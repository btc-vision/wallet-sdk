/**
 * OPNet Wallet SDK - Network Module
 * Network configuration and conversion utilities.
 */

import { type Network, networks } from '@btc-vision/bitcoin';
import { WalletNetworks } from '@btc-vision/transaction';

/**
 * Convert WalletNetworks enum to @btc-vision/bitcoin Network object
 */
export function toNetwork(networkType: WalletNetworks): Network {
    switch (networkType) {
        case WalletNetworks.Mainnet: {
            return networks.bitcoin;
        }

        case WalletNetworks.Testnet: {
            return networks.testnet;
        }

        case WalletNetworks.Regtest: {
            return networks.regtest;
        }

        case WalletNetworks.OpnetTestnet: {
            return networks.opnetTestnet;
        }

        default: {
            throw new Error(`Unsupported network type: ${networkType}`);
        }
    }
}

/**
 * Convert @btc-vision/bitcoin Network object to WalletNetworks enum
 */
export function toNetworkType(network: Network): WalletNetworks {
    if (network.bech32 === networks.bitcoin.bech32) {
        return WalletNetworks.Mainnet;
    }

    if (network.bech32 === networks.testnet.bech32) {
        return WalletNetworks.Testnet;
    }

    if (network.bech32 === networks.opnetTestnet.bech32) {
        return WalletNetworks.OpnetTestnet;
    }

    return WalletNetworks.Regtest;
}

/**
 * Get the bech32 prefix for a network type
 */
export function getBech32Prefix(networkType: WalletNetworks): string {
    const network = toNetwork(networkType);
    return network.bech32;
}

/**
 * Detect network type from an address.
 *
 * Handles bech32/bech32m (segwit), base58 P2PKH and P2SH formats.
 * Order matters: more specific prefixes (bcrt1, opt1) are checked before
 * shorter ones (bc1, tb1) to avoid false matches.
 */
export function detectNetworkFromAddress(address: string): WalletNetworks | null {
    // Bech32/bech32m — check longest prefixes first to avoid false matches
    // Regtest: bcrt1...
    if (address.startsWith(`${networks.regtest.bech32}1`)) {
        return WalletNetworks.Regtest;
    }

    // OPNet Testnet: opt1...
    if (address.startsWith(`${networks.opnetTestnet.bech32}1`)) {
        return WalletNetworks.OpnetTestnet;
    }

    // Mainnet: bc1...  (also covers legacy 1... and 3...)
    if (address.startsWith(`${networks.bitcoin.bech32}1`)) {
        return WalletNetworks.Mainnet;
    }

    // Testnet: tb1...
    if (address.startsWith(`${networks.testnet.bech32}1`)) {
        return WalletNetworks.Testnet;
    }

    // Base58 legacy addresses (P2PKH / P2SH)
    // Mainnet P2PKH starts with 1, P2SH starts with 3
    if (address.startsWith('1') || address.startsWith('3')) {
        return WalletNetworks.Mainnet;
    }

    // Testnet/Regtest P2PKH starts with m or n, P2SH starts with 2
    // (Regtest and testnet share the same base58 prefixes)
    if (address.startsWith('m') || address.startsWith('n') || address.startsWith('2')) {
        return WalletNetworks.Testnet;
    }

    return null;
}

/**
 * Validate that an address matches the expected network
 */
export function validateAddressNetwork(address: string, expectedNetwork: WalletNetworks): boolean {
    const detectedNetwork = detectNetworkFromAddress(address);
    return detectedNetwork === expectedNetwork;
}
