import { NetworkType } from '../network';
import { ToSignInput, UnspentOutput } from '../types';
export declare function splitInscriptionUtxo({ btcUtxos, assetUtxo, networkType, changeAddress, feeRate, enableRBF, outputValue }: {
    btcUtxos: UnspentOutput[];
    assetUtxo: UnspentOutput;
    networkType: NetworkType;
    changeAddress: string;
    feeRate?: number;
    enableRBF?: boolean;
    outputValue?: number;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    toSignInputs: ToSignInput[];
    splitedCount: number;
}>;
