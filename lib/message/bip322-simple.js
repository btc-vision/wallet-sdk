"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.verifyMessageOfBIP322Simple = exports.signMessageOfBIP322Simple = exports.getSignatureFromPsbtOfBIP322Simple = exports.genPsbtOfBIP322Simple = void 0;
const varuint_bitcoin_1 = require("varuint-bitcoin");
const address_1 = require("../address");
const network_1 = require("../network");
const types_1 = require("../types");
const utils_1 = require("../utils");
const bitcoin = __importStar(require("bitcoinjs-lib"));
function bip0322_hash(message) {
    const { sha256 } = bitcoin.crypto;
    const tag = 'BIP0322-signed-message';
    const tagHash = sha256(Buffer.from(tag));
    const result = sha256(Buffer.concat([tagHash, tagHash, Buffer.from(message)]));
    return result.toString('hex');
}
function genPsbtOfBIP322Simple({ message, address, networkType }) {
    const outputScript = (0, address_1.addressToScriptPk)(address, networkType);
    const addressType = (0, address_1.getAddressType)(address, networkType);
    const supportedTypes = [types_1.AddressType.P2WPKH, types_1.AddressType.P2TR, types_1.AddressType.M44_P2WPKH, types_1.AddressType.M44_P2TR];
    if (supportedTypes.includes(addressType) == false) {
        throw new Error('Not support address type to sign');
    }
    const prevoutHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const scriptSig = Buffer.concat([Buffer.from('0020', 'hex'), Buffer.from(bip0322_hash(message), 'hex')]);
    const txToSpend = new bitcoin.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
    txToSpend.addOutput(outputScript, 0);
    const psbtToSign = new bitcoin.Psbt();
    psbtToSign.setVersion(0);
    psbtToSign.addInput({
        hash: txToSpend.getHash(),
        index: 0,
        sequence: 0,
        witnessUtxo: {
            script: outputScript,
            value: 0
        }
    });
    psbtToSign.addOutput({ script: Buffer.from('6a', 'hex'), value: 0 });
    return psbtToSign;
}
exports.genPsbtOfBIP322Simple = genPsbtOfBIP322Simple;
function getSignatureFromPsbtOfBIP322Simple(psbt) {
    const txToSign = psbt.extractTransaction();
    function encodeVarString(b) {
        return Buffer.concat([(0, varuint_bitcoin_1.encode)(b.byteLength), b]);
    }
    const len = (0, varuint_bitcoin_1.encode)(txToSign.ins[0].witness.length);
    const result = Buffer.concat([len, ...txToSign.ins[0].witness.map((w) => encodeVarString(w))]);
    const signature = result.toString('base64');
    return signature;
}
exports.getSignatureFromPsbtOfBIP322Simple = getSignatureFromPsbtOfBIP322Simple;
/**
 * reference: https://github.com/bitcoin/bips/blob/master/bip-0322.mediawiki
 */
function signMessageOfBIP322Simple({ message, address, networkType, wallet }) {
    return __awaiter(this, void 0, void 0, function* () {
        const psbtToSign = genPsbtOfBIP322Simple({
            message,
            address,
            networkType
        });
        yield wallet.signPsbt(psbtToSign);
        return getSignatureFromPsbtOfBIP322Simple(psbtToSign);
    });
}
exports.signMessageOfBIP322Simple = signMessageOfBIP322Simple;
function verifyMessageOfBIP322Simple(address, msg, signature, networkType = network_1.NetworkType.MAINNET) {
    const addressType = (0, address_1.getAddressType)(address, networkType);
    if (addressType === types_1.AddressType.P2WPKH || addressType === types_1.AddressType.M44_P2WPKH) {
        return verifySignatureOfBIP322Simple_P2PWPKH(address, msg, signature, networkType);
    }
    else if (addressType === types_1.AddressType.P2TR || addressType === types_1.AddressType.M44_P2TR) {
        return verifySignatureOfBIP322Simple_P2TR(address, msg, signature, networkType);
    }
    return false;
}
exports.verifyMessageOfBIP322Simple = verifyMessageOfBIP322Simple;
function verifySignatureOfBIP322Simple_P2TR(address, msg, sign, networkType = network_1.NetworkType.MAINNET) {
    const network = (0, network_1.toPsbtNetwork)(networkType);
    const outputScript = bitcoin.address.toOutputScript(address, network);
    const prevoutHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const scriptSig = Buffer.concat([Buffer.from('0020', 'hex'), Buffer.from(bip0322_hash(msg), 'hex')]);
    const txToSpend = new bitcoin.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
    txToSpend.addOutput(outputScript, 0);
    const data = Buffer.from(sign, 'base64');
    const _res = bitcoin.script.decompile(data.slice(1));
    const signature = _res[0];
    const pubkey = Buffer.from('02' + outputScript.subarray(2).toString('hex'), 'hex');
    const psbtToSign = new bitcoin.Psbt();
    psbtToSign.setVersion(0);
    psbtToSign.addInput({
        hash: txToSpend.getHash(),
        index: 0,
        sequence: 0,
        witnessUtxo: {
            script: outputScript,
            value: 0
        }
    });
    psbtToSign.addOutput({ script: Buffer.from('6a', 'hex'), value: 0 });
    const tapKeyHash = psbtToSign.__CACHE.__TX.hashForWitnessV1(0, [outputScript], [0], 0);
    const valid = (0, utils_1.schnorrValidator)(pubkey, tapKeyHash, signature);
    return valid;
}
function verifySignatureOfBIP322Simple_P2PWPKH(address, msg, sign, networkType = network_1.NetworkType.MAINNET) {
    const network = (0, network_1.toPsbtNetwork)(networkType);
    const outputScript = bitcoin.address.toOutputScript(address, network);
    const prevoutHash = Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex');
    const prevoutIndex = 0xffffffff;
    const sequence = 0;
    const scriptSig = Buffer.concat([Buffer.from('0020', 'hex'), Buffer.from(bip0322_hash(msg), 'hex')]);
    const txToSpend = new bitcoin.Transaction();
    txToSpend.version = 0;
    txToSpend.addInput(prevoutHash, prevoutIndex, sequence, scriptSig);
    txToSpend.addOutput(outputScript, 0);
    const data = Buffer.from(sign, 'base64');
    const _res = bitcoin.script.decompile(data.slice(1));
    const psbtToSign = new bitcoin.Psbt();
    psbtToSign.setVersion(0);
    psbtToSign.addInput({
        hash: txToSpend.getHash(),
        index: 0,
        sequence: 0,
        witnessUtxo: {
            script: outputScript,
            value: 0
        }
    });
    psbtToSign.addOutput({ script: Buffer.from('6a', 'hex'), value: 0 });
    psbtToSign.updateInput(0, {
        partialSig: [
            {
                pubkey: _res[1],
                signature: _res[0]
            }
        ]
    });
    const valid = psbtToSign.validateSignaturesOfAllInputs(utils_1.validator);
    return valid;
}
