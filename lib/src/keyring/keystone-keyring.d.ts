import bitcore from 'bitcore-lib';
import { DeserializeOptionKeystone, IKeyringBase, KeystoneKey } from './interfaces/SimpleKeyringOptions';
interface Wallet {
    index: number;
    publicKey: string;
    path: string;
}
export declare class KeystoneKeyring extends IKeyringBase<DeserializeOptionKeystone> {
    static type: string;
    type: string;
    mfp: string;
    keys: KeystoneKey[];
    hdPath?: string;
    activeIndexes?: number[];
    root: bitcore.HDPublicKey;
    page: number;
    perPage: number;
    origin: string;
    constructor(opts?: DeserializeOptionKeystone);
    initFromUR(type: string, cbor: string): Promise<void>;
    getHardenedPath(hdPath: string): string;
    getHDPublicKey(hdPath: string): bitcore.HDPublicKey;
    getDefaultHdPath(): string;
    initRoot(): void;
    deserialize(opts: DeserializeOptionKeystone): void;
    serialize(): DeserializeOptionKeystone;
    addAccounts(numberOfAccounts?: number): string[];
    addChangeAddressAccounts(numberOfAccounts?: number): Promise<any[]>;
    getAccounts(): string[];
    getAccounts2(): Promise<{
        index: number;
        path: string;
        publicKey: string;
    }[]>;
    getAccountsWithBrand(): Promise<{
        address: string;
        index: number;
    }[]>;
    getWalletByIndex(index: number): Wallet;
    getChangeAddressWalletByIndex(index: number): Wallet;
    removeAccount(publicKey: string): void;
    exportAccount(_publicKey: string): string;
    getFirstPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getNextPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getPreviousPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getAddresses(start: number, end: number): {
        address: string;
        index: number;
    }[];
    getPage(increment: number): Promise<{
        address: string;
        index: number;
    }[]>;
    activeAccounts(indexes: number[]): string[];
    changeHdPath(hdPath: string): void;
    changeChangeAddressHdPath(hdPath: string): any[];
    getAccountByHdPath(hdPath: string, index: number): string;
    getChangeAddressAccountByHdPath(hdPath: string, index: number): string;
    genSignPsbtUr(psbtHex: string): Promise<{
        type: string;
        cbor: string;
    }>;
    parseSignPsbtUr(type: string, cbor: string): Promise<string>;
    genSignMsgUr(publicKey: string, text: string): Promise<{
        requestId: any;
        type: string;
        cbor: string;
    }>;
    parseSignMsgUr(type: string, cbor: string): Promise<import("@keystonehq/keystone-sdk").BtcSignature>;
    signMessage(publicKey: string, text: string): string;
    verifyMessage(publicKey: string, text: string, sig: string): Promise<boolean>;
}
export {};
