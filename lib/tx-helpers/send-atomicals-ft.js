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
exports.sendAtomicalsFT = void 0;
const error_1 = require("../error");
const transaction_1 = require("../transaction/transaction");
const utxo_1 = require("../transaction/utxo");
// only one arc20 can be send
function sendAtomicalsFT({ assetUtxos, btcUtxos, toAddress, networkType, changeAssetAddress, sendAmount, changeAddress, feeRate, enableRBF = true }) {
    return __awaiter(this, void 0, void 0, function* () {
        // safe check
        if (utxo_1.utxoHelper.hasAtomicalsNFT(assetUtxos) || utxo_1.utxoHelper.hasInscription(assetUtxos)) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
        }
        if (utxo_1.utxoHelper.hasAnyAssets(btcUtxos)) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
        }
        const tx = new transaction_1.Transaction();
        tx.setNetworkType(networkType);
        tx.setFeeRate(feeRate);
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        const toSignInputs = [];
        let totalInputFTAmount = 0;
        assetUtxos.forEach((v) => {
            if (v.atomicals.length > 1) {
                throw new error_1.WalletUtilsError(error_1.ErrorCodes.ONLY_ONE_ARC20_CAN_BE_SENT);
            }
            v.atomicals.forEach((w) => {
                if (!w.atomicalValue) {
                    w.atomicalValue = v.satoshis;
                }
                totalInputFTAmount += w.atomicalValue;
            });
        });
        if (sendAmount > totalInputFTAmount) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.INSUFFICIENT_ASSET_UTXO);
        }
        // add assets
        assetUtxos.forEach((v, index) => {
            tx.addInput(v);
            toSignInputs.push({ index, publicKey: v.pubkey });
        });
        // add receiver
        tx.addOutput(toAddress, sendAmount);
        // add change
        const changeArc20Amount = totalInputFTAmount - sendAmount;
        if (changeArc20Amount > 0) {
            tx.addOutput(changeAssetAddress, changeArc20Amount);
        }
        // add btc
        const _toSignInputs = yield tx.addSufficientUtxosForFee(btcUtxos, true);
        toSignInputs.push(..._toSignInputs);
        const psbt = tx.toPsbt();
        return { psbt, toSignInputs };
    });
}
exports.sendAtomicalsFT = sendAtomicalsFT;
