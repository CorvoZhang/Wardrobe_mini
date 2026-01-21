export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/cypress/'],
  transformIgnorePatterns: [
    '/node_modules/(?!(' +
      'axios|' +
      'react-router-dom|' +
      'react-router|' +
      '@remix-run|' +
      'antd|' +
      '@ant-design|' +
      'rc-[^/]+|' +
      '@rc-component|' +
      '@babel/runtime' +
    ')/)',
  ],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  testMatch: ['**/*.test.jsx', '**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/**/*.test.{js,jsx}',
  ],
  // Increase timeout for async tests with Ant Design components
  testTimeout: 10000,
};
