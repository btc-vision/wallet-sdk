/**
 * OPNet Wallet SDK - BIP322 Message Signing
 * BIP322 simple message signing and verification.
 * Reference: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
 */

import * as ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from '@btc-vision/bitcoin';
import {
    address as bitcoinAddress,
    crypto as bitcoinCrypto,
    type Network,
    Psbt,
    Transaction
} from '@btc-vision/bitcoin';
import { AddressTypes, WalletNetworks } from '@btc-vision/transaction';
import { detectAddressType } from '@/address';
import { toNetwork } from '@/network';
import type { Bip322Signature } from '@/types';

/**
 * Supported address types for BIP322 signing
 */
const SUPPORTED_ADDRESS_TYPES = [AddressTypes.P2WPKH, AddressTypes.P2TR];

/**
 * Compute the BIP322 message hash
 */
function computeBip322Hash(message: string | Buffer): Buffer {
    const tag = 'BIP0322-signed-message';
    const tagHash = bitcoinCrypto.sha256(Buffer.from(tag, 'utf8'));
    const messageBuffer = typeof message === 'string' ? Buffer.from(message, 'utf8') : message;
    return bitcoinCrypto.sha256(Buffer.concat([tagHash, tagHash, messageBuffer]));
}

/**
 * Encode a buffer as a variable-length string for witness serialization
 */
function encodeVarString(buf: Buffer): Buffer {
    const varint = bitcoin.script.number.encode(buf.length);
    return Buffer.concat([varint, buf]);
}

/**
 * Generate a PSBT for BIP322 simple message signing
 */
export function generateBip322Psbt(message: string | Buffer, address: string, network: Network): Psbt {
    const outputScript = bitcoinAddress.toOutputScript(address, network);
    const addressType = detectAddressType(address, network);

    if (addressType === null || !SUPPORTED_ADDRESS_TYPES.includes(addressType)) {
        throw new Error(`BIP322: Address type not supported for signing. Got: ${String(addressType)}`);
    }

    const messageHash = computeBip322Hash(message);
    const prevoutHash = Buffer.alloc(32, 0);
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const scriptSig = Buffer.concat([Buffer.from('0020', 'hex'), messageHash]);

    // Create "to spend" transaction
    const txToSpend = new Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
    txToSpend.addOutput(outputScript, 0);

    // Create PSBT to sign
    const psbt = new Psbt({ network });
    psbt.setVersion(0);
    psbt.addInput({
        hash: txToSpend.getHash(),
        index: 0,
        sequence: 0,
        witnessUtxo: {
            script: outputScript,
            value: 0
        }
    });
    psbt.addOutput({
        script: Buffer.from('6a', 'hex'), // OP_RETURN
        value: 0
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
    const varintLength = bitcoin.script.number.encode(witness.length);
    const encodedWitness = Buffer.concat([varintLength, ...witness.map((w) => encodeVarString(w))]);

    return encodedWitness.toString('base64');
}

/**
 * Sign a message using BIP322 simple format
 */
export async function signBip322Message(
    message: string | Buffer,
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
function ecdsaValidator(pubkey: Buffer, msghash: Buffer, signature: Buffer): boolean {
    try {
        // Decode DER signature if needed
        const decoded = bitcoin.script.signature.decode(signature);
        return ecc.verify(msghash, pubkey, decoded.signature);
    } catch {
        return false;
    }
}

/**
 * Schnorr signature validator
 */
function schnorrValidator(pubkey: Buffer, msghash: Buffer, signature: Buffer): boolean {
    try {
        // For Taproot, use x-only pubkey
        const xOnlyPubkey = pubkey.length === 33 ? pubkey.subarray(1, 33) : pubkey;
        return ecc.verifySchnorr(msghash, xOnlyPubkey, signature);
    } catch {
        return false;
    }
}

/**
 * Verify a BIP322 simple message signature for P2TR addresses
 */
function verifyBip322P2TR(address: string, message: string | Buffer, signature: string, network: Network): boolean {
    try {
        const outputScript = bitcoinAddress.toOutputScript(address, network);
        const messageHash = computeBip322Hash(message);

        const prevoutHash = Buffer.alloc(32, 0);
        const prevoutIndex = 0xffffffff;
        const sequence = 0;
        const scriptSig = Buffer.concat([Buffer.from('0020', 'hex'), messageHash]);

        // Reconstruct "to spend" transaction
        const txToSpend = new Transaction();
        txToSpend.version = 0;
        txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
        txToSpend.addOutput(outputScript, 0);

        // Decode signature
        const signatureData = Buffer.from(signature, 'base64');
        const decompiled = bitcoin.script.decompile(signatureData.subarray(1));

        if (!Array.isArray(decompiled) || decompiled.length === 0) {
            return false;
        }

        const sig = decompiled[0];
        if (!Buffer.isBuffer(sig)) {
            return false;
        }

        // Extract pubkey from output script (x-only format)
        const pubkey = Buffer.concat([Buffer.from('02', 'hex'), outputScript.subarray(2)]);

        // Create PSBT for verification
        const psbt = new Psbt({ network });
        psbt.setVersion(0);
        psbt.addInput({
            hash: txToSpend.getHash(),
            index: 0,
            sequence: 0,
            witnessUtxo: {
                script: outputScript,
                value: 0
            }
        });
        psbt.addOutput({
            script: Buffer.from('6a', 'hex'),
            value: 0
        });

        // Compute taproot sighash
        const txForHash = (psbt as unknown as { __CACHE: { __TX: Transaction } }).__CACHE.__TX;
        const tapKeyHash = txForHash.hashForWitnessV1(0, [outputScript], [0], bitcoin.Transaction.SIGHASH_DEFAULT);

        return schnorrValidator(pubkey, tapKeyHash, sig);
    } catch {
        return false;
    }
}

/**
 * Verify a BIP322 simple message signature for P2WPKH addresses
 */
function verifyBip322P2WPKH(address: string, message: string | Buffer, signature: string, network: Network): boolean {
    try {
        const outputScript = bitcoinAddress.toOutputScript(address, network);
        const messageHash = computeBip322Hash(message);

        const prevoutHash = Buffer.alloc(32, 0);
        const prevoutIndex = 0xffffffff;
        const sequence = 0;
        const scriptSig = Buffer.concat([Buffer.from('0020', 'hex'), messageHash]);

        // Reconstruct "to spend" transaction
        const txToSpend = new Transaction();
        txToSpend.version = 0;
        txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
        txToSpend.addOutput(outputScript, 0);

        // Decode signature
        const signatureData = Buffer.from(signature, 'base64');
        const decompiled = bitcoin.script.decompile(signatureData.subarray(1));

        if (!Array.isArray(decompiled) || decompiled.length < 2) {
            return false;
        }

        const sig = decompiled[0];
        const pubkey = decompiled[1];

        if (!Buffer.isBuffer(sig) || !Buffer.isBuffer(pubkey)) {
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
                value: 0
            }
        });
        psbt.addOutput({
            script: Buffer.from('6a', 'hex'),
            value: 0
        });

        psbt.updateInput(0, {
            partialSig: [
                {
                    pubkey,
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
    message: string | Buffer,
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
    message: string | Buffer,
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
    message: string | Buffer,
    signature: string,
    networkType: WalletNetworks
): boolean {
    const network = toNetwork(networkType);
    return verifyBip322Message(address, message, signature, network);
}
