describe('用户认证流程', () => {
  it('应该能够注册新用户', () => {
    // 生成随机邮箱，避免重复注册
    const randomEmail = `test_${Math.floor(Math.random() * 10000)}@example.com`;
    
    // 注册新用户（注册成功后跳转到登录页）
    cy.register(randomEmail, 'password123', '测试用户', '1234567890');
    
    // 验证在登录页面
    cy.url().should('include', '/login');
  });

  it('应该能够登录已有用户', () => {
    // 使用已注册的测试用户登录
    cy.login('test@example.com', 'password123');
    
    // 验证登录成功后可以看到主页内容
    cy.contains('CHANEL').should('be.visible');
    
    // 登出
    cy.logout();
  });

  it('应该能够成功登出', () => {
    // 先登录
    cy.login('test@example.com', 'password123');
    
    // 验证登录成功
    cy.contains('CHANEL').should('be.visible');
    
    // 然后登出
    cy.logout();
    
    // 验证登出后在登录页
    cy.url().should('include', '/login');
  });

  it('登录失败时应该显示错误信息', () => {
    cy.visit('/login');
    
    // 等待页面加载
    cy.get('#login_email').should('be.visible');
    
    // 使用错误密码登录
    cy.get('#login_email').type('test@example.com');
    cy.get('#login_password').type('wrongpassword');
    
    cy.get('button').contains('登录').click();
    
    // 验证错误信息显示（Ant Design message组件）
    cy.contains('邮箱或密码错误').should('be.visible');
  });

  it('注册时使用已存在邮箱应该显示错误信息', () => {
    cy.visit('/register');
    
    // 等待页面加载
    cy.get('#register_email').should('be.visible');
    
    // 使用已存在的邮箱注册
    cy.get('#register_name').type('测试用户');
    cy.get('#register_email').type('test@example.com');
    cy.get('#register_phone').type('1234567890');
    cy.get('#register_password').type('password123');
    cy.get('#register_confirmPassword').type('password123');
    
    cy.get('button').contains('注册').click();
    
    // 验证错误信息显示（Ant Design message组件）
    cy.contains('该邮箱已被注册').should('be.visible');
  });
});