import { useState, useEffect, useCallback } from 'react';
import { Button, message, Spin, Upload, Tabs, Modal, Collapse, Badge } from 'antd';
import { 
  CameraOutlined, 
  UploadOutlined, 
  HistoryOutlined, 
  CheckCircleOutlined,
  LoadingOutlined,
  DeleteOutlined,
  EyeOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig.js';

const TryOn = () => {
  const navigate = useNavigate();
  
  // 状态管理
  const [clothingList, setClothingList] = useState([]);
  const [presetModels, setPresetModels] = useState([]);
  const [presetScenes, setPresetScenes] = useState([]);
  const [groupedScenes, setGroupedScenes] = useState({});
  const [categoryNames, setCategoryNames] = useState({});
  const [tryOnHistory, setTryOnHistory] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  
  const [selectedClothing, setSelectedClothing] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedScene, setSelectedScene] = useState(null);
  const [uploadedModelImage, setUploadedModelImage] = useState(null);
  const [modelType, setModelType] = useState('preset'); // 'preset' or 'upload'
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState(null);
  
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  
  const [activeTab, setActiveTab] = useState('generate');

  // 获取 AI 服务状态
  useEffect(() => {
    const fetchAIStatus = async () => {
      try {
        const response = await axiosInstance.get('/tryon/status');
        setAiStatus(response);
      } catch (error) {
        console.error('获取 AI 服务状态失败:', error);
      }
    };
    fetchAIStatus();
  }, []);

  // 获取衣物列表
  useEffect(() => {
    const fetchClothing = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/clothing');
        const clothes = response.clothing || response || [];
        // 只显示有图片的上衣类衣物
        const filteredClothes = clothes.filter(item => 
          item.images && item.images.length > 0
        );
        setClothingList(filteredClothes);
      } catch (error) {
        console.error('获取衣物列表失败:', error);
        message.error('获取衣物列表失败');
      } finally {
        setLoading(false);
      }
    };
    fetchClothing();
  }, []);

  // 获取预设场景列表
  useEffect(() => {
    const fetchPresetScenes = async () => {
      try {
        const response = await axiosInstance.get('/tryon/scenes');
        setPresetScenes(response.scenes || []);
        setGroupedScenes(response.groupedScenes || {});
        setCategoryNames(response.categoryNames || {});
      } catch (error) {
        console.error('获取预设场景失败:', error);
      }
    };
    fetchPresetScenes();
  }, []);

  // 获取预设模特列表
  useEffect(() => {
    const fetchPresetModels = async () => {
      try {
        const response = await axiosInstance.get('/tryon/models');
        setPresetModels(response.models || []);
      } catch (error) {
        console.error('获取预设模特失败:', error);
        // 使用备用数据
        setPresetModels([
          {
            id: 'female_1',
            name: '女性模特 1',
            gender: 'female',
            imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop',
            thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop'
          },
          {
            id: 'female_2',
            name: '女性模特 2',
            gender: 'female',
            imageUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop',
            thumbnail: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop'
          },
          {
            id: 'male_1',
            name: '男性模特 1',
            gender: 'male',
            imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop',
            thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
          },
          {
            id: 'male_2',
            name: '男性模特 2',
            gender: 'male',
            imageUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop',
            thumbnail: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop'
          }
        ]);
      }
    };
    fetchPresetModels();
  }, []);

  // 获取试穿历史
  const fetchHistory = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/tryon/history');
      setTryOnHistory(response.data || []);
    } catch (error) {
      console.error('获取试穿历史失败:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // 生成虚拟试穿图片
  const handleGenerate = async () => {
    if (!selectedClothing) {
      message.warning('请先选择一件衣物');
      return;
    }

    const modelImageUrl = modelType === 'preset' 
      ? selectedModel?.imageUrl 
      : uploadedModelImage;

    if (!modelImageUrl) {
      message.warning('请选择模特或上传照片');
      return;
    }

    setGenerating(true);
    setGeneratedResult(null);

    try {
      const payload = {
        clothingId: selectedClothing.id,
        category: 'upper_body', // MVP 只支持上衣
      };

      if (modelType === 'preset' && selectedModel) {
        payload.presetModelId = selectedModel.id;
      } else {
        payload.modelImageUrl = modelImageUrl;
      }

      // 添加场景选择
      if (selectedScene) {
        payload.sceneId = selectedScene.id;
      }

      const response = await axiosInstance.post('/tryon/generate', payload);

      if (response.success) {
        setGeneratedResult(response.data);
        message.success(response.data.isMock ? '生成完成（Mock 模式）' : '虚拟试穿生成成功！');
        // 刷新历史
        fetchHistory();
      } else {
        message.error(response.message || '生成失败');
      }
    } catch (error) {
      console.error('生成失败:', error);
      message.error('虚拟试穿生成失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  // 删除历史记录
  const handleDeleteHistory = async (id) => {
    try {
      await axiosInstance.delete(`/tryon/history/${id}`);
      message.success('记录已删除');
      fetchHistory();
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  };

  // 处理图片上传
  const handleUpload = (info) => {
    if (info.file.status === 'done') {
      // 如果服务器返回了 URL
      const url = info.file.response?.url || URL.createObjectURL(info.file.originFileObj);
      setUploadedModelImage(url);
      setModelType('upload');
      message.success('图片上传成功');
    } else if (info.file.status === 'error') {
      message.error('图片上传失败');
    }
  };

  // 自定义上传（直接读取本地文件）
  const customUpload = async ({ file, onSuccess }) => {
    // 将文件转换为 base64 或 blob URL
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedModelImage(reader.result);
      setModelType('upload');
      onSuccess({ url: reader.result });
    };
    reader.readAsDataURL(file);
  };

  // 预览图片
  const handlePreview = (imageUrl) => {
    setPreviewImage(imageUrl);
    setPreviewVisible(true);
  };

  // 渲染衣物选择区域
  const renderClothingSelector = () => (
    <div style={{
      backgroundColor: 'var(--color-secondary)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--spacing-6)',
      marginBottom: 'var(--spacing-6)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-base)',
    }}>
      <h3 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--spacing-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
      }}>
        <span style={{ color: 'var(--color-accent)' }}>01</span>
        选择衣物
      </h3>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--spacing-8)' }}>
          <Spin size="large" />
        </div>
      ) : clothingList.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 'var(--spacing-4)',
          maxHeight: '300px',
          overflowY: 'auto',
          padding: 'var(--spacing-2)',
        }}>
          {clothingList.map((clothing) => {
            const isSelected = selectedClothing?.id === clothing.id;
            const imageUrl = clothing.images?.[0]?.imageUrl;
            
            return (
              <div
                key={clothing.id}
                onClick={() => setSelectedClothing(clothing)}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: isSelected 
                    ? '3px solid var(--color-accent)' 
                    : '2px solid var(--color-border)',
                  transition: 'all var(--transition-base)',
                  transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <img
                  src={imageUrl || 'https://via.placeholder.com/150?text=No+Image'}
                  alt={clothing.name}
                  style={{
                    width: '100%',
                    height: '120px',
                    objectFit: 'cover',
                  }}
                />
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    top: 'var(--spacing-2)',
                    right: 'var(--spacing-2)',
                    backgroundColor: 'var(--color-accent)',
                    borderRadius: 'var(--radius-full)',
                    padding: 'var(--spacing-1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <CheckCircleOutlined style={{ color: '#fff', fontSize: '14px' }} />
                  </div>
                )}
                <div style={{
                  padding: 'var(--spacing-2)',
                  backgroundColor: 'var(--color-secondary)',
                  textAlign: 'center',
                }}>
                  <span style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-primary)',
                    fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {clothing.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: 'var(--spacing-8)',
          color: 'var(--color-text-secondary)',
        }}>
          <p>衣橱中暂无衣物</p>
          <Button 
            type="primary" 
            onClick={() => navigate('/closet/add')}
            style={{ marginTop: 'var(--spacing-4)' }}
          >
            添加衣物
          </Button>
        </div>
      )}
    </div>
  );

  // 渲染模特选择区域
  const renderModelSelector = () => (
    <div style={{
      backgroundColor: 'var(--color-secondary)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--spacing-6)',
      marginBottom: 'var(--spacing-6)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-base)',
    }}>
      <h3 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--spacing-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
      }}>
        <span style={{ color: 'var(--color-accent)' }}>02</span>
        选择模特
      </h3>

      <Tabs
        activeKey={modelType}
        onChange={(key) => setModelType(key)}
        items={[
          {
            key: 'preset',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <CameraOutlined />
                预设模特
              </span>
            ),
            children: (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 'var(--spacing-4)',
                padding: 'var(--spacing-2)',
              }}>
                {presetModels.map((model) => {
                  const isSelected = selectedModel?.id === model.id && modelType === 'preset';
                  
                  return (
                    <div
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model);
                        setModelType('preset');
                      }}
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                        border: isSelected 
                          ? '3px solid var(--color-accent)' 
                          : '2px solid var(--color-border)',
                        transition: 'all var(--transition-base)',
                        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                        boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--color-primary)';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      <img
                        src={model.thumbnail || model.imageUrl}
                        alt={model.name}
                        style={{
                          width: '100%',
                          height: '180px',
                          objectFit: 'cover',
                        }}
                      />
                      {isSelected && (
                        <div style={{
                          position: 'absolute',
                          top: 'var(--spacing-2)',
                          right: 'var(--spacing-2)',
                          backgroundColor: 'var(--color-accent)',
                          borderRadius: 'var(--radius-full)',
                          padding: 'var(--spacing-1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <CheckCircleOutlined style={{ color: '#fff', fontSize: '14px' }} />
                        </div>
                      )}
                      <div style={{
                        padding: 'var(--spacing-2)',
                        backgroundColor: 'var(--color-secondary)',
                        textAlign: 'center',
                      }}>
                        <span style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--color-text-primary)',
                          fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                        }}>
                          {model.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ),
          },
          {
            key: 'upload',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <UploadOutlined />
                上传照片
              </span>
            ),
            children: (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-4)',
                padding: 'var(--spacing-6)',
              }}>
                <Upload
                  name="model"
                  accept="image/*"
                  showUploadList={false}
                  customRequest={customUpload}
                  onChange={handleUpload}
                >
                  <div style={{
                    width: '200px',
                    height: '260px',
                    border: '2px dashed var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all var(--transition-base)',
                    backgroundColor: uploadedModelImage ? 'transparent' : 'var(--color-background)',
                    overflow: 'hidden',
                    position: 'relative',
                  }}>
                    {uploadedModelImage ? (
                      <>
                        <img
                          src={uploadedModelImage}
                          alt="上传的照片"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.5)',
                          color: '#fff',
                          padding: 'var(--spacing-2)',
                          textAlign: 'center',
                          fontSize: 'var(--font-size-xs)',
                        }}>
                          点击更换照片
                        </div>
                      </>
                    ) : (
                      <>
                        <UploadOutlined style={{ 
                          fontSize: '48px', 
                          color: 'var(--color-text-secondary)',
                          marginBottom: 'var(--spacing-4)',
                        }} />
                        <span style={{ 
                          color: 'var(--color-text-secondary)',
                          fontSize: 'var(--font-size-sm)',
                        }}>
                          点击上传照片
                        </span>
                        <span style={{ 
                          color: 'var(--color-text-secondary)',
                          fontSize: 'var(--font-size-xs)',
                          marginTop: 'var(--spacing-2)',
                        }}>
                          建议上传正面站立照
                        </span>
                      </>
                    )}
                  </div>
                </Upload>
                <p style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  textAlign: 'center',
                  maxWidth: '300px',
                }}>
                  为获得最佳效果，请上传正面站立的全身照片，背景尽量简洁
                </p>
              </div>
            ),
          },
        ]}
      />
    </div>
  );

  // 渲染场景选择区域
  const renderSceneSelector = () => (
    <div style={{
      backgroundColor: 'var(--color-secondary)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--spacing-6)',
      marginBottom: 'var(--spacing-6)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-base)',
    }}>
      <h3 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--spacing-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
      }}>
        <span style={{ color: 'var(--color-accent)' }}>03</span>
        选择场景
        <Badge 
          count={selectedScene ? 1 : 0} 
          style={{ backgroundColor: 'var(--color-accent)' }}
        />
        <span style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
          fontWeight: 'var(--font-weight-regular)',
          marginLeft: 'auto',
        }}>
          （可选，共 {presetScenes.length} 个场景）
        </span>
      </h3>

      {/* 当前选中的场景 */}
      {selectedScene && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-3)',
          padding: 'var(--spacing-3)',
          backgroundColor: 'rgba(192, 160, 98, 0.1)',
          borderRadius: 'var(--radius-base)',
          marginBottom: 'var(--spacing-4)',
          border: '1px solid var(--color-accent)',
        }}>
          <img
            src={selectedScene.thumbnailUrl || selectedScene.imageUrl}
            alt={selectedScene.name}
            style={{
              width: '60px',
              height: '40px',
              objectFit: 'cover',
              borderRadius: 'var(--radius-sm)',
            }}
          />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
              {selectedScene.name}
            </span>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
              {selectedScene.description}
            </p>
          </div>
          <Button 
            size="small" 
            onClick={() => setSelectedScene(null)}
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            取消选择
          </Button>
        </div>
      )}

      {/* 场景分类折叠面板 */}
      <Collapse
        ghost
        defaultActiveKey={['outdoor', 'indoor']}
        style={{ backgroundColor: 'transparent' }}
        items={Object.entries(groupedScenes).map(([category, scenes]) => ({
          key: category,
          label: (
            <span style={{ 
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-text-primary)',
            }}>
              <EnvironmentOutlined style={{ marginRight: 'var(--spacing-2)' }} />
              {categoryNames[category] || category} 
              <span style={{ 
                color: 'var(--color-text-secondary)', 
                fontWeight: 'var(--font-weight-regular)',
                marginLeft: 'var(--spacing-2)',
              }}>
                ({scenes.length})
              </span>
            </span>
          ),
          children: (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 'var(--spacing-3)',
            }}>
              {scenes.map((scene) => {
                const isSelected = selectedScene?.id === scene.id;
                
                return (
                  <div
                    key={scene.id}
                    onClick={() => setSelectedScene(isSelected ? null : scene)}
                    style={{
                      position: 'relative',
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      border: isSelected 
                        ? '3px solid var(--color-accent)' 
                        : '2px solid var(--color-border)',
                      transition: 'all var(--transition-base)',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                      boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    <img
                      src={scene.thumbnailUrl || scene.imageUrl}
                      alt={scene.name}
                      style={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'cover',
                      }}
                    />
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: 'var(--spacing-1)',
                        right: 'var(--spacing-1)',
                        backgroundColor: 'var(--color-accent)',
                        borderRadius: 'var(--radius-full)',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <CheckCircleOutlined style={{ color: '#fff', fontSize: '12px' }} />
                      </div>
                    )}
                    <div style={{
                      padding: 'var(--spacing-2)',
                      backgroundColor: 'var(--color-secondary)',
                      textAlign: 'center',
                    }}>
                      <span style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-primary)',
                        fontWeight: isSelected ? 'var(--font-weight-semibold)' : 'var(--font-weight-regular)',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {scene.name}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ),
        }))}
      />
    </div>
  );

  // 渲染生成结果区域
  const renderGenerateArea = () => (
    <div style={{
      backgroundColor: 'var(--color-secondary)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--spacing-6)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-base)',
    }}>
      <h3 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--spacing-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
      }}>
        <span style={{ color: 'var(--color-accent)' }}>04</span>
        生成试穿效果
      </h3>

      {/* AI 状态提示 */}
      {aiStatus?.mockMode && (
        <div style={{
          backgroundColor: 'rgba(192, 160, 98, 0.1)',
          border: '1px solid var(--color-accent)',
          borderRadius: 'var(--radius-base)',
          padding: 'var(--spacing-3) var(--spacing-4)',
          marginBottom: 'var(--spacing-4)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-accent)',
        }}>
          ⚠️ {aiStatus.message}
        </div>
      )}

      {/* 选择预览 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: generating || generatedResult ? '1fr 1fr 1fr' : '1fr 1fr',
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-6)',
      }}>
        {/* 选中的衣物 */}
        <div style={{
          textAlign: 'center',
          padding: 'var(--spacing-4)',
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}>
          <p style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-2)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            选中衣物
          </p>
          {selectedClothing ? (
            <img
              src={selectedClothing.images?.[0]?.imageUrl}
              alt={selectedClothing.name}
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-base)',
              }}
            />
          ) : (
            <div style={{
              width: '120px',
              height: '120px',
              backgroundColor: 'var(--color-border)',
              borderRadius: 'var(--radius-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-xs)',
            }}>
              未选择
            </div>
          )}
        </div>

        {/* 选中的模特 */}
        <div style={{
          textAlign: 'center',
          padding: 'var(--spacing-4)',
          backgroundColor: 'var(--color-background)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
        }}>
          <p style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-2)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            选中模特
          </p>
          {(modelType === 'preset' && selectedModel) || (modelType === 'upload' && uploadedModelImage) ? (
            <img
              src={modelType === 'preset' ? selectedModel?.thumbnail : uploadedModelImage}
              alt="选中的模特"
              style={{
                width: '120px',
                height: '120px',
                objectFit: 'cover',
                borderRadius: 'var(--radius-base)',
              }}
            />
          ) : (
            <div style={{
              width: '120px',
              height: '120px',
              backgroundColor: 'var(--color-border)',
              borderRadius: 'var(--radius-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-xs)',
            }}>
              未选择
            </div>
          )}
        </div>

        {/* 生成结果 */}
        {(generating || generatedResult) && (
          <div style={{
            textAlign: 'center',
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-background)',
            borderRadius: 'var(--radius-lg)',
            border: generatedResult ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
          }}>
            <p style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--spacing-2)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              试穿效果
            </p>
            {generating ? (
              <div style={{
                width: '120px',
                height: '120px',
                backgroundColor: 'var(--color-border)',
                borderRadius: 'var(--radius-base)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}>
                <LoadingOutlined style={{ 
                  fontSize: '24px', 
                  color: 'var(--color-accent)',
                  marginBottom: 'var(--spacing-2)',
                }} />
                <span style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                }}>
                  生成中...
                </span>
              </div>
            ) : generatedResult ? (
              <img
                src={generatedResult.generatedImageUrl}
                alt="试穿效果"
                onClick={() => handlePreview(generatedResult.generatedImageUrl)}
                style={{
                  width: '120px',
                  height: '120px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-base)',
                  cursor: 'pointer',
                  transition: 'transform var(--transition-base)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              />
            ) : null}
          </div>
        )}
      </div>

      {/* 生成按钮 */}
      <Button
        type="primary"
        size="large"
        onClick={handleGenerate}
        loading={generating}
        disabled={!selectedClothing || (!selectedModel && !uploadedModelImage)}
        style={{
          width: '100%',
          height: '56px',
          fontSize: 'var(--font-size-lg)',
          fontWeight: 'var(--font-weight-semibold)',
          borderRadius: 'var(--radius-base)',
          background: generating 
            ? 'var(--color-primary)' 
            : 'linear-gradient(135deg, var(--color-primary) 0%, #333 100%)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {generating ? (
          <>
            <LoadingOutlined style={{ marginRight: 'var(--spacing-2)' }} />
            AI 正在生成...
          </>
        ) : (
          '✨ 生成虚拟试穿效果'
        )}
      </Button>

      {/* 生成结果大图 */}
      {generatedResult && (
        <div style={{
          marginTop: 'var(--spacing-6)',
          textAlign: 'center',
        }}>
          <h4 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-4)',
            color: 'var(--color-text-primary)',
          }}>
            🎉 生成完成！
            {generatedResult.isMock && (
              <span style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-accent)',
                marginLeft: 'var(--spacing-2)',
              }}>
                (Mock 示例)
              </span>
            )}
          </h4>
          <div style={{
            display: 'inline-block',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xl)',
            border: '3px solid var(--color-accent)',
          }}>
            <img
              src={generatedResult.generatedImageUrl}
              alt="虚拟试穿效果"
              onClick={() => handlePreview(generatedResult.generatedImageUrl)}
              style={{
                maxWidth: '400px',
                maxHeight: '500px',
                objectFit: 'cover',
                cursor: 'pointer',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );

  // 渲染历史记录
  const renderHistory = () => (
    <div style={{
      backgroundColor: 'var(--color-secondary)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--spacing-6)',
      border: '1px solid var(--color-border)',
      boxShadow: 'var(--shadow-base)',
    }}>
      <h3 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        color: 'var(--color-text-primary)',
        marginBottom: 'var(--spacing-4)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
      }}>
        <HistoryOutlined style={{ color: 'var(--color-accent)' }} />
        试穿历史
      </h3>

      {tryOnHistory.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 'var(--spacing-4)',
        }}>
          {tryOnHistory.map((record, index) => (
            <div
              key={record.id}
              style={{
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                transition: 'all var(--transition-base)',
                animation: `fadeIn 0.6s ease ${0.1 * index}s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={record.generatedImageUrl}
                  alt="试穿效果"
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                  }}
                />
                {record.isMock && (
                  <span style={{
                    position: 'absolute',
                    top: 'var(--spacing-2)',
                    left: 'var(--spacing-2)',
                    backgroundColor: 'var(--color-accent)',
                    color: '#fff',
                    fontSize: 'var(--font-size-xs)',
                    padding: 'var(--spacing-1) var(--spacing-2)',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    Mock
                  </span>
                )}
                
                {/* 操作按钮 */}
                <div style={{
                  position: 'absolute',
                  bottom: 'var(--spacing-2)',
                  right: 'var(--spacing-2)',
                  display: 'flex',
                  gap: 'var(--spacing-2)',
                }}>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => handlePreview(record.generatedImageUrl)}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                    }}
                  />
                  <Button
                    size="small"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={() => handleDeleteHistory(record.id)}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.9)',
                    }}
                  />
                </div>
              </div>
              
              <div style={{ padding: 'var(--spacing-3)' }}>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-1)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {record.clothing?.name || '已删除的衣物'}
                </p>
                <p style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                }}>
                  {new Date(record.createdAt).toLocaleString('zh-CN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: 'var(--spacing-12)',
          color: 'var(--color-text-secondary)',
        }}>
          <HistoryOutlined style={{ fontSize: '48px', marginBottom: 'var(--spacing-4)', opacity: 0.5 }} />
          <p style={{ fontSize: 'var(--font-size-lg)' }}>暂无试穿历史</p>
          <p style={{ fontSize: 'var(--font-size-sm)' }}>开始您的第一次虚拟试穿吧！</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="page-transition">
      {/* 页面标题 */}
      <div style={{ marginBottom: 'var(--spacing-8)' }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>虚拟试穿</h1>
        <p style={{ 
          color: 'var(--color-text-secondary)', 
          fontSize: 'var(--font-size-lg)',
          margin: 'var(--spacing-1) 0 0 0'
        }}>
          选择衣物和模特，AI 为您生成试穿效果图
        </p>
      </div>

      {/* 标签页切换 */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        style={{ marginBottom: 'var(--spacing-6)' }}
        items={[
          {
            key: 'generate',
            label: (
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-2)',
                fontSize: 'var(--font-size-lg)',
              }}>
                <CameraOutlined />
                生成试穿
              </span>
            ),
            children: (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: 'var(--spacing-6)',
              }}>
                <div>
                  {renderClothingSelector()}
                  {renderModelSelector()}
                  {renderSceneSelector()}
                </div>
                <div>
                  {renderGenerateArea()}
                </div>
              </div>
            ),
          },
          {
            key: 'history',
            label: (
              <span style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-2)',
                fontSize: 'var(--font-size-lg)',
              }}>
                <HistoryOutlined />
                历史记录
                {tryOnHistory.length > 0 && (
                  <span style={{
                    backgroundColor: 'var(--color-accent)',
                    color: '#fff',
                    fontSize: 'var(--font-size-xs)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    marginLeft: 'var(--spacing-2)',
                  }}>
                    {tryOnHistory.length}
                  </span>
                )}
              </span>
            ),
            children: renderHistory(),
          },
        ]}
      />

      {/* 图片预览 Modal */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        centered
        styles={{ body: { padding: 0, textAlign: 'center' } }}
      >
        <img
          src={previewImage}
          alt="预览"
          style={{
            maxWidth: '100%',
            maxHeight: '80vh',
            objectFit: 'contain',
          }}
        />
      </Modal>
    </div>
  );
};

export default TryOn;
