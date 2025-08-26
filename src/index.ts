Object.defineProperty(global, '_bitcore', {
    get() {
        return undefined;
    },
    set() {}
});

import * as address from './address';
import * as core from './bitcoin-core';
import * as message from './message';
import * as network from './network';
import * as wallet from './wallet';

export { network };
export { core };
export { message };
export { address };
export { wallet };

export const toPsbtNetwork = network.toPsbtNetwork;
export const verifyMessageOfBIP322Simple = message.verifyMessageOfBIP322Simple;
export const genPsbtOfBIP322Simple = message.genPsbtOfBIP322Simple;
export const getSignatureFromPsbtOfBIP322Simple = message.getSignatureFromPsbtOfBIP322Simple;
export const scriptPkToAddress = address.scriptPkToAddress;
export const publicKeyToAddress = address.publicKeyToAddress;
export const ECPair = core.ECPair;
export type AbstractWallet = wallet.AbstractWallet;

export * from './keyring';
export * from './constants';

export * as transaction from './transaction';
export * as txHelpers from './tx-helpers';
export * from './types';
export * as utils from './utils';

export * from './message/bip322-simple';

// Export with types.
export * from './keyring/interfaces/SimpleKeyringOptions';
export * from './keyring/hd-keyring';
export * from './keyring/keystone-keyring';
export * from './keyring/simple-keyring';
