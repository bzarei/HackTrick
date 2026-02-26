import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  displayName: 'portal',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx']
};

export default config;