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
exports.Transaction = void 0;
const address_1 = require("../address");
const bitcoin_core_1 = require("../bitcoin-core");
const constants_1 = require("../constants");
const error_1 = require("../error");
const network_1 = require("../network");
const types_1 = require("../types");
const utils_1 = require("../utils");
const wallet_1 = require("../wallet");
const utxo_1 = require("./utxo");
/**
 * Convert UnspentOutput to PSBT TxInput
 */
function utxoToInput(utxo, estimate) {
    if (utxo.addressType === types_1.AddressType.P2TR || utxo.addressType === types_1.AddressType.M44_P2TR) {
        const data = {
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
                value: utxo.satoshis,
                script: Buffer.from(utxo.scriptPk, 'hex')
            },
            tapInternalKey: (0, utils_1.toXOnly)(Buffer.from(utxo.pubkey, 'hex'))
        };
        return {
            data,
            utxo
        };
    }
    else if (utxo.addressType === types_1.AddressType.P2WPKH || utxo.addressType === types_1.AddressType.M44_P2WPKH) {
        const data = {
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
                value: utxo.satoshis,
                script: Buffer.from(utxo.scriptPk, 'hex')
            }
        };
        return {
            data,
            utxo
        };
    }
    else if (utxo.addressType === types_1.AddressType.P2PKH) {
        if (!utxo.rawtx || estimate) {
            const data = {
                hash: utxo.txid,
                index: utxo.vout,
                witnessUtxo: {
                    value: utxo.satoshis,
                    script: Buffer.from(utxo.scriptPk, 'hex')
                }
            };
            return {
                data,
                utxo
            };
        }
        else {
            const data = {
                hash: utxo.txid,
                index: utxo.vout,
                nonWitnessUtxo: Buffer.from(utxo.rawtx, 'hex')
            };
            return {
                data,
                utxo
            };
        }
    }
    else if (utxo.addressType === types_1.AddressType.P2SH_P2WPKH) {
        const redeemData = bitcoin_core_1.bitcoin.payments.p2wpkh({
            pubkey: Buffer.from(utxo.pubkey, 'hex')
        });
        const data = {
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: {
                value: utxo.satoshis,
                script: Buffer.from(utxo.scriptPk, 'hex')
            },
            redeemScript: redeemData.output
        };
        return {
            data,
            utxo
        };
    }
}
/**
 * Transaction
 */
class Transaction {
    constructor() {
        this.utxos = [];
        this.inputs = [];
        this.outputs = [];
        this.changeOutputIndex = -1;
        this.enableRBF = true;
        this._cacheNetworkFee = 0;
        this._cacheBtcUtxos = [];
        this._cacheToSignInputs = [];
    }
    setNetworkType(network) {
        this.networkType = network;
    }
    setEnableRBF(enable) {
        this.enableRBF = enable;
    }
    setFeeRate(feeRate) {
        this.feeRate = feeRate;
    }
    setChangeAddress(address) {
        this.changedAddress = address;
    }
    addInput(utxo) {
        this.utxos.push(utxo);
        this.inputs.push(utxoToInput(utxo));
    }
    removeLastInput() {
        this.utxos = this.utxos.slice(0, -1);
        this.inputs = this.inputs.slice(0, -1);
    }
    getTotalInput() {
        return this.inputs.reduce((pre, cur) => pre + cur.utxo.satoshis, 0);
    }
    getTotalOutput() {
        return this.outputs.reduce((pre, cur) => pre + cur.value, 0);
    }
    getUnspent() {
        return this.getTotalInput() - this.getTotalOutput();
    }
    calNetworkFee() {
        return __awaiter(this, void 0, void 0, function* () {
            const psbt = yield this.createEstimatePsbt();
            const txSize = psbt.extractTransaction(true).virtualSize();
            const fee = Math.ceil(txSize * this.feeRate);
            return fee;
        });
    }
    addOutput(address, value) {
        this.outputs.push({
            address,
            value
        });
    }
    addOpreturn(data) {
        const embed = bitcoin_core_1.bitcoin.payments.embed({ data });
        this.outputs.push({
            script: embed.output,
            value: 0
        });
    }
    addScriptOutput(script, value) {
        this.outputs.push({
            script,
            value
        });
    }
    getOutput(index) {
        return this.outputs[index];
    }
    addChangeOutput(value) {
        this.outputs.push({
            address: this.changedAddress,
            value
        });
        this.changeOutputIndex = this.outputs.length - 1;
    }
    getChangeOutput() {
        return this.outputs[this.changeOutputIndex];
    }
    getChangeAmount() {
        const output = this.getChangeOutput();
        return output ? output.value : 0;
    }
    removeChangeOutput() {
        this.outputs.splice(this.changeOutputIndex, 1);
        this.changeOutputIndex = -1;
    }
    removeRecentOutputs(count) {
        this.outputs.splice(-count);
    }
    toPsbt() {
        const network = (0, network_1.toPsbtNetwork)(this.networkType);
        const psbt = new bitcoin_core_1.bitcoin.Psbt({ network });
        this.inputs.forEach((v, index) => {
            if (v.utxo.addressType === types_1.AddressType.P2PKH) {
                if (v.data.witnessUtxo) {
                    //@ts-ignore
                    psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = true;
                }
            }
            psbt.data.addInput(v.data);
            if (this.enableRBF) {
                psbt.setInputSequence(index, 0xfffffffd);
            }
        });
        this.outputs.forEach((v) => {
            if (v.address) {
                psbt.addOutput({
                    address: v.address,
                    value: v.value
                });
            }
            else if (v.script) {
                psbt.addOutput({
                    script: v.script,
                    value: v.value
                });
            }
        });
        return psbt;
    }
    clone() {
        const tx = new Transaction();
        tx.setNetworkType(this.networkType);
        tx.setFeeRate(this.feeRate);
        tx.setEnableRBF(this.enableRBF);
        tx.setChangeAddress(this.changedAddress);
        tx.utxos = this.utxos.map((v) => Object.assign({}, v));
        tx.inputs = this.inputs.map((v) => v);
        tx.outputs = this.outputs.map((v) => v);
        return tx;
    }
    createEstimatePsbt() {
        return __awaiter(this, void 0, void 0, function* () {
            const estimateWallet = wallet_1.EstimateWallet.fromRandom(this.inputs[0].utxo.addressType, this.networkType);
            const scriptPk = (0, address_1.addressToScriptPk)(estimateWallet.address, this.networkType).toString('hex');
            const tx = this.clone();
            tx.utxos.forEach((v) => {
                v.pubkey = estimateWallet.pubkey;
                v.scriptPk = scriptPk;
            });
            tx.inputs = [];
            tx.utxos.forEach((v) => {
                const input = utxoToInput(v, true);
                tx.inputs.push(input);
            });
            const psbt = tx.toPsbt();
            const toSignInputs = tx.inputs.map((v, index) => ({
                index,
                publicKey: estimateWallet.pubkey
            }));
            yield estimateWallet.signPsbt(psbt, {
                autoFinalized: true,
                toSignInputs: toSignInputs
            });
            return psbt;
        });
    }
    selectBtcUtxos() {
        const totalInput = this.getTotalInput();
        const totalOutput = this.getTotalOutput() + this._cacheNetworkFee;
        if (totalInput < totalOutput) {
            const { selectedUtxos, remainingUtxos } = utxo_1.utxoHelper.selectBtcUtxos(this._cacheBtcUtxos, totalOutput - totalInput);
            if (selectedUtxos.length == 0) {
                throw new error_1.WalletUtilsError(error_1.ErrorCodes.INSUFFICIENT_BTC_UTXO);
            }
            selectedUtxos.forEach((v) => {
                this.addInput(v);
                this._cacheToSignInputs.push({
                    index: this.inputs.length - 1,
                    publicKey: v.pubkey
                });
                this._cacheNetworkFee += utxo_1.utxoHelper.getAddedVirtualSize(v.addressType) * this.feeRate;
            });
            this._cacheBtcUtxos = remainingUtxos;
            this.selectBtcUtxos();
        }
    }
    addSufficientUtxosForFee(btcUtxos, forceAsFee) {
        return __awaiter(this, void 0, void 0, function* () {
            if (btcUtxos.length > 0) {
                this._cacheBtcUtxos = btcUtxos;
                const dummyBtcUtxo = Object.assign({}, btcUtxos[0]);
                dummyBtcUtxo.satoshis = 2100000000000000;
                this.addInput(dummyBtcUtxo);
                this.addChangeOutput(0);
                const networkFee = yield this.calNetworkFee();
                const dummyBtcUtxoSize = utxo_1.utxoHelper.getAddedVirtualSize(dummyBtcUtxo.addressType);
                this._cacheNetworkFee = networkFee - dummyBtcUtxoSize * this.feeRate;
                this.removeLastInput();
                this.selectBtcUtxos();
            }
            else {
                if (forceAsFee) {
                    throw new error_1.WalletUtilsError(error_1.ErrorCodes.INSUFFICIENT_BTC_UTXO);
                }
                if (this.getTotalInput() < this.getTotalOutput()) {
                    throw new error_1.WalletUtilsError(error_1.ErrorCodes.INSUFFICIENT_BTC_UTXO);
                }
                this._cacheNetworkFee = yield this.calNetworkFee();
            }
            const changeAmount = this.getTotalInput() - this.getTotalOutput() - Math.ceil(this._cacheNetworkFee);
            if (changeAmount > constants_1.UTXO_DUST) {
                this.removeChangeOutput();
                this.addChangeOutput(changeAmount);
            }
            else {
                this.removeChangeOutput();
            }
            return this._cacheToSignInputs;
        });
    }
    dumpTx(psbt) {
        return __awaiter(this, void 0, void 0, function* () {
            const tx = psbt.extractTransaction();
            const feeRate = psbt.getFeeRate();
            console.log(`
=============================================================================================
Summary
  txid:     ${tx.getId()}
  Size:     ${tx.byteLength()}
  Fee Paid: ${psbt.getFee()}
  Fee Rate: ${feeRate} sat/vB
  Detail:   ${psbt.txInputs.length} Inputs, ${psbt.txOutputs.length} Outputs
----------------------------------------------------------------------------------------------
Inputs
${this.inputs
                .map((input, index) => {
                const str = `
=>${index} ${input.data.witnessUtxo.value} Sats
        lock-size: ${input.data.witnessUtxo.script.length}
        via ${input.data.hash} [${input.data.index}]
`;
                return str;
            })
                .join('')}
total: ${this.getTotalInput()} Sats
----------------------------------------------------------------------------------------------
Outputs
${this.outputs
                .map((output, index) => {
                const str = `
=>${index} ${output.address} ${output.value} Sats`;
                return str;
            })
                .join('')}

total: ${this.getTotalOutput()} Sats
=============================================================================================
    `);
        });
    }
}
exports.Transaction = Transaction;
