"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNetworkType = exports.toPsbtNetwork = exports.NetworkType = void 0;
const bitcoin_core_1 = require("../bitcoin-core");
var NetworkType;
(function (NetworkType) {
    NetworkType[NetworkType["MAINNET"] = 0] = "MAINNET";
    NetworkType[NetworkType["TESTNET"] = 1] = "TESTNET";
    NetworkType[NetworkType["REGTEST"] = 2] = "REGTEST";
})(NetworkType = exports.NetworkType || (exports.NetworkType = {}));
/**
 * Convert network type to bitcoinjs-lib network.
 */
function toPsbtNetwork(networkType) {
    if (networkType === NetworkType.MAINNET) {
        return bitcoin_core_1.bitcoin.networks.bitcoin;
    }
    else if (networkType === NetworkType.TESTNET) {
        return bitcoin_core_1.bitcoin.networks.testnet;
    }
    else {
        return bitcoin_core_1.bitcoin.networks.regtest;
    }
}
exports.toPsbtNetwork = toPsbtNetwork;
/**
 * Convert bitcoinjs-lib network to network type.
 */
function toNetworkType(network) {
    if (network.bech32 == bitcoin_core_1.bitcoin.networks.bitcoin.bech32) {
        return NetworkType.MAINNET;
    }
    else if (network.bech32 == bitcoin_core_1.bitcoin.networks.testnet.bech32) {
        return NetworkType.TESTNET;
    }
    else {
        return NetworkType.REGTEST;
    }
}
exports.toNetworkType = toNetworkType;
