import { describe, expect, it } from 'vitest';
import { networks } from '@btc-vision/bitcoin';
import { MLDSASecurityLevel } from '@btc-vision/transaction';
import {
    deserializeExport,
    exportWallet,
    exportWalletToString,
    importWallet,
    importWalletFromString,
    serializeExport,
    SimpleKeyring,
    validateExport
} from '../../src';

describe('Key Export Module', () => {
    describe('exportWallet', () => {
        it('should export wallet keys', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();
            const quantumKeypair = keyring.getQuantumKeypair();

            const exported = exportWallet(
                keypair.privateKey!,
                keypair.publicKey,
                quantumKeypair.privateKey!,
                quantumKeypair.publicKey,
                keyring.getChainCode(),
                keyring.getSecurityLevel(),
                keyring.getNetwork()
            );

            expect(exported.magic).toBe('OPNET_WALLET_V1');
            expect(exported.version).toBe(1);
            expect(exported.network).toBe('mainnet');
            expect(exported.classical.privateKey).toBeDefined();
            expect(exported.classical.publicKey).toBeDefined();
            expect(exported.quantum.privateKey).toBeDefined();
            expect(exported.quantum.publicKey).toBeDefined();
            expect(exported.quantum.securityLevel).toBe(MLDSASecurityLevel.LEVEL2);
            expect(exported.checksum).toBeDefined();
        });
    });

    describe('importWallet', () => {
        it('should import wallet from export data', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();
            const quantumKeypair = keyring.getQuantumKeypair();

            const exported = exportWallet(
                keypair.privateKey!,
                keypair.publicKey,
                quantumKeypair.privateKey!,
                quantumKeypair.publicKey,
                keyring.getChainCode(),
                keyring.getSecurityLevel(),
                keyring.getNetwork()
            );

            const imported = importWallet(exported);
            expect(imported.keypair.publicKey.toString('hex')).toBe(keypair.publicKey.toString('hex'));
            expect(imported.network).toBe(networks.bitcoin);
            expect(imported.securityLevel).toBe(MLDSASecurityLevel.LEVEL2);
        });

        it('should throw for invalid magic header', () => {
            const invalidExport = {
                magic: 'INVALID',
                version: 1,
                network: 'mainnet',
                classical: { privateKey: '', publicKey: '' },
                quantum: {
                    privateKey: '',
                    publicKey: '',
                    securityLevel: MLDSASecurityLevel.LEVEL2,
                    chainCode: ''
                },
                checksum: ''
            };
            expect(() => importWallet(invalidExport)).toThrow('wrong magic header');
        });

        it('should throw for unsupported version', () => {
            const invalidExport = {
                magic: 'OPNET_WALLET_V1',
                version: 999,
                network: 'mainnet',
                classical: { privateKey: '', publicKey: '' },
                quantum: {
                    privateKey: '',
                    publicKey: '',
                    securityLevel: MLDSASecurityLevel.LEVEL2,
                    chainCode: ''
                },
                checksum: ''
            };
            expect(() => importWallet(invalidExport)).toThrow('Unsupported wallet export version');
        });
    });

    describe('serializeExport / deserializeExport', () => {
        it('should serialize and deserialize export data', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();
            const quantumKeypair = keyring.getQuantumKeypair();

            const exported = exportWallet(
                keypair.privateKey!,
                keypair.publicKey,
                quantumKeypair.privateKey!,
                quantumKeypair.publicKey,
                keyring.getChainCode(),
                keyring.getSecurityLevel(),
                keyring.getNetwork()
            );

            const serialized = serializeExport(exported);
            expect(typeof serialized).toBe('string');

            const deserialized = deserializeExport(serialized);
            expect(deserialized.magic).toBe(exported.magic);
            expect(deserialized.version).toBe(exported.version);
            expect(deserialized.checksum).toBe(exported.checksum);
        });

        it('should throw for invalid serialized data', () => {
            expect(() => deserializeExport('invalid_base64')).toThrow();
        });
    });

    describe('exportWalletToString / importWalletFromString', () => {
        it('should export and import as string', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();
            const quantumKeypair = keyring.getQuantumKeypair();

            const exportedString = exportWalletToString(
                keypair.privateKey!,
                keypair.publicKey,
                quantumKeypair.privateKey!,
                quantumKeypair.publicKey,
                keyring.getChainCode(),
                keyring.getSecurityLevel(),
                keyring.getNetwork()
            );

            expect(typeof exportedString).toBe('string');

            const imported = importWalletFromString(exportedString);
            expect(imported.keypair.publicKey.toString('hex')).toBe(keypair.publicKey.toString('hex'));
        });
    });

    describe('validateExport', () => {
        it('should validate correct export data', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();
            const quantumKeypair = keyring.getQuantumKeypair();

            const exported = exportWallet(
                keypair.privateKey!,
                keypair.publicKey,
                quantumKeypair.privateKey!,
                quantumKeypair.publicKey,
                keyring.getChainCode(),
                keyring.getSecurityLevel(),
                keyring.getNetwork()
            );

            expect(validateExport(exported)).toBe(true);
        });

        it('should reject invalid magic header', () => {
            const invalidExport = {
                magic: 'INVALID',
                version: 1,
                network: 'mainnet',
                classical: { privateKey: '', publicKey: '' },
                quantum: {
                    privateKey: '',
                    publicKey: '',
                    securityLevel: MLDSASecurityLevel.LEVEL2,
                    chainCode: ''
                },
                checksum: ''
            };
            expect(validateExport(invalidExport)).toBe(false);
        });

        it('should reject invalid checksum', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();
            const quantumKeypair = keyring.getQuantumKeypair();

            const exported = exportWallet(
                keypair.privateKey!,
                keypair.publicKey,
                quantumKeypair.privateKey!,
                quantumKeypair.publicKey,
                keyring.getChainCode(),
                keyring.getSecurityLevel(),
                keyring.getNetwork()
            );

            const tamperedExport = { ...exported, checksum: 'invalid' };
            expect(validateExport(tamperedExport)).toBe(false);
        });
    });

    describe('network support', () => {
        it('should export and import testnet wallet', () => {
            const keyring = SimpleKeyring.generate(networks.testnet);
            const keypair = keyring.getKeypair();
            const quantumKeypair = keyring.getQuantumKeypair();

            const exportedString = exportWalletToString(
                keypair.privateKey!,
                keypair.publicKey,
                quantumKeypair.privateKey!,
                quantumKeypair.publicKey,
                keyring.getChainCode(),
                keyring.getSecurityLevel(),
                keyring.getNetwork()
            );

            const imported = importWalletFromString(exportedString);
            expect(imported.network).toBe(networks.testnet);
        });

        it('should export and import regtest wallet', () => {
            const keyring = SimpleKeyring.generate(networks.regtest);
            const keypair = keyring.getKeypair();
            const quantumKeypair = keyring.getQuantumKeypair();

            const exportedString = exportWalletToString(
                keypair.privateKey!,
                keypair.publicKey,
                quantumKeypair.privateKey!,
                quantumKeypair.publicKey,
                keyring.getChainCode(),
                keyring.getSecurityLevel(),
                keyring.getNetwork()
            );

            const imported = importWalletFromString(exportedString);
            expect(imported.network).toBe(networks.regtest);
        });
    });

    describe('security level support', () => {
        it('should preserve LEVEL3 security', () => {
            const keyring = SimpleKeyring.generate(networks.bitcoin, MLDSASecurityLevel.LEVEL3);
            const keypair = keyring.getKeypair();
            const quantumKeypair = keyring.getQuantumKeypair();

            const exportedString = exportWalletToString(
                keypair.privateKey!,
                keypair.publicKey,
                quantumKeypair.privateKey!,
                quantumKeypair.publicKey,
                keyring.getChainCode(),
                keyring.getSecurityLevel(),
                keyring.getNetwork()
            );

            const imported = importWalletFromString(exportedString);
            expect(imported.securityLevel).toBe(MLDSASecurityLevel.LEVEL3);
        });

        it('should preserve LEVEL5 security', () => {
            const keyring = SimpleKeyring.generate(networks.bitcoin, MLDSASecurityLevel.LEVEL5);
            const keypair = keyring.getKeypair();
            const quantumKeypair = keyring.getQuantumKeypair();

            const exportedString = exportWalletToString(
                keypair.privateKey!,
                keypair.publicKey,
                quantumKeypair.privateKey!,
                quantumKeypair.publicKey,
                keyring.getChainCode(),
                keyring.getSecurityLevel(),
                keyring.getNetwork()
            );

            const imported = importWalletFromString(exportedString);
            expect(imported.securityLevel).toBe(MLDSASecurityLevel.LEVEL5);
        });
    });
});
