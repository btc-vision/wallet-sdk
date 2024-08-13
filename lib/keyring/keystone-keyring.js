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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeystoneKeyring = void 0;
const keystone_sdk_1 = __importStar(require("@keystonehq/keystone-sdk"));
const utils_1 = require("@keystonehq/keystone-sdk/dist/utils");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const bitcore_lib_1 = __importDefault(require("bitcore-lib"));
const message_1 = require("../message");
const SimpleKeyringOptions_1 = require("./interfaces/SimpleKeyringOptions");
const type = 'Keystone';
class KeystoneKeyring extends SimpleKeyringOptions_1.IKeyringBase {
    constructor(opts) {
        super((opts === null || opts === void 0 ? void 0 : opts.network) || bitcoinjs_lib_1.networks.bitcoin);
        this.type = type;
        this.mfp = '';
        this.keys = [];
        this.activeIndexes = [];
        this.root = null;
        this.page = 0;
        this.perPage = 5;
        this.origin = 'UniSat Wallet';
        if (opts) {
            this.deserialize(opts);
        }
    }
    initFromUR(type, cbor) {
        return __awaiter(this, void 0, void 0, function* () {
            const keystoneSDK = new keystone_sdk_1.default({
                origin: this.origin
            });
            const account = keystoneSDK.parseAccount(new keystone_sdk_1.UR(Buffer.from(cbor, 'hex'), type));
            this.deserialize({
                mfp: account.masterFingerprint,
                keys: account.keys.map((k) => ({
                    path: k.path,
                    extendedPublicKey: k.extendedPublicKey
                }))
            });
        });
    }
    getHardenedPath(hdPath) {
        const paths = hdPath.split('/');
        return paths.slice(0, 4).join('/');
    }
    getHDPublicKey(hdPath) {
        const path = this.getHardenedPath(hdPath);
        const key = this.keys.find((v) => v.path === path);
        if (!key) {
            throw new Error('Invalid path');
        }
        return new bitcore_lib_1.default.HDPublicKey(key.extendedPublicKey);
    }
    getDefaultHdPath() {
        return "m/44'/0'/0'/0";
    }
    initRoot() {
        var _a;
        this.root = this.getHDPublicKey((_a = this.hdPath) !== null && _a !== void 0 ? _a : this.getDefaultHdPath());
    }
    deserialize(opts) {
        var _a;
        this.mfp = opts.mfp;
        this.keys = opts.keys;
        this.hdPath = (_a = opts.hdPath) !== null && _a !== void 0 ? _a : this.getDefaultHdPath();
        this.activeIndexes = opts.activeIndexes ? [...opts.activeIndexes] : [];
        this.initRoot();
        if (opts.hdPath !== null &&
            opts.hdPath !== undefined &&
            opts.hdPath.length >= 13 &&
            opts.hdPath[opts.hdPath.length - 1] === '1') {
            this.root = this.root.derive(`m/1`);
        }
    }
    serialize() {
        return {
            mfp: this.mfp,
            keys: this.keys,
            hdPath: this.hdPath,
            activeIndexes: this.activeIndexes
        };
    }
    addAccounts(numberOfAccounts = 1) {
        let count = numberOfAccounts;
        let i = 0;
        const pubkeys = [];
        while (count) {
            if (this.activeIndexes.includes(i)) {
                i++;
            }
            else {
                const w = this.getWalletByIndex(i);
                pubkeys.push(w.publicKey);
                this.activeIndexes.push(i);
                count--;
            }
        }
        return pubkeys;
    }
    addChangeAddressAccounts(numberOfAccounts = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = numberOfAccounts;
            let i = 0;
            const pubkeys = [];
            while (count) {
                if (this.activeIndexes.includes(i)) {
                    i++;
                }
                else {
                    const w = this.getChangeAddressWalletByIndex(i);
                    pubkeys.push(w.publicKey);
                    this.activeIndexes.push(i);
                    count--;
                }
            }
            return Promise.resolve(pubkeys);
        });
    }
    getAccounts() {
        if (this.hdPath !== null &&
            this.hdPath !== undefined &&
            this.hdPath.length >= 13 &&
            this.hdPath[this.hdPath.length - 1] === '1') {
            return this.activeIndexes.map((index) => {
                const child = this.root.derive(`m/${index}`);
                return child.publicKey.toString();
            });
        }
        return this.activeIndexes.map((i) => this.getWalletByIndex(i).publicKey);
    }
    getAccounts2() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.activeIndexes.map((index) => {
                const child = this.root.derive(`m/${index}`);
                return {
                    index,
                    path: `${this.hdPath}/${index}`,
                    publicKey: child.publicKey.toString()
                };
            });
        });
    }
    getAccountsWithBrand() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.activeIndexes.map((i) => {
                const w = this.getWalletByIndex(i);
                return {
                    address: w.publicKey,
                    index: i
                };
            });
        });
    }
    getWalletByIndex(index) {
        const child = this.root.derive(`m/0/${index}`);
        return {
            index,
            path: `${this.hdPath}/${index}`,
            publicKey: child.publicKey.toString()
        };
    }
    getChangeAddressWalletByIndex(index) {
        const child = this.root.derive(`m/1/${index}`);
        return {
            index,
            path: `${this.hdPath}/${index}`,
            publicKey: child.publicKey.toString()
        };
    }
    removeAccount(publicKey) {
        const index = this.activeIndexes.findIndex((i) => {
            const w = this.getWalletByIndex(i);
            return w.publicKey === publicKey;
        });
        if (index !== -1) {
            this.activeIndexes.splice(index, 1);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    exportAccount(_publicKey) {
        throw new Error('Not supported');
    }
    getFirstPage() {
        this.page = 0;
        return this.getPage(1);
    }
    getNextPage() {
        return this.getPage(1);
    }
    getPreviousPage() {
        return this.getPage(-1);
    }
    getAddresses(start, end) {
        const from = start;
        const to = end;
        const accounts = [];
        for (let i = from; i < to; i++) {
            const w = this.getWalletByIndex(i);
            accounts.push({
                address: w.publicKey,
                index: i + 1
            });
        }
        return accounts;
    }
    getPage(increment) {
        return __awaiter(this, void 0, void 0, function* () {
            this.page += increment;
            if (!this.page || this.page <= 0) {
                this.page = 1;
            }
            const from = (this.page - 1) * this.perPage;
            const to = from + this.perPage;
            const accounts = [];
            for (let i = from; i < to; i++) {
                const w = this.getWalletByIndex(i);
                accounts.push({
                    address: w.publicKey,
                    index: i + 1
                });
            }
            return accounts;
        });
    }
    activeAccounts(indexes) {
        const accounts = [];
        for (const index of indexes) {
            const w = this.getWalletByIndex(index);
            if (!this.activeIndexes.includes(index)) {
                this.activeIndexes.push(index);
            }
            accounts.push(w.publicKey);
        }
        return accounts;
    }
    changeHdPath(hdPath) {
        this.hdPath = hdPath;
        this.initRoot();
        this.activeAccounts(this.activeIndexes);
    }
    changeChangeAddressHdPath(hdPath) {
        var _a;
        this.hdPath = hdPath;
        this.root = this.getHDPublicKey((_a = this.hdPath) !== null && _a !== void 0 ? _a : this.getDefaultHdPath());
        this.root = this.root.derive(`m/1`);
        this.activeIndexes = [];
        return [];
    }
    getAccountByHdPath(hdPath, index) {
        const root = this.getHDPublicKey(hdPath);
        const child = root.derive(`m/0/${index}`);
        return child.publicKey.toString();
    }
    getChangeAddressAccountByHdPath(hdPath, index) {
        const root = this.getHDPublicKey(hdPath);
        const child = root.derive(`m/1/${index}`);
        return child.publicKey.toString();
    }
    genSignPsbtUr(psbtHex) {
        return __awaiter(this, void 0, void 0, function* () {
            const psbt = bitcoinjs_lib_1.Psbt.fromHex(psbtHex);
            const keystoneSDK = new keystone_sdk_1.default({
                origin: this.origin
            });
            const ur = keystoneSDK.btc.generatePSBT(psbt.data.toBuffer());
            return {
                type: ur.type,
                cbor: ur.cbor.toString('hex')
            };
        });
    }
    parseSignPsbtUr(type, cbor) {
        return __awaiter(this, void 0, void 0, function* () {
            const keystoneSDK = new keystone_sdk_1.default({
                origin: this.origin
            });
            return keystoneSDK.btc.parsePSBT(new keystone_sdk_1.UR(Buffer.from(cbor, 'hex'), type));
        });
    }
    genSignMsgUr(publicKey, text) {
        return __awaiter(this, void 0, void 0, function* () {
            const keystoneSDK = new keystone_sdk_1.default({
                origin: this.origin
            });
            let i = undefined;
            if (this.hdPath !== null &&
                this.hdPath !== undefined &&
                this.hdPath.length >= 13 &&
                this.hdPath[this.hdPath.length - 1] === '1') {
                const root = this.getHDPublicKey(this.hdPath);
                i = this.activeIndexes.find((i) => {
                    const child = root.derive(`m/1/${i}`);
                    if (child.publicKey.toString() === publicKey) {
                        return true;
                    }
                });
            }
            else {
                i = this.activeIndexes.find((i) => this.getWalletByIndex(i).publicKey === publicKey);
            }
            if (i === undefined) {
                throw new Error('publicKey not found');
            }
            const requestId = utils_1.uuid.v4();
            const ur = keystoneSDK.btc.generateSignRequest({
                requestId,
                signData: Buffer.from(text).toString('hex'),
                dataType: keystone_sdk_1.KeystoneBitcoinSDK.DataType.message,
                accounts: [
                    {
                        path: `${this.hdPath}/${i}`,
                        xfp: this.mfp
                    }
                ],
                origin: this.origin
            });
            return {
                requestId,
                type: ur.type,
                cbor: ur.cbor.toString('hex')
            };
        });
    }
    parseSignMsgUr(type, cbor) {
        return __awaiter(this, void 0, void 0, function* () {
            const keystoneSDK = new keystone_sdk_1.default({
                origin: this.origin
            });
            return keystoneSDK.btc.parseSignature(new keystone_sdk_1.UR(Buffer.from(cbor, 'hex'), type));
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signMessage(publicKey, text) {
        return 'Signing Message with Keystone should use genSignMsgUr and parseSignMsgUr';
    }
    verifyMessage(publicKey, text, sig) {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, message_1.verifyMessageOfECDSA)(publicKey, text, sig);
        });
    }
}
exports.KeystoneKeyring = KeystoneKeyring;
KeystoneKeyring.type = type;
