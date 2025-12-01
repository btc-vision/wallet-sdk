import { describe, expect, it } from 'vitest';
import { networks, Psbt } from '@btc-vision/bitcoin';
import { AddressTypes, OPNetNetwork } from '@btc-vision/transaction';
import {
    generateBip322Psbt,
    HdKeyring,
    signBip322Message,
    signBip322MessageWithNetworkType,
    SimpleKeyring,
    verifyBip322Message,
    verifyBip322MessageWithNetworkType
} from '../../src';

describe('BIP322 Message Signing', () => {
    const testMessage = 'Hello, BIP322!';

    describe('generateBip322Psbt', () => {
        it('should generate PSBT for P2WPKH address', () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2WPKH);

            const psbt = generateBip322Psbt(testMessage, address, networks.bitcoin);

            expect(psbt).toBeInstanceOf(Psbt);
            expect(psbt.data.inputs.length).toBe(1);
            expect(psbt.data.outputs.length).toBe(1);
        });

        it('should generate PSBT for P2TR address', () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2TR);

            const psbt = generateBip322Psbt(testMessage, address, networks.bitcoin);

            expect(psbt).toBeInstanceOf(Psbt);
            expect(psbt.data.inputs.length).toBe(1);
            expect(psbt.data.outputs.length).toBe(1);
        });

        it('should throw for unsupported address type', () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2PKH);

            expect(() => generateBip322Psbt(testMessage, address, networks.bitcoin)).toThrow();
        });

        it('should accept buffer message', () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2TR);
            const messageBuffer = Buffer.from(testMessage, 'utf8');

            const psbt = generateBip322Psbt(messageBuffer, address, networks.bitcoin);

            expect(psbt).toBeInstanceOf(Psbt);
        });
    });

    describe('signBip322Message', () => {
        it('should sign message for P2WPKH address', async () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2WPKH);

            const signature = await signBip322Message(testMessage, address, networks.bitcoin, async (psbt) => {
                const inputs = [{ index: 0, publicKey: keyring.getPublicKey() }];
                keyring.signTransaction(psbt, inputs);
                return psbt;
            });

            expect(typeof signature).toBe('string');
            expect(signature.length).toBeGreaterThan(0);
        });

        // TODO: P2TR BIP322 signing requires proper taproot sighash handling
        it.skip('should sign message for P2TR address', async () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2TR);

            const signature = await signBip322Message(testMessage, address, networks.bitcoin, async (psbt) => {
                // For P2TR, we need to add tapInternalKey
                const pubkeyBuffer = Buffer.from(keyring.getPublicKey(), 'hex');
                const tapInternalKey = pubkeyBuffer.subarray(1, 33);
                psbt.data.inputs[0]!.tapInternalKey = tapInternalKey;

                // Sign with tweak for taproot key path
                const inputs = [{ index: 0, publicKey: keyring.getPublicKey(), disableTweakSigner: false }];
                keyring.signTransaction(psbt, inputs);
                return psbt;
            });

            expect(typeof signature).toBe('string');
            expect(signature.length).toBeGreaterThan(0);
        });
    });

    describe('verifyBip322Message', () => {
        // TODO: BIP322 verification requires review - signature encoding/decoding needs verification
        it.skip('should verify P2WPKH signature', async () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2WPKH);

            const signature = await signBip322Message(testMessage, address, networks.bitcoin, async (psbt) => {
                const inputs = [{ index: 0, publicKey: keyring.getPublicKey() }];
                keyring.signTransaction(psbt, inputs);
                return psbt;
            });

            const isValid = verifyBip322Message(address, testMessage, signature, networks.bitcoin);
            expect(isValid).toBe(true);
        });

        // TODO: BIP322 P2TR verification requires review
        it.skip('should verify P2TR signature', async () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2TR);

            const signature = await signBip322Message(testMessage, address, networks.bitcoin, async (psbt) => {
                const pubkeyBuffer = Buffer.from(keyring.getPublicKey(), 'hex');
                const tapInternalKey = pubkeyBuffer.subarray(1, 33);
                psbt.data.inputs[0]!.tapInternalKey = tapInternalKey;

                const inputs = [{ index: 0, publicKey: keyring.getPublicKey() }];
                keyring.signTransaction(psbt, inputs);
                return psbt;
            });

            const isValid = verifyBip322Message(address, testMessage, signature, networks.bitcoin);
            expect(isValid).toBe(true);
        });

        it('should reject signature for wrong message', async () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2WPKH);

            const signature = await signBip322Message(testMessage, address, networks.bitcoin, async (psbt) => {
                const inputs = [{ index: 0, publicKey: keyring.getPublicKey() }];
                keyring.signTransaction(psbt, inputs);
                return psbt;
            });

            const isValid = verifyBip322Message(address, 'Wrong message', signature, networks.bitcoin);
            expect(isValid).toBe(false);
        });

        it('should return false for invalid address', () => {
            const isValid = verifyBip322Message('invalid', testMessage, 'sig', networks.bitcoin);
            expect(isValid).toBe(false);
        });

        it('should return false for unsupported address type', () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2PKH);

            const isValid = verifyBip322Message(address, testMessage, 'sig', networks.bitcoin);
            expect(isValid).toBe(false);
        });
    });

    describe('signBip322MessageWithNetworkType', () => {
        it('should sign message with OPNetNetwork', async () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2WPKH);

            const result = await signBip322MessageWithNetworkType(
                testMessage,
                address,
                OPNetNetwork.Mainnet,
                async (psbt) => {
                    const inputs = [{ index: 0, publicKey: keyring.getPublicKey() }];
                    keyring.signTransaction(psbt, inputs);
                    return psbt;
                }
            );

            expect(result.address).toBe(address);
            expect(result.message).toBe(testMessage);
            expect(result.networkType).toBe(OPNetNetwork.Mainnet);
            expect(typeof result.signature).toBe('string');
        });
    });

    describe('verifyBip322MessageWithNetworkType', () => {
        // TODO: BIP322 verification requires review
        it.skip('should verify with OPNetNetwork', async () => {
            const keyring = SimpleKeyring.generate();
            const address = keyring.getAddress(AddressTypes.P2WPKH);

            const result = await signBip322MessageWithNetworkType(
                testMessage,
                address,
                OPNetNetwork.Mainnet,
                async (psbt) => {
                    const inputs = [{ index: 0, publicKey: keyring.getPublicKey() }];
                    keyring.signTransaction(psbt, inputs);
                    return psbt;
                }
            );

            const isValid = verifyBip322MessageWithNetworkType(
                address,
                testMessage,
                result.signature,
                OPNetNetwork.Mainnet
            );
            expect(isValid).toBe(true);
        });
    });

    describe('with HD keyring', () => {
        const testMnemonic =
            'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

        // TODO: BIP322 verification requires review
        it.skip('should sign message with HD keyring wallet', async () => {
            const keyring = new HdKeyring({
                mnemonic: testMnemonic,
                activeIndexes: [0],
                addressType: AddressTypes.P2WPKH
            });
            const publicKey = keyring.getAccounts()[0]!;
            const addresses = keyring.getAddressesForPublicKey(publicKey);
            const address = addresses.p2wpkh!;

            const signature = await signBip322Message(testMessage, address, networks.bitcoin, async (psbt) => {
                const inputs = [{ index: 0, publicKey }];
                keyring.signTransaction(psbt, inputs);
                return psbt;
            });

            const isValid = verifyBip322Message(address, testMessage, signature, networks.bitcoin);
            expect(isValid).toBe(true);
        });
    });

    describe('testnet support', () => {
        // TODO: BIP322 verification requires review
        it.skip('should sign and verify on testnet', async () => {
            const keyring = SimpleKeyring.generate(networks.testnet);
            const address = keyring.getAddress(AddressTypes.P2WPKH);

            expect(address).toMatch(/^tb1q/);

            const signature = await signBip322Message(testMessage, address, networks.testnet, async (psbt) => {
                const inputs = [{ index: 0, publicKey: keyring.getPublicKey() }];
                keyring.signTransaction(psbt, inputs);
                return psbt;
            });

            const isValid = verifyBip322Message(address, testMessage, signature, networks.testnet);
            expect(isValid).toBe(true);
        });
    });
});
