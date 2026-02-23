/**
 * OPNet Wallet SDK - Address Module
 * Address generation, validation, and conversion utilities.
 * Uses @btc-vision/transaction AddressVerificator for all operations.
 */

import { address as bitcoinAddress, fromHex, type Network, networks, type Payment, payments, toHex } from '@btc-vision/bitcoin';
import { createPublicKey, createXOnlyPublicKey, fromHexInternal } from '@btc-vision/ecpair';
import { AddressTypes, AddressVerificator, WalletNetworks } from '@btc-vision/transaction';
import { toNetwork } from '@/network';
import type { DecodedAddress } from '@/types';

/**
 * Generate a Bitcoin address from a public key
 */
export function publicKeyToAddress(publicKey: Uint8Array | string, addressType: AddressTypes, network: Network): string {
    const pubkeyBytes: Uint8Array = typeof publicKey === 'string' ? fromHexInternal(publicKey) : publicKey;

    switch (addressType) {
        case AddressTypes.P2PKH: {
            const payment = payments.p2pkh({ pubkey: createPublicKey(pubkeyBytes), network });
            if (payment.address === undefined) {
                throw new Error('Failed to generate P2PKH address');
            }
            return payment.address;
        }
        case AddressTypes.P2WPKH: {
            const payment = payments.p2wpkh({ pubkey: createPublicKey(pubkeyBytes), network });
            if (payment.address === undefined) {
                throw new Error('Failed to generate P2WPKH address');
            }
            return payment.address;
        }
        case AddressTypes.P2TR: {
            const xOnly: Uint8Array = pubkeyBytes.length === 33 ? pubkeyBytes.subarray(1, 33) : pubkeyBytes;
            const payment = payments.p2tr({ internalPubkey: createXOnlyPublicKey(xOnly), network });
            if (payment.address === undefined) {
                throw new Error('Failed to generate P2TR address');
            }
            return payment.address;
        }
        case AddressTypes.P2SH_OR_P2SH_P2WPKH: {
            const p2wpkh = payments.p2wpkh({ pubkey: createPublicKey(pubkeyBytes), network });
            const payment = payments.p2sh({ redeem: p2wpkh, network });
            if (payment.address === undefined) {
                throw new Error('Failed to generate P2SH-P2WPKH address');
            }
            return payment.address;
        }
        default: {
            throw new Error(`Unsupported address type: ${addressType as string}`);
        }
    }
}

/**
 * Generate a payment object from a public key
 */
export function publicKeyToPayment(
    publicKey: Uint8Array | string,
    addressType: AddressTypes,
    network: Network
): Payment {
    const pubkeyBytes: Uint8Array = typeof publicKey === 'string' ? fromHexInternal(publicKey) : publicKey;

    switch (addressType) {
        case AddressTypes.P2PKH: {
            return payments.p2pkh({ pubkey: createPublicKey(pubkeyBytes), network });
        }
        case AddressTypes.P2WPKH: {
            return payments.p2wpkh({ pubkey: createPublicKey(pubkeyBytes), network });
        }
        case AddressTypes.P2TR: {
            const xOnly: Uint8Array = pubkeyBytes.length === 33 ? pubkeyBytes.subarray(1, 33) : pubkeyBytes;
            return payments.p2tr({ internalPubkey: createXOnlyPublicKey(xOnly), network });
        }
        case AddressTypes.P2SH_OR_P2SH_P2WPKH: {
            const p2wpkh = payments.p2wpkh({ pubkey: createPublicKey(pubkeyBytes), network });
            return payments.p2sh({ redeem: p2wpkh, network });
        }
        default: {
            throw new Error(`Unsupported address type: ${addressType as string}`);
        }
    }
}

/**
 * Generate scriptPubKey from a public key
 */
export function publicKeyToScriptPubKey(
    publicKey: Uint8Array | string,
    addressType: AddressTypes,
    network: Network
): Uint8Array {
    const payment = publicKeyToPayment(publicKey, addressType, network);
    if (!payment.output) {
        throw new Error('Failed to generate script pubkey');
    }
    return payment.output;
}

/**
 * Convert an address to its scriptPubKey
 */
export function addressToScriptPubKey(address: string, network: Network): Uint8Array {
    return bitcoinAddress.toOutputScript(address, network);
}

/**
 * Convert scriptPubKey to an address
 */
export function scriptPubKeyToAddress(scriptPubKey: Uint8Array | string, network: Network): string {
    const script = typeof scriptPubKey === 'string' ? fromHex(scriptPubKey) : scriptPubKey;
    return bitcoinAddress.fromOutputScript(script, network);
}

/**
 * Validate if an address is valid for the given network
 */
export function isValidAddress(address: string, network: Network): boolean {
    return AddressVerificator.detectAddressType(address, network) !== null;
}

/**
 * Detect the address type from an address string
 */
export function detectAddressType(address: string, network: Network): AddressTypes | null {
    return AddressVerificator.detectAddressType(address, network);
}

/**
 * Decode an address to get its network type, address type, and scriptPubKey
 */
export function decodeAddress(address: string): DecodedAddress | null {
    // Try each network to decode the address
    const networksToTry: { network: Network; networkType: WalletNetworks }[] = [
        { network: networks.bitcoin, networkType: WalletNetworks.Mainnet },
        { network: networks.opnetTestnet, networkType: WalletNetworks.OpnetTestnet },
        { network: networks.testnet, networkType: WalletNetworks.Testnet },
        { network: networks.regtest, networkType: WalletNetworks.Regtest }
    ];

    for (const { network, networkType } of networksToTry) {
        try {
            const scriptPubKey = bitcoinAddress.toOutputScript(address, network);
            const addressType = detectAddressType(address, network);

            if (addressType !== null) {
                return {
                    networkType,
                    addressType,
                    scriptPubKey
                };
            }
        } catch {
            // Try next network
        }
    }

    return null;
}

/**
 * Validate a public key using AddressVerificator
 */
export function isValidPublicKey(publicKey: Uint8Array | string, network: Network): boolean {
    const pubkeyHex = typeof publicKey === 'string' ? publicKey : toHex(publicKey);
    return AddressVerificator.isValidPublicKey(pubkeyHex, network);
}

/**
 * Validate a Taproot (P2TR) address
 */
export function isValidP2TRAddress(address: string, network: Network): boolean {
    return AddressVerificator.isValidP2TRAddress(address, network);
}

/**
 * Check if an address is P2WPKH
 */
export function isP2WPKHAddress(address: string, network: Network): boolean {
    return AddressVerificator.isP2WPKHAddress(address, network);
}

/**
 * Check if an address is P2PKH or P2SH
 */
export function isP2PKHOrP2SHAddress(address: string, network: Network): boolean {
    return AddressVerificator.isP2PKHOrP2SH(address, network);
}

/**
 * Convert WalletNetworks to Network and validate address
 */
export function isValidAddressForNetworkType(address: string, networkType: WalletNetworks): boolean {
    const network = toNetwork(networkType);
    return isValidAddress(address, network);
}

/**
 * Get address type with WalletNetworks parameter
 */
export function getAddressType(address: string, networkType: WalletNetworks): AddressTypes | null {
    const network = toNetwork(networkType);
    return detectAddressType(address, network);
}

/**
 * Convert WalletNetworks-based operations to Network-based
 */
export function publicKeyToAddressWithNetworkType(
    publicKey: Uint8Array | string,
    addressType: AddressTypes,
    networkType: WalletNetworks
): string {
    const network = toNetwork(networkType);
    return publicKeyToAddress(publicKey, addressType, network);
}
