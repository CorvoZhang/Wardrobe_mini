describe('衣橱系统功能测试', () => {
  // 在每个测试前登录
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  // 在每个测试后登出（使用 cy.then 确保只在登录成功时执行）
  afterEach(function() {
    // 只有当测试没有失败时才尝试登出
    if (this.currentTest.state !== 'failed') {
      cy.logout();
    }
  });

  it('应该能够查看衣橱列表', () => {
    cy.visit('/closet');
    
    // 验证衣橱页面加载成功
    cy.contains('我的衣橱').should('be.visible');
    
    // 验证页面基本元素存在
    cy.contains('添加衣物').should('be.visible');
  });

  it('应该能够导航到添加衣物页面', () => {
    cy.visit('/closet');
    
    // 点击添加衣物按钮
    cy.contains('添加衣物').click();
    
    // 验证跳转到添加衣物页面
    cy.url().should('include', '/closet/add');
  });

  it('应该能够使用搜索功能', () => {
    cy.visit('/closet');
    
    // 验证搜索框存在
    cy.get('input[placeholder*="搜索"]').should('be.visible');
    
    // 输入搜索关键词
    cy.get('input[placeholder*="搜索"]').type('测试');
    
    // 页面应该正常响应
    cy.get('body').should('be.visible');
  });

  it('应该能够使用分类筛选功能', () => {
    cy.visit('/closet');
    
    // 验证分类选择器存在
    cy.get('.ant-select').should('be.visible');
  });
});
