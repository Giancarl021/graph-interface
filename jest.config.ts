import type { JestConfigWithTsJest } from 'ts-jest';

const config: JestConfigWithTsJest = {
    testMatch: ['<rootDir>/tests/**/*.test.ts'],
    transformIgnorePatterns: ['/node_modules/(?!@giancarl021/type-inference)'],
    moduleFileExtensions: [
        'js',
        'mjs',
        'cjs',
        'jsx',
        'ts',
        'tsx',
        'json',
        'node',
        'd.ts'
    ],
    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/lib/'],
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1'
    },
    transform: {
        'node_modules/.+\\.(j|t)sx?$': 'ts-jest',
        'node_modules/@giancarl021/type-inference/.+\\.(j|t)sx?$': 'ts-jest',
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: './tsconfig.json'
            }
        ],
        '^.+\\.jsx?$': [
            'babel-jest',
            { plugins: ['@babel/plugin-transform-modules-commonjs'] }
        ]
    },
    collectCoverageFrom: ['<rootDir>/src/**/*.ts', '<rootDir>/index.ts'],
    coveragePathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/tests/',
        '<rootDir>/lib/'
    ]
};

export default config;
