export default {
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    baseUrl: 'http://localhost:3000', // Vite开发服务器实际运行端口
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    // 增加默认超时时间，处理网络延迟
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 30000,
    // 重试失败的测试
    retries: {
      runMode: 2,
      openMode: 0
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
};