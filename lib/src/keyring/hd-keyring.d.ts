import bitcore from 'bitcore-lib';
import { ECPairInterface } from '../bitcoin-core';
import { DeserializeOption, IKeyringBase } from './interfaces/SimpleKeyringOptions';
export declare class HdKeyring extends IKeyringBase<DeserializeOption> {
    static type: string;
    type: string;
    mnemonic: string;
    xpriv: string;
    passphrase: string;
    hdPath: string;
    root: bitcore.HDPrivateKey;
    hdWallet?: any;
    wallets: ECPairInterface[];
    activeIndexes: number[];
    page: number;
    perPage: number;
    private _index2wallet;
    constructor(opts?: DeserializeOption);
    serialize(): DeserializeOption;
    deserialize(_opts?: DeserializeOption): void;
    initFromXpriv(xpriv: string): void;
    initFromMnemonic(mnemonic: string): void;
    changeHdPath(hdPath: string): void;
    getAccountByHdPath(hdPath: string, index: number): string;
    addAccounts(numberOfAccounts?: number): string[];
    activeAccounts(indexes: number[]): string[];
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
    __getPage(increment: number): Promise<{
        address: string;
        index: number;
    }[]>;
    getAccounts(): string[];
    getIndexByAddress(address: string): number;
    private _addressFromIndex;
}
