"use strict";
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.ecc = exports.bitcoin = exports.ECPair = void 0;
  
  const bitcoin = require("bitcoinjs-lib");
  const ecpair = require("ecpair");
  
  let eccPromise;
  try {
    // Attempt to import tiny-secp256k1
    eccPromise = import("tiny-secp256k1");
  } catch (error) {
    // If import fails, fallback to a synchronous import
    eccPromise = Promise.resolve(require("tiny-secp256k1"));
  }
  
  eccPromise.then((ecc) => {
    exports.bitcoin = bitcoin;
    exports.ecc = ecc;
    exports.ECPair = ecpair.default(ecc); // use .default if available, otherwise use the module directly
    bitcoin.initEccLib(ecc);
  });
  