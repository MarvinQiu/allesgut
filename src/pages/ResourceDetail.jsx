import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPhone, faMapMarkerAlt, faClock, faGlobe } from '@fortawesome/free-solid-svg-icons';
import './ResourceDetail.css';

const ResourceDetail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const resource = location.state?.resource;

  if (!resource) {
    return (
      <div className="resource-detail">
        <div className="detail-header">
          <button className="back-button" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h1>资源不存在</h1>
        </div>
      </div>
    );
  }

  const additionalInfo = {
    address: '北京市东城区帅府园1号',
    phone: '010-12345678',
    hours: '周一至周五 8:00-17:00',
    website: 'https://example.com',
    expertise: ['代谢性疾病', '神经系统疾病', '免疫系统疾病'],
    doctors: [
      {
        name: '张医生',
        title: '主任医师',
        specialty: '代谢病专家',
        avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100'
      },
      {
        name: '李医生',
        title: '副主任医师',
        specialty: '神经病学专家',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100'
      }
    ],
    services: [
      {
        title: '专业诊断',
        description: '提供全面的疾病诊断服务，包括基因检测、生化检查等。'
      },
      {
        title: '个性化治疗',
        description: '根据患者具体情况制定个性化治疗方案。'
      },
      {
        title: '康复指导',
        description: '提供专业的康复训练指导和建议。'
      }
    ]
  };

  return (
    <div className="resource-detail">
      <div className="detail-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1>{resource.title}</h1>
      </div>

      <div className="detail-hero">
        <img src={resource.image} alt={resource.title} className="detail-image" />
        <div className="detail-type">{resource.type}</div>
      </div>

      <div className="detail-content">
        <section className="detail-section">
          <h2>基本信息</h2>
          <div className="info-grid">
            <div className="info-item">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              <div>
                <h4>地址</h4>
                <p>{additionalInfo.address}</p>
              </div>
            </div>
            <div className="info-item">
              <FontAwesomeIcon icon={faPhone} />
              <div>
                <h4>联系电话</h4>
                <p>{additionalInfo.phone}</p>
              </div>
            </div>
            <div className="info-item">
              <FontAwesomeIcon icon={faClock} />
              <div>
                <h4>营业时间</h4>
                <p>{additionalInfo.hours}</p>
              </div>
            </div>
            <div className="info-item">
              <FontAwesomeIcon icon={faGlobe} />
              <div>
                <h4>官方网站</h4>
                <a href={additionalInfo.website} target="_blank" rel="noopener noreferrer">
                  访问网站
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="detail-section">
          <h2>机构简介</h2>
          <p className="description">{resource.description}</p>
          <div className="expertise-tags">
            {additionalInfo.expertise.map((tag, index) => (
              <span key={index} className="expertise-tag">
                {tag}
              </span>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <h2>专家团队</h2>
          <div className="doctors-list">
            {additionalInfo.doctors.map((doctor, index) => (
              <div key={index} className="doctor-card">
                <img src={doctor.avatar} alt={doctor.name} className="doctor-avatar" />
                <div className="doctor-info">
                  <h3>{doctor.name}</h3>
                  <p className="doctor-title">{doctor.title}</p>
                  <p className="doctor-specialty">{doctor.specialty}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <h2>服务内容</h2>
          <div className="services-list">
            {additionalInfo.services.map((service, index) => (
              <div key={index} className="service-card">
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResourceDetail;
