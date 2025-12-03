import { beforeEach, describe, expect, it } from 'vitest';
import { networks } from '@btc-vision/bitcoin';
import { AddressTypes, MLDSASecurityLevel, MnemonicStrength } from '@btc-vision/transaction';
import { HdKeyring } from '../../src';

describe('HdKeyring', () => {
    const testMnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    describe('constructor', () => {
        it('should create empty keyring', () => {
            const keyring = new HdKeyring({ network: networks.bitcoin });
            expect(keyring.hasMnemonic()).toBe(false);
        });

        it('should create keyring with mnemonic', () => {
            const keyring = new HdKeyring({ mnemonic: testMnemonic, network: networks.bitcoin });
            expect(keyring.hasMnemonic()).toBe(true);
        });

        it('should create keyring with custom options', () => {
            const keyring = new HdKeyring({
                mnemonic: testMnemonic,
                network: networks.testnet,
                securityLevel: MLDSASecurityLevel.LEVEL3,
                passphrase: 'test',
                addressType: AddressTypes.P2WPKH
            });
            expect(keyring.hasMnemonic()).toBe(true);
            expect(keyring.getNetwork()).toBe(networks.testnet);
            expect(keyring.getSecurityLevel()).toBe(MLDSASecurityLevel.LEVEL3);
            expect(keyring.getAddressType()).toBe(AddressTypes.P2WPKH);
        });

        it('should activate indexes on construction', () => {
            const keyring = new HdKeyring({
                mnemonic: testMnemonic,
                activeIndexes: [0, 1, 2],
                network: networks.bitcoin
            });
            expect(keyring.getActiveIndexes()).toHaveLength(3);
        });
    });

    describe('generate', () => {
        it('should generate new mnemonic', () => {
            const keyring = HdKeyring.generate();
            expect(keyring.hasMnemonic()).toBe(true);
            const phrase = keyring.getMnemonic();
            expect(phrase.split(' ').length).toBe(24); // Default is MAXIMUM (24 words)
        });

        it('should generate with custom strength', () => {
            const keyring = HdKeyring.generate(MnemonicStrength.MINIMUM);
            const phrase = keyring.getMnemonic();
            expect(phrase.split(' ').length).toBe(12);
        });

        it('should generate with custom security level', () => {
            const keyring = HdKeyring.generate(
                MnemonicStrength.MAXIMUM,
                '',
                networks.bitcoin,
                MLDSASecurityLevel.LEVEL5
            );
            expect(keyring.getSecurityLevel()).toBe(MLDSASecurityLevel.LEVEL5);
        });
    });

    describe('initFromMnemonic', () => {
        it('should initialize from mnemonic', () => {
            const keyring = new HdKeyring({ network: networks.bitcoin });
            keyring.initFromMnemonic(testMnemonic);
            expect(keyring.hasMnemonic()).toBe(true);
            expect(keyring.getMnemonic()).toBe(testMnemonic);
        });

        it('should throw if already initialized', () => {
            const keyring = new HdKeyring({ mnemonic: testMnemonic, network: networks.bitcoin });
            expect(() => keyring.initFromMnemonic(testMnemonic)).toThrow();
        });
    });

    describe('deriveWallet', () => {
        let keyring: HdKeyring;

        beforeEach(() => {
            keyring = new HdKeyring({ mnemonic: testMnemonic, network: networks.bitcoin });
        });

        it('should derive wallet at index', () => {
            const wallet = keyring.deriveWallet(0);
            expect(wallet).toBeDefined();
            expect(wallet.toPublicKeyHex()).toBeDefined();
            expect(wallet.quantumPublicKeyHex).toBeDefined();
        });

        it('should cache derived wallets', () => {
            const wallet1 = keyring.deriveWallet(0);
            const wallet2 = keyring.deriveWallet(0);
            expect(wallet1).toBe(wallet2);
        });

        it('should derive different wallets at different indexes', () => {
            const wallet0 = keyring.deriveWallet(0);
            const wallet1 = keyring.deriveWallet(1);
            expect(wallet0.toPublicKeyHex()).not.toBe(wallet1.toPublicKeyHex());
        });

        it('should throw if no mnemonic', () => {
            const emptyKeyring = new HdKeyring({ network: networks.bitcoin });
            expect(() => emptyKeyring.deriveWallet(0)).toThrow();
        });
    });

    describe('addAccounts', () => {
        let keyring: HdKeyring;

        beforeEach(() => {
            keyring = new HdKeyring({ mnemonic: testMnemonic, network: networks.bitcoin });
        });

        it('should add accounts', () => {
            const publicKeys = keyring.addAccounts(3);
            expect(publicKeys).toHaveLength(3);
            expect(keyring.getAccounts()).toHaveLength(3);
        });

        it('should not duplicate accounts', () => {
            keyring.addAccounts(2);
            keyring.addAccounts(2);
            expect(keyring.getAccounts()).toHaveLength(4);
        });
    });

    describe('activateAccounts', () => {
        let keyring: HdKeyring;

        beforeEach(() => {
            keyring = new HdKeyring({ mnemonic: testMnemonic, network: networks.bitcoin });
        });

        it('should activate specific indexes', () => {
            const publicKeys = keyring.activateAccounts([0, 5, 10]);
            expect(publicKeys).toHaveLength(3);
            expect(keyring.getActiveIndexes()).toContain(0);
            expect(keyring.getActiveIndexes()).toContain(5);
            expect(keyring.getActiveIndexes()).toContain(10);
        });

        it('should not duplicate activated accounts', () => {
            keyring.activateAccounts([0, 1]);
            keyring.activateAccounts([0, 2]);
            expect(keyring.getActiveIndexes()).toHaveLength(3);
        });
    });

    describe('getAccounts', () => {
        it('should return empty array for new keyring', () => {
            const keyring = new HdKeyring({ mnemonic: testMnemonic, network: networks.bitcoin });
            expect(keyring.getAccounts()).toHaveLength(0);
        });

        it('should return public keys for active accounts', () => {
            const keyring = new HdKeyring({
                mnemonic: testMnemonic,
                activeIndexes: [0, 1],
                network: networks.bitcoin
            });
            const accounts = keyring.getAccounts();
            expect(accounts).toHaveLength(2);
            accounts.forEach((account) => {
                expect(account).toMatch(/^[0-9a-f]{66}$/); // 33 bytes hex
            });
        });
    });

    describe('getAccountsInfo', () => {
        it('should return detailed account info', () => {
            const keyring = new HdKeyring({
                mnemonic: testMnemonic,
                activeIndexes: [0],
                network: networks.bitcoin
            });
            const infos = keyring.getAccountsInfo();
            expect(infos).toHaveLength(1);
            expect(infos[0]?.index).toBe(0);
            expect(infos[0]?.publicKey).toBeDefined();
            expect(infos[0]?.quantumPublicKey).toBeDefined();
            expect(infos[0]?.addresses.p2tr).toMatch(/^bc1p/);
            expect(infos[0]?.addresses.p2wpkh).toMatch(/^bc1q/);
        });
    });

    describe('getQuantumPublicKey', () => {
        it('should return quantum public key for account', () => {
            const keyring = new HdKeyring({
                mnemonic: testMnemonic,
                activeIndexes: [0],
                network: networks.bitcoin
            });
            const publicKey = keyring.getAccounts()[0]!;
            const quantumPubKey = keyring.getQuantumPublicKey(publicKey);
            expect(quantumPubKey).toBeDefined();
            expect(quantumPubKey.length).toBeGreaterThan(100); // ML-DSA public keys are large
        });
    });

    describe('getIndexByPublicKey', () => {
        it('should return index for public key', () => {
            const keyring = new HdKeyring({
                mnemonic: testMnemonic,
                activeIndexes: [0, 5],
                network: networks.bitcoin
            });
            const accounts = keyring.getAccounts();
            expect(keyring.getIndexByPublicKey(accounts[0]!)).toBe(0);
            expect(keyring.getIndexByPublicKey(accounts[1]!)).toBe(5);
        });

        it('should return null for unknown public key', () => {
            const keyring = new HdKeyring({ mnemonic: testMnemonic, network: networks.bitcoin });
            expect(keyring.getIndexByPublicKey('unknown')).toBeNull();
        });
    });

    describe('removeAccount', () => {
        it('should remove account by public key', () => {
            const keyring = new HdKeyring({
                mnemonic: testMnemonic,
                activeIndexes: [0, 1],
                network: networks.bitcoin
            });
            const accounts = keyring.getAccounts();
            keyring.removeAccount(accounts[0]!);
            expect(keyring.getAccounts()).toHaveLength(1);
        });

        it('should throw for unknown public key', () => {
            const keyring = new HdKeyring({ mnemonic: testMnemonic, network: networks.bitcoin });
            expect(() => keyring.removeAccount('unknown')).toThrow();
        });
    });

    describe('exportAccount', () => {
        it('should export private key', () => {
            const keyring = new HdKeyring({
                mnemonic: testMnemonic,
                activeIndexes: [0],
                network: networks.bitcoin
            });
            const publicKey = keyring.getAccounts()[0]!;
            const privateKey = keyring.exportAccount(publicKey);
            expect(privateKey).toMatch(/^[0-9a-f]{64}$/);
        });
    });

    describe('serialize', () => {
        it('should serialize keyring state', () => {
            const keyring = new HdKeyring({
                mnemonic: testMnemonic,
                passphrase: 'test',
                network: networks.testnet,
                activeIndexes: [0, 1]
            });
            const serialized = keyring.serialize();
            expect(serialized.mnemonic).toBe(testMnemonic);
            expect(serialized.passphrase).toBe('test');
            expect(serialized.network).toBe(networks.testnet);
            expect(serialized.activeIndexes).toEqual([0, 1]);
        });
    });

    describe('setAddressType', () => {
        it('should change address type', () => {
            const keyring = new HdKeyring({ mnemonic: testMnemonic, network: networks.bitcoin });
            keyring.setAddressType(AddressTypes.P2WPKH);
            expect(keyring.getAddressType()).toBe(AddressTypes.P2WPKH);
        });
    });

    describe('getAddressesPage', () => {
        it('should return paginated addresses', () => {
            const keyring = new HdKeyring({ mnemonic: testMnemonic, network: networks.bitcoin });
            const page = keyring.getAddressesPage(0, 5);
            expect(page).toHaveLength(5);
            page.forEach((item, i) => {
                expect(item.index).toBe(i);
                expect(item.address).toBeDefined();
            });
        });

        it('should return different pages', () => {
            const keyring = new HdKeyring({ mnemonic: testMnemonic, network: networks.bitcoin });
            const page0 = keyring.getAddressesPage(0, 5);
            const page1 = keyring.getAddressesPage(1, 5);
            expect(page0[0]?.address).not.toBe(page1[0]?.address);
        });
    });

    describe('deterministic derivation', () => {
        it('should derive same keys from same mnemonic', () => {
            const keyring1 = new HdKeyring({
                mnemonic: testMnemonic,
                activeIndexes: [0],
                network: networks.bitcoin
            });
            const keyring2 = new HdKeyring({
                mnemonic: testMnemonic,
                activeIndexes: [0],
                network: networks.bitcoin
            });
            expect(keyring1.getAccounts()[0]).toBe(keyring2.getAccounts()[0]);
        });

        it('should derive different keys with different passphrase', () => {
            const keyring1 = new HdKeyring({
                mnemonic: testMnemonic,
                passphrase: '',
                activeIndexes: [0],
                network: networks.bitcoin
            });
            const keyring2 = new HdKeyring({
                mnemonic: testMnemonic,
                passphrase: 'different',
                activeIndexes: [0],
                network: networks.bitcoin
            });
            expect(keyring1.getAccounts()[0]).not.toBe(keyring2.getAccounts()[0]);
        });
    });
});
