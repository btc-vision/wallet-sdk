/**
 * OPNet Wallet SDK - HD Keyring
 * Hierarchical Deterministic keyring with quantum-resistant (ML-DSA) support.
 * Uses @btc-vision/transaction Mnemonic class for BIP39 + BIP360 key derivation.
 */

import { isTaprootInput, type Network, networks, Psbt } from '@btc-vision/bitcoin';
import {
    AddressTypes,
    MLDSASecurityLevel,
    Mnemonic,
    MnemonicStrength,
    type QuantumBIP32Interface,
    Wallet
} from '@btc-vision/transaction';
import { publicKeyToAddress } from '@/address';
import type { AccountAddresses, AccountInfo, HdKeyringOptions, ToSignInput } from '@/types';

/**
 * HD Keyring with quantum-resistant cryptography support.
 * Supports BIP39 mnemonic phrases with BIP360 quantum key derivation.
 */
export class HdKeyring {
    public static readonly type = 'HD Key Tree';
    public readonly type = HdKeyring.type;

    private mnemonic: Mnemonic | null = null;
    private readonly wallets: Map<number, Wallet> = new Map();
    private readonly activeIndexes: number[] = [];
    private readonly network: Network;
    private readonly securityLevel: MLDSASecurityLevel;
    private readonly passphrase: string;
    private addressType: AddressTypes;
    private readonly _hdPath: string;

    constructor(options?: HdKeyringOptions) {
        this.network = options?.network ?? networks.bitcoin;
        this.securityLevel = options?.securityLevel ?? MLDSASecurityLevel.LEVEL2;
        this.passphrase = options?.passphrase ?? '';
        this.addressType = options?.addressType ?? AddressTypes.P2TR;
        this._hdPath = options?.hdPath ?? '';

        if (options?.mnemonic !== undefined) {
            this.initFromMnemonic(options.mnemonic);

            if (options.activeIndexes !== undefined && options.activeIndexes.length > 0) {
                this.activateAccounts([...options.activeIndexes]);
            }
        }
    }

    /**
     * Get the HD derivation path
     */
    public get hdPath(): string {
        return this._hdPath;
    }

    /**
     * Generate a new mnemonic with quantum support
     */
    public static generate(
        strength: MnemonicStrength = MnemonicStrength.MAXIMUM,
        passphrase = '',
        network: Network = networks.bitcoin,
        securityLevel: MLDSASecurityLevel = MLDSASecurityLevel.LEVEL2
    ): HdKeyring {
        const mnemonic = Mnemonic.generate(strength, passphrase, network, securityLevel);
        const keyring = new HdKeyring({
            network,
            securityLevel,
            passphrase
        });
        keyring.mnemonic = mnemonic;
        return keyring;
    }

    /**
     * Initialize from an existing mnemonic phrase
     */
    public initFromMnemonic(phrase: string): void {
        if (this.mnemonic !== null) {
            throw new Error('HdKeyring: Mnemonic already initialized');
        }

        this.mnemonic = new Mnemonic(phrase, this.passphrase, this.network, this.securityLevel);
    }

    /**
     * Get the mnemonic phrase
     */
    public getMnemonic(): string {
        if (this.mnemonic === null) {
            throw new Error('HdKeyring: No mnemonic initialized');
        }
        return this.mnemonic.phrase;
    }

    /**
     * Check if keyring has a mnemonic
     */
    public hasMnemonic(): boolean {
        return this.mnemonic !== null;
    }

    /**
     * Derive a wallet at a specific index.
     * Uses custom hdPath if set, otherwise uses Unisat-compatible derivation.
     */
    public deriveWallet(index: number): Wallet {
        if (this.mnemonic === null) {
            throw new Error('HdKeyring: No mnemonic initialized');
        }

        const cached = this.wallets.get(index);
        if (cached !== undefined) {
            return cached;
        }

        let wallet: Wallet;

        // Check if using a custom HD path
        if (this.isCustomHdPath()) {
            // Build the full classical path: hdPath + /index
            const classicalPath = `${this._hdPath}/${index}`;
            // Quantum path always uses BIP360 with coin type 0 for mainnet
            const coinType = this.network === networks.bitcoin ? 0 : 1;
            const quantumPath = `m/360'/${coinType}'/0'/0/${index}`;
            wallet = this.mnemonic.deriveCustomPath(classicalPath, quantumPath);
        } else {
            wallet = this.mnemonic.deriveUnisat(this.addressType, index);
        }

        this.wallets.set(index, wallet);
        return wallet;
    }

    /**
     * Derive a wallet using standard (non-Unisat) derivation
     */
    public deriveStandardWallet(index: number): Wallet {
        if (this.mnemonic === null) {
            throw new Error('HdKeyring: No mnemonic initialized');
        }

        return this.mnemonic.derive(index);
    }

    /**
     * Add new accounts to the keyring
     */
    public addAccounts(numberOfAccounts = 1): string[] {
        if (this.mnemonic === null) {
            throw new Error('HdKeyring: No mnemonic initialized');
        }

        const newPublicKeys: string[] = [];
        let currentIndex = 0;

        while (newPublicKeys.length < numberOfAccounts) {
            if (!this.activeIndexes.includes(currentIndex)) {
                const wallet = this.deriveWallet(currentIndex);
                this.activeIndexes.push(currentIndex);
                newPublicKeys.push(wallet.toPublicKeyHex());
            }
            currentIndex++;
        }

        return newPublicKeys;
    }

    /**
     * Activate specific account indexes
     */
    public activateAccounts(indexes: number[]): string[] {
        if (this.mnemonic === null) {
            throw new Error('HdKeyring: No mnemonic initialized');
        }

        const publicKeys: string[] = [];

        for (const index of indexes) {
            if (!this.activeIndexes.includes(index)) {
                const wallet = this.deriveWallet(index);
                this.activeIndexes.push(index);
                publicKeys.push(wallet.toPublicKeyHex());
            } else {
                const wallet = this.wallets.get(index);
                if (wallet !== undefined) {
                    publicKeys.push(wallet.toPublicKeyHex());
                }
            }
        }

        return publicKeys;
    }

    /**
     * Get all active account public keys
     */
    public getAccounts(): string[] {
        return this.activeIndexes.map((index) => {
            const wallet = this.wallets.get(index);
            if (wallet === undefined) {
                throw new Error(`HdKeyring: Wallet at index ${index} not found`);
            }
            return wallet.toPublicKeyHex();
        });
    }

    /**
     * Get detailed account info for all active accounts
     */
    public getAccountsInfo(): AccountInfo[] {
        return this.activeIndexes.map((index) => {
            const wallet = this.wallets.get(index);
            if (wallet === undefined) {
                throw new Error(`HdKeyring: Wallet at index ${index} not found`);
            }

            const addresses: AccountAddresses = {
                p2pkh: wallet.legacy,
                p2wpkh: wallet.p2wpkh,
                p2tr: wallet.p2tr,
                p2shP2wpkh: wallet.segwitLegacy
            };

            return {
                index,
                publicKey: wallet.toPublicKeyHex(),
                quantumPublicKey: wallet.quantumPublicKeyHex,
                addresses
            };
        });
    }

    /**
     * Get quantum public key for an account
     */
    public getQuantumPublicKey(publicKey: string): string {
        const wallet = this.findWalletByPublicKey(publicKey);
        return wallet.quantumPublicKeyHex;
    }

    /**
     * Get the index for a public key
     */
    public getIndexByPublicKey(publicKey: string): number | null {
        for (const [index, wallet] of this.wallets.entries()) {
            if (wallet.toPublicKeyHex() === publicKey) {
                return index;
            }
        }
        return null;
    }

    /**
     * Get addresses for a specific public key
     */
    public getAddressesForPublicKey(publicKey: string): AccountAddresses {
        const wallet = this.findWalletByPublicKey(publicKey);
        return {
            p2pkh: wallet.legacy,
            p2wpkh: wallet.p2wpkh,
            p2tr: wallet.p2tr,
            p2shP2wpkh: wallet.segwitLegacy
        };
    }

    /**
     * Get an address for a public key and address type
     */
    public getAddress(publicKey: string, addressType: AddressTypes): string {
        const pubkeyBuffer = Buffer.from(publicKey, 'hex');
        return publicKeyToAddress(pubkeyBuffer, addressType, this.network);
    }

    /**
     * Remove an account by public key
     */
    public removeAccount(publicKey: string): void {
        const index = this.getIndexByPublicKey(publicKey);
        if (index === null) {
            throw new Error(`HdKeyring: Account with public key ${publicKey} not found`);
        }

        const activeIdx = this.activeIndexes.indexOf(index);
        if (activeIdx !== -1) {
            this.activeIndexes.splice(activeIdx, 1);
        }
        this.wallets.delete(index);
    }

    /**
     * Export the private key for an account
     */
    public exportAccount(publicKey: string): string {
        const wallet = this.findWalletByPublicKey(publicKey);
        return wallet.toPrivateKeyHex();
    }

    /**
     * Sign a PSBT transaction
     */
    public signTransaction(psbt: Psbt, inputs: readonly ToSignInput[]): Psbt {
        for (const input of inputs) {
            const wallet = this.findWalletByPublicKey(input.publicKey);
            const psbtInput = psbt.data.inputs[input.index];

            if (psbtInput === undefined) {
                throw new Error(`HdKeyring: Input at index ${input.index} not found`);
            }

            const keypair = wallet.keypair;
            const sighashTypes = input.sighashTypes !== undefined ? [...input.sighashTypes] : undefined;

            if (isTaprootInput(psbtInput) && input.disableTweakSigner !== true) {
                // For taproot, use tweaked signer
                const internalPubkey = wallet.publicKey.subarray(1, 33);
                const tweakedKeypair = keypair.tweak(Buffer.from(internalPubkey));
                psbt.signInput(input.index, tweakedKeypair, sighashTypes);
            } else {
                psbt.signInput(input.index, keypair, sighashTypes);
            }
        }

        return psbt;
    }

    /**
     * Sign arbitrary data with ECDSA or Schnorr
     */
    public signData(publicKey: string, data: string, type: 'ecdsa' | 'schnorr' = 'ecdsa'): string {
        const wallet = this.findWalletByPublicKey(publicKey);
        const dataBuffer = Buffer.from(data, 'hex');

        if (type === 'ecdsa') {
            return Buffer.from(wallet.keypair.sign(dataBuffer)).toString('hex');
        } else {
            return Buffer.from(wallet.keypair.signSchnorr(dataBuffer)).toString('hex');
        }
    }

    /**
     * Get the Wallet for a public key
     */
    public getWallet(publicKey: string): Wallet {
        return this.findWalletByPublicKey(publicKey);
    }

    /**
     * Serialize the keyring state
     */
    public serialize(): HdKeyringOptions {
        return {
            mnemonic: this.mnemonic?.phrase,
            passphrase: this.passphrase,
            network: this.network,
            securityLevel: this.securityLevel,
            activeIndexes: [...this.activeIndexes],
            addressType: this.addressType,
            hdPath: this._hdPath
        };
    }

    /**
     * Get active indexes
     */
    public getActiveIndexes(): readonly number[] {
        return [...this.activeIndexes];
    }

    /**
     * Change the address type for new derivations
     */
    public setAddressType(addressType: AddressTypes): void {
        this.addressType = addressType;
    }

    /**
     * Get current address type
     */
    public getAddressType(): AddressTypes {
        return this.addressType;
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
     * Get paginated addresses for display
     */
    public getAddressesPage(page: number, perPage = 5): { address: string; index: number }[] {
        if (this.mnemonic === null) {
            throw new Error('HdKeyring: No mnemonic initialized');
        }

        const start = page * perPage;
        const end = start + perPage;
        const results: { address: string; index: number }[] = [];

        for (let i = start; i < end; i++) {
            let wallet: Wallet;

            if (this.isCustomHdPath()) {
                const classicalPath = `${this._hdPath}/${i}`;
                const coinType = this.network === networks.bitcoin ? 0 : 1;
                const quantumPath = `m/360'/${coinType}'/0'/0/${i}`;
                wallet = this.mnemonic.deriveCustomPath(classicalPath, quantumPath);
            } else {
                wallet = this.mnemonic.deriveUnisat(this.addressType, i);
            }

            const address = this.getAddressFromWallet(wallet);
            results.push({ address, index: i });
        }

        return results;
    }

    /**
     * Get the chain code for a wallet
     */
    public getChainCode(publicKey: string): Buffer {
        const wallet = this.findWalletByPublicKey(publicKey);
        return Buffer.from(wallet.chainCode);
    }

    /**
     * Get ML-DSA keypair for quantum operations
     */
    public getMLDSAKeypair(publicKey: string): QuantumBIP32Interface {
        const wallet = this.findWalletByPublicKey(publicKey);
        return wallet.mldsaKeypair;
    }

    /**
     * Check if the current hdPath is a custom (non-standard) path
     */
    private isCustomHdPath(): boolean {
        // Standard BIP paths for common address types
        const standardPaths: Partial<Record<AddressTypes, string>> = {
            [AddressTypes.P2PKH]: "m/44'/0'/0'/0",
            [AddressTypes.P2WPKH]: "m/84'/0'/0'/0",
            [AddressTypes.P2TR]: "m/86'/0'/0'/0",
            [AddressTypes.P2SH_OR_P2SH_P2WPKH]: "m/49'/0'/0'/0"
        };

        const standardPath = standardPaths[this.addressType];

        // If no standard path exists for this address type, any non-empty path is "custom"
        if (standardPath === undefined) {
            return this._hdPath !== '';
        }

        // Also check without trailing /0 for base paths like m/84'/0'/0'
        const standardPathBase = standardPath.slice(0, -2); // Remove /0

        return !this._hdPath.includes(standardPathBase) && this._hdPath !== '';
    }

    private findWalletByPublicKey(publicKey: string): Wallet {
        for (const wallet of this.wallets.values()) {
            if (wallet.toPublicKeyHex() === publicKey) {
                return wallet;
            }
        }
        throw new Error(`HdKeyring: Wallet with public key ${publicKey} not found`);
    }

    private getAddressFromWallet(wallet: Wallet): string {
        switch (this.addressType) {
            case AddressTypes.P2PKH: {
                return wallet.legacy;
            }
            case AddressTypes.P2WPKH: {
                return wallet.p2wpkh;
            }
            case AddressTypes.P2TR: {
                return wallet.p2tr;
            }
            case AddressTypes.P2SH_OR_P2SH_P2WPKH: {
                return wallet.segwitLegacy;
            }
            default: {
                return wallet.p2tr;
            }
        }
    }
}
