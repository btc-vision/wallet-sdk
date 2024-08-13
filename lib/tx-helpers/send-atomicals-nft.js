"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendAtomicalsNFT = void 0;
const error_1 = require("../error");
const transaction_1 = require("../transaction/transaction");
const utxo_1 = require("../transaction/utxo");
function sendAtomicalsNFT({ assetUtxo, btcUtxos, toAddress, networkType, changeAddress, feeRate, enableRBF = true }) {
    return __awaiter(this, void 0, void 0, function* () {
        // safe check
        if (utxo_1.utxoHelper.hasAtomicalsFT([assetUtxo]) || utxo_1.utxoHelper.hasInscription([assetUtxo])) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
        }
        if (utxo_1.utxoHelper.hasAnyAssets(btcUtxos)) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
        }
        if (assetUtxo.atomicals.length !== 1) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
        }
        const tx = new transaction_1.Transaction();
        tx.setNetworkType(networkType);
        tx.setFeeRate(feeRate);
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        const toSignInputs = [];
        // add asset
        tx.addInput(assetUtxo);
        toSignInputs.push({ index: 0, publicKey: assetUtxo.pubkey });
        tx.addOutput(toAddress, assetUtxo.satoshis);
        // add btc
        const _toSignInputs = yield tx.addSufficientUtxosForFee(btcUtxos, true);
        toSignInputs.push(..._toSignInputs);
        const psbt = tx.toPsbt();
        return { psbt, toSignInputs };
    });
}
exports.sendAtomicalsNFT = sendAtomicalsNFT;
