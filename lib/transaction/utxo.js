"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.utxoHelper = exports.getAddressUtxoDust = exports.getUtxoDust = void 0;
const address_1 = require("../address");
const network_1 = require("../network");
const types_1 = require("../types");
function hasInscription(utxos) {
    if (utxos.find((v) => v.inscriptions.length > 0)) {
        return true;
    }
    return false;
}
function hasAtomicalsFT(utxos) {
    if (utxos.find((v) => v.atomicals.find((w) => w.type === 'FT'))) {
        return true;
    }
    return false;
}
function hasAtomicalsNFT(utxos) {
    if (utxos.find((v) => v.atomicals.find((w) => w.type === 'NFT'))) {
        return true;
    }
    return false;
}
function hasAtomicals(utxos) {
    if (utxos.find((v) => v.atomicals.length > 0)) {
        return true;
    }
    return false;
}
function hasAnyAssets(utxos) {
    if (utxos.find((v) => v.inscriptions.length > 0 || v.atomicals.length > 0)) {
        return true;
    }
    return false;
}
/**
 * select utxos so that the total amount of utxos is greater than or equal to targetAmount
 * return the selected utxos and the unselected utxos
 * @param utxos
 * @param targetAmount
 */
function selectBtcUtxos(utxos, targetAmount) {
    let selectedUtxos = [];
    let remainingUtxos = [];
    let totalAmount = 0;
    for (const utxo of utxos) {
        if (totalAmount < targetAmount) {
            totalAmount += utxo.satoshis;
            selectedUtxos.push(utxo);
        }
        else {
            remainingUtxos.push(utxo);
        }
    }
    return {
        selectedUtxos,
        remainingUtxos
    };
}
/**
 * return the added virtual size of the utxo
 */
function getAddedVirtualSize(addressType) {
    if (addressType === types_1.AddressType.P2WPKH || addressType === types_1.AddressType.M44_P2WPKH) {
        return 41 + (1 + 1 + 72 + 1 + 33) / 4;
    }
    else if (addressType === types_1.AddressType.P2TR || addressType === types_1.AddressType.M44_P2TR) {
        return 41 + (1 + 1 + 64) / 4;
    }
    else if (addressType === types_1.AddressType.P2PKH) {
        return 41 + 1 + 1 + 72 + 1 + 33;
    }
    else if (addressType === types_1.AddressType.P2SH_P2WPKH) {
        return 41 + 24 + (1 + 1 + 72 + 1 + 33) / 4;
    }
    throw new Error('unknown address type');
}
function getUtxoDust(addressType) {
    if (addressType === types_1.AddressType.P2WPKH || addressType === types_1.AddressType.M44_P2WPKH) {
        return 294;
    }
    else if (addressType === types_1.AddressType.P2TR || addressType === types_1.AddressType.M44_P2TR) {
        return 330;
    }
    else {
        return 546;
    }
}
exports.getUtxoDust = getUtxoDust;
// deprecated
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getAddressUtxoDust(address, networkType = network_1.NetworkType.MAINNET) {
    return (0, address_1.decodeAddress)(address).dust;
}
exports.getAddressUtxoDust = getAddressUtxoDust;
exports.utxoHelper = {
    hasAtomicalsFT,
    hasAtomicalsNFT,
    hasAtomicals,
    hasInscription,
    hasAnyAssets,
    selectBtcUtxos,
    getAddedVirtualSize,
    getUtxoDust,
    getAddressUtxoDust
};
