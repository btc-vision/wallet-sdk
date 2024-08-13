import { bitcoin } from '../bitcoin-core';
import { NetworkType } from '../network';
import { ToSignInput, UnspentOutput } from '../types';
export declare function sendRunes({ assetUtxos, btcUtxos, assetAddress, btcAddress, toAddress, networkType, runeid, runeAmount, outputValue, feeRate, enableRBF }: {
    assetUtxos: UnspentOutput[];
    btcUtxos: UnspentOutput[];
    assetAddress: string;
    btcAddress: string;
    toAddress: string;
    networkType: NetworkType;
    runeid: string;
    runeAmount: string;
    outputValue: number;
    feeRate: number;
    enableRBF?: boolean;
}): Promise<{
    psbt: bitcoin.Psbt;
    toSignInputs: ToSignInput[];
}>;
