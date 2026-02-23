import { describe, expect, it } from 'vitest';
import { networks } from '@btc-vision/bitcoin';
import { detectNetworkFromAddress, getBech32Prefix, toNetwork, toNetworkType, validateAddressNetwork } from '../../src';
import { WalletNetworks } from '@btc-vision/transaction';

describe('Network Module', () => {
    describe('toNetwork', () => {
        it('should convert MAINNET to bitcoin network', () => {
            const network = toNetwork(WalletNetworks.Mainnet);
            expect(network.bech32).toBe('bc');
            expect(network).toBe(networks.bitcoin);
        });

        it('should convert TESTNET to testnet network', () => {
            const network = toNetwork(WalletNetworks.Testnet);
            expect(network.bech32).toBe('tb');
            expect(network).toBe(networks.testnet);
        });

        it('should convert REGTEST to regtest network', () => {
            const network = toNetwork(WalletNetworks.Regtest);
            expect(network.bech32).toBe('bcrt');
            expect(network).toBe(networks.regtest);
        });

        it('should convert OpnetTestnet to opnetTestnet network', () => {
            const network = toNetwork(WalletNetworks.OpnetTestnet);
            expect(network.bech32).toBe('opt');
            expect(network).toBe(networks.opnetTestnet);
        });

        it('should throw for unsupported network type', () => {
            expect(() => toNetwork('invalid' as WalletNetworks)).toThrow('Unsupported network type');
        });
    });

    describe('toNetworkType', () => {
        it('should convert bitcoin network to MAINNET', () => {
            const networkType = toNetworkType(networks.bitcoin);
            expect(networkType).toBe(WalletNetworks.Mainnet);
        });

        it('should convert testnet network to TESTNET', () => {
            const networkType = toNetworkType(networks.testnet);
            expect(networkType).toBe(WalletNetworks.Testnet);
        });

        it('should convert regtest network to REGTEST', () => {
            const networkType = toNetworkType(networks.regtest);
            expect(networkType).toBe(WalletNetworks.Regtest);
        });

        it('should convert opnetTestnet network to OpnetTestnet', () => {
            const networkType = toNetworkType(networks.opnetTestnet);
            expect(networkType).toBe(WalletNetworks.OpnetTestnet);
        });
    });

    describe('getBech32Prefix', () => {
        it('should return bc for mainnet', () => {
            expect(getBech32Prefix(WalletNetworks.Mainnet)).toBe('bc');
        });

        it('should return tb for testnet', () => {
            expect(getBech32Prefix(WalletNetworks.Testnet)).toBe('tb');
        });

        it('should return bcrt for regtest', () => {
            expect(getBech32Prefix(WalletNetworks.Regtest)).toBe('bcrt');
        });

        it('should return opt for opnetTestnet', () => {
            expect(getBech32Prefix(WalletNetworks.OpnetTestnet)).toBe('opt');
        });
    });

    describe('detectNetworkFromAddress', () => {
        it('should detect mainnet from bc1 address', () => {
            const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
            expect(detectNetworkFromAddress(address)).toBe(WalletNetworks.Mainnet);
        });

        it('should detect mainnet from 1 address', () => {
            const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
            expect(detectNetworkFromAddress(address)).toBe(WalletNetworks.Mainnet);
        });

        it('should detect mainnet from 3 address', () => {
            const address = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
            expect(detectNetworkFromAddress(address)).toBe(WalletNetworks.Mainnet);
        });

        it('should detect testnet from tb1 address', () => {
            const address = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
            expect(detectNetworkFromAddress(address)).toBe(WalletNetworks.Testnet);
        });

        it('should detect testnet from m address', () => {
            const address = 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn';
            expect(detectNetworkFromAddress(address)).toBe(WalletNetworks.Testnet);
        });

        it('should detect regtest from bcrt1 address', () => {
            const address = 'bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080';
            expect(detectNetworkFromAddress(address)).toBe(WalletNetworks.Regtest);
        });

        it('should detect opnetTestnet from opt1 address', () => {
            const address = 'opt1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
            expect(detectNetworkFromAddress(address)).toBe(WalletNetworks.OpnetTestnet);
        });

        it('should detect testnet from n address', () => {
            const address = 'n1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
            expect(detectNetworkFromAddress(address)).toBe(WalletNetworks.Testnet);
        });

        it('should detect testnet from 2 address', () => {
            const address = '2J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy';
            expect(detectNetworkFromAddress(address)).toBe(WalletNetworks.Testnet);
        });

        it('should return null for invalid address', () => {
            const address = 'invalid_address';
            expect(detectNetworkFromAddress(address)).toBeNull();
        });
    });

    describe('validateAddressNetwork', () => {
        it('should validate mainnet address on mainnet', () => {
            const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
            expect(validateAddressNetwork(address, WalletNetworks.Mainnet)).toBe(true);
        });

        it('should reject mainnet address on testnet', () => {
            const address = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
            expect(validateAddressNetwork(address, WalletNetworks.Testnet)).toBe(false);
        });

        it('should validate testnet address on testnet', () => {
            const address = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
            expect(validateAddressNetwork(address, WalletNetworks.Testnet)).toBe(true);
        });

        it('should validate opt1 address on opnetTestnet', () => {
            const address = 'opt1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
            expect(validateAddressNetwork(address, WalletNetworks.OpnetTestnet)).toBe(true);
        });

        it('should reject opt1 address on mainnet', () => {
            const address = 'opt1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
            expect(validateAddressNetwork(address, WalletNetworks.Mainnet)).toBe(false);
        });
    });
});
