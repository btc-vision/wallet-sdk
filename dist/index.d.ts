import * as bitcoin from '@btc-vision/bitcoin';
import { BtcSignature } from '@keystonehq/keystone-sdk';
import { default as default_2 } from 'bitcore-lib';
import * as ecc from '@bitcoinerlab/secp256k1';
import { ECPairAPI } from 'ecpair';
import { ECPairInterface } from 'ecpair';
import { EventEmitter } from 'events';
import { Network } from '@btc-vision/bitcoin';
import { Psbt } from '@btc-vision/bitcoin';
import { ToSignInput as ToSignInput_2 } from '..';

export declare type AbstractWallet = wallet.AbstractWallet;

declare interface AbstractWallet_2 {
    signPsbt(psbt: bitcoin.Psbt, opts?: SignPsbtOptions): Promise<bitcoin.Psbt>;
    signMessage(message: string | Buffer, type: 'bip322-simple' | 'ecdsa'): Promise<string>;
}

declare namespace address {
    export {
        publicKeyToPayment,
        publicKeyToAddress_2 as publicKeyToAddress,
        publicKeyToScriptPk,
        addressToScriptPk,
        isValidAddress,
        decodeAddress,
        getAddressType,
        scriptPkToAddress_2 as scriptPkToAddress
    }
}
export { address }

/**
 * Convert bitcoin address to scriptPk.
 */
declare function addressToScriptPk(address: string, networkType: NetworkType): Buffer<ArrayBufferLike>;

export declare enum AddressType {
    P2PKH = 0,
    P2WPKH = 1,
    P2TR = 2,
    P2SH_P2WPKH = 3,
    M44_P2WPKH = 4,// deprecated
    M44_P2TR = 5,// deprecated
    P2WSH = 6,
    P2SH = 7,
    UNKNOWN = 8
}

export declare interface AddressUserToSignInput extends BaseUserToSignInput {
    address: string;
}

/**
 * Transform btc format to satoshis
 */
declare function amountToSaothis(val: any): number;

declare interface BaseKeyringOptions {
    readonly network?: Network;
}

declare interface BaseUserToSignInput {
    index: number;
    sighashTypes?: number[] | undefined;
    disableTweakSigner?: boolean;
}

declare namespace core {
    export {
        ECPair_2 as ECPair,
        ECPairInterface,
        ecc,
        bitcoin
    }
}
export { core }

declare function decodeAddress(address: string): {
    networkType: NetworkType;
    addressType: AddressType;
    dust: number;
};

export declare interface DeserializeOption extends DeserializeOptionBase {
    readonly mnemonic?: string | null;
    readonly xpriv?: string | null;
    readonly passphrase?: string | null;
}

export declare interface DeserializeOptionBase extends BaseKeyringOptions {
    readonly hdPath?: string;
    readonly activeIndexes?: number[];
}

export declare interface DeserializeOptionKeystone extends DeserializeOptionBase {
    readonly mfp: string;
    readonly keys: KeystoneKey[];
}

export declare const ECPair: ECPairAPI;

declare const ECPair_2: ECPairAPI;

/**
 * EstimateWallet is a wallet that can be used to estimate the size of a transaction.
 */
declare class EstimateWallet implements AbstractWallet_2 {
    keyring: SimpleKeyring;
    address: string;
    pubkey: string;
    network: bitcoin.Network;
    networkType: NetworkType;
    addressType: AddressType;
    constructor(wif: string, networkType?: NetworkType, addressType?: AddressType);
    static fromRandom(addressType?: AddressType, networkType?: NetworkType): EstimateWallet;
    getNetworkType(): NetworkType;
    signPsbt(psbt: bitcoin.Psbt, opts?: SignPsbtOptions): Promise<bitcoin.Psbt>;
    getPublicKey(): Promise<string>;
    signMessage(message: string | Buffer, type: 'bip322-simple' | 'ecdsa'): Promise<string>;
    private formatOptionsToSignInputs;
}

export declare const genPsbtOfBIP322Simple: typeof message.genPsbtOfBIP322Simple;

declare function genPsbtOfBIP322Simple_2({ message, address, networkType }: {
    message: string | Buffer;
    address: string;
    networkType: NetworkType;
}): bitcoin.Psbt;

/**
 * return the added virtual size of the utxo
 */
declare function getAddedVirtualSize(addressType: AddressType): number;

/**
 * Get address type.
 */
declare function getAddressType(address: string, networkType?: NetworkType): AddressType;

declare function getAddressUtxoDust(address: string, networkType?: NetworkType): number;

export declare const getSignatureFromPsbtOfBIP322Simple: typeof message.getSignatureFromPsbtOfBIP322Simple;

declare function getSignatureFromPsbtOfBIP322Simple_2(psbt: bitcoin.Psbt): string;

declare function getUtxoDust(addressType: AddressType): 294 | 330 | 546;

declare function hasAnyAssets(utxos: UnspentOutput[]): boolean;

declare function hasAtomicals(utxos: UnspentOutput[]): boolean;

declare function hasAtomicalsFT(utxos: UnspentOutput[]): boolean;

declare function hasAtomicalsNFT(utxos: UnspentOutput[]): boolean;

declare function hasInscription(utxos: UnspentOutput[]): boolean;

export declare class HdKeyring extends IKeyringBase<DeserializeOption> {
    static type: string;
    type: string;
    mnemonic: string | null;
    xpriv: string | null;
    passphrase: string | null;
    hdPath: string;
    root: default_2.HDPrivateKey | null;
    hdWallet?: any;
    wallets: ECPairInterface[];
    activeIndexes: number[];
    page: number;
    perPage: number;
    private _index2wallet;
    constructor(opts?: DeserializeOption);
    serialize(): DeserializeOption;
    deserialize(_opts?: DeserializeOption): void;
    initFromXpriv(xpriv: string): void;
    initFromMnemonic(mnemonic: string): void;
    changeHdPath(hdPath: string): void;
    getAccountByHdPath(hdPath: string, index: number): string;
    addAccounts(numberOfAccounts?: number): string[];
    activeAccounts(indexes: number[]): string[];
    getFirstPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getNextPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getPreviousPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getAddresses(start: number, end: number): {
        address: string;
        index: number;
    }[];
    __getPage(increment: number): Promise<{
        address: string;
        index: number;
    }[]>;
    getAccounts(): string[];
    getIndexByAddress(address: string): number | null;
    private _addressFromIndex;
}

export declare abstract class IKeyringBase<T extends BaseKeyringOptions> extends EventEmitter {
    readonly network: Network;
    static type: string;
    type: string;
    protected wallets: ECPairInterface[];
    protected constructor(network?: Network);
    abstract serialize(): T;
    abstract addAccounts(numberOfAccounts: number): string[];
    abstract deserialize(opts?: T): unknown;
    removeAccount(publicKey: string): void;
    verifyMessage(publicKey: string, text: string, sig: string): Promise<boolean>;
    signData(publicKey: string, data: string, type?: 'ecdsa' | 'schnorr'): string;
    abstract getAccounts(): string[];
    signMessage(publicKey: string, message: string | Buffer): string;
    exportAccount(publicKey: string): string | undefined;
    signTransaction(psbt: Psbt, inputs: {
        index: number;
        publicKey: string;
        sighashTypes?: number[];
        disableTweakSigner?: boolean;
    }[], opts?: any): Psbt;
    private _getWalletForAccount;
    private _getPrivateKeyFor;
}

declare class InscriptionUnit {
    satoshis: number;
    inscriptions: {
        id: string;
        outputOffset: number;
        unitOffset: number;
    }[];
    constructor(satoshis: number, inscriptions: {
        id: string;
        outputOffset: number;
        unitOffset: number;
    }[]);
    hasInscriptions(): boolean;
}

declare class InscriptionUnspendOutput {
    inscriptionUnits: InscriptionUnit[];
    utxo: UnspentOutput;
    constructor(utxo: UnspentOutput, outputValue?: number);
    /**
     * Get non-Ord satoshis for spending
     */
    getNonInscriptionSatoshis(): number;
    /**
     * Get last non-ord satoshis for spending.
     * Only the last one is available
     * @returns
     */
    getLastUnitSatoshis(): number;
    hasInscriptions(): boolean;
    dump(): void;
    private split;
}

/**
 * Check if the address is valid.
 */
declare function isValidAddress(address: string, networkType?: NetworkType): boolean;

export declare type KeyringOptions = SimpleKeyringOptions | DeserializeOption | DeserializeOptionKeystone;

export declare interface KeystoneKey {
    readonly path: string;
    readonly extendedPublicKey: string;
}

export declare class KeystoneKeyring extends IKeyringBase<DeserializeOptionKeystone> {
    static type: string;
    type: string;
    mfp: string;
    keys: KeystoneKey[];
    hdPath?: string;
    activeIndexes: number[];
    root: default_2.HDPublicKey | undefined;
    page: number;
    perPage: number;
    origin: string;
    constructor(opts?: DeserializeOptionKeystone);
    initFromUR(type: string, cbor: string): Promise<void>;
    getHardenedPath(hdPath: string): string;
    getHDPublicKey(hdPath: string): default_2.HDPublicKey;
    getDefaultHdPath(): string;
    initRoot(): void;
    deserialize(opts: DeserializeOptionKeystone): void;
    serialize(): DeserializeOptionKeystone;
    addAccounts(numberOfAccounts?: number): string[];
    addChangeAddressAccounts(numberOfAccounts?: number): Promise<string[]>;
    getAccounts(): string[];
    getAccounts2(): Promise<{
        index: number;
        path: string;
        publicKey: string;
    }[]>;
    getAccountsWithBrand(): Promise<{
        address: string;
        index: number;
    }[]>;
    getWalletByIndex(index: number): Wallet;
    getChangeAddressWalletByIndex(index: number): Wallet;
    removeAccount(publicKey: string): void;
    exportAccount(_publicKey: string): string;
    getFirstPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getNextPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getPreviousPage(): Promise<{
        address: string;
        index: number;
    }[]>;
    getAddresses(start: number, end: number): {
        address: string;
        index: number;
    }[];
    getPage(increment: number): Promise<{
        address: string;
        index: number;
    }[]>;
    activeAccounts(indexes: number[]): string[];
    changeHdPath(hdPath: string): void;
    changeChangeAddressHdPath(hdPath: string): never[];
    getAccountByHdPath(hdPath: string, index: number): string;
    getChangeAddressAccountByHdPath(hdPath: string, index: number): string;
    genSignPsbtUr(psbtHex: string): Promise<{
        type: string;
        cbor: string;
    }>;
    parseSignPsbtUr(type: string, cbor: string): Promise<string>;
    genSignMsgUr(publicKey: string, text: string): Promise<{
        requestId: any;
        type: string;
        cbor: string;
    }>;
    parseSignMsgUr(type: string, cbor: string): Promise<BtcSignature>;
    signMessage(publicKey: string, message: string | Buffer): string;
    verifyMessage(publicKey: string, text: string, sig: string): Promise<boolean>;
}

declare class LocalWallet implements AbstractWallet_2 {
    keyring: SimpleKeyring;
    address: string;
    pubkey: string;
    network: bitcoin.Network;
    addressType: AddressType;
    networkType: NetworkType;
    scriptPk: string | undefined;
    constructor(wif: string, addressType?: AddressType, networkType?: NetworkType);
    static fromMnemonic(addressType: AddressType, networkType: NetworkType, mnemonic: string, passPhrase?: string, hdPath?: string): LocalWallet;
    static fromRandom(addressType?: AddressType, networkType?: NetworkType): LocalWallet;
    getNetworkType(): NetworkType;
    signPsbt(psbt: bitcoin.Psbt, opts?: SignPsbtOptions): Promise<bitcoin.Psbt>;
    getPublicKey(): string;
    signMessage(message: string | Buffer, type: 'bip322-simple' | 'ecdsa'): Promise<string>;
    signData(data: string, type?: 'ecdsa' | 'schnorr'): Promise<string>;
    private formatOptionsToSignInputs;
}

declare namespace message {
    export {
        genPsbtOfBIP322Simple_2 as genPsbtOfBIP322Simple,
        getSignatureFromPsbtOfBIP322Simple_2 as getSignatureFromPsbtOfBIP322Simple,
        signMessageOfBIP322Simple,
        verifyMessageOfBIP322Simple_2 as verifyMessageOfBIP322Simple,
        signMessageOfDeterministicECDSA,
        signMessageOfECDSA,
        verifyMessageOfECDSA
    }
}
export { message }

declare namespace network {
    export {
        toPsbtNetwork_2 as toPsbtNetwork,
        toNetworkType,
        NetworkType
    }
}
export { network }

declare enum NetworkType {
    MAINNET = 0,
    TESTNET = 1,
    REGTEST = 2
}

export declare const publicKeyToAddress: typeof address.publicKeyToAddress;

/**
 * Convert public key to bitcoin address.
 */
declare function publicKeyToAddress_2(publicKey: string, type: AddressType, networkType: NetworkType): string;

/**
 * Convert public key to bitcoin payment object.
 */
declare function publicKeyToPayment(publicKey: string, type: AddressType, networkType: NetworkType): bitcoin.P2PKHPayment | bitcoin.P2WPKHPayment | bitcoin.P2TRPayment | bitcoin.P2SHPayment | null | undefined;

/**
 * Convert public key to bitcoin scriptPk.
 */
declare function publicKeyToScriptPk(publicKey: string, type: AddressType, networkType: NetworkType): string | undefined;

export declare interface PublicKeyUserToSignInput extends BaseUserToSignInput {
    publicKey: string;
}

/**
 * Transform satoshis to btc format
 */
declare function satoshisToAmount(val: number): string;

/**
 * Schnorr signature validator
 */
declare const schnorrValidator: (pubkey: Buffer, msghash: Buffer, signature: Buffer) => boolean;

export declare const scriptPkToAddress: typeof address.scriptPkToAddress;

/**
 * Convert scriptPk to address.
 */
declare function scriptPkToAddress_2(scriptPk: string | Buffer, networkType?: NetworkType): string;

/**
 * select utxos so that the total amount of utxos is greater than or equal to targetAmount
 * return the selected utxos and the unselected utxos
 * @param utxos
 * @param targetAmount
 */
declare function selectBtcUtxos(utxos: UnspentOutput[], targetAmount: number): {
    selectedUtxos: UnspentOutput[];
    remainingUtxos: UnspentOutput[];
};

declare function sendAllBTC(params: {
    btcUtxos: UnspentOutput[];
    toAddress: string;
    networkType: NetworkType;
    feeRate: number;
    enableRBF?: boolean;
}): Promise<{
    psbt: Psbt;
    toSignInputs: ToSignInput[];
}>;

declare function sendAtomicalsFT(params: {
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
    psbt: Psbt;
    toSignInputs: ToSignInput[];
}>;

declare function sendAtomicalsNFT(params: {
    assetUtxo: UnspentOutput;
    btcUtxos: UnspentOutput[];
    toAddress: string;
    networkType: NetworkType;
    changeAddress: string;
    feeRate: number;
    enableRBF?: boolean;
}): Promise<{
    psbt: Psbt;
    toSignInputs: ToSignInput[];
}>;

declare function sendBTC(params: {
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
    psbt: Psbt;
    toSignInputs: ToSignInput[];
}>;

declare function sendInscription({ assetUtxo, btcUtxos, toAddress, networkType, changeAddress, feeRate, outputValue, enableRBF, enableMixed }: {
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
    psbt: Psbt;
    toSignInputs: ToSignInput_2[];
}>;

declare function sendInscriptions({ assetUtxos, btcUtxos, toAddress, networkType, changeAddress, feeRate, enableRBF }: {
    assetUtxos: UnspentOutput[];
    btcUtxos: UnspentOutput[];
    toAddress: string;
    networkType: NetworkType;
    changeAddress: string;
    feeRate: number;
    enableRBF?: boolean;
}): Promise<{
    psbt: Psbt;
    toSignInputs: ToSignInput[];
}>;

declare function sendRunes({ assetUtxos, btcUtxos, assetAddress, btcAddress, toAddress, networkType, runeid, runeAmount, outputValue, feeRate, enableRBF }: {
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

declare function shortAddress(address?: string, len?: number): string;

/**
 * reference: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
 */
export declare function signMessageOfBIP322Simple({ message, address, networkType, wallet }: {
    message: string | Buffer;
    address: string;
    networkType: NetworkType;
    wallet: AbstractWallet_2;
}): Promise<string>;

declare function signMessageOfDeterministicECDSA(ecpair: ECPairInterface, message: string | Buffer): string;

declare function signMessageOfECDSA(privateKey: ECPairInterface, text: string): string;

export declare interface SignPsbtOptions {
    autoFinalized?: boolean;
    toSignInputs?: UserToSignInput[];
}

export declare class SimpleKeyring extends IKeyringBase<SimpleKeyringOptions> {
    static type: string;
    type: string;
    constructor(opts?: SimpleKeyringOptions);
    serialize(): SimpleKeyringOptions;
    deserialize(opts: SimpleKeyringOptions): void;
    addAccounts(n?: number): string[];
    getAccounts(): string[];
}

export declare interface SimpleKeyringOptions extends BaseKeyringOptions {
    readonly privateKeys?: string[];
}

declare function splitInscriptionUtxo({ btcUtxos, assetUtxo, networkType, changeAddress, feeRate, enableRBF, outputValue }: {
    btcUtxos: UnspentOutput[];
    assetUtxo: UnspentOutput;
    networkType: NetworkType;
    changeAddress: string;
    feeRate?: number;
    enableRBF?: boolean;
    outputValue?: number;
}): Promise<{
    psbt: Psbt;
    toSignInputs: ToSignInput[];
    splitedCount: number;
}>;

/**
 * Convert @btc-vision/bitcoin network to network type.
 */
declare function toNetworkType(network: bitcoin.Network): NetworkType;

export declare const toPsbtNetwork: typeof network.toPsbtNetwork;

/**
 * Convert network type to @btc-vision/bitcoin network.
 */
declare function toPsbtNetwork_2(networkType: NetworkType): bitcoin.networks.Network;

export declare interface ToSignInput {
    index: number;
    publicKey: string;
    sighashTypes?: number[];
    disableTweakSigner?: boolean;
}

declare const toXOnly: (pubKey: Buffer) => Buffer<ArrayBufferLike>;

/**
 * Transaction
 */
declare class Transaction {
    outputs: TxOutput[];
    changedAddress: string;
    private utxos;
    private inputs;
    private changeOutputIndex;
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
    addSufficientUtxosForFee(btcUtxos: UnspentOutput[], forceAsFee?: boolean): Promise<ToSignInput[]>;
    dumpTx(psbt: any): Promise<void>;
    private selectBtcUtxos;
}

export declare namespace transaction {
    export {
        InscriptionUnit,
        InscriptionUnspendOutput,
        Transaction,
        getUtxoDust,
        getAddressUtxoDust,
        utxoHelper
    }
}

/**
 * Transform raw private key to taproot address private key
 */
declare function tweakSigner(signer: bitcoin.Signer, opts?: any): bitcoin.Signer;

export declare namespace txHelpers {
    export {
        sendAllBTC,
        sendAtomicalsFT,
        sendAtomicalsNFT,
        sendBTC,
        sendInscription,
        sendInscriptions,
        sendRunes,
        splitInscriptionUtxo
    }
}

declare interface TxOutput {
    address?: string;
    script?: Buffer;
    value: number;
}

export declare interface UnspentOutput {
    txid: string;
    vout: number;
    satoshis: number;
    scriptPk: string;
    pubkey: string;
    addressType: AddressType;
    inscriptions: {
        inscriptionId: string;
        inscriptionNumber?: number;
        offset: number;
    }[];
    atomicals: {
        atomicalId: string;
        atomicalNumber: number;
        type: 'FT' | 'NFT';
        ticker?: string;
        atomicalValue?: number;
    }[];
    runes?: {
        runeid: string;
        amount: string;
    }[];
    rawtx?: string;
}

export declare type UserToSignInput = AddressUserToSignInput | PublicKeyUserToSignInput;

export declare namespace utils {
    export {
        tweakSigner,
        satoshisToAmount,
        amountToSaothis,
        shortAddress,
        toXOnly,
        validator,
        schnorrValidator
    }
}

export declare const UTXO_DUST = 546;

declare const utxoHelper: {
    hasAtomicalsFT: typeof hasAtomicalsFT;
    hasAtomicalsNFT: typeof hasAtomicalsNFT;
    hasAtomicals: typeof hasAtomicals;
    hasInscription: typeof hasInscription;
    hasAnyAssets: typeof hasAnyAssets;
    selectBtcUtxos: typeof selectBtcUtxos;
    getAddedVirtualSize: typeof getAddedVirtualSize;
    getUtxoDust: typeof getUtxoDust;
    getAddressUtxoDust: typeof getAddressUtxoDust;
};

/**
 * ECDSA signature validator
 */
declare const validator: (pubkey: Buffer, msghash: Buffer, signature: Buffer) => boolean;

export declare const verifyMessageOfBIP322Simple: typeof message.verifyMessageOfBIP322Simple;

declare function verifyMessageOfBIP322Simple_2(address: string, msg: string, signature: string, networkType?: NetworkType): boolean;

declare function verifyMessageOfECDSA(publicKey: string, text: string, sig: string): boolean;

export declare function verifySignData(publicKey: string, hash: string, type: 'ecdsa' | 'schnorr', signature: string): boolean;

declare interface Wallet {
    index: number;
    publicKey: string;
    path: string;
}

declare namespace wallet {
    export {
        AbstractWallet_2 as AbstractWallet,
        EstimateWallet,
        LocalWallet
    }
}
export { wallet }

export { }
