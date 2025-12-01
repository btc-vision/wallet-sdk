/**
 * OPNet Wallet SDK - Simple Keyring
 * Single key pair management with quantum-resistant (ML-DSA) support.
 * For WIF/private key imports, requires either:
 * 1. A quantum private key to be assigned on import
 * 2. Generation of a fresh quantum key pair
 */

import { crypto as bitcoinCrypto, isTaprootInput, type Network, networks, Psbt } from '@btc-vision/bitcoin';
import {
    AddressTypes,
    EcKeyPair,
    MLDSASecurityLevel,
    QuantumBIP32Factory,
    type QuantumBIP32Interface
} from '@btc-vision/transaction';
import type { ECPairInterface } from 'ecpair';
import { publicKeyToAddress } from '@/address';
import type { AccountAddresses, SimpleKeyringOptions, ToSignInput } from '@/types';

/**
 * Simple Keyring for single key pair management with quantum support.
 * When importing from WIF or private key, a quantum key must be provided or generated.
 */
export class SimpleKeyring {
    public static readonly type = 'Simple Key Pair';
    public readonly type = SimpleKeyring.type;

    private readonly network: Network;
    private readonly securityLevel: MLDSASecurityLevel;
    private keypair: ECPairInterface | null = null;
    private quantumKeypair: QuantumBIP32Interface | null = null;
    private chainCode: Buffer = Buffer.alloc(32);

    constructor(options?: SimpleKeyringOptions) {
        this.network = options?.network ?? networks.bitcoin;
        this.securityLevel = options?.securityLevel ?? MLDSASecurityLevel.LEVEL2;

        if (options?.privateKey !== undefined) {
            this.importPrivateKey(options.privateKey, options.quantumPrivateKey);
        }
    }

    /**
     * Generate a new random key pair with quantum support
     */
    public static generate(
        network: Network = networks.bitcoin,
        securityLevel: MLDSASecurityLevel = MLDSASecurityLevel.LEVEL2
    ): SimpleKeyring {
        const keyring = new SimpleKeyring({ network, securityLevel, privateKey: '' });

        // Generate random classical keypair
        keyring.keypair = EcKeyPair.generateRandomKeyPair(network);

        // Generate random quantum keypair
        const seed = Buffer.from(crypto.getRandomValues(new Uint8Array(64)));
        keyring.quantumKeypair = QuantumBIP32Factory.fromSeed(seed, network, securityLevel);
        keyring.chainCode = Buffer.from(keyring.quantumKeypair.chainCode);

        return keyring;
    }

    /**
     * Import from WIF (Wallet Import Format) with optional quantum key.
     * If no quantum key is provided, the keyring will NOT have a quantum keypair.
     * The quantum key must be explicitly set later via importQuantumKey() or generateFreshQuantumKey().
     */
    public static fromWIF(
        wif: string,
        quantumPrivateKey: string | undefined,
        network: Network = networks.bitcoin,
        securityLevel: MLDSASecurityLevel = MLDSASecurityLevel.LEVEL2
    ): SimpleKeyring {
        const keyring = new SimpleKeyring({ network, securityLevel, privateKey: '' });
        keyring.keypair = EcKeyPair.fromWIF(wif, network);

        if (quantumPrivateKey !== undefined && quantumPrivateKey !== '') {
            keyring.importQuantumKey(quantumPrivateKey);
        }
        // Do NOT auto-generate quantum key - user must explicitly migrate

        return keyring;
    }

    /**
     * Import from hex private key with optional quantum key.
     * If no quantum key is provided, the keyring will NOT have a quantum keypair.
     * The quantum key must be explicitly set later via importQuantumKey() or generateFreshQuantumKey().
     */
    public static fromPrivateKey(
        privateKeyHex: string,
        quantumPrivateKey: string | undefined,
        network: Network = networks.bitcoin,
        securityLevel: MLDSASecurityLevel = MLDSASecurityLevel.LEVEL2
    ): SimpleKeyring {
        const keyring = new SimpleKeyring({ network, securityLevel, privateKey: '' });
        const privateKeyBuffer = Buffer.from(privateKeyHex, 'hex');
        keyring.keypair = EcKeyPair.fromPrivateKey(privateKeyBuffer, network);

        if (quantumPrivateKey !== undefined && quantumPrivateKey !== '') {
            keyring.importQuantumKey(quantumPrivateKey);
        }
        // Do NOT auto-generate quantum key - user must explicitly migrate

        return keyring;
    }

    /**
     * Import a private key (WIF or hex format).
     * If no quantum key is provided, the keyring will NOT have a quantum keypair.
     * The quantum key must be explicitly set later via importQuantumKey() or generateFreshQuantumKey().
     */
    public importPrivateKey(privateKey: string, quantumPrivateKey?: string): void {
        if (privateKey === '') {
            return;
        }

        // Determine if WIF or hex
        if (privateKey.length === 64) {
            // Hex format
            const privateKeyBuffer = Buffer.from(privateKey, 'hex');
            this.keypair = EcKeyPair.fromPrivateKey(privateKeyBuffer, this.network);
        } else {
            // WIF format
            this.keypair = EcKeyPair.fromWIF(privateKey, this.network);
        }

        if (quantumPrivateKey !== undefined && quantumPrivateKey !== '') {
            this.importQuantumKey(quantumPrivateKey);
        }
        // Do NOT auto-generate quantum key - user must explicitly migrate
    }

    /**
     * Import an existing quantum private key
     */
    public importQuantumKey(quantumPrivateKeyHex: string): void {
        const privateKeyBytes = Buffer.from(quantumPrivateKeyHex, 'hex');

        // Extract chain code from the end of the key if present
        // Format: privateKey + chainCode (32 bytes)
        if (privateKeyBytes.length > 32) {
            this.chainCode = privateKeyBytes.subarray(-32);
            const keyWithoutChainCode = privateKeyBytes.subarray(0, -32);
            this.quantumKeypair = QuantumBIP32Factory.fromPrivateKey(
                keyWithoutChainCode,
                this.chainCode,
                this.network,
                this.securityLevel
            );
        } else {
            // Generate a deterministic chain code from the key
            this.chainCode = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));
            this.quantumKeypair = QuantumBIP32Factory.fromPrivateKey(
                privateKeyBytes,
                this.chainCode,
                this.network,
                this.securityLevel
            );
        }
    }

    /**
     * Generate a fresh quantum key pair
     */
    public generateFreshQuantumKey(): void {
        const seed = Buffer.from(crypto.getRandomValues(new Uint8Array(64)));
        this.quantumKeypair = QuantumBIP32Factory.fromSeed(seed, this.network, this.securityLevel);
        this.chainCode = Buffer.from(this.quantumKeypair.chainCode);
    }

    /**
     * Check if keyring has both classical and quantum keys
     */
    public hasKeys(): boolean {
        return this.keypair !== null && this.quantumKeypair !== null;
    }

    /**
     * Check if keyring has the classical keypair (may or may not have quantum key)
     */
    public hasClassicalKey(): boolean {
        return this.keypair !== null;
    }

    /**
     * Check if keyring has a quantum keypair
     */
    public hasQuantumKey(): boolean {
        return this.quantumKeypair !== null;
    }

    /**
     * Check if quantum migration is needed (has classical but no quantum key)
     */
    public needsQuantumMigration(): boolean {
        return this.keypair !== null && this.quantumKeypair === null;
    }

    /**
     * Get the classical public key
     */
    public getPublicKey(): string {
        if (this.keypair === null) {
            throw new Error('SimpleKeyring: No keypair initialized');
        }
        return this.keypair.publicKey.toString('hex');
    }

    /**
     * Get the quantum public key
     */
    public getQuantumPublicKey(): string {
        if (this.quantumKeypair === null) {
            throw new Error('SimpleKeyring: No quantum keypair initialized');
        }
        return Buffer.from(this.quantumKeypair.publicKey).toString('hex');
    }

    /**
     * Get the quantum public key hash (universal identifier)
     */
    public getQuantumPublicKeyHash(): string {
        if (this.quantumKeypair === null) {
            throw new Error('SimpleKeyring: No quantum keypair initialized');
        }
        // SHA256 hash of the quantum public key
        const hash = bitcoinCrypto.sha256(Buffer.from(this.quantumKeypair.publicKey));
        return hash.toString('hex');
    }

    /**
     * Clear the quantum keypair (used for reverting failed imports)
     */
    public clearQuantumKey(): void {
        this.quantumKeypair = null;
        this.chainCode = Buffer.alloc(32);
    }

    /**
     * Get all accounts (returns array with single public key)
     */
    public getAccounts(): string[] {
        if (this.keypair === null) {
            return [];
        }
        return [this.getPublicKey()];
    }

    /**
     * Get addresses for the key pair
     */
    public getAddresses(): AccountAddresses {
        if (this.keypair === null) {
            throw new Error('SimpleKeyring: No keypair initialized');
        }

        const pubkey = this.keypair.publicKey;

        return {
            p2pkh: publicKeyToAddress(pubkey, AddressTypes.P2PKH, this.network),
            p2wpkh: publicKeyToAddress(pubkey, AddressTypes.P2WPKH, this.network),
            p2tr: publicKeyToAddress(pubkey, AddressTypes.P2TR, this.network),
            p2shP2wpkh: publicKeyToAddress(pubkey, AddressTypes.P2SH_OR_P2SH_P2WPKH, this.network)
        };
    }

    /**
     * Get an address for a specific type
     */
    public getAddress(addressType: AddressTypes): string {
        if (this.keypair === null) {
            throw new Error('SimpleKeyring: No keypair initialized');
        }
        return publicKeyToAddress(this.keypair.publicKey, addressType, this.network);
    }

    /**
     * Export the classical private key
     */
    public exportPrivateKey(): string {
        if (this.keypair?.privateKey === undefined) {
            throw new Error('SimpleKeyring: No private key available');
        }
        return Buffer.from(this.keypair.privateKey).toString('hex');
    }

    /**
     * Export the quantum private key with chain code (for backup/restore)
     */
    public exportQuantumPrivateKey(): string {
        if (this.quantumKeypair?.privateKey === undefined) {
            throw new Error('SimpleKeyring: No quantum private key available');
        }

        // Combine private key and chain code for full export
        const privateKey = Buffer.from(this.quantumKeypair.privateKey);
        return Buffer.concat([privateKey, this.chainCode]).toString('hex');
    }

    /**
     * Export the raw quantum private key WITHOUT chain code (for Wallet.fromWif)
     */
    public exportRawQuantumPrivateKey(): string {
        if (this.quantumKeypair?.privateKey === undefined) {
            throw new Error('SimpleKeyring: No quantum private key available');
        }
        return Buffer.from(this.quantumKeypair.privateKey).toString('hex');
    }

    /**
     * Export the chain code (for use with Wallet.fromWif separately)
     */
    public exportChainCode(): Buffer {
        return this.chainCode;
    }

    /**
     * Export WIF format
     */
    public exportWIF(): string {
        if (this.keypair === null) {
            throw new Error('SimpleKeyring: No keypair initialized');
        }
        return this.keypair.toWIF();
    }

    /**
     * Sign a PSBT transaction
     */
    public signTransaction(psbt: Psbt, inputs: readonly ToSignInput[]): Psbt {
        if (this.keypair === null) {
            throw new Error('SimpleKeyring: No keypair initialized');
        }

        for (const input of inputs) {
            const psbtInput = psbt.data.inputs[input.index];

            if (psbtInput === undefined) {
                throw new Error(`SimpleKeyring: Input at index ${input.index} not found`);
            }

            if (isTaprootInput(psbtInput) && input.disableTweakSigner !== true) {
                const tweakedSigner = this.keypair.tweak(Buffer.from(this.keypair.publicKey.subarray(1, 33)));
                psbt.signInput(input.index, tweakedSigner, input.sighashTypes as number[] | undefined);
            } else {
                psbt.signInput(input.index, this.keypair, input.sighashTypes as number[] | undefined);
            }
        }

        return psbt;
    }

    /**
     * Sign arbitrary data with ECDSA or Schnorr
     */
    public signData(data: string, type: 'ecdsa' | 'schnorr' = 'ecdsa'): string {
        if (this.keypair === null) {
            throw new Error('SimpleKeyring: No keypair initialized');
        }

        const dataBuffer = Buffer.from(data, 'hex');

        if (type === 'ecdsa') {
            return Buffer.from(this.keypair.sign(dataBuffer)).toString('hex');
        } else {
            return Buffer.from(this.keypair.signSchnorr(dataBuffer)).toString('hex');
        }
    }

    /**
     * Verify a signature
     */
    public verify(data: string, signature: string, type: 'ecdsa' | 'schnorr' = 'ecdsa'): boolean {
        if (this.keypair === null) {
            throw new Error('SimpleKeyring: No keypair initialized');
        }

        const dataBuffer = Buffer.from(data, 'hex');
        const signatureBuffer = Buffer.from(signature, 'hex');

        if (type === 'ecdsa') {
            return this.keypair.verify(dataBuffer, signatureBuffer);
        } else {
            return this.keypair.verifySchnorr(dataBuffer, signatureBuffer);
        }
    }

    /**
     * Get the keypair
     */
    public getKeypair(): ECPairInterface {
        if (this.keypair === null) {
            throw new Error('SimpleKeyring: No keypair initialized');
        }
        return this.keypair;
    }

    /**
     * Get the quantum keypair
     */
    public getQuantumKeypair(): QuantumBIP32Interface {
        if (this.quantumKeypair === null) {
            throw new Error('SimpleKeyring: No quantum keypair initialized');
        }
        return this.quantumKeypair;
    }

    /**
     * Get the chain code
     */
    public getChainCode(): Buffer {
        return this.chainCode;
    }

    /**
     * Get the security level
     */
    public getSecurityLevel(): MLDSASecurityLevel {
        return this.securityLevel;
    }

    /**
     * Get the network
     */
    public getNetwork(): Network {
        return this.network;
    }

    /**
     * Serialize the keyring state (excludes private keys for safety)
     */
    public serialize(): SimpleKeyringOptions {
        return {
            privateKey: this.exportPrivateKey(),
            quantumPrivateKey: this.exportQuantumPrivateKey(),
            network: this.network,
            securityLevel: this.securityLevel
        };
    }

    /**
     * Remove the key (clear keyring)
     */
    public clear(): void {
        this.keypair = null;
        this.quantumKeypair = null;
        this.chainCode = Buffer.alloc(32);
    }
}
