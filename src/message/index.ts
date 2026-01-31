/**
 * OPNet Wallet SDK - Message Module
 * Exports all message signing and verification utilities.
 */

export {
    signMLDSA,
    verifyMLDSA,
    verifyMLDSAWithKeypair,
    signSchnorr,
    verifySchnorr,
    signTweakedSchnorr,
    verifyTweakedSchnorr,
    signMessage,
    verifyMessage,
    type MessageInput,
    type MLDSASignatureResult,
    type SchnorrSignatureResult
} from './signing.js';

export {
    generateBip322Psbt,
    extractBip322Signature,
    signBip322Message,
    verifyBip322Message,
    signBip322MessageWithNetworkType,
    verifyBip322MessageWithNetworkType
} from './bip322.js';

export { getNobleBackend } from './backend.js';
