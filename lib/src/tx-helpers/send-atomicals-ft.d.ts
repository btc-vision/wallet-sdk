import { NetworkType } from '../network';
import { ToSignInput, UnspentOutput } from '../types';
export declare function sendAtomicalsFT({ assetUtxos, btcUtxos, toAddress, networkType, changeAssetAddress, sendAmount, changeAddress, feeRate, enableRBF }: {
    assetUtxos: UnspentOutput[];
    btcUtxos: UnspentOutput[];
    toAddress: string;
    networkType: NetworkType;
    changeAssetAddress: string;
    sendAmount: number;
    changeAddress: string;
    feeRate: number;
    enableRBF?: boolean;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    toSignInputs: ToSignInput[];
}>;
