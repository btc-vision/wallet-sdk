import ECPairFactory from 'ecpair';
import * as ecc from '@bitcoinerlab/secp256k1';
import * as bitcoin from '@btc-vision/bitcoin';
import { initEccLib } from '@btc-vision/bitcoin';

initEccLib(ecc);

export const ECPair = ECPairFactory(ecc);
export { ECPairInterface } from 'ecpair';
export { ecc, bitcoin };
