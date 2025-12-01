import { beforeEach, describe, expect, it } from 'vitest';
import { AddressType, UnspentOutput } from '../../src';
import { NetworkType } from '../../src/network';
import { utxoHelper } from '../../src/transaction/utxo';
import { LocalWallet } from '../../src/wallet';

describe('utxo', () => {
    beforeEach(() => {
        // todo
    });

    it('getUtxoDust', function () {
        expect(utxoHelper.getUtxoDust(AddressType.M44_P2TR)).to.eq(330);
        expect(utxoHelper.getUtxoDust(AddressType.P2TR)).to.eq(330);

        expect(utxoHelper.getUtxoDust(AddressType.M44_P2WPKH)).to.eq(294);
        expect(utxoHelper.getUtxoDust(AddressType.P2WPKH)).to.eq(294);

        expect(utxoHelper.getUtxoDust(AddressType.P2PKH)).to.eq(546);
        expect(utxoHelper.getUtxoDust(AddressType.P2SH_P2WPKH)).to.eq(546);
        expect(utxoHelper.getUtxoDust(AddressType.P2SH)).to.eq(546);
        expect(utxoHelper.getUtxoDust(AddressType.P2WSH)).to.eq(546);
    });

    const networks = [
        NetworkType.MAINNET,
        NetworkType.TESTNET
        // NetworkType.REGTEST, not support
    ];
    const networkNames = ['MAINNET', 'TESTNET', 'REGTEST'];
    networks.forEach((networkType) => {
        describe('getAddressUtxoDust networkType: ' + networkNames[networkType], function () {
            it('should return dust for P2TR', function () {
                expect(
                    utxoHelper.getAddressUtxoDust(
                        LocalWallet.fromRandom(AddressType.P2TR, networkType).address,
                        networkType
                    )
                ).to.eq(330);
            });

            it('should return dust for P2WPKH', function () {
                expect(
                    utxoHelper.getAddressUtxoDust(
                        LocalWallet.fromRandom(AddressType.P2WPKH, networkType).address,
                        networkType
                    )
                ).to.eq(294);
            });

            it('should return dust for P2PKH', function () {
                expect(
                    utxoHelper.getAddressUtxoDust(
                        LocalWallet.fromRandom(AddressType.P2PKH, networkType).address,
                        networkType
                    )
                ).to.eq(546);
            });

            it('should return dust for P2SH_P2WPKH', function () {
                expect(
                    utxoHelper.getAddressUtxoDust(
                        LocalWallet.fromRandom(AddressType.P2SH_P2WPKH, networkType).address,
                        networkType
                    )
                ).to.eq(546);
            });
        });
    });
});
