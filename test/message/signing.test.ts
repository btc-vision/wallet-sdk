import { describe, expect, it } from 'vitest';
import { networks } from '@btc-vision/bitcoin';
import { MessageSigner, MLDSASecurityLevel } from '@btc-vision/transaction';
import {
    HdKeyring,
    signMessage,
    signMLDSA,
    signSchnorr,
    signTweakedSchnorr,
    SimpleKeyring,
    verifyMessage,
    verifyMLDSA,
    verifyMLDSAWithKeypair,
    verifySchnorr,
    verifyTweakedSchnorr
} from '../../src';

describe('Message Signing Module', () => {
    const testMessage = 'Hello, OPNet!';
    const testMessageBuffer = Buffer.from(testMessage, 'utf8');

    describe('signMLDSA', () => {
        it('should sign message with ML-DSA', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKeypair = keyring.getQuantumKeypair();

            const result = signMLDSA(quantumKeypair, testMessage);

            expect(result.message).toBeInstanceOf(Uint8Array);
            expect(result.signature).toBeInstanceOf(Uint8Array);
            expect(result.publicKey).toBeInstanceOf(Uint8Array);
            expect(result.securityLevel).toBe(MLDSASecurityLevel.LEVEL2);
        });

        it('should sign buffer message', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKeypair = keyring.getQuantumKeypair();

            const result = signMLDSA(quantumKeypair, testMessageBuffer);

            expect(result.signature).toBeInstanceOf(Uint8Array);
        });

        it('should produce different signatures for different messages', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKeypair = keyring.getQuantumKeypair();

            const result1 = signMLDSA(quantumKeypair, 'Message 1');
            const result2 = signMLDSA(quantumKeypair, 'Message 2');

            expect(result1.signature).not.toEqual(result2.signature);
        });
    });

    describe('verifyMLDSA', () => {
        it('should verify valid ML-DSA signature', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKeypair = keyring.getQuantumKeypair();

            const result = signMLDSA(quantumKeypair, testMessage);
            const isValid = verifyMLDSA(
                result.publicKey,
                keyring.getChainCode(),
                networks.bitcoin,
                MLDSASecurityLevel.LEVEL2,
                testMessage,
                result.signature
            );

            expect(isValid).toBe(true);
        });

        it('should reject signature for wrong message', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKeypair = keyring.getQuantumKeypair();

            const result = signMLDSA(quantumKeypair, testMessage);
            const isValid = verifyMLDSA(
                result.publicKey,
                keyring.getChainCode(),
                networks.bitcoin,
                MLDSASecurityLevel.LEVEL2,
                'Wrong message',
                result.signature
            );

            expect(isValid).toBe(false);
        });
    });

    describe('verifyMLDSAWithKeypair', () => {
        it('should verify using keypair directly', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKeypair = keyring.getQuantumKeypair();

            const result = signMLDSA(quantumKeypair, testMessage);
            const isValid = verifyMLDSAWithKeypair(quantumKeypair, testMessage, result.signature);

            expect(isValid).toBe(true);
        });
    });

    describe('signSchnorr', () => {
        it('should sign message with Schnorr', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();

            const result = signSchnorr(keypair, testMessage);

            expect(result.message).toBeInstanceOf(Uint8Array);
            expect(result.signature).toBeInstanceOf(Uint8Array);
            expect(result.publicKey).toBeInstanceOf(Uint8Array);
            expect(result.signature.length).toBe(64); // Schnorr signatures are 64 bytes
        });

        it('should sign buffer message', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();

            const result = signSchnorr(keypair, testMessageBuffer);

            expect(result.signature).toBeInstanceOf(Uint8Array);
        });
    });

    describe('verifySchnorr', () => {
        it('should verify valid Schnorr signature', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();

            const result = signSchnorr(keypair, testMessage);
            const isValid = verifySchnorr(result.publicKey, testMessage, result.signature);

            expect(isValid).toBe(true);
        });

        it('should reject signature for wrong message', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();

            const result = signSchnorr(keypair, testMessage);
            const isValid = verifySchnorr(result.publicKey, 'Wrong message', result.signature);

            expect(isValid).toBe(false);
        });
    });

    describe('signTweakedSchnorr', () => {
        it('should sign with tweaked key', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();

            const result = signTweakedSchnorr(keypair, testMessage);

            expect(result.signature).toBeInstanceOf(Uint8Array);
            expect(result.signature.length).toBe(64);
        });
    });

    describe('verifyTweakedSchnorr', () => {
        it('should verify tweaked signature', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();

            const result = signTweakedSchnorr(keypair, testMessage);
            const isValid = verifyTweakedSchnorr(result.publicKey, testMessage, result.signature);

            expect(isValid).toBe(true);
        });
    });

    describe('MessageSigner.sha256', () => {
        it('should hash buffer message', () => {
            const hash = MessageSigner.sha256(testMessageBuffer);
            expect(hash).toBeInstanceOf(Buffer);
            expect(hash.length).toBe(32); // SHA-256 is 32 bytes
        });

        it('should produce same hash for same message', () => {
            const hash1 = MessageSigner.sha256(testMessageBuffer);
            const hash2 = MessageSigner.sha256(testMessageBuffer);
            expect(hash1).toEqual(hash2);
        });

        it('should produce different hash for different messages', () => {
            const hash1 = MessageSigner.sha256(Buffer.from('Message 1'));
            const hash2 = MessageSigner.sha256(Buffer.from('Message 2'));
            expect(hash1).not.toEqual(hash2);
        });
    });

    describe('signMessage', () => {
        it('should sign with ML-DSA type', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKeypair = keyring.getQuantumKeypair();

            const result = signMessage(quantumKeypair, testMessage, 'mldsa');

            expect(result.signatureType).toBe('mldsa');
            expect(result.securityLevel).toBe(MLDSASecurityLevel.LEVEL2);
        });

        it('should sign with Schnorr type', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();

            const result = signMessage(keypair, testMessage, 'schnorr');

            expect(result.signatureType).toBe('schnorr');
            expect(result.securityLevel).toBeUndefined();
        });

        it('should sign with ECDSA type', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();

            const result = signMessage(keypair, testMessage, 'ecdsa');

            expect(result.signatureType).toBe('ecdsa');
        });

        it('should throw for ML-DSA with classical keypair', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();

            expect(() => signMessage(keypair, testMessage, 'mldsa')).toThrow();
        });

        it('should throw for Schnorr with quantum keypair', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKeypair = keyring.getQuantumKeypair();

            expect(() => signMessage(quantumKeypair, testMessage, 'schnorr')).toThrow();
        });
    });

    describe('verifyMessage', () => {
        it('should verify Schnorr signature', () => {
            const keyring = SimpleKeyring.generate();
            const keypair = keyring.getKeypair();
            const result = signMessage(keypair, testMessage, 'schnorr');

            const isValid = verifyMessage(result.publicKey, testMessage, result.signature, 'schnorr');

            expect(isValid).toBe(true);
        });

        it('should verify ML-DSA signature', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKeypair = keyring.getQuantumKeypair();
            const result = signMessage(quantumKeypair, testMessage, 'mldsa');

            const isValid = verifyMessage(
                result.publicKey,
                testMessage,
                result.signature,
                'mldsa',
                keyring.getChainCode(),
                networks.bitcoin,
                result.securityLevel
            );

            expect(isValid).toBe(true);
        });

        it('should throw for ML-DSA without required params', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKeypair = keyring.getQuantumKeypair();
            const result = signMessage(quantumKeypair, testMessage, 'mldsa');

            expect(() => verifyMessage(result.publicKey, testMessage, result.signature, 'mldsa')).toThrow();
        });
    });

    describe('with HD keyring', () => {
        const testMnemonic =
            'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

        it('should sign with HD keyring derived wallet', () => {
            const keyring = new HdKeyring({
                mnemonic: testMnemonic,
                activeIndexes: [0],
                network: networks.bitcoin
            });
            const publicKey = keyring.getAccounts()[0]!;
            const wallet = keyring.getWallet(publicKey);

            const result = signMLDSA(wallet.mldsaKeypair, testMessage);
            expect(result.signature).toBeInstanceOf(Uint8Array);
        });
    });

    describe('cross-format verification', () => {
        it('should verify signature regardless of message input format', () => {
            const keyring = SimpleKeyring.generate();
            const quantumKeypair = keyring.getQuantumKeypair();

            // Sign with string
            const result = signMLDSA(quantumKeypair, testMessage);

            // Verify with buffer
            const isValid = verifyMLDSAWithKeypair(quantumKeypair, testMessageBuffer, result.signature);

            expect(isValid).toBe(true);
        });
    });
});
