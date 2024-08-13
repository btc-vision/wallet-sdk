import { bitcoin } from './bitcoin-core';
export declare const toXOnly: (pubKey: Buffer) => Buffer;
/**
 * Transform raw private key to taproot address private key
 */
export declare function tweakSigner(signer: bitcoin.Signer, opts?: any): bitcoin.Signer;
/**
 * ECDSA signature validator
 */
export declare const validator: (pubkey: Buffer, msghash: Buffer, signature: Buffer) => boolean;
/**
 * Schnorr signature validator
 */
export declare const schnorrValidator: (pubkey: Buffer, msghash: Buffer, signature: Buffer) => boolean;
/**
 * Transform satoshis to btc format
 */
export declare function satoshisToAmount(val: number): string;
/**
 * Transform btc format to satoshis
 */
export declare function amountToSaothis(val: any): number;
export declare function shortAddress(address?: string, len?: number): string;
