import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faVideo, faTimes } from '@fortawesome/free-solid-svg-icons';
import './index.css';

const CreatePost = ({ onClose, onSubmit }) => {
  const [postData, setPostData] = useState({
    type: 'article',
    content: '',
    mediaUrl: '',
    title: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(postData);
  };

  return (
    <div className="create-post-overlay">
      <div className="create-post-container">
        <button className="close-btn" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
        
        <h2>创建新帖子</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="post-type-tabs">
            <button
              type="button"
              className={`type-tab ${postData.type === 'article' ? 'active' : ''}`}
              onClick={() => setPostData({ ...postData, type: 'article' })}
            >
              <FontAwesomeIcon icon={faImage} />
              图文
            </button>
            <button
              type="button"
              className={`type-tab ${postData.type === 'video' ? 'active' : ''}`}
              onClick={() => setPostData({ ...postData, type: 'video' })}
            >
              <FontAwesomeIcon icon={faVideo} />
              视频
            </button>
          </div>

          <input
            type="text"
            placeholder="标题"
            value={postData.title}
            onChange={(e) => setPostData({ ...postData, title: e.target.value })}
          />

          <textarea
            placeholder="分享你的故事..."
            value={postData.content}
            onChange={(e) => setPostData({ ...postData, content: e.target.value })}
          />

          <input
            type="text"
            placeholder={postData.type === 'article' ? '图片链接' : '视频链接'}
            value={postData.mediaUrl}
            onChange={(e) => setPostData({ ...postData, mediaUrl: e.target.value })}
          />

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="submit-btn">
              发布
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
