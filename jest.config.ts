import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src/tests'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  coverageDirectory: './test-reports',
  coveragePathIgnorePatterns: ['node_modules', 'dist', 'src/main/types', 'docker'],
  collectCoverage: true,
  collectCoverageFrom: ['src/main/**/*.ts'],
  transform: {
    '^.+\\.ts?$': ['ts-jest', { isolatedModules: false, useESM: true }]
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  moduleNameMapper: {
    '^@root/(.*)$': '<rootDir>/$1',
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@main/(.*)$': '<rootDir>/src/main/$1',
    '^@tests/(.*)$': '<rootDir>/src/tests/$1'
  }
};

export default config;
