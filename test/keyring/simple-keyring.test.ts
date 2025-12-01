import { describe, expect, it } from 'vitest';
import { networks } from '@btc-vision/bitcoin';
import { AddressTypes, MLDSASecurityLevel } from '@btc-vision/transaction';
import { SimpleKeyring } from '../../src';

describe('SimpleKeyring', () => {
    describe('generate', () => {
        it('should generate random keyring', () => {
            const keyring = SimpleKeyring.generate();
            expect(keyring.hasKeys()).toBe(true);
            expect(keyring.getPublicKey()).toBeDefined();
            expect(keyring.getQuantumPublicKey()).toBeDefined();
        });

        it('should generate with custom network', () => {
            const keyring = SimpleKeyring.generate(networks.testnet);
            expect(keyring.getNetwork()).toBe(networks.testnet);
        });

        it('should generate with custom security level', () => {
            const keyring = SimpleKeyring.generate(networks.bitcoin, MLDSASecurityLevel.LEVEL5);
            expect(keyring.getSecurityLevel()).toBe(MLDSASecurityLevel.LEVEL5);
        });
    });

    describe('fromWIF', () => {
        it('should import from WIF with quantum key generation', () => {
            // Generate a keyring to get a valid WIF
            const original = SimpleKeyring.generate();
            const wif = original.exportWIF();

            const imported = SimpleKeyring.fromWIF(wif, undefined, networks.bitcoin);
            expect(imported.hasKeys()).toBe(true);
            expect(imported.getPublicKey()).toBe(original.getPublicKey());
            // Quantum keys should be different (newly generated)
            expect(imported.getQuantumPublicKey()).not.toBe(original.getQuantumPublicKey());
        });

        it('should import from WIF with existing quantum key', () => {
            const original = SimpleKeyring.generate();
            const wif = original.exportWIF();
            const quantumKey = original.exportQuantumPrivateKey();

            const imported = SimpleKeyring.fromWIF(wif, quantumKey, networks.bitcoin);
            expect(imported.getPublicKey()).toBe(original.getPublicKey());
        });
    });

    describe('fromPrivateKey', () => {
        it('should import from hex private key', () => {
            const original = SimpleKeyring.generate();
            const privateKey = original.exportPrivateKey();

            const imported = SimpleKeyring.fromPrivateKey(privateKey, undefined, networks.bitcoin);
            expect(imported.getPublicKey()).toBe(original.getPublicKey());
        });

        it('should import with quantum key', () => {
            const original = SimpleKeyring.generate();
            const privateKey = original.exportPrivateKey();
            const quantumKey = original.exportQuantumPrivateKey();

            const imported = SimpleKeyring.fromPrivateKey(privateKey, quantumKey, networks.bitcoin);
            expect(imported.hasKeys()).toBe(true);
        });
    });

    describe('getPublicKey', () => {
        it('should return compressed public key', () => {
            const keyring = SimpleKeyring.generate();
            const publicKey = keyring.getPublicKey();
            expect(publicKey).toMatch(/^[0-9a-f]{66}$/); // 33 bytes hex
            expect(publicKey.startsWith('02') || publicKey.startsWith('03')).toBe(true);
        });
    });

    describe('getQuantumPublicKey', () => {
        it('should return ML-DSA public key', () => {
            const keyring = SimpleKeyring.generate();
            const quantumPubKey = keyring.getQuantumPublicKey();
            expect(quantumPubKey.length).toBeGreaterThan(100);
        });
    });

    describe('getAccounts', () => {
        it('should return array with single public key', () => {
            const keyring = SimpleKeyring.generate();
            const accounts = keyring.getAccounts();
            expect(accounts).toHaveLength(1);
            expect(accounts[0]).toBe(keyring.getPublicKey());
        });

        it('should return empty array for uninitialized keyring', () => {
            const keyring = new SimpleKeyring();
            expect(keyring.getAccounts()).toHaveLength(0);
        });
    });

    describe('getAddresses', () => {
        it('should return all address types', () => {
            const keyring = SimpleKeyring.generate();
            const addresses = keyring.getAddresses();
            expect(addresses.p2pkh).toMatch(/^1/);
            expect(addresses.p2wpkh).toMatch(/^bc1q/);
            expect(addresses.p2tr).toMatch(/^bc1p/);
            expect(addresses.p2shP2wpkh).toMatch(/^3/);
        });
    });

    describe('getAddress', () => {
        it('should return specific address type', () => {
            const keyring = SimpleKeyring.generate();
            expect(keyring.getAddress(AddressTypes.P2TR)).toMatch(/^bc1p/);
            expect(keyring.getAddress(AddressTypes.P2WPKH)).toMatch(/^bc1q/);
            expect(keyring.getAddress(AddressTypes.P2PKH)).toMatch(/^1/);
        });
    });

    describe('exportPrivateKey', () => {
        it('should export private key as hex', () => {
            const keyring = SimpleKeyring.generate();
            const privateKey = keyring.exportPrivateKey();
            expect(privateKey).toMatch(/^[0-9a-f]{64}$/);
        });
    });

    describe('exportQuantumPrivateKey', () => {
        it('should export quantum private key with chain code', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKey = keyring.exportQuantumPrivateKey();
            expect(quantumKey.length).toBeGreaterThan(64);
        });
    });

    describe('exportWIF', () => {
        it('should export WIF', () => {
            const keyring = SimpleKeyring.generate();
            const wif = keyring.exportWIF();
            expect(wif.startsWith('K') || wif.startsWith('L')).toBe(true);
        });
    });

    describe('signData', () => {
        it('should sign with ECDSA', () => {
            const keyring = SimpleKeyring.generate();
            const data = 'deadbeef'.repeat(8);
            const signature = keyring.signData(data, 'ecdsa');
            expect(signature).toBeDefined();
        });

        it('should sign with Schnorr', () => {
            const keyring = SimpleKeyring.generate();
            const data = 'deadbeef'.repeat(8);
            const signature = keyring.signData(data, 'schnorr');
            expect(signature).toBeDefined();
        });
    });

    describe('verify', () => {
        it('should verify ECDSA signature', () => {
            const keyring = SimpleKeyring.generate();
            const data = 'deadbeef'.repeat(8);
            const signature = keyring.signData(data, 'ecdsa');
            expect(keyring.verify(data, signature, 'ecdsa')).toBe(true);
        });

        it('should verify Schnorr signature', () => {
            const keyring = SimpleKeyring.generate();
            const data = 'deadbeef'.repeat(8);
            const signature = keyring.signData(data, 'schnorr');
            expect(keyring.verify(data, signature, 'schnorr')).toBe(true);
        });

        it('should reject invalid signature', () => {
            const keyring = SimpleKeyring.generate();
            const data = 'deadbeef'.repeat(8);
            const signature = keyring.signData(data, 'ecdsa');
            const wrongData = 'cafebabe'.repeat(8);
            expect(keyring.verify(wrongData, signature, 'ecdsa')).toBe(false);
        });
    });

    describe('getKeypair', () => {
        it('should return EC keypair', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();
            expect(keypair.publicKey).toBeDefined();
            expect(keypair.privateKey).toBeDefined();
        });
    });

    describe('getQuantumKeypair', () => {
        it('should return quantum keypair', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getQuantumKeypair();
            expect(keypair.publicKey).toBeDefined();
            expect(keypair.securityLevel).toBeDefined();
        });
    });

    describe('getChainCode', () => {
        it('should return 32-byte chain code', () => {
            const keyring = SimpleKeyring.generate();
            const chainCode = keyring.getChainCode();
            expect(chainCode).toBeInstanceOf(Buffer);
            expect(chainCode.length).toBe(32);
        });
    });

    describe('serialize', () => {
        it('should serialize keyring state', () => {
            const keyring = SimpleKeyring.generate();
            const serialized = keyring.serialize();
            expect(serialized.privateKey).toBeDefined();
            expect(serialized.quantumPrivateKey).toBeDefined();
            expect(serialized.network).toBe(networks.bitcoin);
            expect(serialized.securityLevel).toBe(MLDSASecurityLevel.LEVEL2);
        });
    });

    describe('clear', () => {
        it('should clear all keys', () => {
            const keyring = SimpleKeyring.generate();
            keyring.clear();
            expect(keyring.hasKeys()).toBe(false);
        });
    });

    describe('error handling', () => {
        it('should throw when getting public key without initialization', () => {
            const keyring = new SimpleKeyring();
            expect(() => keyring.getPublicKey()).toThrow();
        });

        it('should throw when getting quantum public key without initialization', () => {
            const keyring = new SimpleKeyring();
            expect(() => keyring.getQuantumPublicKey()).toThrow();
        });

        it('should throw when exporting without initialization', () => {
            const keyring = new SimpleKeyring();
            expect(() => keyring.exportPrivateKey()).toThrow();
        });
    });
});
