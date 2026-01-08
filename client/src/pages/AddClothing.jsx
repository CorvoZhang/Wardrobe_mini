import { useState, useEffect } from 'react';
import { Form, Input, Select, Upload, Button, message, Spin } from 'antd';
import { PlusOutlined, UploadOutlined, LoadingOutlined } from '@ant-design/icons';
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

  // 自定义上传组件
  const uploadProps = {
    name: 'image',
    listType: 'picture-card',
    multiple: true,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('只支持JPG/PNG格式的图片!');
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('图片大小不能超过5MB!');
      }
      return isJpgOrPng && isLt5M;
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
      if (imageList.length > 0) {
        setUploading(true);
        // 批量上传图片
        for (const file of imageList) {
          if (file.originFileObj) {
            const formData = new FormData();
            formData.append('image', file.originFileObj);
            await axiosInstance.post(`/clothing/${clothingId}/images`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
          }
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

  // 渲染上传列表
  const renderUploadList = () => {
    return (
      <Upload.Dragger {...uploadProps}>
        <p className="ant-upload-drag-icon">
          <UploadOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
        <p className="ant-upload-hint">支持单个或批量上传，仅支持JPG/PNG格式，单张不超过5MB</p>
      </Upload.Dragger>
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