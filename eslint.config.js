import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,

    {
        files: ['**/*.ts', '**/*.tsx'],
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
            '@typescript-eslint/no-var-requires': 'off',
            'no-undef': 'off',
            '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-empty-function': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            'prefer-const': 'off',
            '@typescript-eslint/ban-types': 'off',
            'no-empty': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-floating-promises': 'off',
            'prettier/prettier': 'off'
        }
    }
];
