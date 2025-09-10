import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname
});

const eslintConfig = [
    ...compat.extends('next/core-web-vitals', 'next/typescript'),
    {
        ignores: ['node_modules/', 'dist/', 'src/generated/'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],
            'react/no-unescaped-entities': 'off',
            'react-hooks/exhaustive-deps': 'warn',
            '@next/next/no-img-element': 'off',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'prefer-const': 'warn',
            'no-duplicate-imports': 'error',
            'react/prop-types': 'off',
            'react/jsx-uses-react': 'off',
            'react/react-in-jsx-scope': 'off',
            'react/self-closing-comp': 'warn',
            'jsx-quotes': ['warn', 'prefer-double'],
            quotes: ['warn', 'single', { avoidEscape: true }],
            semi: ['warn', 'always'],
            'comma-dangle': ['error', 'never']
        }
    }
];

export default eslintConfig;
