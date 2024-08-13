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
exports.sendAllBTC = exports.sendBTC = void 0;
const constants_1 = require("../constants");
const error_1 = require("../error");
const transaction_1 = require("../transaction/transaction");
const utxo_1 = require("../transaction/utxo");
function sendBTC({ btcUtxos, tos, networkType, changeAddress, feeRate, enableRBF = true, memo, memos }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (utxo_1.utxoHelper.hasAnyAssets(btcUtxos)) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
        }
        const tx = new transaction_1.Transaction();
        tx.setNetworkType(networkType);
        tx.setFeeRate(feeRate);
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        tos.forEach((v) => {
            tx.addOutput(v.address, v.satoshis);
        });
        if (memo) {
            if (Buffer.from(memo, 'hex').toString('hex') === memo) {
                tx.addOpreturn([Buffer.from(memo, 'hex')]);
            }
            else {
                tx.addOpreturn([Buffer.from(memo)]);
            }
        }
        else if (memos) {
            if (Buffer.from(memos[0], 'hex').toString('hex') === memos[0]) {
                tx.addOpreturn(memos.map((memo) => Buffer.from(memo, 'hex')));
            }
            else {
                tx.addOpreturn(memos.map((memo) => Buffer.from(memo)));
            }
        }
        const toSignInputs = yield tx.addSufficientUtxosForFee(btcUtxos);
        const psbt = tx.toPsbt();
        return { psbt, toSignInputs };
    });
}
exports.sendBTC = sendBTC;
function sendAllBTC({ btcUtxos, toAddress, networkType, feeRate, enableRBF = true }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (utxo_1.utxoHelper.hasAnyAssets(btcUtxos)) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
        }
        const tx = new transaction_1.Transaction();
        tx.setNetworkType(networkType);
        tx.setFeeRate(feeRate);
        tx.setEnableRBF(enableRBF);
        tx.addOutput(toAddress, constants_1.UTXO_DUST);
        const toSignInputs = [];
        btcUtxos.forEach((v, index) => {
            tx.addInput(v);
            toSignInputs.push({ index, publicKey: v.pubkey });
        });
        const fee = yield tx.calNetworkFee();
        const unspent = tx.getTotalInput() - fee;
        if (unspent < constants_1.UTXO_DUST) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.INSUFFICIENT_BTC_UTXO);
        }
        tx.outputs[0].value = unspent;
        const psbt = tx.toPsbt();
        return { psbt, toSignInputs };
    });
}
exports.sendAllBTC = sendAllBTC;
