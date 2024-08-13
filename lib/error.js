"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletUtilsError = exports.ErrorMessages = exports.ErrorCodes = void 0;
var ErrorCodes;
(function (ErrorCodes) {
    ErrorCodes[ErrorCodes["UNKNOWN"] = -1] = "UNKNOWN";
    ErrorCodes[ErrorCodes["INSUFFICIENT_BTC_UTXO"] = -2] = "INSUFFICIENT_BTC_UTXO";
    ErrorCodes[ErrorCodes["INSUFFICIENT_ASSET_UTXO"] = -3] = "INSUFFICIENT_ASSET_UTXO";
    ErrorCodes[ErrorCodes["NOT_SAFE_UTXOS"] = -4] = "NOT_SAFE_UTXOS";
    ErrorCodes[ErrorCodes["ASSET_MAYBE_LOST"] = -5] = "ASSET_MAYBE_LOST";
    ErrorCodes[ErrorCodes["ONLY_ONE_ARC20_CAN_BE_SENT"] = -6] = "ONLY_ONE_ARC20_CAN_BE_SENT";
})(ErrorCodes = exports.ErrorCodes || (exports.ErrorCodes = {}));
exports.ErrorMessages = {
    [ErrorCodes.UNKNOWN]: 'Unknown error',
    [ErrorCodes.INSUFFICIENT_BTC_UTXO]: 'Insufficient btc utxo',
    [ErrorCodes.INSUFFICIENT_ASSET_UTXO]: 'Insufficient asset utxo',
    [ErrorCodes.NOT_SAFE_UTXOS]: 'Not safe utxos',
    [ErrorCodes.ASSET_MAYBE_LOST]: 'Asset maybe lost',
    [ErrorCodes.ONLY_ONE_ARC20_CAN_BE_SENT]: 'Only one arc20 can be sent'
};
class WalletUtilsError extends Error {
    constructor(code, message = exports.ErrorMessages[code] || 'Unknown error') {
        super(message);
        this.code = ErrorCodes.UNKNOWN;
        this.code = code;
        Object.setPrototypeOf(this, WalletUtilsError.prototype);
    }
}
exports.WalletUtilsError = WalletUtilsError;
