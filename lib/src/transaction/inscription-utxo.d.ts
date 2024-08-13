import { UnspentOutput } from '../types';
export declare class InscriptionUnit {
    satoshis: number;
    inscriptions: {
        id: string;
        outputOffset: number;
        unitOffset: number;
    }[];
    constructor(satoshis: number, inscriptions: {
        id: string;
        outputOffset: number;
        unitOffset: number;
    }[]);
    hasInscriptions(): boolean;
}
export declare class InscriptionUnspendOutput {
    inscriptionUnits: InscriptionUnit[];
    utxo: UnspentOutput;
    constructor(utxo: UnspentOutput, outputValue?: number);
    private split;
    /**
     * Get non-Ord satoshis for spending
     */
    getNonInscriptionSatoshis(): number;
    /**
     * Get last non-ord satoshis for spending.
     * Only the last one is available
     * @returns
     */
    getLastUnitSatoshis(): number;
    hasInscriptions(): boolean;
    dump(): void;
}
