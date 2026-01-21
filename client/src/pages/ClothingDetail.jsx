import { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Image, Tag, message, Spin, Modal, Popconfirm, Form, Input, Select, Upload } from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ScissorOutlined,
  BulbOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig.js';

const { Option } = Select;

const ClothingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clothing, setClothing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processingImageId, setProcessingImageId] = useState(null);
  const [recognizingAttributes, setRecognizingAttributes] = useState(false);
  const [recognizedAttributes, setRecognizedAttributes] = useState(null);
  
  // 编辑相关状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [editForm] = Form.useForm();
  const [newImageList, setNewImageList] = useState([]);

  // 获取衣物详情
  const fetchClothingDetail = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/clothing/${id}`);
      setClothing(response);
    } catch (error) {
      message.error('获取衣物详情失败');
      console.error('获取衣物详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClothingDetail();
  }, [id]);

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get('/clothing/categories');
        setCategories(response || []);
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    };
    fetchCategories();
  }, []);

  const handleBack = () => {
    navigate('/closet');
  };

  // 打开编辑弹窗
  const handleEdit = () => {
    editForm.setFieldsValue({
      name: clothing.name,
      categoryId: clothing.categoryId,
      description: clothing.description || ''
    });
    setNewImageList([]);
    setEditModalVisible(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);

      // 1. 更新衣物基本信息
      await axiosInstance.put(`/clothing/${id}`, {
        name: values.name,
        categoryId: values.categoryId
      });

      // 2. 上传新图片
      if (newImageList.length > 0) {
        for (const file of newImageList) {
          if (file.originFileObj) {
            const formData = new FormData();
            formData.append('image', file.originFileObj);
            await axiosInstance.post(`/clothing/${id}/images`, formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          }
        }
      }

      message.success('衣物更新成功');
      setEditModalVisible(false);
      
      // 刷新衣物详情
      fetchClothingDetail();
      
    } catch (error) {
      console.error('更新衣物失败:', error);
      message.error('更新衣物失败，请稍后重试');
    } finally {
      setEditLoading(false);
    }
  };

  // 删除图片
  const handleDeleteImage = async (imageId) => {
    try {
      await axiosInstance.delete(`/clothing/images/${imageId}`);
      message.success('图片删除成功');
      fetchClothingDetail();
    } catch (error) {
      console.error('删除图片失败:', error);
      message.error('删除图片失败');
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/clothing/${id}`);
      message.success('衣物删除成功');
      navigate('/closet');
    } catch (error) {
      console.error('删除衣物失败:', error);
      message.error('删除衣物失败');
    }
  };

  // AI 去除背景
  const handleRemoveBackground = async (imageId) => {
    setProcessingImageId(imageId);
    try {
      message.loading({ content: 'AI 正在去除背景...', key: 'removeBackground', duration: 0 });
      
      const response = await axiosInstance.post(`/clothing/${id}/process-image`, {
        imageId: imageId
      });
      
      if (response.success) {
        message.success({ content: response.data.isMock ? '背景去除完成（Mock 模式）' : '背景去除成功！', key: 'removeBackground' });
        
        // 刷新衣物详情以显示新图片
        const refreshResponse = await axiosInstance.get(`/clothing/${id}`);
        setClothing(refreshResponse);
      } else {
        message.error({ content: response.message || '背景去除失败', key: 'removeBackground' });
      }
    } catch (error) {
      console.error('背景去除失败:', error);
      message.error({ content: '背景去除失败，请稍后重试', key: 'removeBackground' });
    } finally {
      setProcessingImageId(null);
    }
  };

  // AI 识别衣物属性
  const handleRecognizeAttributes = async () => {
    setRecognizingAttributes(true);
    try {
      message.loading({ content: 'AI 正在识别衣物属性...', key: 'recognizeAttributes', duration: 0 });
      
      const response = await axiosInstance.post(`/clothing/${id}/recognize-attributes`, {});
      
      if (response.success) {
        setRecognizedAttributes(response.data.attributes);
        message.success({ 
          content: response.data.isMock ? '属性识别完成（Mock 模式）' : '属性识别成功！', 
          key: 'recognizeAttributes' 
        });
        
        // 刷新衣物详情以显示更新后的属性
        const refreshResponse = await axiosInstance.get(`/clothing/${id}`);
        setClothing(refreshResponse);
      } else {
        message.error({ content: response.message || '属性识别失败', key: 'recognizeAttributes' });
      }
    } catch (error) {
      console.error('属性识别失败:', error);
      message.error({ content: '属性识别失败，请稍后重试', key: 'recognizeAttributes' });
    } finally {
      setRecognizingAttributes(false);
    }
  };

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!clothing) {
    return <div>衣物不存在</div>;
  }

  return (
    <div className="page-transition">
      <Button type="text" icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginBottom: 16 }}>
        返回衣橱
      </Button>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>衣物图片</span>
                <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                  共 {clothing.images?.length || 0} 张
                </span>
              </div>
            } 
            className="card-hover"
          >
            {clothing.images && clothing.images.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {clothing.images.map(image => {
                  const isProcessing = processingImageId === image.id;
                  const isProcessed = image.imageType === 'processed';
                  
                  return (
                    <div 
                      key={image.id} 
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        border: isProcessed ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-background)'
                      }}
                    >
                      {/* 处理状态标记 */}
                      {isProcessed && (
                        <div style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          backgroundColor: 'var(--color-accent)',
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          fontSize: 'var(--font-size-xs)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          zIndex: 10
                        }}>
                          <CheckCircleOutlined />
                          已去背景
                        </div>
                      )}
                      
                      <Image.PreviewGroup>
                        <Image
                          src={image.imageUrl || image.url}
                          style={{ 
                            width: '100%', 
                            height: '200px',
                            objectFit: 'cover',
                            cursor: 'pointer' 
                          }}
                          alt={clothing.name}
                          fallback="https://via.placeholder.com/400?text=图片加载失败"
                        />
                      </Image.PreviewGroup>
                      
                      {/* 操作按钮 */}
                      {!isProcessed && (
                        <div style={{
                          padding: 8,
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          <Button
                            size="small"
                            type="primary"
                            icon={isProcessing ? <LoadingOutlined spin /> : <ScissorOutlined />}
                            onClick={() => handleRemoveBackground(image.id)}
                            disabled={isProcessing}
                            style={{
                              backgroundColor: 'var(--color-primary)',
                              borderColor: 'var(--color-primary)'
                            }}
                          >
                            {isProcessing ? 'AI 处理中...' : 'AI 去除背景'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-secondary)' }}>
                暂无图片
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="衣物信息" className="card-hover">
            <div style={{ marginBottom: 16 }}>
              <h2 style={{ margin: 0, marginBottom: 12 }}>{clothing.name}</h2>
              <p style={{ margin: '8px 0' }}>
                <strong>分类:</strong> {clothing.category?.name || clothing.category || '未分类'}
              </p>
              <p style={{ margin: '8px 0' }}>
                <strong>描述:</strong> {clothing.description || '暂无描述'}
              </p>
            </div>

            {/* AI 识别的属性 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>衣物属性</h3>
                <Button
                  size="small"
                  icon={recognizingAttributes ? <LoadingOutlined spin /> : <BulbOutlined />}
                  onClick={handleRecognizeAttributes}
                  disabled={recognizingAttributes}
                  style={{ fontSize: 'var(--font-size-xs)' }}
                >
                  {recognizingAttributes ? 'AI 识别中...' : 'AI 智能识别'}
                </Button>
              </div>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {clothing.color && (
                  <Tag color="blue">颜色: {clothing.color}</Tag>
                )}
                {clothing.style && (
                  <Tag color="green">风格: {clothing.style}</Tag>
                )}
                {clothing.season && (
                  <Tag color="orange">季节: {clothing.season}</Tag>
                )}
                {recognizedAttributes && (
                  <>
                    {recognizedAttributes.material && (
                      <Tag color="purple">材质: {recognizedAttributes.material}</Tag>
                    )}
                    {recognizedAttributes.pattern && (
                      <Tag color="cyan">图案: {recognizedAttributes.pattern}</Tag>
                    )}
                  </>
                )}
                {!clothing.color && !clothing.style && !clothing.season && !recognizedAttributes && (
                  <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                    点击「AI 智能识别」自动识别衣物属性
                  </p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ margin: '0 0 8px 0' }}>标签</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(clothing.tags && clothing.tags.length > 0) ? clothing.tags.map((tag, index) => (
                  <Tag key={index} color="default">{tag}</Tag>
                )) : (
                  <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>暂无标签</p>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              <p style={{ margin: '4px 0' }}>创建时间: {new Date(clothing.createdAt).toLocaleString()}</p>
              <p style={{ margin: '4px 0' }}>更新时间: {new Date(clothing.updatedAt).toLocaleString()}</p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                编辑
              </Button>
              <Popconfirm
                title="确定要删除这件衣物吗？"
                description="删除后无法恢复"
                onConfirm={handleDelete}
                okText="确定"
                cancelText="取消"
              >
                <Button danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="搭配建议" className="card-hover" style={{ marginTop: 24 }}>
        <p>基于您的这件{clothing.name}，我们推荐以下搭配：</p>
        <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
          <div style={{ flex: 1 }}>
            <h4>搭配1：牛仔裤</h4>
            <p>经典的{clothing.name}+牛仔裤组合，适合日常休闲场合。</p>
          </div>
          <div style={{ flex: 1 }}>
            <h4>搭配2：黑色短裙</h4>
            <p>{clothing.name}+黑色短裙，简约时尚，适合约会或聚会。</p>
          </div>
        </div>
      </Card>

      {/* 编辑弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EditOutlined style={{ color: 'var(--color-accent)' }} />
            <span>编辑衣物</span>
          </div>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={handleSaveEdit}
        confirmLoading={editLoading}
        okText="保存"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="衣物名称"
            rules={[
              { required: true, message: '请输入衣物名称' },
              { min: 2, max: 50, message: '名称长度应在2-50个字符之间' }
            ]}
          >
            <Input placeholder="请输入衣物名称" size="large" />
          </Form.Item>

          <Form.Item
            name="categoryId"
            label="衣物分类"
            rules={[{ required: true, message: '请选择衣物分类' }]}
          >
            <Select placeholder="请选择衣物分类" size="large">
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 现有图片管理 */}
          <Form.Item label="现有图片">
            {clothing?.images && clothing.images.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                gap: 12 
              }}>
                {clothing.images.map(image => (
                  <div 
                    key={image.id}
                    style={{
                      position: 'relative',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid var(--color-border)'
                    }}
                  >
                    <img
                      src={image.imageUrl || image.url}
                      alt="衣物图片"
                      style={{
                        width: '100%',
                        height: 100,
                        objectFit: 'cover'
                      }}
                    />
                    <Popconfirm
                      title="确定要删除这张图片吗？"
                      onConfirm={() => handleDeleteImage(image.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="primary"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          minWidth: 'auto',
                          padding: '2px 6px'
                        }}
                      />
                    </Popconfirm>
                    {image.imageType === 'processed' && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: 'var(--color-accent)',
                        color: '#fff',
                        fontSize: 10,
                        textAlign: 'center',
                        padding: '2px 0'
                      }}>
                        已去背景
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--color-text-secondary)' }}>暂无图片</div>
            )}
          </Form.Item>

          {/* 上传新图片 */}
          <Form.Item label="添加新图片">
            <Upload
              listType="picture-card"
              fileList={newImageList}
              onChange={({ fileList }) => setNewImageList(fileList)}
              beforeUpload={() => false}
              accept="image/*"
              multiple
            >
              {newImageList.length < 5 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              )}
            </Upload>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
              支持 JPG、PNG 等格式，最多可添加 5 张新图片
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClothingDetail;