export default {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  transformIgnorePatterns: ['/node_modules/(?!(axios|react-router-dom|antd|@ant-design|rc-*|@rc-component)/)'],
  moduleFileExtensions: ['js', 'jsx'],
  extensionsToTreatAsEsm: ['.jsx'],
  globals: {
    'babel-jest': {
      useESM: true,
    },
  },
};