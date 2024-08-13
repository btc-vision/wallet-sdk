import { NetworkType } from '../network';
import { AbstractWallet } from '../wallet';
import * as bitcoin from 'bitcoinjs-lib';
export declare function genPsbtOfBIP322Simple({ message, address, networkType }: {
    message: string;
    address: string;
    networkType: NetworkType;
}): bitcoin.Psbt;
export declare function getSignatureFromPsbtOfBIP322Simple(psbt: bitcoin.Psbt): string;
/**
 * reference: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
 */
export declare function signMessageOfBIP322Simple({ message, address, networkType, wallet }: {
    message: string;
    address: string;
    networkType: NetworkType;
    wallet: AbstractWallet;
}): Promise<string>;
export declare function verifyMessageOfBIP322Simple(address: string, msg: string, signature: string, networkType?: NetworkType): boolean;
