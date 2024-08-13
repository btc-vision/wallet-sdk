"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySignData = exports.SimpleKeyring = void 0;
const bs58check_1 = require("bs58check");
const bitcoin_core_1 = require("../bitcoin-core");
const SimpleKeyringOptions_1 = require("./interfaces/SimpleKeyringOptions");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const type = 'Simple Key Pair';
class SimpleKeyring extends SimpleKeyringOptions_1.IKeyringBase {
    constructor(opts) {
        super((opts === null || opts === void 0 ? void 0 : opts.network) || bitcoinjs_lib_1.networks.bitcoin);
        this.type = type;
        if (opts && opts.privateKeys) {
            this.deserialize(opts);
        }
    }
    serialize() {
        return {
            privateKeys: this.wallets.map((wallet) => wallet.privateKey.toString('hex')),
            network: this.network
        };
    }
    deserialize(opts) {
        if (Array.isArray(opts)) {
            opts = { privateKeys: opts }; // compatibility
        }
        this.wallets = opts.privateKeys.map((key) => {
            let buf;
            if (key.length === 64) {
                // privateKey
                buf = Buffer.from(key, 'hex');
            }
            else {
                // base58
                buf = Buffer.from((0, bs58check_1.decode)(key).slice(1, 33));
            }
            return bitcoin_core_1.ECPair.fromPrivateKey(buf);
        });
    }
    addAccounts(n = 1) {
        const newWallets = [];
        for (let i = 0; i < n; i++) {
            newWallets.push(bitcoin_core_1.ECPair.makeRandom());
        }
        this.wallets = this.wallets.concat(newWallets);
        return newWallets.map(({ publicKey }) => publicKey.toString('hex'));
    }
    getAccounts() {
        return this.wallets.map(({ publicKey }) => publicKey.toString('hex'));
    }
}
exports.SimpleKeyring = SimpleKeyring;
SimpleKeyring.type = type;
function verifySignData(publicKey, hash, type, signature) {
    const keyPair = bitcoin_core_1.ECPair.fromPublicKey(Buffer.from(publicKey, 'hex'));
    if (type === 'ecdsa') {
        return keyPair.verify(Buffer.from(hash, 'hex'), Buffer.from(signature, 'hex'));
    }
    else if (type === 'schnorr') {
        return keyPair.verifySchnorr(Buffer.from(hash, 'hex'), Buffer.from(signature, 'hex'));
    }
    else {
        throw new Error('Not support type');
    }
}
exports.verifySignData = verifySignData;
