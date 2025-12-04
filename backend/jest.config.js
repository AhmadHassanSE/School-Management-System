module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'models/**/*.js',
        'routes/**/*.js',
        'middleware/**/*.js',
        '!**/*.test.js',
        '!**/node_modules/**',
        '!**/coverage/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};