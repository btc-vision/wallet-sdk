import { AddressType, UnspentOutput } from '../../src/types';
import { LocalWallet } from '../../src/wallet';
/**
 * generate dummy utxos
 */
export declare function genDummyUtxos(wallet: LocalWallet, satoshisArray: number[], assetsArray?: {
    inscriptions?: {
        inscriptionId: string;
        offset: number;
    }[];
    atomicals?: {
        atomicalId: string;
        atomicalNumber: number;
        type: 'NFT' | 'FT';
        ticker?: string;
        atomicalValue: number;
    }[];
}[]): UnspentOutput[];
/**
 * generate a dummy utxo
 */
export declare function genDummyUtxo(wallet: LocalWallet, satoshis: number, assets?: {
    inscriptions?: {
        inscriptionId: string;
        offset: number;
    }[];
    atomicals?: {
        atomicalId: string;
        atomicalNumber: number;
        type: 'NFT' | 'FT';
        ticker?: string;
        atomicalValue?: number;
    }[];
    runes?: {
        runeid: string;
        amount: string;
    }[];
}, txid?: string, vout?: number): UnspentOutput;
/**
 * generate a dummy atomical ft
 */
export declare function genDummyAtomicalsFT(ticker: string, atomicalValue: number): {
    atomicalId: string;
    atomicalNumber: number;
    type: 'NFT' | 'FT';
    ticker: string;
    atomicalValue: number;
};
/**
 * generate a dummy atomical nft
 */
export declare function genDummyAtomicalsNFT(): {
    atomicalId: string;
    atomicalNumber: number;
    type: 'NFT' | 'FT';
};
/**
 * For P2PKH, the signature length is not fixed, so we need to handle it specially
 */
export declare function expectFeeRate(addressType: AddressType, feeRateA: number, feeRateB: number): void;
/**
 * create a dummy send btc psbt for test
 */
export declare function dummySendBTC({ wallet, btcUtxos, tos, feeRate, dump, enableRBF, memo, memos }: {
    wallet: LocalWallet;
    btcUtxos: UnspentOutput[];
    tos: {
        address: string;
        satoshis: number;
    }[];
    feeRate: number;
    dump?: boolean;
    enableRBF?: boolean;
    memo?: string;
    memos?: string[];
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    txid: string;
    inputCount: number;
    outputCount: number;
    feeRate: number;
}>;
/**
 * create a dummy send all btc psbt for test
 */
export declare function dummySendAllBTC({ wallet, btcUtxos, toAddress, feeRate, dump, enableRBF }: {
    wallet: LocalWallet;
    btcUtxos: UnspentOutput[];
    toAddress: string;
    feeRate: number;
    dump?: boolean;
    enableRBF?: boolean;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    txid: string;
    inputCount: number;
    outputCount: number;
    feeRate: number;
}>;
/**
 * create a dummy send inscription psbt for test
 */
export declare function dummySendInscription({ assetWallet, assetUtxo, btcWallet, btcUtxos, feeRate, toAddress, outputValue, dump, enableRBF, enableMixed }: {
    assetWallet: LocalWallet;
    assetUtxo: UnspentOutput;
    btcWallet: LocalWallet;
    btcUtxos: UnspentOutput[];
    outputValue: number;
    feeRate: number;
    toAddress: string;
    dump?: boolean;
    enableRBF?: boolean;
    enableMixed?: boolean;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    txid: string;
    inputCount: number;
    outputCount: number;
    feeRate: number;
}>;
/**
 * create a dummy send inscriptions psbt for test
 */
export declare function dummySendInscriptions({ assetWallet, assetUtxos, btcWallet, btcUtxos, feeRate, toAddress, dump, enableRBF }: {
    assetWallet: LocalWallet;
    assetUtxos: UnspentOutput[];
    btcWallet: LocalWallet;
    btcUtxos: UnspentOutput[];
    feeRate: number;
    toAddress: string;
    dump?: boolean;
    enableRBF?: boolean;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    txid: string;
    inputCount: number;
    outputCount: number;
    feeRate: number;
}>;
/**
 * create a dummy split inscription psbt for test
 */
export declare function dummySplitOrdUtxo({ assetWallet, assetUtxo, btcWallet, btcUtxos, feeRate, outputValue, dump, enableRBF }: {
    assetWallet: LocalWallet;
    assetUtxo: UnspentOutput;
    btcWallet: LocalWallet;
    btcUtxos: UnspentOutput[];
    outputValue?: number;
    feeRate: number;
    dump?: boolean;
    enableRBF?: boolean;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    txid: string;
    inputCount: number;
    outputCount: number;
    feeRate: number;
    splitedCount: number;
}>;
/**
 * create a dummy send atomical ft psbt for test
 */
export declare function dummySendAtomicalsFT({ assetWallet, assetUtxo, btcWallet, btcUtxos, feeRate, toAddress, dump, enableRBF, sendAmount }: {
    assetWallet: LocalWallet;
    assetUtxo: UnspentOutput;
    btcWallet: LocalWallet;
    btcUtxos: UnspentOutput[];
    feeRate: number;
    toAddress: string;
    dump?: boolean;
    enableRBF?: boolean;
    sendAmount: number;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    txid: string;
    inputCount: number;
    outputCount: number;
    feeRate: number;
}>;
/**
 * create a dummy send atomical nft psbt for test
 */
export declare function dummySendAtomical({ assetWallet, assetUtxo, btcWallet, btcUtxos, feeRate, toAddress, dump, enableRBF }: {
    assetWallet: LocalWallet;
    assetUtxo: UnspentOutput;
    btcWallet: LocalWallet;
    btcUtxos: UnspentOutput[];
    feeRate: number;
    toAddress: string;
    dump?: boolean;
    enableRBF?: boolean;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    txid: string;
    inputCount: number;
    outputCount: number;
    feeRate: number;
}>;
export declare function dummySendRunes({ assetWallet, assetUtxo, btcWallet, btcUtxos, feeRate, toAddress, dump, enableRBF, runeid, runeAmount, outputValue }: {
    assetWallet: LocalWallet;
    assetUtxo: UnspentOutput;
    btcWallet: LocalWallet;
    btcUtxos: UnspentOutput[];
    feeRate: number;
    toAddress: string;
    dump?: boolean;
    enableRBF?: boolean;
    runeid: string;
    runeAmount: string;
    outputValue: number;
}): Promise<{
    psbt: import("bitcoinjs-lib").Psbt;
    txid: string;
    inputCount: number;
    outputCount: number;
    feeRate: number;
}>;
