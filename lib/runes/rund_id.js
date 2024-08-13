"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuneId = void 0;
const big_integer_1 = __importDefault(require("big-integer"));
class RuneId {
    constructor({ block, tx }) {
        this.block = block;
        this.tx = tx;
    }
    static fromBigInt(n) {
        const bigN = (0, big_integer_1.default)(n);
        const block = bigN.shiftRight(16);
        const tx = bigN.and(0xffff);
        if (block.greater(Number.MAX_SAFE_INTEGER) || tx.greater(Number.MAX_SAFE_INTEGER)) {
            throw new Error('Integer overflow');
        }
        return new RuneId({ block: block.toJSNumber(), tx: tx.toJSNumber() });
    }
    toString() {
        return `${this.block}:${this.tx}`;
    }
    static fromString(s) {
        const [block, tx] = s.split(':').map(Number);
        return new RuneId({ block, tx });
    }
}
exports.RuneId = RuneId;
