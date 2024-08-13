import { NetworkType } from '../network';
import { ToSignInput, UnspentOutput } from '../types';
export declare function sendBTC({ btcUtxos, tos, networkType, changeAddress, feeRate, enableRBF, memo, memos }: {
    btcUtxos: UnspentOutput[];
    tos: {
        address: string;
        satoshis: number;
    }[];
    networkType: NetworkType;
    changeAddress: string;
    feeRate: number;
    enableRBF?: boolean;
    memo?: string;
    memos?: string[];
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    toSignInputs: ToSignInput[];
}>;
export declare function sendAllBTC({ btcUtxos, toAddress, networkType, feeRate, enableRBF }: {
    btcUtxos: UnspentOutput[];
    toAddress: string;
    networkType: NetworkType;
    feeRate: number;
    enableRBF?: boolean;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    toSignInputs: ToSignInput[];
}>;
