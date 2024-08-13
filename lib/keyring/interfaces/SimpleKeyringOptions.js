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
exports.IKeyringBase = void 0;
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const events_1 = require("events");
const bip371_1 = require("bitcoinjs-lib/src/psbt/bip371");
const utils_1 = require("../../utils");
const message_1 = require("../../message");
class IKeyringBase extends events_1.EventEmitter {
    constructor(network = bitcoinjs_lib_1.networks.bitcoin) {
        super();
        this.network = network;
        this.type = '';
        this.wallets = [];
    }
    removeAccount(publicKey) {
        if (!this.wallets.map((wallet) => wallet.publicKey.toString('hex')).includes(publicKey)) {
            throw new Error(`PublicKey ${publicKey} not found in this keyring`);
        }
        this.wallets = this.wallets.filter((wallet) => wallet.publicKey.toString('hex') !== publicKey);
    }
    verifyMessage(publicKey, text, sig) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, message_1.verifyMessageOfECDSA)(publicKey, text, sig);
        });
    }
    // Sign any content, but note that the content signed by this method is unreadable, so use it with caution.
    signData(publicKey, data, type = 'ecdsa') {
        const keyPair = this._getPrivateKeyFor(publicKey);
        if (type === 'ecdsa') {
            return keyPair.sign(Buffer.from(data, 'hex')).toString('hex');
        }
        else if (type === 'schnorr') {
            return keyPair.signSchnorr(Buffer.from(data, 'hex')).toString('hex');
        }
        else {
            throw new Error('Not support type');
        }
    }
    signMessage(publicKey, text) {
        const keyPair = this._getPrivateKeyFor(publicKey);
        return (0, message_1.signMessageOfDeterministicECDSA)(keyPair, text);
    }
    exportAccount(publicKey) {
        const wallet = this._getWalletForAccount(publicKey);
        return wallet.privateKey.toString('hex');
    }
    signTransaction(psbt, inputs, opts) {
        inputs.forEach((input) => {
            const keyPair = this._getPrivateKeyFor(input.publicKey);
            if ((0, bip371_1.isTaprootInput)(psbt.data.inputs[input.index]) && !input.disableTweakSigner) {
                const signer = (0, utils_1.tweakSigner)(keyPair, opts);
                psbt.signInput(input.index, signer, input.sighashTypes);
            }
            else {
                psbt.signInput(input.index, keyPair, input.sighashTypes);
            }
        });
        return psbt;
    }
    _getWalletForAccount(publicKey) {
        let wallet = this.wallets.find((wallet) => wallet.publicKey.toString('hex') == publicKey);
        if (!wallet) {
            throw new Error('Simple Keyring - Unable to find matching publicKey.');
        }
        return wallet;
    }
    _getPrivateKeyFor(publicKey) {
        if (!publicKey) {
            throw new Error('Must specify publicKey.');
        }
        return this._getWalletForAccount(publicKey);
    }
}
exports.IKeyringBase = IKeyringBase;
IKeyringBase.type = '';
