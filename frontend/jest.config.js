module.exports = {
  // Web app: use jsdom test environment and default Jest transform via babel-jest
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
};