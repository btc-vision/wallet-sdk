import { bitcoin } from '../bitcoin-core';
export declare enum NetworkType {
    MAINNET = 0,
    TESTNET = 1,
    REGTEST = 2
}
/**
 * Convert network type to bitcoinjs-lib network.
 */
export declare function toPsbtNetwork(networkType: NetworkType): bitcoin.networks.Network;
/**
 * Convert bitcoinjs-lib network to network type.
 */
export declare function toNetworkType(network: bitcoin.Network): NetworkType;
