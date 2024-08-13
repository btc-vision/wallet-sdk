import { NetworkType } from '../network';
import { AddressType, UnspentOutput } from '../types';
declare function hasInscription(utxos: UnspentOutput[]): boolean;
declare function hasAtomicalsFT(utxos: UnspentOutput[]): boolean;
declare function hasAtomicalsNFT(utxos: UnspentOutput[]): boolean;
declare function hasAtomicals(utxos: UnspentOutput[]): boolean;
declare function hasAnyAssets(utxos: UnspentOutput[]): boolean;
/**
 * select utxos so that the total amount of utxos is greater than or equal to targetAmount
 * return the selected utxos and the unselected utxos
 * @param utxos
 * @param targetAmount
 */
declare function selectBtcUtxos(utxos: UnspentOutput[], targetAmount: number): {
    selectedUtxos: UnspentOutput[];
    remainingUtxos: UnspentOutput[];
};
/**
 * return the added virtual size of the utxo
 */
declare function getAddedVirtualSize(addressType: AddressType): number;
export declare function getUtxoDust(addressType: AddressType): 546 | 294 | 330;
export declare function getAddressUtxoDust(address: string, networkType?: NetworkType): number;
export declare const utxoHelper: {
    hasAtomicalsFT: typeof hasAtomicalsFT;
    hasAtomicalsNFT: typeof hasAtomicalsNFT;
    hasAtomicals: typeof hasAtomicals;
    hasInscription: typeof hasInscription;
    hasAnyAssets: typeof hasAnyAssets;
    selectBtcUtxos: typeof selectBtcUtxos;
    getAddedVirtualSize: typeof getAddedVirtualSize;
    getUtxoDust: typeof getUtxoDust;
    getAddressUtxoDust: typeof getAddressUtxoDust;
};
export {};
