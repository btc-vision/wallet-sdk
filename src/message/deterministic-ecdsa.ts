import * as hmac from '@noble/hashes/hmac';
import * as sha256 from '@noble/hashes/sha256';
import * as noble_secp256k1 from '@noble/secp256k1';
import { bitcoin, ECPairInterface } from '../bitcoin-core';

noble_secp256k1.etc.hmacSha256Sync = (key, ...msgs) =>
    hmac.hmac(sha256.sha256, key, noble_secp256k1.etc.concatBytes(...msgs));
const MAGIC_BYTES = Buffer.from('Bitcoin Signed Message:\n');

function varintBufNum(n: number) {
    let buf;
    if (n < 253) {
        buf = Buffer.alloc(1);
        buf.writeUInt8(n, 0);
    } else if (n < 0x10000) {
        buf = Buffer.alloc(1 + 2);
        buf.writeUInt8(253, 0);
        buf.writeUInt16LE(n, 1);
    } else if (n < 0x100000000) {
        buf = Buffer.alloc(1 + 4);
        buf.writeUInt8(254, 0);
        buf.writeUInt32LE(n, 1);
    } else {
        buf = Buffer.alloc(1 + 8);
        buf.writeUInt8(255, 0);
        buf.writeInt32LE(n & -1, 1);
        buf.writeUInt32LE(Math.floor(n / 0x100000000), 5);
    }
    return buf;
}

function magicHash(message: string | Buffer) {
    const prefix1 = varintBufNum(MAGIC_BYTES.length);
    const messageBuffer = typeof message === 'string' ? Buffer.from(message) : message;
    const prefix2 = varintBufNum(messageBuffer.length);
    const buf = Buffer.concat([prefix1, MAGIC_BYTES, prefix2, messageBuffer]);
    return bitcoin.crypto.hash256(buf);
}

function toCompact(i: number, signature: Uint8Array, compressed: boolean) {
    if (!(i === 0 || i === 1 || i === 2 || i === 3)) {
        throw new Error('i must be equal to 0, 1, 2, or 3');
    }

    let val = i + 27 + 4;
    if (!compressed) {
        val = val - 4;
    }
    return Buffer.concat([Uint8Array.of(val), Uint8Array.from(signature)]);
}

export function signMessageOfDeterministicECDSA(ecpair: ECPairInterface, message: string | Buffer): string {
    const hash = magicHash(message);

    const privateKey = ecpair.privateKey!.toString('hex');

    const { r, s, recovery } = noble_secp256k1.sign(hash, privateKey);

    const signature = Buffer.concat([
        Buffer.from([27 + (recovery ?? 0) + 4]),
        Buffer.from(r.toString(16).padStart(64, '0') + s.toString(16).padStart(64, '0'), 'hex')
    ]);

    const publicKey = ecpair.publicKey.toString('hex');
    const isValid = noble_secp256k1.verify({ r, s }, hash, publicKey);
    if (!isValid) {
        throw new Error('Failed to verify signature');
    }

    return signature.toString('base64');
}
