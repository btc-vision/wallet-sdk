import { describe, expect, it } from 'vitest';
import { networks } from '@btc-vision/bitcoin';
import { detectNetworkFromAddress, getBech32Prefix, toNetwork, toNetworkType, validateAddressNetwork } from '../../src';
import { OPNetNetwork } from '@btc-vision/transaction';

describe('Network Module', () => {
    describe('toNetwork', () => {
        it('should convert MAINNET to bitcoin network', () => {
            const network = toNetwork(OPNetNetwork.Mainnet);
            expect(network.bech32).toBe('bc');
            expect(network).toBe(networks.bitcoin);
        });

        it('should convert TESTNET to testnet network', () => {
            const network = toNetwork(OPNetNetwork.Testnet);
            expect(network.bech32).toBe('tb');
            expect(network).toBe(networks.testnet);
        });

        it('should convert REGTEST to regtest network', () => {
            const network = toNetwork(OPNetNetwork.Regtest);
            expect(network.bech32).toBe('bcrt');
            expect(network).toBe(networks.regtest);
        });
    });

    describe('toNetworkType', () => {
        it('should convert bitcoin network to MAINNET', () => {
            const networkType = toNetworkType(networks.bitcoin);
            expect(networkType).toBe(OPNetNetwork.Mainnet);
        });

        it('should convert testnet network to TESTNET', () => {
            const networkType = toNetworkType(networks.testnet);
            expect(networkType).toBe(OPNetNetwork.Testnet);
        });

        it('should convert regtest network to REGTEST', () => {
            const networkType = toNetworkType(networks.regtest);
            expect(networkType).toBe(OPNetNetwork.Regtest);
        });
    });

    describe('getBech32Prefix', () => {
        it('should return bc for mainnet', () => {
            expect(getBech32Prefix(OPNetNetwork.Mainnet)).toBe('bc');
        });

        it('should return tb for testnet', () => {
            expect(getBech32Prefix(OPNetNetwork.Testnet)).toBe('tb');
        });

        it('should return bcrt for regtest', () => {
            expect(getBech32Prefix(OPNetNetwork.Regtest)).toBe('bcrt');
        });
    });

    describe('detectNetworkFromAddress', () => {
        it('should detect mainnet from bc1 address', () => {
            const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
            expect(detectNetworkFromAddress(address)).toBe(OPNetNetwork.Mainnet);
        });

        it('should detect mainnet from 1 address', () => {
            const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
            expect(detectNetworkFromAddress(address)).toBe(OPNetNetwork.Mainnet);
        });

        it('should detect mainnet from 3 address', () => {
            const address = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
            expect(detectNetworkFromAddress(address)).toBe(OPNetNetwork.Mainnet);
        });

        it('should detect testnet from tb1 address', () => {
            const address = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
            expect(detectNetworkFromAddress(address)).toBe(OPNetNetwork.Testnet);
        });

        it('should detect testnet from m address', () => {
            const address = 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn';
            expect(detectNetworkFromAddress(address)).toBe(OPNetNetwork.Testnet);
        });

        it('should detect regtest from bcrt1 address', () => {
            const address = 'bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080';
            expect(detectNetworkFromAddress(address)).toBe(OPNetNetwork.Regtest);
        });

        it('should return null for invalid address', () => {
            const address = 'invalid_address';
            expect(detectNetworkFromAddress(address)).toBeNull();
        });
    });

    describe('validateAddressNetwork', () => {
        it('should validate mainnet address on mainnet', () => {
            const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
            expect(validateAddressNetwork(address, OPNetNetwork.Mainnet)).toBe(true);
        });

        it('should reject mainnet address on testnet', () => {
            const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
            expect(validateAddressNetwork(address, OPNetNetwork.Testnet)).toBe(false);
        });

        it('should validate testnet address on testnet', () => {
            const address = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
            expect(validateAddressNetwork(address, OPNetNetwork.Testnet)).toBe(true);
        });
    });
});
