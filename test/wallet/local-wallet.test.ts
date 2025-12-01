import { describe, expect, it } from 'vitest';
import { networks, Psbt } from '@btc-vision/bitcoin';
import { AddressTypes } from '@btc-vision/transaction';
import { LocalWallet, SimpleKeyring } from '../../src';

describe('LocalWallet', () => {
    const testMnemonic =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    describe('fromWIF', () => {
        it('should create wallet from WIF', () => {
            const keyring = SimpleKeyring.generate();
            const wif = keyring.exportWIF();

            const wallet = LocalWallet.fromWIF(wif, AddressTypes.P2TR, networks.bitcoin);

            expect(wallet.getPublicKey()).toBe(keyring.getPublicKey());
            expect(wallet.getAddress()).toMatch(/^bc1p/);
        });

        it('should create wallet with P2WPKH address type', () => {
            const keyring = SimpleKeyring.generate();
            const wif = keyring.exportWIF();

            const wallet = LocalWallet.fromWIF(wif, AddressTypes.P2WPKH, networks.bitcoin);

            expect(wallet.getAddress()).toMatch(/^bc1q/);
        });

        it('should create wallet with quantum key', () => {
            const keyring = SimpleKeyring.generate();
            const wif = keyring.exportWIF();
            const quantumKey = keyring.exportQuantumPrivateKey();

            const wallet = LocalWallet.fromWIF(wif, AddressTypes.P2TR, networks.bitcoin, quantumKey);

            expect(wallet.getQuantumPublicKey()).toBeDefined();
        });
    });

    describe('fromPrivateKey', () => {
        it('should create wallet from private key hex', () => {
            const keyring = SimpleKeyring.generate();
            const privateKey = keyring.exportPrivateKey();

            const wallet = LocalWallet.fromPrivateKey(privateKey, AddressTypes.P2TR, networks.bitcoin);

            expect(wallet.getPublicKey()).toBe(keyring.getPublicKey());
        });
    });

    describe('fromMnemonic', () => {
        it('should create wallet from mnemonic', () => {
            const wallet = LocalWallet.fromMnemonic(testMnemonic, AddressTypes.P2TR, networks.bitcoin);

            expect(wallet.getAddress()).toMatch(/^bc1p/);
            expect(wallet.getPublicKey()).toBeDefined();
        });

        it('should create wallet with passphrase', () => {
            const wallet1 = LocalWallet.fromMnemonic(testMnemonic, AddressTypes.P2TR, networks.bitcoin);
            const wallet2 = LocalWallet.fromMnemonic(testMnemonic, AddressTypes.P2TR, networks.bitcoin, 'passphrase');

            expect(wallet1.getPublicKey()).not.toBe(wallet2.getPublicKey());
        });

        it('should create wallet at specific account index', () => {
            const wallet0 = LocalWallet.fromMnemonic(testMnemonic, AddressTypes.P2TR, networks.bitcoin, '', 0);
            const wallet1 = LocalWallet.fromMnemonic(testMnemonic, AddressTypes.P2TR, networks.bitcoin, '', 1);

            expect(wallet0.getPublicKey()).not.toBe(wallet1.getPublicKey());
        });
    });

    describe('random', () => {
        it('should create random wallet', () => {
            const wallet = LocalWallet.random(AddressTypes.P2TR, networks.bitcoin);

            expect(wallet.getAddress()).toMatch(/^bc1p/);
            expect(wallet.getPublicKey()).toBeDefined();
            expect(wallet.getQuantumPublicKey()).toBeDefined();
        });

        it('should create unique wallets', () => {
            const wallet1 = LocalWallet.random();
            const wallet2 = LocalWallet.random();

            expect(wallet1.getPublicKey()).not.toBe(wallet2.getPublicKey());
        });
    });

    describe('getters', () => {
        it('should return address', () => {
            const wallet = LocalWallet.random(AddressTypes.P2TR, networks.bitcoin);
            expect(wallet.getAddress()).toMatch(/^bc1p/);
        });

        it('should return public key', () => {
            const wallet = LocalWallet.random();
            expect(wallet.getPublicKey()).toMatch(/^[0-9a-f]{66}$/);
        });

        it('should return quantum public key', () => {
            const wallet = LocalWallet.random();
            expect(wallet.getQuantumPublicKey().length).toBeGreaterThan(100);
        });

        it('should return network', () => {
            const wallet = LocalWallet.random(AddressTypes.P2TR, networks.testnet);
            expect(wallet.getNetwork()).toBe(networks.testnet);
        });

        it('should return address type', () => {
            const wallet = LocalWallet.random(AddressTypes.P2WPKH, networks.bitcoin);
            expect(wallet.getAddressType()).toBe(AddressTypes.P2WPKH);
        });
    });

    describe('signMessage', () => {
        it('should sign message with BIP322', async () => {
            const wallet = LocalWallet.random(AddressTypes.P2WPKH, networks.bitcoin);
            const message = 'Test message';

            const signature = await wallet.signMessage(message, 'bip322-simple');

            expect(typeof signature).toBe('string');
            expect(signature.length).toBeGreaterThan(0);
        });

        it('should sign message with Schnorr', async () => {
            const wallet = LocalWallet.random();
            const message = 'Test message';

            const signature = await wallet.signMessage(message, 'schnorr');

            expect(typeof signature).toBe('string');
        });

        it('should sign message with ECDSA', async () => {
            const wallet = LocalWallet.random();
            const message = 'Test message';

            const signature = await wallet.signMessage(message, 'ecdsa');

            expect(typeof signature).toBe('string');
        });

        it('should sign message with ML-DSA', async () => {
            const wallet = LocalWallet.random();
            const message = 'Test message';

            const signature = await wallet.signMessage(message, 'mldsa');

            expect(typeof signature).toBe('string');
            expect(signature.length).toBeGreaterThan(100);
        });
    });

    describe('signData', () => {
        it('should sign data with ECDSA', () => {
            const wallet = LocalWallet.random();
            const data = 'deadbeef'.repeat(8);

            const signature = wallet.signData(data, 'ecdsa');

            expect(typeof signature).toBe('string');
        });

        it('should sign data with Schnorr', () => {
            const wallet = LocalWallet.random();
            const data = 'deadbeef'.repeat(8);

            const signature = wallet.signData(data, 'schnorr');

            expect(typeof signature).toBe('string');
        });
    });

    describe('exportPrivateKey', () => {
        it('should export private key', () => {
            const wallet = LocalWallet.random();
            const privateKey = wallet.exportPrivateKey();

            expect(privateKey).toMatch(/^[0-9a-f]{64}$/);
        });
    });

    describe('exportQuantumPrivateKey', () => {
        it('should export quantum private key from WIF wallet', () => {
            const keyring = SimpleKeyring.generate();
            const wif = keyring.exportWIF();
            const wallet = LocalWallet.fromWIF(wif, AddressTypes.P2TR, networks.bitcoin);

            const quantumKey = wallet.exportQuantumPrivateKey();

            expect(quantumKey.length).toBeGreaterThan(64);
        });

        it('should throw for mnemonic wallet', () => {
            const wallet = LocalWallet.fromMnemonic(testMnemonic, AddressTypes.P2TR, networks.bitcoin);

            expect(() => wallet.exportQuantumPrivateKey()).toThrow();
        });
    });

    describe('exportWIF', () => {
        it('should export WIF from WIF wallet', () => {
            const keyring = SimpleKeyring.generate();
            const originalWif = keyring.exportWIF();
            const wallet = LocalWallet.fromWIF(originalWif, AddressTypes.P2TR, networks.bitcoin);

            const exportedWif = wallet.exportWIF();

            expect(exportedWif).toBe(originalWif);
        });

        it('should throw for mnemonic wallet', () => {
            const wallet = LocalWallet.fromMnemonic(testMnemonic, AddressTypes.P2TR, networks.bitcoin);

            expect(() => wallet.exportWIF()).toThrow();
        });
    });

    describe('signPsbt', () => {
        it('should sign PSBT with auto-finalize', () => {
            const wallet = LocalWallet.random(AddressTypes.P2WPKH, networks.regtest);
            const address = wallet.getAddress();

            // Create a simple PSBT
            const psbt = new Psbt({ network: networks.regtest });
            psbt.addInput({
                hash: Buffer.alloc(32, 1),
                index: 0,
                witnessUtxo: {
                    script: require('@btc-vision/bitcoin').address.toOutputScript(address, networks.regtest),
                    value: 10000
                }
            });
            psbt.addOutput({
                address,
                value: 9000
            });

            const signedPsbt = wallet.signPsbt(psbt, { autoFinalized: true });

            expect(signedPsbt.data.inputs[0]?.finalScriptWitness).toBeDefined();
        });

        it('should sign PSBT without auto-finalize', () => {
            const wallet = LocalWallet.random(AddressTypes.P2WPKH, networks.regtest);
            const address = wallet.getAddress();

            const psbt = new Psbt({ network: networks.regtest });
            psbt.addInput({
                hash: Buffer.alloc(32, 1),
                index: 0,
                witnessUtxo: {
                    script: require('@btc-vision/bitcoin').address.toOutputScript(address, networks.regtest),
                    value: 10000
                }
            });
            psbt.addOutput({
                address,
                value: 9000
            });

            const signedPsbt = wallet.signPsbt(psbt, { autoFinalized: false });

            expect(signedPsbt.data.inputs[0]?.partialSig).toBeDefined();
        });

        it('should throw when no inputs to sign', () => {
            const wallet = LocalWallet.random(AddressTypes.P2WPKH, networks.regtest);
            const otherWallet = LocalWallet.random(AddressTypes.P2WPKH, networks.regtest);
            const otherAddress = otherWallet.getAddress();

            const psbt = new Psbt({ network: networks.regtest });
            psbt.addInput({
                hash: Buffer.alloc(32, 1),
                index: 0,
                witnessUtxo: {
                    script: require('@btc-vision/bitcoin').address.toOutputScript(otherAddress, networks.regtest),
                    value: 10000
                }
            });
            psbt.addOutput({
                address: otherAddress,
                value: 9000
            });

            expect(() => wallet.signPsbt(psbt)).toThrow('No inputs to sign');
        });
    });

    describe('network support', () => {
        it('should work with testnet', () => {
            const wallet = LocalWallet.random(AddressTypes.P2TR, networks.testnet);

            expect(wallet.getAddress()).toMatch(/^tb1p/);
            expect(wallet.getNetwork()).toBe(networks.testnet);
        });

        it('should work with regtest', () => {
            const wallet = LocalWallet.random(AddressTypes.P2TR, networks.regtest);

            expect(wallet.getAddress()).toMatch(/^bcrt1p/);
            expect(wallet.getNetwork()).toBe(networks.regtest);
        });
    });

    describe('address types', () => {
        it('should create P2PKH wallet', () => {
            const wallet = LocalWallet.random(AddressTypes.P2PKH, networks.bitcoin);
            expect(wallet.getAddress()).toMatch(/^1/);
        });

        it('should create P2WPKH wallet', () => {
            const wallet = LocalWallet.random(AddressTypes.P2WPKH, networks.bitcoin);
            expect(wallet.getAddress()).toMatch(/^bc1q/);
        });

        it('should create P2TR wallet', () => {
            const wallet = LocalWallet.random(AddressTypes.P2TR, networks.bitcoin);
            expect(wallet.getAddress()).toMatch(/^bc1p/);
        });

        it('should create P2SH-P2WPKH wallet', () => {
            const wallet = LocalWallet.random(AddressTypes.P2SH_OR_P2SH_P2WPKH, networks.bitcoin);
            expect(wallet.getAddress()).toMatch(/^3/);
        });
    });
});
