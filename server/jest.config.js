module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'services/**/*.js',
    'routes/**/*.js',
    'middlewares/**/*.js',
    '!controllers/teamController.js',
    '!routes/teamRoutes.js',
    '!middlewares/teamRoutes.js',
    '!middlewares/analyticsRoutes.js',
    '!middlewares/reportRoutes.js',
    '!middlewares/notFoundMiddleware.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 95,
      functions: 95,
      lines: 95,
    },
  },
  testTimeout: 10000,
  verbose: true,
};
