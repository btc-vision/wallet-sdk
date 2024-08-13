import { NetworkType } from '../network';
import { ToSignInput, UnspentOutput } from '../types';
export declare function sendInscriptions({ assetUtxos, btcUtxos, toAddress, networkType, changeAddress, feeRate, enableRBF }: {
    assetUtxos: UnspentOutput[];
    btcUtxos: UnspentOutput[];
    toAddress: string;
    networkType: NetworkType;
    changeAddress: string;
    feeRate: number;
    enableRBF?: boolean;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    toSignInputs: ToSignInput[];
}>;
