/**
 * OPNet Wallet SDK
 * Bitcoin wallet library with post-quantum cryptography support (BIP360).
 *
 * Features:
 * - HD wallet derivation (BIP39/BIP44/BIP84/BIP86)
 * - Quantum-resistant signatures (ML-DSA/BIP360)
 * - Multiple address types (P2PKH, P2WPKH, P2TR, P2SH-P2WPKH)
 * - BIP322 message signing
 * - PSBT transaction signing
 */

import * as ecc from '@bitcoinerlab/secp256k1';
import { initEccLib } from '@btc-vision/bitcoin';

// Initialize secp256k1 library
initEccLib(ecc);

// Network module
export {
    toNetwork,
    toNetworkType,
    getBech32Prefix,
    detectNetworkFromAddress,
    validateAddressNetwork
} from './network/index.js';

// Address module
export {
    publicKeyToAddress,
    publicKeyToPayment,
    publicKeyToScriptPubKey,
    addressToScriptPubKey,
    scriptPubKeyToAddress,
    isValidAddress,
    detectAddressType,
    decodeAddress,
    isValidPublicKey,
    isValidP2TRAddress,
    isP2WPKHAddress,
    isP2PKHOrP2SHAddress,
    isValidAddressForNetworkType,
    getAddressType,
    publicKeyToAddressWithNetworkType
} from './address/index.js';

// Keyring module
export {
    HdKeyring,
    SimpleKeyring,
    exportWallet,
    importWallet,
    serializeExport,
    deserializeExport,
    exportWalletToString,
    importWalletFromString,
    validateExport,
    fromLegacyExport,
    type UnifiedWalletExport
} from './keyring/index.js';

// Message module
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
    generateBip322Psbt,
    extractBip322Signature,
    signBip322Message,
    verifyBip322Message,
    signBip322MessageWithNetworkType,
    verifyBip322MessageWithNetworkType,
    type MessageInput,
    type MLDSASignatureResult,
    type SchnorrSignatureResult
} from './message/index.js';

// Wallet module
export { LocalWallet, type AbstractWallet } from './wallet/index.js';

// Types
export {
    type SignatureType,
    type MessageSigningMethod,
    type BaseSignInput,
    type AddressSignInput,
    type PublicKeySignInput,
    type SignInput,
    type SignPsbtOptions,
    type ToSignInput,
    type DecodedAddress,
    type QuantumKeyInfo,
    type ClassicalKeyInfo,
    type WalletKeyInfo,
    type ExportedWallet,
    type MnemonicOptions,
    type DerivationOptions,
    type KeyringSerializeOptions,
    type HdKeyringOptions,
    type SimpleKeyringOptions,
    type SignedMessage,
    type Bip322Signature,
    type AccountInfo,
    type AccountAddresses,
    type KeystoneKey,
    type KeystoneKeyringOptions,
    isAddressSignInput,
    isPublicKeySignInput
} from './types/index.js';
