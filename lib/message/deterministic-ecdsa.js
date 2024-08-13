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
Object.defineProperty(exports, "__esModule", { value: true });
exports.signMessageOfDeterministicECDSA = void 0;
const hmac = __importStar(require("@noble/hashes/hmac"));
const sha256 = __importStar(require("@noble/hashes/sha256"));
const noble_secp256k1 = __importStar(require("@noble/secp256k1"));
const bitcoin_core_1 = require("../bitcoin-core");
noble_secp256k1.utils.hmacSha256Sync = (key, ...msgs) => hmac.hmac(sha256.sha256, key, noble_secp256k1.utils.concatBytes(...msgs));
const MAGIC_BYTES = Buffer.from('Bitcoin Signed Message:\n');
function varintBufNum(n) {
    let buf;
    if (n < 253) {
        buf = Buffer.alloc(1);
        buf.writeUInt8(n, 0);
    }
    else if (n < 0x10000) {
        buf = Buffer.alloc(1 + 2);
        buf.writeUInt8(253, 0);
        buf.writeUInt16LE(n, 1);
    }
    else if (n < 0x100000000) {
        buf = Buffer.alloc(1 + 4);
        buf.writeUInt8(254, 0);
        buf.writeUInt32LE(n, 1);
    }
    else {
        buf = Buffer.alloc(1 + 8);
        buf.writeUInt8(255, 0);
        buf.writeInt32LE(n & -1, 1);
        buf.writeUInt32LE(Math.floor(n / 0x100000000), 5);
    }
    return buf;
}
function magicHash(message) {
    const prefix1 = varintBufNum(MAGIC_BYTES.length);
    const messageBuffer = Buffer.from(message);
    const prefix2 = varintBufNum(messageBuffer.length);
    const buf = Buffer.concat([prefix1, MAGIC_BYTES, prefix2, messageBuffer]);
    return bitcoin_core_1.bitcoin.crypto.hash256(buf);
}
function toCompact(i, signature, compressed) {
    if (!(i === 0 || i === 1 || i === 2 || i === 3)) {
        throw new Error('i must be equal to 0, 1, 2, or 3');
    }
    let val = i + 27 + 4;
    if (!compressed) {
        val = val - 4;
    }
    return Buffer.concat([Uint8Array.of(val), Uint8Array.from(signature)]);
}
function signMessageOfDeterministicECDSA(ecpair, message) {
    const hash = magicHash(message);
    const [signature, i] = noble_secp256k1.signSync(Buffer.from(hash), ecpair.privateKey.toString('hex'), {
        canonical: true,
        recovered: true,
        der: false
    });
    return toCompact(i, signature, true).toString('base64');
}
exports.signMessageOfDeterministicECDSA = signMessageOfDeterministicECDSA;
