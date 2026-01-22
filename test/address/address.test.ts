import { describe, expect, it } from 'vitest';
import { networks } from '@btc-vision/bitcoin';
import { AddressTypes, WalletNetworks } from '@btc-vision/transaction';
import {
    addressToScriptPubKey,
    decodeAddress,
    detectAddressType,
    isP2PKHOrP2SHAddress,
    isP2WPKHAddress,
    isValidAddress,
    isValidP2TRAddress,
    isValidPublicKey,
    publicKeyToAddress,
    publicKeyToPayment,
    publicKeyToScriptPubKey,
    scriptPubKeyToAddress
} from '../../src';

describe('Address Module', () => {
    // Test public key (compressed format)
    const testPublicKey = '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798';
    const testPublicKeyBuffer = Buffer.from(testPublicKey, 'hex');

    describe('publicKeyToAddress', () => {
        it('should generate P2PKH address', () => {
            const address = publicKeyToAddress(testPublicKeyBuffer, AddressTypes.P2PKH, networks.bitcoin);
            expect(address).toMatch(/^1/);
        });

        it('should generate P2WPKH address', () => {
            const address = publicKeyToAddress(testPublicKeyBuffer, AddressTypes.P2WPKH, networks.bitcoin);
            expect(address).toMatch(/^bc1q/);
        });

        it('should generate P2TR address', () => {
            const address = publicKeyToAddress(testPublicKeyBuffer, AddressTypes.P2TR, networks.bitcoin);
            expect(address).toMatch(/^bc1p/);
        });

        it('should generate P2SH-P2WPKH address', () => {
            const address = publicKeyToAddress(testPublicKeyBuffer, AddressTypes.P2SH_OR_P2SH_P2WPKH, networks.bitcoin);
            expect(address).toMatch(/^3/);
        });

        it('should generate testnet addresses', () => {
            const p2wpkh = publicKeyToAddress(testPublicKeyBuffer, AddressTypes.P2WPKH, networks.testnet);
            expect(p2wpkh).toMatch(/^tb1q/);

            const p2tr = publicKeyToAddress(testPublicKeyBuffer, AddressTypes.P2TR, networks.testnet);
            expect(p2tr).toMatch(/^tb1p/);
        });

        it('should accept hex string public key', () => {
            const address = publicKeyToAddress(testPublicKey, AddressTypes.P2WPKH, networks.bitcoin);
            expect(address).toMatch(/^bc1q/);
        });

        it('should throw for unsupported address type', () => {
            expect(() =>
                publicKeyToAddress(testPublicKeyBuffer, 'INVALID' as AddressTypes, networks.bitcoin)
            ).toThrow();
        });
    });

    describe('publicKeyToPayment', () => {
        it('should generate P2PKH payment', () => {
            const payment = publicKeyToPayment(testPublicKeyBuffer, AddressTypes.P2PKH, networks.bitcoin);
            expect(payment.address).toMatch(/^1/);
            expect(payment.output).toBeDefined();
        });

        it('should generate P2WPKH payment', () => {
            const payment = publicKeyToPayment(testPublicKeyBuffer, AddressTypes.P2WPKH, networks.bitcoin);
            expect(payment.address).toMatch(/^bc1q/);
            expect(payment.output).toBeDefined();
        });

        it('should generate P2TR payment', () => {
            const payment = publicKeyToPayment(testPublicKeyBuffer, AddressTypes.P2TR, networks.bitcoin);
            expect(payment.address).toMatch(/^bc1p/);
            expect(payment.output).toBeDefined();
        });
    });

    describe('publicKeyToScriptPubKey', () => {
        it('should generate valid scriptPubKey for P2WPKH', () => {
            const scriptPk = publicKeyToScriptPubKey(testPublicKeyBuffer, AddressTypes.P2WPKH, networks.bitcoin);
            expect(scriptPk).toBeInstanceOf(Buffer);
            expect(scriptPk.length).toBe(22); // P2WPKH scriptPubKey is 22 bytes
        });

        it('should generate valid scriptPubKey for P2TR', () => {
            const scriptPk = publicKeyToScriptPubKey(testPublicKeyBuffer, AddressTypes.P2TR, networks.bitcoin);
            expect(scriptPk).toBeInstanceOf(Buffer);
            expect(scriptPk.length).toBe(34); // P2TR scriptPubKey is 34 bytes
        });
    });

    describe('addressToScriptPubKey', () => {
        it('should convert P2WPKH address to scriptPubKey', () => {
            const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
            const scriptPk = addressToScriptPubKey(address, networks.bitcoin);
            expect(scriptPk).toBeInstanceOf(Buffer);
        });

        it('should convert P2TR address to scriptPubKey', () => {
            const address = 'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0';
            const scriptPk = addressToScriptPubKey(address, networks.bitcoin);
            expect(scriptPk).toBeInstanceOf(Buffer);
        });
    });

    describe('scriptPubKeyToAddress', () => {
        it('should convert P2WPKH scriptPubKey to address', () => {
            const scriptPk = Buffer.from('0014751e76e8199196d454941c45d1b3a323f1433bd6', 'hex');
            const address = scriptPubKeyToAddress(scriptPk, networks.bitcoin);
            expect(address).toMatch(/^bc1q/);
        });

        it('should accept hex string scriptPubKey', () => {
            const scriptPkHex = '0014751e76e8199196d454941c45d1b3a323f1433bd6';
            const address = scriptPubKeyToAddress(scriptPkHex, networks.bitcoin);
            expect(address).toMatch(/^bc1q/);
        });
    });

    describe('isValidAddress', () => {
        it('should validate P2WPKH mainnet address', () => {
            const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
            expect(isValidAddress(address, networks.bitcoin)).toBe(true);
        });

        it('should validate P2TR mainnet address', () => {
            const address = 'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0';
            expect(isValidAddress(address, networks.bitcoin)).toBe(true);
        });

        it('should reject invalid address', () => {
            const address = 'invalid_address';
            expect(isValidAddress(address, networks.bitcoin)).toBe(false);
        });

        it('should reject mainnet address on testnet', () => {
            const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
            expect(isValidAddress(address, networks.testnet)).toBe(false);
        });
    });

    describe('detectAddressType', () => {
        it('should detect P2WPKH address', () => {
            const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
            const type = detectAddressType(address, networks.bitcoin);
            expect(type).toBe(AddressTypes.P2WPKH);
        });

        it('should detect P2TR address', () => {
            const address = 'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0';
            const type = detectAddressType(address, networks.bitcoin);
            expect(type).toBe(AddressTypes.P2TR);
        });

        it('should return null for invalid address', () => {
            const address = 'invalid_address';
            const type = detectAddressType(address, networks.bitcoin);
            expect(type).toBeNull();
        });
    });

    describe('decodeAddress', () => {
        it('should decode mainnet P2WPKH address', () => {
            const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
            const decoded = decodeAddress(address);
            expect(decoded).not.toBeNull();
            expect(decoded?.networkType).toBe(WalletNetworks.Mainnet);
            expect(decoded?.addressType).toBe(AddressTypes.P2WPKH);
        });

        it('should decode testnet P2WPKH address', () => {
            const address = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
            const decoded = decodeAddress(address);
            expect(decoded).not.toBeNull();
            expect(decoded?.networkType).toBe(WalletNetworks.Testnet);
        });

        it('should return null for invalid address', () => {
            const address = 'invalid_address';
            const decoded = decodeAddress(address);
            expect(decoded).toBeNull();
        });
    });

    describe('isValidPublicKey', () => {
        it('should validate compressed public key', () => {
            const isValid = isValidPublicKey(testPublicKeyBuffer, networks.bitcoin);
            expect(isValid).toBe(true);
        });

        it('should validate hex string public key', () => {
            const isValid = isValidPublicKey(testPublicKey, networks.bitcoin);
            expect(isValid).toBe(true);
        });
    });

    describe('isValidP2TRAddress', () => {
        it('should return true for valid P2TR address', () => {
            const address = 'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0';
            expect(isValidP2TRAddress(address, networks.bitcoin)).toBe(true);
        });

        it('should return false for P2WPKH address', () => {
            const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
            expect(isValidP2TRAddress(address, networks.bitcoin)).toBe(false);
        });
    });

    describe('isP2WPKHAddress', () => {
        it('should return true for P2WPKH address', () => {
            const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
            expect(isP2WPKHAddress(address, networks.bitcoin)).toBe(true);
        });

        it('should return false for P2TR address', () => {
            const address = 'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0';
            expect(isP2WPKHAddress(address, networks.bitcoin)).toBe(false);
        });
    });

    describe('isP2PKHOrP2SHAddress', () => {
        it('should return true for P2PKH address', () => {
            const address = '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2';
            expect(isP2PKHOrP2SHAddress(address, networks.bitcoin)).toBe(true);
        });

        it('should return false for P2WPKH address', () => {
            const address = 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4';
            expect(isP2PKHOrP2SHAddress(address, networks.bitcoin)).toBe(false);
        });
    });
});
