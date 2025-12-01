/**
 * OPNet Wallet SDK - Network Module
 * Network configuration and conversion utilities.
 */

import { type Network, networks } from '@btc-vision/bitcoin';
import { OPNetNetwork } from '@btc-vision/transaction';

/**
 * Convert OPNetNetwork enum to @btc-vision/bitcoin Network object
 */
export function toNetwork(networkType: OPNetNetwork): Network {
    switch (networkType) {
        case OPNetNetwork.Mainnet: {
            return networks.bitcoin;
        }
        case OPNetNetwork.Testnet: {
            return networks.testnet;
        }
        case OPNetNetwork.Regtest: {
            return networks.regtest;
        }
    }
}

/**
 * Convert @btc-vision/bitcoin Network object to OPNetNetwork enum
 */
export function toNetworkType(network: Network): OPNetNetwork {
    if (network.bech32 === networks.bitcoin.bech32) {
        return OPNetNetwork.Mainnet;
    }
    if (network.bech32 === networks.testnet.bech32) {
        return OPNetNetwork.Testnet;
    }
    return OPNetNetwork.Regtest;
}

/**
 * Get the bech32 prefix for a network type
 */
export function getBech32Prefix(networkType: OPNetNetwork): string {
    const network = toNetwork(networkType);
    return network.bech32;
}

/**
 * Detect network type from an address
 */
export function detectNetworkFromAddress(address: string): OPNetNetwork | null {
    if (address.startsWith('bc1') || address.startsWith('1') || address.startsWith('3')) {
        return OPNetNetwork.Mainnet;
    }
    if (address.startsWith('tb1') || address.startsWith('m') || address.startsWith('n') || address.startsWith('2')) {
        return OPNetNetwork.Testnet;
    }
    if (address.startsWith('bcrt1')) {
        return OPNetNetwork.Regtest;
    }
    return null;
}

/**
 * Validate that an address matches the expected network
 */
export function validateAddressNetwork(address: string, expectedNetwork: OPNetNetwork): boolean {
    const detectedNetwork = detectNetworkFromAddress(address);
    return detectedNetwork === expectedNetwork;
}
