/**
 * OPNet Wallet SDK Type Definitions
 * All core types and interfaces for the wallet SDK.
 */

import type { Network, Psbt } from '@btc-vision/bitcoin';
import { AddressTypes, MLDSASecurityLevel, type QuantumBIP32Interface, WalletNetworks } from '@btc-vision/transaction';
import type { ECPairInterface } from 'ecpair';

/**
 * Signature type for message signing operations
 */
export type SignatureType = 'ecdsa' | 'schnorr' | 'mldsa';

/**
 * Message signing method types
 */
export type MessageSigningMethod = 'bip322-simple' | 'ecdsa' | 'schnorr' | 'mldsa';

/**
 * Base interface for inputs to sign in a PSBT
 */
export interface BaseSignInput {
    readonly index: number;
    readonly sighashTypes?: readonly number[];
    readonly disableTweakSigner?: boolean;
}

/**
 * Sign input with address specification
 */
export interface AddressSignInput extends BaseSignInput {
    readonly address: string;
}

/**
 * Sign input with public key specification
 */
export interface PublicKeySignInput extends BaseSignInput {
    readonly publicKey: string;
}

/**
 * Union type for sign inputs
 */
export type SignInput = AddressSignInput | PublicKeySignInput;

/**
 * Options for signing PSBTs
 */
export interface SignPsbtOptions {
    readonly autoFinalized?: boolean;
    readonly toSignInputs?: readonly SignInput[];
}

/**
 * Internal representation of inputs to sign
 */
export interface ToSignInput {
    readonly index: number;
    readonly publicKey: string;
    readonly sighashTypes?: readonly number[];
    readonly disableTweakSigner?: boolean;
}

/**
 * Result of an address decode operation
 */
export interface DecodedAddress {
    readonly networkType: WalletNetworks;
    readonly addressType: AddressTypes;
    readonly scriptPubKey: Buffer;
}

/**
 * Quantum key pair information
 */
export interface QuantumKeyInfo {
    readonly publicKey: Uint8Array;
    readonly securityLevel: MLDSASecurityLevel;
}

/**
 * Classical key pair information
 */
export interface ClassicalKeyInfo {
    readonly publicKey: Buffer;
    readonly privateKey?: Buffer;
}

/**
 * Combined wallet key information (classical + quantum)
 */
export interface WalletKeyInfo {
    readonly classical: ClassicalKeyInfo;
    readonly quantum: QuantumKeyInfo;
    readonly chainCode: Buffer;
}

/**
 * Exported wallet format for unified key export
 */
export interface ExportedWallet {
    readonly version: number;
    readonly classicalPrivateKey: string;
    readonly quantumPrivateKey: string;
    readonly quantumPublicKey: string;
    readonly securityLevel: MLDSASecurityLevel;
    readonly chainCode: string;
}

/**
 * Mnemonic options for wallet generation
 */
export interface MnemonicOptions {
    readonly phrase?: string;
    readonly passphrase?: string;
    readonly network?: Network;
    readonly securityLevel?: MLDSASecurityLevel;
}

/**
 * HD derivation options
 */
export interface DerivationOptions {
    readonly addressType?: AddressTypes;
    readonly account?: number;
    readonly change?: boolean;
    readonly index?: number;
}

/**
 * Keyring serialization options
 */
export interface KeyringSerializeOptions {
    readonly includePrivateKeys?: boolean;
}

/**
 * HD Keyring deserialization options
 */
export interface HdKeyringOptions {
    readonly mnemonic?: string | undefined;
    readonly passphrase?: string | undefined;
    readonly network?: Network | undefined;
    readonly securityLevel?: MLDSASecurityLevel | undefined;
    readonly activeIndexes?: readonly number[] | undefined;
    readonly addressType?: AddressTypes | undefined;
    readonly hdPath?: string | undefined;
}

/**
 * Simple keyring options for WIF/private key import
 */
export interface SimpleKeyringOptions {
    readonly privateKey: string;
    readonly quantumPrivateKey?: string | undefined;
    readonly network?: Network | undefined;
    readonly securityLevel?: MLDSASecurityLevel | undefined;
}

/**
 * Message signature result
 */
export interface SignedMessage {
    readonly message: string | Buffer;
    readonly signature: Uint8Array;
    readonly publicKey: Uint8Array;
    readonly signatureType: SignatureType;
    readonly securityLevel?: MLDSASecurityLevel;
}

/**
 * BIP322 signature result
 */
export interface Bip322Signature {
    readonly address: string;
    readonly message: string | Buffer;
    readonly signature: string;
    readonly networkType: WalletNetworks;
}

/**
 * Wallet account information
 */
export interface AccountInfo {
    readonly index: number;
    readonly publicKey: string;
    readonly quantumPublicKey: string;
    readonly addresses: AccountAddresses;
}

/**
 * All address types for an account
 */
export interface AccountAddresses {
    readonly p2pkh?: string;
    readonly p2wpkh?: string;
    readonly p2tr?: string;
    readonly p2shP2wpkh?: string;
}

/**
 * Abstract wallet interface
 */
export interface AbstractWallet {
    signPsbt(psbt: Psbt, opts?: SignPsbtOptions): Promise<Psbt> | Psbt;
    signMessage(message: string | Buffer, method: MessageSigningMethod): Promise<string>;
}

/**
 * Keystone hardware wallet key information
 */
export interface KeystoneKey {
    readonly path: string;
    readonly extendedPublicKey: string;
}

/**
 * Keystone keyring options
 */
export interface KeystoneKeyringOptions {
    readonly mfp: string;
    readonly keys: readonly KeystoneKey[];
    readonly network?: Network;
    readonly activeIndexes?: readonly number[];
    readonly addressType?: AddressTypes;
}

/**
 * Type guard to check if sign input has address
 */
export function isAddressSignInput(input: SignInput): input is AddressSignInput {
    return 'address' in input;
}

/**
 * Type guard to check if sign input has public key
 */
export function isPublicKeySignInput(input: SignInput): input is PublicKeySignInput {
    return 'publicKey' in input;
}

/**
 * Re-export ECPairInterface for convenience
 */
export type { ECPairInterface, QuantumBIP32Interface };
