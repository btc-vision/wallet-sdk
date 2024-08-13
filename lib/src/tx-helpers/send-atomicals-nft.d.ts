import { NetworkType } from '../network';
import { ToSignInput, UnspentOutput } from '../types';
export declare function sendAtomicalsNFT({ assetUtxo, btcUtxos, toAddress, networkType, changeAddress, feeRate, enableRBF }: {
    assetUtxo: UnspentOutput;
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
