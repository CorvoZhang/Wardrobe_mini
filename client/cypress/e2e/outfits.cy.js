describe('穿搭系统功能测试', () => {
  // 在每个测试前登录
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  // 在每个测试后登出
  afterEach(() => {
    cy.logout();
  });

  it('应该能够查看穿搭列表', () => {
    cy.visit('/outfits');
    
    // 验证穿搭页面加载成功
    cy.contains('穿搭').should('be.visible');
    
    // 页面应该加载完成（可能有穿搭卡片或空状态提示）
    cy.get('body').should('be.visible');
  });

  it('应该能够创建新穿搭', () => {
    cy.visit('/outfits');
    
    // 点击创建穿搭按钮
    cy.contains('创建穿搭').click();
    
    // 输入穿搭信息
    const outfitName = `测试穿搭_${Math.floor(Math.random() * 10000)}`;
    cy.get('#outfit_name').type(outfitName);
    cy.get('#outfit_description').type('测试穿搭描述');
    cy.get('#outfit_style').select('休闲');
    cy.get('#outfit_occasion').select('日常');
    cy.get('#outfit_season').select('春季');
    
    // 点击保存按钮
    cy.contains('保存').click();
    
    // 验证穿搭创建成功
    cy.contains(outfitName).should('be.visible');
  });

  it('应该能够查看穿搭详情', () => {
    cy.visit('/outfits');
    
    // 点击第一个穿搭卡片
    cy.get('.ant-card').first().click();
    
    // 验证穿搭详情页面加载成功
    cy.url().should('include', '/outfit/');
    cy.contains('穿搭详情').should('be.visible');
  });

  it('应该能够添加衣物到穿搭', () => {
    cy.visit('/outfits');
    
    // 点击创建穿搭按钮
    cy.contains('创建穿搭').click();
    
    // 输入穿搭基本信息
    const outfitName = `测试穿搭_${Math.floor(Math.random() * 10000)}`;
    cy.get('#outfit_name').type(outfitName);
    cy.get('#outfit_description').type('测试穿搭描述');
    cy.get('#outfit_style').select('休闲');
    cy.get('#outfit_occasion').select('日常');
    cy.get('#outfit_season').select('春季');
    
    // 保存穿搭
    cy.contains('保存').click();
    
    // 进入穿搭详情页面
    cy.contains(outfitName).click();
    
    // 点击添加衣物按钮
    cy.contains('添加衣物').click();
    
    // 选择第一个衣物
    cy.get('.ant-checkbox').first().click();
    
    // 点击确认添加
    cy.contains('确认添加').click();
    
    // 验证衣物添加成功
    cy.get('.ant-card').should('have.length.greaterThan', 0);
  });

  it('应该能够按风格筛选穿搭', () => {
    cy.visit('/outfits');
    
    // 点击风格筛选按钮
    cy.contains('风格筛选').click();
    
    // 选择休闲风格
    cy.get('.ant-select-dropdown-menu-item').contains('休闲').click();
    
    // 验证筛选结果
    cy.get('.ant-card').each(($card) => {
      cy.wrap($card).should('contain.text', '休闲');
    });
  });
});