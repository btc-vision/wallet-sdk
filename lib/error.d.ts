export declare enum ErrorCodes {
    UNKNOWN = -1,
    INSUFFICIENT_BTC_UTXO = -2,
    INSUFFICIENT_ASSET_UTXO = -3,
    NOT_SAFE_UTXOS = -4,
    ASSET_MAYBE_LOST = -5,
    ONLY_ONE_ARC20_CAN_BE_SENT = -6
}
export declare const ErrorMessages: {
    [-1]: string;
    [-2]: string;
    [-3]: string;
    [-4]: string;
    [-5]: string;
    [-6]: string;
};
export declare class WalletUtilsError extends Error {
    code: ErrorCodes;
    constructor(code: ErrorCodes, message?: string);
}
