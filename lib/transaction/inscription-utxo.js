"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InscriptionUnspendOutput = exports.InscriptionUnit = void 0;
const constants_1 = require("../constants");
class InscriptionUnit {
    constructor(satoshis, inscriptions) {
        this.satoshis = satoshis;
        this.inscriptions = inscriptions;
    }
    hasInscriptions() {
        return this.inscriptions.length > 0;
    }
}
exports.InscriptionUnit = InscriptionUnit;
class InscriptionUnspendOutput {
    constructor(utxo, outputValue) {
        this.utxo = utxo;
        this.split(utxo.satoshis, utxo.inscriptions, outputValue);
    }
    // split the UTXO to units
    split(satoshis, inscriptions, splitOutputValue = constants_1.UTXO_DUST) {
        const inscriptionUnits = [];
        let leftAmount = satoshis;
        for (let i = 0; i < inscriptions.length; i++) {
            const id = inscriptions[i].inscriptionId;
            const offset = inscriptions[i].offset;
            const usedSatoshis = satoshis - leftAmount;
            const curOffset = offset - usedSatoshis;
            if (curOffset < 0 || leftAmount < splitOutputValue) {
                if (inscriptionUnits.length == 0) {
                    inscriptionUnits.push(new InscriptionUnit(leftAmount, [
                        {
                            id: id,
                            outputOffset: offset,
                            unitOffset: curOffset
                        }
                    ]));
                    leftAmount = 0;
                }
                else {
                    // injected to previous
                    const preUnit = inscriptionUnits[inscriptionUnits.length - 1];
                    preUnit.inscriptions.push({
                        id,
                        outputOffset: offset,
                        unitOffset: preUnit.satoshis + curOffset
                    });
                    continue;
                }
            }
            if (leftAmount >= curOffset) {
                if (leftAmount > splitOutputValue * 2) {
                    if (curOffset >= splitOutputValue) {
                        inscriptionUnits.push(new InscriptionUnit(curOffset, []));
                        inscriptionUnits.push(new InscriptionUnit(splitOutputValue, [
                            {
                                id,
                                outputOffset: offset,
                                unitOffset: 0
                            }
                        ]));
                    }
                    else {
                        inscriptionUnits.push(new InscriptionUnit(curOffset + splitOutputValue, [
                            {
                                id,
                                outputOffset: offset,
                                unitOffset: curOffset
                            }
                        ]));
                    }
                }
                else {
                    inscriptionUnits.push(new InscriptionUnit(curOffset + splitOutputValue, [{ id, outputOffset: offset, unitOffset: curOffset }]));
                }
            }
            leftAmount -= curOffset + splitOutputValue;
        }
        if (leftAmount > constants_1.UTXO_DUST) {
            inscriptionUnits.push(new InscriptionUnit(leftAmount, []));
        }
        else if (leftAmount > 0) {
            if (inscriptionUnits.length > 0) {
                inscriptionUnits[inscriptionUnits.length - 1].satoshis += leftAmount;
            }
            else {
                inscriptionUnits.push(new InscriptionUnit(leftAmount, []));
            }
        }
        this.inscriptionUnits = inscriptionUnits;
    }
    /**
     * Get non-Ord satoshis for spending
     */
    getNonInscriptionSatoshis() {
        return this.inscriptionUnits.filter((v) => v.inscriptions.length == 0).reduce((pre, cur) => pre + cur.satoshis, 0);
    }
    /**
     * Get last non-ord satoshis for spending.
     * Only the last one is available
     * @returns
     */
    getLastUnitSatoshis() {
        const last = this.inscriptionUnits[this.inscriptionUnits.length - 1];
        if (last.inscriptions.length == 0) {
            return last.satoshis;
        }
        return 0;
    }
    hasInscriptions() {
        return this.utxo.inscriptions.length > 0;
    }
    // print each units
    dump() {
        this.inscriptionUnits.forEach((v) => {
            console.log('satoshis:', v.satoshis, 'inscriptions:', v.inscriptions);
        });
    }
}
exports.InscriptionUnspendOutput = InscriptionUnspendOutput;
