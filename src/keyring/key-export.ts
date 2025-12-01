/**
 * OPNet Wallet SDK - Unified Key Export
 * Provides a single export format that contains both classical and quantum keys.
 * This allows users to export their complete wallet state in one operation.
 */

import { crypto as bitcoinCrypto, type Network, networks } from '@btc-vision/bitcoin';
import { EcKeyPair, MLDSASecurityLevel, QuantumBIP32Factory } from '@btc-vision/transaction';
import type { ECPairInterface } from 'ecpair';
import type { ExportedWallet } from '@/types';

const EXPORT_VERSION = 1;
const MAGIC_HEADER = 'OPNET_WALLET_V1';

/**
 * Unified wallet export format
 */
export interface UnifiedWalletExport {
    readonly magic: string;
    readonly version: number;
    readonly network: string;
    readonly classical: {
        readonly privateKey: string;
        readonly publicKey: string;
    };
    readonly quantum: {
        readonly privateKey: string;
        readonly publicKey: string;
        readonly securityLevel: MLDSASecurityLevel;
        readonly chainCode: string;
    };
    readonly checksum: string;
}

/**
 * Calculate checksum for wallet export data
 */
function calculateChecksum(data: string): string {
    const hash = bitcoinCrypto.sha256(Buffer.from(data, 'utf8'));
    return hash.subarray(0, 4).toString('hex');
}

/**
 * Get network name from Network object
 */
function getNetworkName(network: Network): string {
    if (network.bech32 === networks.bitcoin.bech32) {
        return 'mainnet';
    }
    if (network.bech32 === networks.testnet.bech32) {
        return 'testnet';
    }
    return 'regtest';
}

/**
 * Get Network object from network name
 */
function getNetworkFromName(name: string): Network {
    switch (name) {
        case 'mainnet': {
            return networks.bitcoin;
        }
        case 'testnet': {
            return networks.testnet;
        }
        case 'regtest': {
            return networks.regtest;
        }
        default: {
            return networks.bitcoin;
        }
    }
}

/**
 * Export wallet keys to unified format
 */
export function exportWallet(
    classicalPrivateKey: Buffer,
    classicalPublicKey: Buffer,
    quantumPrivateKey: Uint8Array,
    quantumPublicKey: Uint8Array,
    chainCode: Buffer,
    securityLevel: MLDSASecurityLevel,
    network: Network
): UnifiedWalletExport {
    const exportData: Omit<UnifiedWalletExport, 'checksum'> = {
        magic: MAGIC_HEADER,
        version: EXPORT_VERSION,
        network: getNetworkName(network),
        classical: {
            privateKey: classicalPrivateKey.toString('hex'),
            publicKey: classicalPublicKey.toString('hex')
        },
        quantum: {
            privateKey: Buffer.from(quantumPrivateKey).toString('hex'),
            publicKey: Buffer.from(quantumPublicKey).toString('hex'),
            securityLevel,
            chainCode: chainCode.toString('hex')
        }
    };

    const dataString = JSON.stringify(exportData);
    const checksum = calculateChecksum(dataString);

    return {
        ...exportData,
        checksum
    };
}

/**
 * Import wallet keys from unified format
 */
export function importWallet(exportData: UnifiedWalletExport): {
    keypair: ECPairInterface;
    quantumKeypair: ReturnType<typeof QuantumBIP32Factory.fromPrivateKey>;
    network: Network;
    securityLevel: MLDSASecurityLevel;
    chainCode: Buffer;
} {
    // Validate magic header
    if (exportData.magic !== MAGIC_HEADER) {
        throw new Error('Invalid wallet export format: wrong magic header');
    }

    // Validate version
    if (exportData.version !== EXPORT_VERSION) {
        throw new Error(`Unsupported wallet export version: ${exportData.version}`);
    }

    // Validate checksum
    const dataWithoutChecksum: Omit<UnifiedWalletExport, 'checksum'> = {
        magic: exportData.magic,
        version: exportData.version,
        network: exportData.network,
        classical: exportData.classical,
        quantum: exportData.quantum
    };
    const expectedChecksum = calculateChecksum(JSON.stringify(dataWithoutChecksum));
    if (exportData.checksum !== expectedChecksum) {
        throw new Error('Invalid wallet export: checksum mismatch');
    }

    const network = getNetworkFromName(exportData.network);
    const chainCode = Buffer.from(exportData.quantum.chainCode, 'hex');

    // Restore classical keypair
    const classicalPrivateKey = Buffer.from(exportData.classical.privateKey, 'hex');
    const keypair = EcKeyPair.fromPrivateKey(classicalPrivateKey, network);

    // Restore quantum keypair
    const quantumPrivateKey = Buffer.from(exportData.quantum.privateKey, 'hex');
    const quantumKeypair = QuantumBIP32Factory.fromPrivateKey(
        quantumPrivateKey,
        chainCode,
        network,
        exportData.quantum.securityLevel
    );

    return {
        keypair,
        quantumKeypair,
        network,
        securityLevel: exportData.quantum.securityLevel,
        chainCode
    };
}

/**
 * Serialize unified export to string (base64 encoded JSON)
 */
export function serializeExport(exportData: UnifiedWalletExport): string {
    const json = JSON.stringify(exportData);
    return Buffer.from(json, 'utf8').toString('base64');
}

/**
 * Deserialize string to unified export
 */
export function deserializeExport(serialized: string): UnifiedWalletExport {
    try {
        const json = Buffer.from(serialized, 'base64').toString('utf8');
        return JSON.parse(json) as UnifiedWalletExport;
    } catch {
        throw new Error('Invalid wallet export: failed to deserialize');
    }
}

/**
 * Export wallet to portable string format
 */
export function exportWalletToString(
    classicalPrivateKey: Buffer,
    classicalPublicKey: Buffer,
    quantumPrivateKey: Uint8Array,
    quantumPublicKey: Uint8Array,
    chainCode: Buffer,
    securityLevel: MLDSASecurityLevel,
    network: Network
): string {
    const exportData = exportWallet(
        classicalPrivateKey,
        classicalPublicKey,
        quantumPrivateKey,
        quantumPublicKey,
        chainCode,
        securityLevel,
        network
    );
    return serializeExport(exportData);
}

/**
 * Import wallet from portable string format
 */
export function importWalletFromString(serialized: string): {
    keypair: ECPairInterface;
    quantumKeypair: ReturnType<typeof QuantumBIP32Factory.fromPrivateKey>;
    network: Network;
    securityLevel: MLDSASecurityLevel;
    chainCode: Buffer;
} {
    const exportData = deserializeExport(serialized);
    return importWallet(exportData);
}

/**
 * Validate export data without importing
 */
export function validateExport(exportData: UnifiedWalletExport): boolean {
    try {
        if (exportData.magic !== MAGIC_HEADER) {
            return false;
        }

        if (exportData.version !== EXPORT_VERSION) {
            return false;
        }

        const dataWithoutChecksum: Omit<UnifiedWalletExport, 'checksum'> = {
            magic: exportData.magic,
            version: exportData.version,
            network: exportData.network,
            classical: exportData.classical,
            quantum: exportData.quantum
        };
        const expectedChecksum = calculateChecksum(JSON.stringify(dataWithoutChecksum));

        return exportData.checksum === expectedChecksum;
    } catch {
        return false;
    }
}

/**
 * Convert legacy ExportedWallet format to unified format
 */
export function fromLegacyExport(legacy: ExportedWallet, network: Network): UnifiedWalletExport {
    const classicalPrivateKey = Buffer.from(legacy.classicalPrivateKey, 'hex');
    const keypair = EcKeyPair.fromPrivateKey(classicalPrivateKey, network);

    const exportData: Omit<UnifiedWalletExport, 'checksum'> = {
        magic: MAGIC_HEADER,
        version: EXPORT_VERSION,
        network: getNetworkName(network),
        classical: {
            privateKey: legacy.classicalPrivateKey,
            publicKey: keypair.publicKey.toString('hex')
        },
        quantum: {
            privateKey: legacy.quantumPrivateKey,
            publicKey: legacy.quantumPublicKey,
            securityLevel: legacy.securityLevel,
            chainCode: legacy.chainCode
        }
    };

    const dataString = JSON.stringify(exportData);
    const checksum = calculateChecksum(dataString);

    return {
        ...exportData,
        checksum
    };
}
