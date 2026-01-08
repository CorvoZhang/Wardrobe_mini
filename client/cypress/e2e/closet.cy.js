describe('衣橱系统功能测试', () => {
  // 在每个测试前登录
  beforeEach(() => {
    cy.login('test@example.com', 'password123');
  });

  // 在每个测试后登出
  afterEach(() => {
    cy.logout();
  });

  it('应该能够查看衣橱列表', () => {
    cy.visit('/closet');
    
    // 验证衣橱页面加载成功
    cy.contains('衣橱').should('be.visible');
    
    // 页面应该加载完成（可能有衣物卡片或空状态提示）
    cy.get('body').should('be.visible');
  });

  it('应该能够添加新衣物', () => {
    cy.visit('/closet');
    
    // 点击添加衣物按钮
    cy.contains('添加衣物').click();
    
    // 输入衣物信息
    const clothingName = `测试衣物_${Math.floor(Math.random() * 10000)}`;
    cy.get('#clothing_name').type(clothingName);
    cy.get('#clothing_category').select('上衣');
    cy.get('#clothing_style').select('休闲');
    cy.get('#clothing_season').select('春季');
    cy.get('#clothing_color').type('蓝色');
    cy.get('#clothing_brand').type('品牌A');
    cy.get('#clothing_material').type('棉质');
    
    // 点击保存按钮
    cy.contains('保存').click();
    
    // 验证衣物创建成功
    cy.contains(clothingName).should('be.visible');
  });

  it('应该能够查看衣物详情', () => {
    cy.visit('/closet');
    
    // 点击第一个衣物卡片
    cy.get('.ant-card').first().click();
    
    // 验证衣物详情页面加载成功
    cy.url().should('include', '/clothing/');
    cy.contains('衣物详情').should('be.visible');
  });

  it('应该能够搜索衣物', () => {
    cy.visit('/closet');
    
    // 输入搜索关键词
    const searchKeyword = '测试';
    cy.get('.ant-input-search input').type(searchKeyword);
    cy.get('.ant-input-search-button').click();
    
    // 验证搜索结果
    cy.get('.ant-card').each(($card) => {
      cy.wrap($card).should('contain.text', searchKeyword);
    });
  });

  it('应该能够按分类筛选衣物', () => {
    cy.visit('/closet');
    
    // 点击分类筛选按钮
    cy.contains('分类筛选').click();
    
    // 选择上衣分类
    cy.get('.ant-select-dropdown-menu-item').contains('上衣').click();
    
    // 验证筛选结果
    cy.get('.ant-card').each(($card) => {
      cy.wrap($card).should('contain.text', '上衣');
    });
  });
});