"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyMessageOfECDSA = exports.signMessageOfECDSA = void 0;
const bitcore_lib_1 = __importDefault(require("bitcore-lib"));
function signMessageOfECDSA(privateKey, text) {
    const keyPair = privateKey;
    const message = new bitcore_lib_1.default.Message(text);
    // @ts-ignore
    return message.sign(new bitcore_lib_1.default.PrivateKey(keyPair.privateKey));
}
exports.signMessageOfECDSA = signMessageOfECDSA;
function verifyMessageOfECDSA(publicKey, text, sig) {
    const message = new bitcore_lib_1.default.Message(text);
    // @ts-ignore
    const signature = bitcore_lib_1.default.crypto.Signature.fromCompact(Buffer.from(sig, 'base64'));
    const hash = message.magicHash();
    // recover the public key
    // @ts-ignore
    const ecdsa = new bitcore_lib_1.default.crypto.ECDSA();
    ecdsa.hashbuf = hash;
    ecdsa.sig = signature;
    const pubkeyInSig = ecdsa.toPublicKey();
    const pubkeyInSigString = new bitcore_lib_1.default.PublicKey(Object.assign({}, pubkeyInSig.toObject(), { compressed: true })).toString();
    if (pubkeyInSigString != publicKey) {
        return false;
    }
    return bitcore_lib_1.default.crypto.ECDSA.verify(hash, signature, pubkeyInSig);
}
exports.verifyMessageOfECDSA = verifyMessageOfECDSA;
