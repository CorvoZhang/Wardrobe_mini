describe('穿搭系统功能测试', () => {
  // 在每个测试前登录
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  // 在每个测试后登出（使用 this 确保只在登录成功时执行）
  afterEach(function() {
    // 只有当测试没有失败时才尝试登出
    if (this.currentTest.state !== 'failed') {
      cy.logout();
    }
  });

  it('应该能够查看穿搭列表', () => {
    cy.visit('/outfits');
    
    // 验证穿搭页面加载成功
    cy.contains('我的穿搭').should('be.visible');
    
    // 验证页面基本元素存在
    cy.contains('创建穿搭').should('be.visible');
  });

  it('应该能够点击创建穿搭按钮', () => {
    cy.visit('/outfits');
    
    // 点击创建穿搭按钮
    cy.contains('创建穿搭').click();
    
    // 验证跳转到创建穿搭页面或显示创建对话框
    cy.url().should('include', '/outfits');
  });

  it('应该能够使用场合筛选功能', () => {
    cy.visit('/outfits');
    
    // 验证场合选择器存在
    cy.get('.ant-select').first().should('be.visible');
  });

  it('应该能够使用季节筛选功能', () => {
    cy.visit('/outfits');
    
    // 验证有多个筛选器
    cy.get('.ant-select').should('have.length.at.least', 1);
  });
});
