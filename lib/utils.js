"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortAddress = exports.amountToSaothis = exports.satoshisToAmount = exports.schnorrValidator = exports.validator = exports.tweakSigner = exports.toXOnly = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const bitcoin_core_1 = require("./bitcoin-core");
const toXOnly = (pubKey) => (pubKey.length === 32 ? pubKey : pubKey.slice(1, 33));
exports.toXOnly = toXOnly;
function tapTweakHash(pubKey, h) {
    return bitcoin_core_1.bitcoin.crypto.taggedHash('TapTweak', Buffer.concat(h ? [pubKey, h] : [pubKey]));
}
/**
 * Transform raw private key to taproot address private key
 */
function tweakSigner(signer, opts = {}) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    let privateKey = signer.privateKey;
    if (!privateKey) {
        throw new Error('Private key is required for tweaking signer!');
    }
    if (signer.publicKey[0] === 3) {
        privateKey = bitcoin_core_1.ecc.privateNegate(privateKey);
    }
    const tweakedPrivateKey = bitcoin_core_1.ecc.privateAdd(privateKey, tapTweakHash((0, exports.toXOnly)(signer.publicKey), opts.tweakHash));
    if (!tweakedPrivateKey) {
        throw new Error('Invalid tweaked private key!');
    }
    return bitcoin_core_1.ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
        network: opts.network
    });
}
exports.tweakSigner = tweakSigner;
/**
 * ECDSA signature validator
 */
const validator = (pubkey, msghash, signature) => bitcoin_core_1.ECPair.fromPublicKey(pubkey).verify(msghash, signature);
exports.validator = validator;
/**
 * Schnorr signature validator
 */
const schnorrValidator = (pubkey, msghash, signature) => {
    return bitcoin_core_1.ECPair.fromPublicKey(pubkey).verifySchnorr(msghash, signature);
};
exports.schnorrValidator = schnorrValidator;
/**
 * Transform satoshis to btc format
 */
function satoshisToAmount(val) {
    const num = new bignumber_js_1.default(val);
    return num.dividedBy(100000000).toFixed(8);
}
exports.satoshisToAmount = satoshisToAmount;
/**
 * Transform btc format to satoshis
 */
function amountToSaothis(val) {
    const num = new bignumber_js_1.default(val);
    return num.multipliedBy(100000000).toNumber();
}
exports.amountToSaothis = amountToSaothis;
function shortAddress(address, len = 5) {
    if (!address)
        return '';
    if (address.length <= len * 2)
        return address;
    return address.slice(0, len) + '...' + address.slice(address.length - len);
}
exports.shortAddress = shortAddress;
