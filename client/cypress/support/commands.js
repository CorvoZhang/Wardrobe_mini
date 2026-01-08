// 登录命令
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  
  // 等待页面加载
  cy.get('#login_email').should('be.visible');
  
  // 输入邮箱和密码
  cy.get('#login_email').type(email);
  cy.get('#login_password').type(password);
  
  // 点击登录按钮
  cy.get('button').contains('登录').click();
  
  // 验证登录成功，跳转到主页（App的index路由是 /）
  cy.url().should('eq', Cypress.config().baseUrl + '/');
  // 或者验证已显示主页内容（CHANEL CLOSET logo）
  cy.contains('CHANEL').should('be.visible');
});

// 注册命令
Cypress.Commands.add('register', (email, password, name, phone) => {
  cy.visit('/register');
  
  // 等待页面加载
  cy.get('#register_email').should('be.visible');
  
  // 输入注册信息
  cy.get('#register_name').type(name);
  cy.get('#register_email').type(email);
  cy.get('#register_phone').type(phone);
  cy.get('#register_password').type(password);
  cy.get('#register_confirmPassword').type(password);
  
  // 点击注册按钮
  cy.get('button').contains('注册').click();
  
  // 验证注册成功，跳转到登录页
  cy.url().should('include', '/login');
});

// 登出命令
Cypress.Commands.add('logout', () => {
  // 点击登出按钮（是普通按钮，不是Ant Design菜单项）
  cy.get('button').contains('登出').click();
  
  // 验证登出成功，跳转到登录页
  cy.url().should('include', '/login');
});

// 创建衣物命令
Cypress.Commands.add('createClothing', (name, category) => {
  cy.visit('/closet');
  
  // 点击添加衣物按钮
  cy.contains('添加衣物').click();
  
  // 输入衣物信息
  cy.get('#clothing_name').type(name);
  cy.get('#clothing_category').select(category);
  
  // 点击保存按钮
  cy.contains('保存').click();
  
  // 验证衣物创建成功
  cy.contains(name).should('be.visible');
});

// 创建穿搭命令
Cypress.Commands.add('createOutfit', (name, description, style, occasion, season) => {
  cy.visit('/outfits');
  
  // 点击创建穿搭按钮
  cy.contains('创建穿搭').click();
  
  // 输入穿搭信息
  cy.get('#outfit_name').type(name);
  cy.get('#outfit_description').type(description);
  cy.get('#outfit_style').select(style);
  cy.get('#outfit_occasion').select(occasion);
  cy.get('#outfit_season').select(season);
  
  // 点击保存按钮
  cy.contains('保存').click();
  
  // 验证穿搭创建成功
  cy.contains(name).should('be.visible');
});