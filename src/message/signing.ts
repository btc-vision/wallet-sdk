/**
 * OPNet Wallet SDK - Message Signing Module
 * Message signing and verification using classical (Schnorr/ECDSA) and quantum (ML-DSA) signatures.
 * Uses @btc-vision/transaction MessageSigner for all operations.
 */

import * as ecc from '@bitcoinerlab/secp256k1';
import { type Network, networks } from '@btc-vision/bitcoin';
import {
    MessageSigner,
    MLDSASecurityLevel,
    QuantumBIP32Factory,
    type QuantumBIP32Interface
} from '@btc-vision/transaction';
import type { ECPairInterface } from 'ecpair';
import type { SignatureType, SignedMessage } from '@/types';

/**
 * Message input type - can be string, Buffer, or Uint8Array
 */
export type MessageInput = string | Buffer | Uint8Array;

/**
 * Result of ML-DSA signature operation
 */
export interface MLDSASignatureResult {
    readonly message: MessageInput;
    readonly signature: Uint8Array;
    readonly publicKey: Uint8Array;
    readonly securityLevel: MLDSASecurityLevel;
}

/**
 * Result of Schnorr signature operation
 */
export interface SchnorrSignatureResult {
    readonly message: MessageInput;
    readonly signature: Uint8Array;
    readonly publicKey: Uint8Array;
}

/**
 * Sign a message with ML-DSA (quantum-resistant)
 */
export function signMLDSA(keypair: QuantumBIP32Interface, message: MessageInput): MLDSASignatureResult {
    const result = MessageSigner.signMLDSAMessage(keypair, message);
    return {
        message: result.message,
        signature: result.signature,
        publicKey: result.publicKey,
        securityLevel: result.securityLevel
    };
}

/**
 * Verify an ML-DSA signature
 */
export function verifyMLDSA(
    publicKey: Uint8Array,
    chainCode: Buffer,
    network: Network,
    securityLevel: MLDSASecurityLevel,
    message: MessageInput,
    signature: Uint8Array
): boolean {
    const keypair = QuantumBIP32Factory.fromPublicKey(publicKey, chainCode, network, securityLevel);
    return MessageSigner.verifyMLDSASignature(keypair, message, signature);
}

/**
 * Verify an ML-DSA signature using an existing keypair
 */
export function verifyMLDSAWithKeypair(
    keypair: QuantumBIP32Interface,
    message: MessageInput,
    signature: Uint8Array
): boolean {
    return MessageSigner.verifyMLDSASignature(keypair, message, signature);
}

/**
 * Sign a message with Schnorr (classical)
 */
export function signSchnorr(keypair: ECPairInterface, message: MessageInput): SchnorrSignatureResult {
    const result = MessageSigner.signMessage(keypair, message);
    return {
        message: result.message,
        signature: result.signature,
        publicKey: keypair.publicKey
    };
}

/**
 * Verify a Schnorr signature
 */
export function verifySchnorr(publicKey: Buffer | Uint8Array, message: MessageInput, signature: Uint8Array): boolean {
    return MessageSigner.verifySignature(publicKey, message, signature);
}

/**
 * Sign a message with tweaked key for Taproot
 */
export function signTweakedSchnorr(
    keypair: ECPairInterface,
    message: MessageInput,
    network: Network = networks.bitcoin
): SchnorrSignatureResult {
    const result = MessageSigner.tweakAndSignMessage(keypair, message, network);
    return {
        message: result.message,
        signature: result.signature,
        publicKey: keypair.publicKey
    };
}

/**
 * Verify a tweaked Schnorr signature
 */
export function verifyTweakedSchnorr(
    publicKey: Buffer | Uint8Array,
    message: MessageInput,
    signature: Uint8Array
): boolean {
    return MessageSigner.tweakAndVerifySignature(publicKey, message, signature);
}

/**
 * Sign message with automatic type selection
 */
export function signMessage(
    keypair: ECPairInterface | QuantumBIP32Interface,
    message: MessageInput,
    signatureType: SignatureType
): SignedMessage {
    const messageBuffer = toBuffer(message);
    switch (signatureType) {
        case 'mldsa': {
            if (!isQuantumKeypair(keypair)) {
                throw new Error('ML-DSA signing requires a quantum keypair');
            }
            const result = signMLDSA(keypair, message);
            return {
                message: messageBuffer,
                signature: result.signature,
                publicKey: result.publicKey,
                signatureType: 'mldsa',
                securityLevel: result.securityLevel
            };
        }
        case 'schnorr': {
            if (isQuantumKeypair(keypair)) {
                throw new Error('Schnorr signing requires a classical keypair');
            }
            const result = signSchnorr(keypair, message);
            return {
                message: messageBuffer,
                signature: result.signature,
                publicKey: result.publicKey,
                signatureType: 'schnorr'
            };
        }
        case 'ecdsa': {
            if (isQuantumKeypair(keypair)) {
                throw new Error('ECDSA signing requires a classical keypair');
            }
            const hash = MessageSigner.sha256(messageBuffer);
            const signature = keypair.sign(Buffer.from(hash));
            return {
                message: messageBuffer,
                signature,
                publicKey: keypair.publicKey,
                signatureType: 'ecdsa'
            };
        }
    }
}

/**
 * Verify message with automatic type detection
 */
export function verifyMessage(
    publicKey: Buffer | Uint8Array,
    message: MessageInput,
    signature: Uint8Array,
    signatureType: SignatureType,
    chainCode?: Buffer,
    network?: Network,
    securityLevel?: MLDSASecurityLevel
): boolean {
    switch (signatureType) {
        case 'mldsa': {
            if (chainCode === undefined || network === undefined || securityLevel === undefined) {
                throw new Error('ML-DSA verification requires chainCode, network, and securityLevel');
            }
            return verifyMLDSA(publicKey, chainCode, network, securityLevel, message, signature);
        }
        case 'schnorr': {
            return verifySchnorr(publicKey, message, signature);
        }
        case 'ecdsa': {
            // For ECDSA verification, use secp256k1 directly
            const messageBuffer = toBuffer(message);
            const hash = MessageSigner.sha256(messageBuffer);
            return ecc.verify(hash, Buffer.from(publicKey), Buffer.from(signature));
        }
    }
}

/**
 * Type guard to check if keypair is quantum
 */
function isQuantumKeypair(keypair: ECPairInterface | QuantumBIP32Interface): keypair is QuantumBIP32Interface {
    return 'securityLevel' in keypair && 'chainCode' in keypair;
}

/**
 * Convert message input to Buffer
 */
function toBuffer(message: MessageInput): Buffer {
    if (typeof message === 'string') {
        return Buffer.from(message, 'utf8');
    }
    if (message instanceof Uint8Array) {
        return Buffer.from(message);
    }
    return message;
}

// Re-export MessageSigner for direct usage
export { MessageSigner };
