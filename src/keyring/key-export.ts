/**
 * OPNet Wallet SDK - Unified Key Export
 * Provides a single export format that contains both classical and quantum keys.
 * This allows users to export their complete wallet state in one operation.
 */

import { crypto as bitcoinCrypto, type Network, networks } from '@btc-vision/bitcoin';
import { EcKeyPair, MLDSASecurityLevel, QuantumBIP32Factory, WalletNetworks } from '@btc-vision/transaction';
import { fromHexInternal, toHex, type UniversalSigner } from '@btc-vision/ecpair';
import type { ExportedWallet } from '@/types';
import { toNetwork, toNetworkType } from '@/network';

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
const textEncoder = new TextEncoder();

function calculateChecksum(data: string): string {
    const hash: Uint8Array = bitcoinCrypto.sha256(textEncoder.encode(data));
    return toHex(hash.subarray(0, 4));
}

/**
 * Get network name from Network object (serialized as WalletNetworks enum value)
 */
function getNetworkName(network: Network): string {
    return toNetworkType(network);
}

/**
 * Get Network object from network name (WalletNetworks enum value)
 */
function getNetworkFromName(name: string): Network {
    const walletNetwork = name as WalletNetworks;

    // Validate it's a known enum value, fall back to mainnet for unknown
    if (Object.values(WalletNetworks).includes(walletNetwork)) {
        return toNetwork(walletNetwork);
    }

    return networks.bitcoin;
}

/**
 * Export wallet keys to unified format
 */
export function exportWallet(
    classicalPrivateKey: Uint8Array,
    classicalPublicKey: Uint8Array,
    quantumPrivateKey: Uint8Array,
    quantumPublicKey: Uint8Array,
    chainCode: Uint8Array,
    securityLevel: MLDSASecurityLevel,
    network: Network
): UnifiedWalletExport {
    const exportData: Omit<UnifiedWalletExport, 'checksum'> = {
        magic: MAGIC_HEADER,
        version: EXPORT_VERSION,
        network: getNetworkName(network),
        classical: {
            privateKey: toHex(classicalPrivateKey),
            publicKey: toHex(classicalPublicKey)
        },
        quantum: {
            privateKey: toHex(quantumPrivateKey),
            publicKey: toHex(quantumPublicKey),
            securityLevel,
            chainCode: toHex(chainCode)
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
    keypair: UniversalSigner;
    quantumKeypair: ReturnType<typeof QuantumBIP32Factory.fromPrivateKey>;
    network: Network;
    securityLevel: MLDSASecurityLevel;
    chainCode: Uint8Array;
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

    const network: Network = getNetworkFromName(exportData.network);
    const chainCode: Uint8Array = fromHexInternal(exportData.quantum.chainCode);

    // Restore classical keypair
    const classicalPrivateKey: Uint8Array = fromHexInternal(exportData.classical.privateKey);
    const keypair: UniversalSigner = EcKeyPair.fromPrivateKey(classicalPrivateKey, network);

    // Restore quantum keypair
    const quantumPrivateKey: Uint8Array = fromHexInternal(exportData.quantum.privateKey);
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
    const json: string = JSON.stringify(exportData);
    return btoa(json);
}

/**
 * Deserialize string to unified export
 */
export function deserializeExport(serialized: string): UnifiedWalletExport {
    try {
        const json: string = atob(serialized);
        return JSON.parse(json) as UnifiedWalletExport;
    } catch {
        throw new Error('Invalid wallet export: failed to deserialize');
    }
}

/**
 * Export wallet to portable string format
 */
export function exportWalletToString(
    classicalPrivateKey: Uint8Array,
    classicalPublicKey: Uint8Array,
    quantumPrivateKey: Uint8Array,
    quantumPublicKey: Uint8Array,
    chainCode: Uint8Array,
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
    keypair: UniversalSigner;
    quantumKeypair: ReturnType<typeof QuantumBIP32Factory.fromPrivateKey>;
    network: Network;
    securityLevel: MLDSASecurityLevel;
    chainCode: Uint8Array;
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
    const classicalPrivateKey: Uint8Array = fromHexInternal(legacy.classicalPrivateKey);
    const keypair: UniversalSigner = EcKeyPair.fromPrivateKey(classicalPrivateKey, network);

    const exportData: Omit<UnifiedWalletExport, 'checksum'> = {
        magic: MAGIC_HEADER,
        version: EXPORT_VERSION,
        network: getNetworkName(network),
        classical: {
            privateKey: legacy.classicalPrivateKey,
            publicKey: toHex(keypair.publicKey)
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
