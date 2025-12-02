import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

export default [
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,

    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir: import.meta.dirname
            }
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
            prettier
        },
        rules: {
            // Strict TypeScript rules
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'error',
            '@typescript-eslint/explicit-module-boundary-types': 'error',
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/strict-boolean-expressions': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/prefer-nullish-coalescing': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
            '@typescript-eslint/no-unnecessary-type-assertion': 'error',
            '@typescript-eslint/prefer-readonly': 'error',
            '@typescript-eslint/require-await': 'error',
            '@typescript-eslint/return-await': ['error', 'always'],
            '@typescript-eslint/no-redundant-type-constituents': 'error',

            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/restrict-template-expressions': 'off',
            '@typescript-eslint/only-throw-error': 'off',
            '@typescript-eslint/no-unnecessary-condition': 'off',
            '@typescript-eslint/unbound-method': 'warn',
            '@typescript-eslint/no-confusing-void-expression': 'off',
            '@typescript-eslint/no-extraneous-class': 'off',
            'no-async-promise-executor': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            '@typescript-eslint/no-unnecessary-type-parameters': 'off',
            '@typescript-eslint/no-duplicate-enum-values': 'off',
            'prefer-spread': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/prefer-literal-enum-member': 'off',
            '@typescript-eslint/related-getter-setter-pairs': 'off',
            '@typescript-eslint/consistent-generic-constructors': 'off',

            // General rules
            'no-undef': 'off',
            'prefer-const': 'error',
            'no-empty': 'error',
            eqeqeq: ['error', 'always']
        }
    },

    {
        ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts']
    }
];
