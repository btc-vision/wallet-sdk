export declare function expectThrowError(func: any, errorMsg: any): Promise<void>;
import { bitcoin } from '../src/bitcoin-core';
export declare function printTx(rawtx: string): void;
export declare function printPsbt(psbtData: string | bitcoin.Psbt): void;
