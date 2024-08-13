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
exports.splitInscriptionUtxo = void 0;
const constants_1 = require("../constants");
const error_1 = require("../error");
const transaction_1 = require("../transaction");
function splitInscriptionUtxo({ btcUtxos, assetUtxo, networkType, changeAddress, feeRate, enableRBF = true, outputValue = 546 }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (transaction_1.utxoHelper.hasAnyAssets(btcUtxos)) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
        }
        if (transaction_1.utxoHelper.hasAtomicals([assetUtxo])) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.NOT_SAFE_UTXOS);
        }
        const tx = new transaction_1.Transaction();
        tx.setNetworkType(networkType);
        tx.setFeeRate(feeRate);
        tx.setEnableRBF(enableRBF);
        tx.setChangeAddress(changeAddress);
        const toSignInputs = [];
        let lastUnit = null;
        let splitedCount = 0;
        const ordUtxo = new transaction_1.InscriptionUnspendOutput(assetUtxo, outputValue);
        tx.addInput(ordUtxo.utxo);
        toSignInputs.push({ index: 0, publicKey: ordUtxo.utxo.pubkey });
        for (let j = 0; j < ordUtxo.inscriptionUnits.length; j++) {
            const unit = ordUtxo.inscriptionUnits[j];
            if (unit.hasInscriptions()) {
                tx.addChangeOutput(unit.satoshis);
                lastUnit = unit;
                splitedCount++;
                continue;
            }
            tx.addChangeOutput(unit.satoshis);
            lastUnit = unit;
        }
        if (!lastUnit.hasInscriptions()) {
            tx.removeChangeOutput();
        }
        if (lastUnit.satoshis < constants_1.UTXO_DUST) {
            lastUnit.satoshis = constants_1.UTXO_DUST;
        }
        const _toSignInputs = yield tx.addSufficientUtxosForFee(btcUtxos);
        toSignInputs.push(..._toSignInputs);
        const psbt = tx.toPsbt();
        return { psbt, toSignInputs, splitedCount };
    });
}
exports.splitInscriptionUtxo = splitInscriptionUtxo;
