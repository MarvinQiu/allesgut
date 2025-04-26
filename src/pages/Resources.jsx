import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import './Resources.css';

const Resources = () => {
  const navigate = useNavigate();
  const diseaseCategories = [
    { id: 'all', name: '全部' },
    { id: 'metabolic', name: '代谢病' },
    { id: 'nervous', name: '神经系统疾病' },
    { id: 'immune', name: '免疫系统疾病' },
    { id: 'blood', name: '血液系统疾病' },
    { id: 'skeletal', name: '骨骼疾病' },
    { id: 'genetic', name: '遗传性疾病' },
    { id: 'other', name: '其他罕见病' }
  ];

  const [activeCategory, setActiveCategory] = useState('all');

  const allResources = [
    {
      id: 1,
      category: 'metabolic',
      type: '医疗机构',
      title: '北京协和医院-代谢病诊疗中心',
      description: '专业的代谢病诊断和治疗团队，提供全面的医疗服务。',
      image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400'
    },
    {
      id: 2,
      category: 'nervous',
      type: '医疗机构',
      title: '华西医院-神经系统疾病中心',
      description: '专注于神经系统罕见病的诊断与治疗。',
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400'
    },
    {
      id: 3,
      category: 'metabolic',
      type: '培训机构',
      title: '代谢病康复训练中心',
      description: '提供专业的康复训练和指导，帮助病友恢复健康。',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400'
    },
    {
      id: 4,
      category: 'immune',
      type: '医疗机构',
      title: '免疫系统疾病专科医院',
      description: '专注免疫系统疾病的诊断和治疗。',
      image: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1b98?w=400'
    },
    {
      id: 5,
      category: 'blood',
      type: '医疗机构',
      title: '血液病专科医院',
      description: '专业的血液系统疾病诊疗团队。',
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400'
    },
    {
      id: 6,
      category: 'genetic',
      type: '咨询服务',
      title: '遗传病咨询中心',
      description: '提供遗传病相关的专业咨询和指导。',
      image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400'
    }
  ];

  // 根据选中的分类过滤资源
  const filteredResources = activeCategory === 'all'
    ? allResources
    : allResources.filter(resource => resource.category === activeCategory);

  const handleTabClick = (categoryId) => {
    setActiveCategory(categoryId);
  };

  return (
    <div className="resources">
      <div className="resources-header">
        <h1>医疗资源</h1>
        <div className="disease-tabs-container">
          <div className="disease-tabs">
            {diseaseCategories.map(category => (
              <button
                key={category.id}
                className={`disease-tab ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => handleTabClick(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        <div className="search-bar">
          <input type="text" placeholder="搜索医疗资源..." />
        </div>
      </div>
      <div className="resource-grid">
        {filteredResources.map(resource => (
          <div 
            key={resource.id} 
            className="resource-card"
            onClick={() => navigate(`/resource/${resource.id}`, { state: { resource } })}
          >
            <div className="resource-image">
              <img src={resource.image} alt={resource.title} />
              <span className="resource-type">{resource.type}</span>
            </div>
            <div className="resource-content">
              <h3>{resource.title}</h3>
              <p>{resource.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Resources;
