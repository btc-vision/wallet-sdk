/// <reference types="node" />
import { bitcoin } from '../bitcoin-core';
import { NetworkType } from '../network';
import { ToSignInput, UnspentOutput } from '../types';
interface TxOutput {
    address?: string;
    script?: Buffer;
    value: number;
}
/**
 * Transaction
 */
export declare class Transaction {
    private utxos;
    private inputs;
    outputs: TxOutput[];
    private changeOutputIndex;
    changedAddress: string;
    private networkType;
    private feeRate;
    private enableRBF;
    private _cacheNetworkFee;
    private _cacheBtcUtxos;
    private _cacheToSignInputs;
    constructor();
    setNetworkType(network: NetworkType): void;
    setEnableRBF(enable: boolean): void;
    setFeeRate(feeRate: number): void;
    setChangeAddress(address: string): void;
    addInput(utxo: UnspentOutput): void;
    removeLastInput(): void;
    getTotalInput(): number;
    getTotalOutput(): number;
    getUnspent(): number;
    calNetworkFee(): Promise<number>;
    addOutput(address: string, value: number): void;
    addOpreturn(data: Buffer[]): void;
    addScriptOutput(script: Buffer, value: number): void;
    getOutput(index: number): TxOutput;
    addChangeOutput(value: number): void;
    getChangeOutput(): TxOutput;
    getChangeAmount(): number;
    removeChangeOutput(): void;
    removeRecentOutputs(count: number): void;
    toPsbt(): bitcoin.Psbt;
    clone(): Transaction;
    createEstimatePsbt(): Promise<bitcoin.Psbt>;
    private selectBtcUtxos;
    addSufficientUtxosForFee(btcUtxos: UnspentOutput[], forceAsFee?: boolean): Promise<ToSignInput[]>;
    dumpTx(psbt: any): Promise<void>;
}
export {};
