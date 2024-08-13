import { NetworkType } from '../network';
import { UnspentOutput } from '../types';
export declare function sendInscription({ assetUtxo, btcUtxos, toAddress, networkType, changeAddress, feeRate, outputValue, enableRBF, enableMixed }: {
    assetUtxo: UnspentOutput;
    btcUtxos: UnspentOutput[];
    toAddress: string;
    networkType: NetworkType;
    changeAddress: string;
    feeRate: number;
    outputValue: number;
    enableRBF?: boolean;
    enableMixed?: boolean;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    toSignInputs: import("../types").ToSignInput[];
}>;
