import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  roots: ['<rootDir>'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/shared/$1',
  },
};

export default config;
