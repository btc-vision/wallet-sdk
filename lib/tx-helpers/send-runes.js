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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendRunes = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
const bitcoin_core_1 = require("../bitcoin-core");
const error_1 = require("../error");
const runes_1 = require("../runes");
const rund_id_1 = require("../runes/rund_id");
const transaction_1 = require("../transaction/transaction");
const utxo_1 = require("../transaction/utxo");
// only one arc20 can be send
function sendRunes({ assetUtxos, btcUtxos, assetAddress, btcAddress, toAddress, networkType, runeid, runeAmount, outputValue, feeRate, enableRBF = true }) {
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
        tx.setChangeAddress(btcAddress);
        const toSignInputs = [];
        // add assets
        assetUtxos.forEach((v, index) => {
            tx.addInput(v);
            toSignInputs.push({ index, publicKey: v.pubkey });
        });
        let fromRuneAmount = (0, big_integer_1.default)(0);
        let hasMultipleRunes = false;
        let runesMap = {};
        assetUtxos.forEach((v) => {
            if (v.runes) {
                v.runes.forEach((w) => {
                    runesMap[w.runeid] = true;
                    if (w.runeid === runeid) {
                        fromRuneAmount = fromRuneAmount.plus((0, big_integer_1.default)(w.amount));
                    }
                });
            }
        });
        if (Object.keys(runesMap).length > 1) {
            hasMultipleRunes = true;
        }
        const changedRuneAmount = fromRuneAmount.minus((0, big_integer_1.default)(runeAmount));
        if (changedRuneAmount.lt(0)) {
            throw new error_1.WalletUtilsError(error_1.ErrorCodes.INSUFFICIENT_ASSET_UTXO);
        }
        let needChange = false;
        if (hasMultipleRunes || changedRuneAmount.gt(0)) {
            needChange = true;
        }
        let payload = [];
        let runeId = rund_id_1.RuneId.fromString(runeid);
        runes_1.varint.encodeToVec(0, payload);
        // add send data
        runes_1.varint.encodeToVec(runeId.block, payload);
        runes_1.varint.encodeToVec(runeId.tx, payload);
        runes_1.varint.encodeToVec(runeAmount, payload);
        if (needChange) {
            // 1 is to change
            // 2 is to send
            runes_1.varint.encodeToVec(2, payload);
        }
        else {
            // 1 is to send
            runes_1.varint.encodeToVec(1, payload);
        }
        // add op_return
        tx.addScriptOutput(
        // OUTPUT_0
        bitcoin_core_1.bitcoin.script.compile([bitcoin_core_1.bitcoin.opcodes.OP_RETURN, bitcoin_core_1.bitcoin.opcodes.OP_13, Buffer.from(new Uint8Array(payload))]), 0);
        if (needChange) {
            // OUTPUT_1
            // add change
            tx.addOutput(assetAddress, outputValue);
        }
        tx.addOutput(toAddress, outputValue);
        // add btc
        const _toSignInputs = yield tx.addSufficientUtxosForFee(btcUtxos, true);
        toSignInputs.push(..._toSignInputs);
        const psbt = tx.toPsbt();
        return { psbt, toSignInputs };
    });
}
exports.sendRunes = sendRunes;
