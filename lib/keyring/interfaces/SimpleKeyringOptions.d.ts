/// <reference types="node" />
import { Network, Psbt } from 'bitcoinjs-lib';
import { EventEmitter } from 'events';
import { ECPairInterface } from 'ecpair';
interface BaseKeyringOptions {
    readonly network?: Network;
}
export interface SimpleKeyringOptions extends BaseKeyringOptions {
    readonly privateKeys?: string[];
}
export interface DeserializeOptionBase extends BaseKeyringOptions {
    readonly hdPath?: string;
    readonly activeIndexes?: number[];
}
export interface DeserializeOption extends DeserializeOptionBase {
    readonly mnemonic?: string;
    readonly xpriv?: string;
    readonly passphrase?: string;
}
export interface KeystoneKey {
    readonly path: string;
    readonly extendedPublicKey: string;
}
export interface DeserializeOptionKeystone extends DeserializeOptionBase {
    readonly mfp: string;
    readonly keys: KeystoneKey[];
}
export type KeyringOptions = SimpleKeyringOptions | DeserializeOption | DeserializeOptionKeystone;
export declare abstract class IKeyringBase<T extends BaseKeyringOptions> extends EventEmitter {
    readonly network: Network;
    static type: string;
    type: string;
    protected wallets: ECPairInterface[];
    protected constructor(network?: Network);
    abstract serialize(): T;
    abstract addAccounts(numberOfAccounts: number): string[];
    abstract deserialize(opts?: T): unknown;
    removeAccount(publicKey: string): void;
    verifyMessage(publicKey: string, text: string, sig: string): Promise<boolean>;
    signData(publicKey: string, data: string, type?: 'ecdsa' | 'schnorr'): string;
    abstract getAccounts(): string[];
    signMessage(publicKey: string, text: string): string;
    exportAccount(publicKey: string): string;
    signTransaction(psbt: Psbt, inputs: {
        index: number;
        publicKey: string;
        sighashTypes?: number[];
        disableTweakSigner?: boolean;
    }[], opts?: any): Psbt;
    private _getWalletForAccount;
    private _getPrivateKeyFor;
}
export {};
