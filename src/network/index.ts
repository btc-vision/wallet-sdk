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
 * Detect network type from an address
 */
export function detectNetworkFromAddress(address: string): WalletNetworks | null {
    if (address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3')) {
        return WalletNetworks.Mainnet;
    }
    if (address.startsWith('tb1') || address.startsWith('m') || address.startsWith('n') || address.startsWith('2')) {
        return WalletNetworks.Testnet;
    }
    if (address.startsWith('bcrt1')) {
        return WalletNetworks.Regtest;
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
