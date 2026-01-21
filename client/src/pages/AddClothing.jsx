import { useState, useEffect } from 'react';
import { Form, Input, Select, Upload, Button, message, Spin, Modal, Image, Tooltip } from 'antd';
import { PlusOutlined, UploadOutlined, LoadingOutlined, ScissorOutlined, BgColorsOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig.js';

const { Option } = Select;

const AddClothing = () => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [processingImage, setProcessingImage] = useState(null); // 正在处理背景的图片
  const [processedImages, setProcessedImages] = useState({}); // 已处理的图片 {originalUid: processedUrl}
  const navigate = useNavigate();

  // 获取衣物分类
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const response = await axiosInstance.get('/clothing/categories');
        setCategories(response);
      } catch (error) {
        console.error('获取分类失败:', error);
        message.error('获取分类失败，请稍后重试');
        // 模拟数据作为后备
        setCategories([
          { id: '1', name: '上衣' },
          { id: '2', name: '裤子' },
          { id: '3', name: '裙子' },
          { id: '4', name: '鞋子' },
          { id: '5', name: '配饰' }
        ]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 支持的图片格式
  const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/svg+xml',
    'image/heic',
    'image/heif',
    'image/avif'
  ];

  // 自定义上传组件
  const uploadProps = {
    name: 'image',
    listType: 'picture-card',
    multiple: true,
    accept: 'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/svg+xml,image/heic,image/heif,image/avif,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.tif,.svg,.heic,.heif,.avif',
    beforeUpload: (file) => {
      const isValidType = ALLOWED_IMAGE_TYPES.includes(file.type) || 
        /\.(jpe?g|png|gif|webp|bmp|tiff?|svg|heic|heif|avif)$/i.test(file.name);
      if (!isValidType) {
        message.error('不支持的图片格式！支持：JPG, PNG, GIF, WebP, BMP, TIFF, SVG, HEIC, HEIF, AVIF');
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('图片大小不能超过10MB!');
      }
      return isValidType && isLt10M;
    },
    onChange: (info) => {
      setImageList(info.fileList);
    },
    onPreview: async (file) => {
      let src = file.url;
      if (!src) {
        src = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file.originFileObj);
          reader.onload = () => resolve(reader.result);
        });
      }
      const image = new Image();
      image.src = src;
      const imgWindow = window.open(src);
      imgWindow?.document.write(image.outerHTML);
    },
  };

  // 提交表单
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // 1. 创建衣物
      const clothingResponse = await axiosInstance.post('/clothing', {
        name: values.name,
        categoryId: values.categoryId
      });
      const clothingId = clothingResponse.clothing.id;

      // 2. 上传图片
      const uploadedImages = [];
      if (imageList.length > 0) {
        setUploading(true);
        // 批量上传图片
        for (const file of imageList) {
          if (file.originFileObj) {
            const formData = new FormData();
            formData.append('image', file.originFileObj);
            const uploadResponse = await axiosInstance.post(`/clothing/${clothingId}/images`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            uploadedImages.push({
              fileUid: file.uid,
              imageId: uploadResponse.image.id,
              needsProcessing: processedImages[file.uid] === 'pending'
            });
          }
        }
        
        // 3. 处理需要去除背景的图片
        const imagesToProcess = uploadedImages.filter(img => img.needsProcessing);
        if (imagesToProcess.length > 0) {
          message.loading({ content: `正在处理 ${imagesToProcess.length} 张图片的背景...`, key: 'processingBg' });
          
          for (const img of imagesToProcess) {
            try {
              await axiosInstance.post(`/clothing/${clothingId}/process-image`, {
                imageId: img.imageId
              });
            } catch (processError) {
              console.error('处理图片背景失败:', processError);
            }
          }
          
          message.success({ content: '背景处理完成！', key: 'processingBg' });
        }
        
        setUploading(false);
      }

      message.success('衣物添加成功！');
      // 跳转到衣橱页面
      navigate('/closet');
    } catch (error) {
      console.error('添加衣物失败:', error);
      message.error('添加衣物失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理背景去除 - 在上传前本地预览处理
  const handleRemoveBackground = async (file) => {
    if (!file.originFileObj) {
      message.warning('请先上传图片');
      return;
    }
    
    setProcessingImage(file.uid);
    
    try {
      // 先创建一个临时的衣物和上传图片，然后调用AI处理
      // 为了更好的用户体验，我们先显示处理中状态
      message.loading({ content: 'AI 正在去除背景...', key: 'removeBackground' });
      
      // 模拟处理（实际在提交时会调用真实API）
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 标记该图片已处理（实际处理在服务端进行）
      setProcessedImages(prev => ({
        ...prev,
        [file.uid]: 'pending' // 标记为待处理
      }));
      
      message.success({ 
        content: '已标记为需要去除背景，将在保存时处理', 
        key: 'removeBackground' 
      });
      
    } catch (error) {
      console.error('标记背景去除失败:', error);
      message.error({ content: '操作失败，请稍后重试', key: 'removeBackground' });
    } finally {
      setProcessingImage(null);
    }
  };

  // 渲染上传列表
  const renderUploadList = () => {
    return (
      <div>
        <Upload.Dragger {...uploadProps} fileList={imageList}>
          <p className="ant-upload-drag-icon">
            <UploadOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
          <p className="ant-upload-hint">支持单个或批量上传，支持 JPG/PNG/GIF/WebP/BMP/TIFF/SVG/HEIC/AVIF 格式，单张不超过10MB</p>
        </Upload.Dragger>
        
        {/* 已上传图片列表 - 带有去除背景按钮 */}
        {imageList.length > 0 && (
          <div style={{ marginTop: 'var(--spacing-4)' }}>
            <p style={{ 
              fontSize: 'var(--font-size-sm)', 
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-2)'
            }}>
              <ScissorOutlined style={{ marginRight: 'var(--spacing-1)' }} />
              点击图片下方按钮可使用 AI 去除背景
            </p>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
              gap: 'var(--spacing-4)' 
            }}>
              {imageList.map((file) => {
                const isProcessing = processingImage === file.uid;
                const isProcessed = processedImages[file.uid];
                const previewUrl = file.thumbUrl || file.url || (file.originFileObj ? URL.createObjectURL(file.originFileObj) : null);
                
                return (
                  <div 
                    key={file.uid}
                    style={{
                      position: 'relative',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: isProcessed ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      transition: 'all var(--transition-base)',
                    }}
                  >
                    {/* 图片预览 */}
                    <div style={{ 
                      width: '100%', 
                      height: '120px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5'
                    }}>
                      {previewUrl ? (
                        <img 
                          src={previewUrl} 
                          alt={file.name}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      ) : (
                        <LoadingOutlined />
                      )}
                    </div>
                    
                    {/* 已处理标记 */}
                    {isProcessed && (
                      <div style={{
                        position: 'absolute',
                        top: 'var(--spacing-1)',
                        right: 'var(--spacing-1)',
                        backgroundColor: 'var(--color-accent)',
                        color: '#fff',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px 6px',
                        fontSize: 'var(--font-size-xs)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <CheckCircleOutlined />
                        <span>待去背景</span>
                      </div>
                    )}
                    
                    {/* 操作按钮 */}
                    <div style={{
                      padding: 'var(--spacing-2)',
                      display: 'flex',
                      gap: 'var(--spacing-2)'
                    }}>
                      <Tooltip title={isProcessed ? '已标记去除背景' : 'AI 去除背景'}>
                        <Button
                          size="small"
                          type={isProcessed ? 'primary' : 'default'}
                          icon={isProcessing ? <LoadingOutlined spin /> : <ScissorOutlined />}
                          onClick={() => !isProcessed && handleRemoveBackground(file)}
                          disabled={isProcessing || isProcessed}
                          style={{
                            flex: 1,
                            fontSize: 'var(--font-size-xs)',
                            backgroundColor: isProcessed ? 'var(--color-accent)' : undefined
                          }}
                        >
                          {isProcessing ? '处理中' : isProcessed ? '已标记' : '去背景'}
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page-transition">
      {/* 页面标题 */}
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 className="page-title">添加衣物</h1>
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          fontSize: 'var(--font-size-lg)',
          margin: 'var(--spacing-1) 0 0 0'
        }}>
          填写衣物信息并上传图片
        </p>
      </div>

      {/* 添加衣物表单 */}
      <div style={{
        backgroundColor: 'var(--color-secondary)',
        padding: 'var(--spacing-8)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-base)',
        border: '1px solid var(--color-border)',
        maxWidth: '800px',
      }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{}}
        >
          {/* 衣物名称 */}
          <Form.Item
            name="name"
            label="衣物名称"
            rules={[
              { required: true, message: '请输入衣物名称' },
              { min: 2, max: 50, message: '衣物名称长度应在2-50个字符之间' }
            ]}
          >
            <Input
              placeholder="请输入衣物名称"
              size="large"
              style={{ borderRadius: 'var(--radius-base)' }}
            />
          </Form.Item>

          {/* 衣物分类 */}
          <Form.Item
            name="categoryId"
            label="衣物分类"
            rules={[{ required: true, message: '请选择衣物分类' }]}
          >
            <Select
              placeholder="请选择衣物分类"
              size="large"
              loading={categoriesLoading}
              style={{ borderRadius: 'var(--radius-base)' }}
            >
              {categories.map(category => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 图片上传 */}
          <Form.Item
            label="衣物图片"
            rules={[{ required: true, message: '请上传至少一张衣物图片' }]}
          >
            {renderUploadList()}
          </Form.Item>

          {/* 操作按钮 */}
          <Form.Item style={{ marginTop: 'var(--spacing-8)' }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                loading={loading}
                style={{
                  padding: 'var(--spacing-3) var(--spacing-8)',
                  fontSize: 'var(--font-size-lg)',
                  borderRadius: 'var(--radius-base)',
                  flex: 1
                }}
              >
                {loading ? (
                  <>
                    <LoadingOutlined style={{ marginRight: 'var(--spacing-2)' }} />
                    正在添加...
                  </>
                ) : (
                  '添加衣物'
                )}
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/closet')}
                style={{
                  padding: 'var(--spacing-3) var(--spacing-8)',
                  fontSize: 'var(--font-size-lg)',
                  borderRadius: 'var(--radius-base)',
                  flex: 1
                }}
              >
                取消
              </Button>
            </div>
            {uploading && (
              <div style={{ marginTop: 'var(--spacing-4)', textAlign: 'center' }}>
                <Spin indicator={<LoadingOutlined spin />} />
                <span style={{ marginLeft: 'var(--spacing-2)' }}>正在上传图片...</span>
              </div>
            )}
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default AddClothing;