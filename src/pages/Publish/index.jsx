import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Publish = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: [],
    images: []
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = [
    '感统训练', '自闭症', '视障', '听障', '营养搭配', 
    '教育', '日常护理', '行为训练', '康复治疗', '心理健康'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else if (prev.length < 5) {
        return [...prev, tag];
      }
      return prev;
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    // 这里可以添加图片上传逻辑
    console.log('选择的图片:', files);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('请填写标题和内容');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 模拟发布请求
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 发布成功后返回首页
      alert('发布成功！');
      navigate('/');
    } catch (error) {
      alert('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <span className="font-medium text-gray-900">发布内容</span>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isSubmitting || !formData.title.trim() || !formData.content.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {isSubmitting ? '发布中...' : '发布'}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 标题输入 */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">标题</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="请输入标题..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            maxLength={50}
          />
          <div className="text-right text-gray-400 text-sm mt-1">
            {formData.title.length}/50
          </div>
        </div>

        {/* 内容输入 */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">内容</label>
          <textarea
            value={formData.content}
            onChange={(e) => handleInputChange('content', e.target.value)}
            placeholder="分享你的经验和想法..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={8}
            maxLength={1000}
          />
          <div className="text-right text-gray-400 text-sm mt-1">
            {formData.content.length}/1000
          </div>
        </div>

        {/* 图片上传 */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">添加图片</label>
          <div className="flex items-center space-x-3">
            <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <i className="fas fa-plus text-gray-400 text-xl"></i>
            </label>
            <div className="text-gray-500 text-sm">
              <p>最多可上传9张图片</p>
              <p>支持JPG、PNG格式</p>
            </div>
          </div>
        </div>

        {/* 标签选择 */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            选择标签 ({selectedTags.length}/5)
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* 发布提示 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start">
            <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-3"></i>
            <div className="text-blue-700 text-sm">
              <p className="font-medium mb-1">发布须知</p>
              <ul className="space-y-1 text-xs">
                <li>• 请确保内容真实有效，对他人有帮助</li>
                <li>• 不得发布违法违规或不当内容</li>
                <li>• 尊重他人隐私，保护个人信息</li>
                <li>• 发布后可在个人中心管理你的内容</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Publish;
