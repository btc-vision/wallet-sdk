/**
 * OPNet Wallet SDK - Local Wallet
 * Full-featured local wallet implementation with quantum support.
 */

import { equals, type Network, networks, payments, Psbt, Transaction, type XOnlyPublicKey } from '@btc-vision/bitcoin';
import { createXOnlyPublicKey, fromHexInternal, toHex, concatBytes } from '@btc-vision/ecpair';
import { AddressTypes } from '@btc-vision/transaction';
import { publicKeyToAddress, scriptPubKeyToAddress } from '@/address';
import { HdKeyring } from '@/keyring';
import { SimpleKeyring } from '@/keyring';
import { signBip322Message, signMLDSA, signSchnorr } from '@/message';
import type { AbstractWallet, MessageSigningMethod, SignPsbtOptions, ToSignInput } from '@/types';

/**
 * Local wallet implementation with full signing capabilities.
 */
export class LocalWallet implements AbstractWallet {
    private readonly keyring: SimpleKeyring | HdKeyring;
    private readonly network: Network;
    private readonly addressType: AddressTypes;
    private readonly publicKey: string;
    private readonly address: string;

    private constructor(
        keyring: SimpleKeyring | HdKeyring,
        network: Network,
        addressType: AddressTypes,
        publicKey: string
    ) {
        this.keyring = keyring;
        this.network = network;
        this.addressType = addressType;
        this.publicKey = publicKey;
        this.address = publicKeyToAddress(fromHexInternal(publicKey), addressType, network);
    }

    /**
     * Create wallet from WIF
     */
    public static fromWIF(
        wif: string,
        addressType: AddressTypes = AddressTypes.P2TR,
        network: Network,
        quantumPrivateKey?: string
    ): LocalWallet {
        const keyring = SimpleKeyring.fromWIF(wif, quantumPrivateKey, network);
        const publicKey = keyring.getPublicKey();
        return new LocalWallet(keyring, network, addressType, publicKey);
    }

    /**
     * Create wallet from private key hex
     */
    public static fromPrivateKey(
        privateKeyHex: string,
        addressType: AddressTypes = AddressTypes.P2TR,
        network: Network,
        quantumPrivateKey?: string
    ): LocalWallet {
        const keyring = SimpleKeyring.fromPrivateKey(privateKeyHex, quantumPrivateKey, network);
        const publicKey = keyring.getPublicKey();
        return new LocalWallet(keyring, network, addressType, publicKey);
    }

    /**
     * Create wallet from mnemonic
     */
    public static fromMnemonic(
        mnemonic: string,
        addressType: AddressTypes = AddressTypes.P2TR,
        network: Network,
        passphrase?: string,
        accountIndex = 0
    ): LocalWallet {
        const keyring = new HdKeyring({
            mnemonic,
            passphrase,
            network,
            addressType,
            activeIndexes: [accountIndex]
        });
        const accounts = keyring.getAccounts();
        const publicKey = accounts[0];
        if (publicKey === undefined) {
            throw new Error('Failed to derive wallet from mnemonic');
        }
        return new LocalWallet(keyring, network, addressType, publicKey);
    }

    /**
     * Create a random wallet
     */
    public static random(
        addressType: AddressTypes = AddressTypes.P2TR,
        network: Network = networks.bitcoin
    ): LocalWallet {
        const keyring = SimpleKeyring.generate(network);
        const publicKey = keyring.getPublicKey();
        return new LocalWallet(keyring, network, addressType, publicKey);
    }

    /**
     * Get the wallet address
     */
    public getAddress(): string {
        return this.address;
    }

    /**
     * Get the public key
     */
    public getPublicKey(): string {
        return this.publicKey;
    }

    /**
     * Get the quantum public key
     */
    public getQuantumPublicKey(): string {
        if (this.keyring instanceof SimpleKeyring) {
            return this.keyring.getQuantumPublicKey();
        }
        return this.keyring.getQuantumPublicKey(this.publicKey);
    }

    /**
     * Get the network
     */
    public getNetwork(): Network {
        return this.network;
    }

    /**
     * Get the address type
     */
    public getAddressType(): AddressTypes {
        return this.addressType;
    }

    /**
     * Sign a PSBT
     */
    public signPsbt(psbt: Psbt, opts?: SignPsbtOptions): Psbt {
        const options = opts ?? { autoFinalized: true, toSignInputs: [] };
        const inputs = this.formatInputsToSign(psbt, options);

        if (inputs.length === 0) {
            throw new Error('LocalWallet: No inputs to sign');
        }

        // Add tapInternalKey for P2TR inputs if missing
        for (const input of inputs) {
            const psbtInput = psbt.data.inputs[input.index];
            if (psbtInput === undefined) {
                continue;
            }

            const isNotSigned = !(psbtInput.finalScriptSig ?? psbtInput.finalScriptWitness);
            const isP2TR = this.addressType === AddressTypes.P2TR;
            const lostInternalPubkey = psbtInput.tapInternalKey === undefined;

            if (isNotSigned && isP2TR && lostInternalPubkey) {
                const pubkeyBytes: Uint8Array = fromHexInternal(this.publicKey);
                const xOnlyBytes: Uint8Array = pubkeyBytes.length === 33 ? pubkeyBytes.subarray(1, 33) : pubkeyBytes;
                const tapInternalKey: XOnlyPublicKey = createXOnlyPublicKey(xOnlyBytes);
                const { output } = payments.p2tr({
                    internalPubkey: tapInternalKey,
                    network: this.network
                });
                if (output !== undefined && psbtInput.witnessUtxo !== undefined && equals(psbtInput.witnessUtxo.script, output)) {
                    psbtInput.tapInternalKey = tapInternalKey;
                }
            }
        }

        // Sign transaction
        if (this.keyring instanceof SimpleKeyring) {
            this.keyring.signTransaction(psbt, inputs);
        } else {
            this.keyring.signTransaction(psbt, inputs);
        }

        // Finalize if requested
        if (options.autoFinalized === true) {
            for (const input of inputs) {
                psbt.finalizeInput(input.index);
            }
        }

        return psbt;
    }

    /**
     * Sign a message
     */
    public async signMessage(message: string | Uint8Array, method: MessageSigningMethod): Promise<string> {
        switch (method) {
            case 'bip322-simple': {
                return await signBip322Message(message, this.address, this.network, (psbt) => {
                    return Promise.resolve(this.signPsbt(psbt, { autoFinalized: false }));
                });
            }
            case 'ecdsa':
            case 'schnorr': {
                const keypair = this.getKeypair();
                const result = signSchnorr(keypair, message);
                return toHex(result.signature);
            }
            case 'mldsa': {
                const quantumKeypair = this.getQuantumKeypair();
                const result = signMLDSA(quantumKeypair, message);
                return toHex(result.signature);
            }
        }
    }

    /**
     * Sign raw data
     */
    public signData(data: string, type: 'ecdsa' | 'schnorr' = 'ecdsa'): string {
        if (this.keyring instanceof SimpleKeyring) {
            return this.keyring.signData(data, type);
        }
        return this.keyring.signData(this.publicKey, data, type);
    }

    /**
     * Export the private key
     */
    public exportPrivateKey(): string {
        if (this.keyring instanceof SimpleKeyring) {
            return this.keyring.exportPrivateKey();
        }
        return this.keyring.exportAccount(this.publicKey);
    }

    /**
     * Export the quantum private key WITH chain code (for backup/restore)
     */
    public exportQuantumPrivateKey(): string {
        if (this.keyring instanceof SimpleKeyring) {
            return this.keyring.exportQuantumPrivateKey();
        }
        // For HD keyrings, get the quantum key from the derived wallet
        const wallet = this.keyring.getWallet(this.publicKey);
        const mldsaPrivateKey: Uint8Array | undefined = wallet.mldsaKeypair.privateKey;
        if (mldsaPrivateKey === undefined) {
            throw new Error('LocalWallet: No quantum private key available');
        }
        return toHex(concatBytes(mldsaPrivateKey, wallet.chainCode));
    }

    /**
     * Export the raw quantum private key WITHOUT chain code (for Wallet.fromWif)
     */
    public exportRawQuantumPrivateKey(): string {
        if (this.keyring instanceof SimpleKeyring) {
            return this.keyring.exportRawQuantumPrivateKey();
        }
        // For HD keyrings, get the quantum key from the derived wallet
        const wallet = this.keyring.getWallet(this.publicKey);
        const mldsaPrivateKey: Uint8Array | undefined = wallet.mldsaKeypair.privateKey;
        if (mldsaPrivateKey === undefined) {
            throw new Error('LocalWallet: No quantum private key available');
        }
        return toHex(mldsaPrivateKey);
    }

    /**
     * Export the chain code
     */
    public exportChainCode(): Uint8Array {
        if (this.keyring instanceof SimpleKeyring) {
            return this.keyring.exportChainCode();
        }
        // For HD keyrings, get chain code from the derived wallet
        return this.keyring.getChainCode(this.publicKey);
    }

    /**
     * Export WIF
     */
    public exportWIF(): string {
        if (this.keyring instanceof SimpleKeyring) {
            return this.keyring.exportWIF();
        }
        throw new Error('LocalWallet: Cannot export WIF from HD keyring directly');
    }

    private getKeypair(): ReturnType<SimpleKeyring['getKeypair']> {
        if (this.keyring instanceof SimpleKeyring) {
            return this.keyring.getKeypair();
        }
        return this.keyring.getWallet(this.publicKey).keypair;
    }

    private getQuantumKeypair(): ReturnType<SimpleKeyring['getQuantumKeypair']> {
        if (this.keyring instanceof SimpleKeyring) {
            return this.keyring.getQuantumKeypair();
        }
        return this.keyring.getMLDSAKeypair(this.publicKey);
    }

    private formatInputsToSign(psbt: Psbt, options: SignPsbtOptions): ToSignInput[] {
        const toSignInputs: ToSignInput[] = [];

        if (options.toSignInputs !== undefined && options.toSignInputs.length > 0) {
            for (const input of options.toSignInputs) {
                const index = input.index;

                if ('address' in input) {
                    if (input.address !== this.address) {
                        throw new Error(`LocalWallet: Address mismatch at input ${index}`);
                    }
                } else if ('publicKey' in input) {
                    if (input.publicKey !== this.publicKey) {
                        throw new Error(`LocalWallet: Public key mismatch at input ${index}`);
                    }
                }

                const toSignInput: ToSignInput = {
                    index,
                    publicKey: this.publicKey
                };
                if (input.sighashTypes !== undefined) {
                    (toSignInput as { sighashTypes?: readonly number[] }).sighashTypes = input.sighashTypes;
                }
                if (input.disableTweakSigner !== undefined) {
                    (toSignInput as { disableTweakSigner?: boolean }).disableTweakSigner = input.disableTweakSigner;
                }
                toSignInputs.push(toSignInput);
            }
        } else {
            // Auto-detect inputs to sign
            for (let i = 0; i < psbt.data.inputs.length; i++) {
                const input = psbt.data.inputs[i];
                if (input === undefined) {
                    continue;
                }

                let script: Uint8Array | undefined;
                if (input.witnessUtxo !== undefined) {
                    script = input.witnessUtxo.script;
                } else if (input.nonWitnessUtxo !== undefined) {
                    const tx = psbt.txInputs[i];
                    if (tx !== undefined) {
                        const nonWitnessTx = Transaction.fromBuffer(input.nonWitnessUtxo);
                        const output = nonWitnessTx.outs[tx.index];
                        script = output?.script;
                    }
                }

                const isSigned = input.finalScriptSig ?? input.finalScriptWitness;

                if (script !== undefined && isSigned === undefined) {
                    const address = scriptPubKeyToAddress(script, this.network);
                    if (address === this.address) {
                        const toSignInput: ToSignInput = {
                            index: i,
                            publicKey: this.publicKey
                        };
                        if (input.sighashType !== undefined) {
                            (toSignInput as { sighashTypes?: readonly number[] }).sighashTypes = [input.sighashType];
                        }
                        toSignInputs.push(toSignInput);
                    }
                }
            }
        }

        return toSignInputs;
    }
}
