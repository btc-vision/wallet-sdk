"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressType = void 0;
var AddressType;
(function (AddressType) {
    AddressType[AddressType["P2PKH"] = 0] = "P2PKH";
    AddressType[AddressType["P2WPKH"] = 1] = "P2WPKH";
    AddressType[AddressType["P2TR"] = 2] = "P2TR";
    AddressType[AddressType["P2SH_P2WPKH"] = 3] = "P2SH_P2WPKH";
    AddressType[AddressType["M44_P2WPKH"] = 4] = "M44_P2WPKH";
    AddressType[AddressType["M44_P2TR"] = 5] = "M44_P2TR";
    AddressType[AddressType["P2WSH"] = 6] = "P2WSH";
    AddressType[AddressType["P2SH"] = 7] = "P2SH";
    AddressType[AddressType["UNKNOWN"] = 8] = "UNKNOWN";
})(AddressType = exports.AddressType || (exports.AddressType = {}));
