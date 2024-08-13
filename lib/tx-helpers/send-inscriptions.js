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
exports.sendInscriptions = void 0;
const error_1 = require("../error");
const transaction_1 = require("../transaction/transaction");
const utxo_1 = require("../transaction/utxo");
function sendInscriptions({ assetUtxos, btcUtxos, toAddress, networkType, changeAddress, feeRate, enableRBF = true }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (utxo_1.utxoHelper.hasAnyAssets(btcUtxos)) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
        }
        if (utxo_1.utxoHelper.hasAtomicals(assetUtxos)) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
        }
        const tx = new transaction_1.Transaction();
        tx.setNetworkType(networkType);
        tx.setFeeRate(feeRate);
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        const toSignInputs = [];
        for (let i = 0; i < assetUtxos.length; i++) {
            const assetUtxo = assetUtxos[i];
            if (assetUtxo.inscriptions.length > 1) {
                throw new Error('Multiple inscriptions in one UTXO! Please split them first.');
            }
            tx.addInput(assetUtxo);
            tx.addOutput(toAddress, assetUtxo.satoshis);
            toSignInputs.push({ index: i, publicKey: assetUtxo.pubkey });
        }
        const _toSignInputs = yield tx.addSufficientUtxosForFee(btcUtxos);
        toSignInputs.push(..._toSignInputs);
        const psbt = tx.toPsbt();
        return { psbt, toSignInputs };
    });
}
exports.sendInscriptions = sendInscriptions;
