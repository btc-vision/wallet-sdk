/**
 * OPNet Wallet SDK - BIP322 Message Signing
 * BIP322 simple message signing and verification.
 * Reference: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
 */

import {
    address as bitcoinAddress,
    alloc,
    concat,
    crypto as bitcoinCrypto,
    fromHex,
    type Bytes32,
    type Network,
    type PublicKey,
    type Satoshi,
    type Script,
    Psbt,
    PsbtTransaction,
    script as bitcoinScript,
    toSatoshi,
    Transaction,
    type ValidateSigFunction,
} from '@btc-vision/bitcoin';
import { type MessageHash, createMessageHash, createPublicKey, createSchnorrSignature, createSignature, createXOnlyPublicKey } from '@btc-vision/ecpair';
import { AddressTypes, WalletNetworks } from '@btc-vision/transaction';
import { detectAddressType } from '@/address';
import { toNetwork } from '@/network';
import type { Bip322Signature } from '@/types';
import { getNobleBackend } from './backend.js';

const textEncoder = new TextEncoder();
const ZERO_SATOSHI: Satoshi = toSatoshi(0n);

function toBase64(bytes: Uint8Array): string {
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

function fromBase64Bytes(base64: string): Uint8Array {
    const binary: string = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Supported address types for BIP322 signing
 */
const SUPPORTED_ADDRESS_TYPES = [AddressTypes.P2WPKH, AddressTypes.P2TR];

/**
 * Compute the BIP322 message hash
 */
function computeBip322Hash(message: string | Uint8Array): Uint8Array {
    const tag = 'BIP0322-signed-message';
    const tagHash = bitcoinCrypto.sha256(textEncoder.encode(tag));
    const messageBytes: Uint8Array = typeof message === 'string' ? textEncoder.encode(message) : message;
    return bitcoinCrypto.sha256(concat([tagHash, tagHash, messageBytes]));
}

/**
 * Encode a buffer as a variable-length string for witness serialization
 */
function encodeVarString(buf: Uint8Array): Uint8Array {
    const varint = bitcoinScript.number.encode(buf.length);
    return concat([varint, buf]);
}

/**
 * Generate a PSBT for BIP322 simple message signing
 */
export function generateBip322Psbt(message: string | Uint8Array, address: string, network: Network): Psbt {
    const outputScript = bitcoinAddress.toOutputScript(address, network);
    const addressType = detectAddressType(address, network);

    if (addressType === null || !SUPPORTED_ADDRESS_TYPES.includes(addressType)) {
        throw new Error(`BIP322: Address type not supported for signing. Got: ${String(addressType)}`);
    }

    const messageHash = computeBip322Hash(message);
    const prevoutHash = alloc(32) as Bytes32;
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const scriptSig = concat([fromHex('0020'), messageHash]) as Script;

    // Create "to spend" transaction
    const txToSpend = new Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
    txToSpend.addOutput(outputScript, ZERO_SATOSHI);

    // Create PSBT to sign
    const psbt = new Psbt({ network });
    psbt.setVersion(0);
    psbt.addInput({
        hash: txToSpend.getHash(),
        index: 0,
        sequence: 0,
        witnessUtxo: {
            script: outputScript,
            value: ZERO_SATOSHI
        }
    });
    psbt.addOutput({
        script: fromHex('6a') as Script, // OP_RETURN
        value: ZERO_SATOSHI
    });

    return psbt;
}

/**
 * Extract signature from a signed BIP322 PSBT
 */
export function extractBip322Signature(psbt: Psbt): string {
    const tx = psbt.extractTransaction();
    const witness = tx.ins[0]?.witness;

    if (witness === undefined || witness.length === 0) {
        throw new Error('BIP322: No witness data found in signed transaction');
    }

    // Encode witness stack
    const varintLength = bitcoinScript.number.encode(witness.length);
    const encodedWitness = concat([varintLength, ...witness.map((w) => encodeVarString(w))]);

    return toBase64(encodedWitness);
}

/**
 * Sign a message using BIP322 simple format
 */
export async function signBip322Message(
    message: string | Uint8Array,
    address: string,
    network: Network,
    signPsbt: (psbt: Psbt) => Promise<Psbt>
): Promise<string> {
    const psbt = generateBip322Psbt(message, address, network);
    const signedPsbt = await signPsbt(psbt);
    signedPsbt.finalizeAllInputs();
    return extractBip322Signature(signedPsbt);
}

/**
 * ECDSA signature validator
 */
const ecdsaValidator: ValidateSigFunction = (pubkey: PublicKey, msghash: MessageHash, signature: Uint8Array): boolean => {
    try {
        const decoded = bitcoinScript.signature.decode(signature);
        return getNobleBackend().verify(createMessageHash(msghash), createPublicKey(pubkey), createSignature(decoded.signature));
    } catch {
        return false;
    }
};

/**
 * Schnorr signature validator
 */
function schnorrValidator(pubkey: Uint8Array, msghash: Uint8Array, signature: Uint8Array): boolean {
    try {
        const xOnlyPubkey = pubkey.length === 33 ? pubkey.subarray(1, 33) : pubkey;
        return getNobleBackend().verifySchnorr(createMessageHash(msghash), createXOnlyPublicKey(xOnlyPubkey), createSchnorrSignature(signature));
    } catch {
        return false;
    }
}

/**
 * Verify a BIP322 simple message signature for P2TR addresses
 */
function verifyBip322P2TR(address: string, message: string | Uint8Array, signature: string, network: Network): boolean {
    try {
        const outputScript = bitcoinAddress.toOutputScript(address, network);
        const messageHash = computeBip322Hash(message);

        const prevoutHash = alloc(32) as Bytes32;
        const prevoutIndex = 0xffffffff;
        const sequence = 0;
        const scriptSig = concat([fromHex('0020'), messageHash]) as Script;

        // Reconstruct "to spend" transaction
        const txToSpend = new Transaction();
        txToSpend.version = 0;
        txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
        txToSpend.addOutput(outputScript, ZERO_SATOSHI);

        // Decode signature
        const signatureData = fromBase64Bytes(signature);
        const decompiled = bitcoinScript.decompile(signatureData.subarray(1));

        if (!Array.isArray(decompiled) || decompiled.length === 0) {
            return false;
        }

        const sig = decompiled[0];
        if (!(sig instanceof Uint8Array)) {
            return false;
        }

        // Extract pubkey from output script (x-only format)
        const pubkey = concat([fromHex('02'), outputScript.subarray(2)]);

        // Create PSBT for verification
        const psbt = new Psbt({ network });
        psbt.setVersion(0);
        psbt.addInput({
            hash: txToSpend.getHash(),
            index: 0,
            sequence: 0,
            witnessUtxo: {
                script: outputScript,
                value: ZERO_SATOSHI
            }
        });
        psbt.addOutput({
            script: fromHex('6a') as Script,
            value: ZERO_SATOSHI
        });

        // Compute taproot sighash using public API
        const psbtTx = psbt.data.globalMap.unsignedTx as PsbtTransaction;
        const txForHash: Transaction = psbtTx.tx;
        const tapKeyHash = txForHash.hashForWitnessV1(0, [outputScript], [ZERO_SATOSHI], Transaction.SIGHASH_DEFAULT);

        return schnorrValidator(pubkey, tapKeyHash, sig);
    } catch {
        return false;
    }
}

/**
 * Verify a BIP322 simple message signature for P2WPKH addresses
 */
function verifyBip322P2WPKH(address: string, message: string | Uint8Array, signature: string, network: Network): boolean {
    try {
        const outputScript = bitcoinAddress.toOutputScript(address, network);
        const messageHash = computeBip322Hash(message);

        const prevoutHash = alloc(32) as Bytes32;
        const prevoutIndex = 0xffffffff;
        const sequence = 0;
        const scriptSig = concat([fromHex('0020'), messageHash]) as Script;

        // Reconstruct "to spend" transaction
        const txToSpend = new Transaction();
        txToSpend.version = 0;
        txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
        txToSpend.addOutput(outputScript, ZERO_SATOSHI);

        // Decode signature
        const signatureData = fromBase64Bytes(signature);
        const decompiled = bitcoinScript.decompile(signatureData.subarray(1));

        if (!Array.isArray(decompiled) || decompiled.length < 2) {
            return false;
        }

        const sig = decompiled[0];
        const pubkey = decompiled[1];

        if (!(sig instanceof Uint8Array) || !(pubkey instanceof Uint8Array)) {
            return false;
        }

        // Create PSBT for verification
        const psbt = new Psbt({ network });
        psbt.setVersion(0);
        psbt.addInput({
            hash: txToSpend.getHash(),
            index: 0,
            sequence: 0,
            witnessUtxo: {
                script: outputScript,
                value: ZERO_SATOSHI
            }
        });
        psbt.addOutput({
            script: fromHex('6a') as Script,
            value: ZERO_SATOSHI
        });

        psbt.updateInput(0, {
            partialSig: [
                {
                    pubkey: pubkey,
                    signature: sig
                }
            ]
        });

        return psbt.validateSignaturesOfAllInputs(ecdsaValidator);
    } catch {
        return false;
    }
}

/**
 * Verify a BIP322 simple message signature
 */
export function verifyBip322Message(
    address: string,
    message: string | Uint8Array,
    signature: string,
    network: Network
): boolean {
    const addressType = detectAddressType(address, network);

    if (addressType === null) {
        return false;
    }

    switch (addressType) {
        case AddressTypes.P2TR: {
            return verifyBip322P2TR(address, message, signature, network);
        }
        case AddressTypes.P2WPKH: {
            return verifyBip322P2WPKH(address, message, signature, network);
        }
        default: {
            return false;
        }
    }
}

/**
 * Sign a message using BIP322 with WalletNetworks parameter
 */
export async function signBip322MessageWithNetworkType(
    message: string | Uint8Array,
    address: string,
    networkType: WalletNetworks,
    signPsbt: (psbt: Psbt) => Promise<Psbt>
): Promise<Bip322Signature> {
    const network = toNetwork(networkType);
    const signature = await signBip322Message(message, address, network, signPsbt);

    return {
        address,
        message,
        signature,
        networkType
    };
}

/**
 * Verify a BIP322 signature with WalletNetworks parameter
 */
export function verifyBip322MessageWithNetworkType(
    address: string,
    message: string | Uint8Array,
    signature: string,
    networkType: WalletNetworks
): boolean {
    const network = toNetwork(networkType);
    return verifyBip322Message(address, message, signature, network);
}
