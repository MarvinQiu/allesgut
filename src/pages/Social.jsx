import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faImage, faVideo, faHeart, faComment, faShare, faPlay, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { getPosts, likePost, addComment, addPost } from '../services/db';
import { mockUploadFiles } from '../services/upload';
import './Social.css';

const Social = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPost, setNewPost] = useState({
    type: 'article',
    content: '',
    images: [],
    videoUrl: '',
    videoPoster: ''
  });
  const [uploadingFiles, setUploadingFiles] = useState(0);
  const fileInputRef = useRef(null);

  const getCurrentUser = () => {
    const saved = JSON.parse(localStorage.getItem('profile_user') || 'null');
    return saved || {
      nickname: '当前用户',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
    };
  };

  const handleFileSelect = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    try {
      setUploadingFiles(files.length);
      const uploadedUrls = await mockUploadFiles(files);
      setNewPost(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
    } catch (error) {
      console.error('上传图片失败:', error);
      // 这里可以添加错误提示
    } finally {
      setUploadingFiles(0);
      // 清空input，允许重复选择同一文件
      event.target.value = '';
    }
  };

  const handleRemoveImage = (index) => {
    setNewPost(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // 初始化加载帖子
  useEffect(() => {
    loadPosts();
  }, []);

  // 加载帖子数据
  const loadPosts = async (page = 1) => {
    try {
      setLoading(true);
      const fetchedPosts = await getPosts('all', page);
      if (page === 1) {
        setPosts(fetchedPosts);
      } else {
        setPosts(prev => [...prev, ...fetchedPosts]);
      }
      setHasMore(fetchedPosts.length === 10);
      setCurrentPage(page);
    } catch (error) {
      console.error('加载帖子失败:', error);
      // 可以添加错误提示UI
    } finally {
      setLoading(false);
    }
  };

  // 处理点赞
  const handleLike = async (postId) => {
    try {
      const updatedPost = await likePost(postId);
      setPosts(prev => prev.map(post => 
        post.id === postId ? updatedPost : post
      ));
    } catch (error) {
      console.error('点赞失败:', error);
    }
  };

  // 处理评论
  const handleComment = async (postId, comment) => {
    try {
      const currentUser = getCurrentUser();
      const updatedPost = await addComment(postId, {
        content: comment,
        author: currentUser.nickname || '当前用户',
        avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
      });
      setPosts(prev => prev.map(post => 
        post.id === postId ? updatedPost : post
      ));
    } catch (error) {
      console.error('评论失败:', error);
    }
  };

  // 创建新帖子
  const handleCreatePost = async () => {
    try {
      const currentUser = getCurrentUser();
      const post = {
        ...newPost,
        author: currentUser.nickname || '当前用户',
        avatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
      };
      await addPost(post);
      setShowCreateModal(false);
      setNewPost({
        type: 'article',
        content: '',
        images: [],
        videoUrl: '',
        videoPoster: ''
      });
      loadPosts(1); // 重新加载第一页
    } catch (error) {
      console.error('创建帖子失败:', error);
    }
  };

  return (
    <div className="social">
      <div className="social-header">
        <h1>互动社区</h1>
        <button 
          className="create-post-btn"
          type="button"
          onClick={() => setShowCreateModal(true)}
        >
          <FontAwesomeIcon icon={faImage} />
          发布动态
        </button>
      </div>

      {loading && (
        <div className="loading">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>加载中...</span>
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="empty-state">
          <p>暂无动态，快来发布第一条吧！</p>
        </div>
      )}

      <div className="posts-container">
        {posts.map(post => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <img src={post.avatar} alt={post.author} className="author-avatar" />
              <span className="author-name">{post.author}</span>
            </div>
            <div className="post-content">
              <p>{post.content}</p>
              {post.images?.length > 0 && (
                <div className={`post-images-grid grid-${Math.min(post.images.length, 4)}`}>
                  {post.images.slice(0, 4).map((image, index) => (
                    <div key={index} className="post-image-item">
                      <img src={image} alt={`图片 ${index + 1}`} loading="lazy" />
                      {post.images.length > 4 && index === 3 && (
                        <div className="more-images">
                          +{post.images.length - 4}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {post.type === 'video' && post.videoUrl && (
                <div className="post-video">
                  <video
                    controls
                    preload="metadata"
                    poster={post.videoPoster}
                    playsInline
                    webkit-playsinline="true"
                  >
                    <source src={post.videoUrl} type="video/mp4" />
                    您的浏览器不支持视频播放
                  </video>
                  <div className="video-overlay">
                    <div className="play-button">
                      <FontAwesomeIcon icon={faPlay} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="post-footer">
              <div className="post-actions">
                <button 
                  className={`action-btn ${post.liked ? 'liked' : ''}`}
                  onClick={() => handleLike(post.id)}
                >
                  <FontAwesomeIcon icon={faHeart} />
                  <span>{post.likes}</span>
                </button>
                <button 
                  className="action-btn"
                  onClick={() => handleComment(post.id, '测试评论')}
                >
                  <FontAwesomeIcon icon={faComment} />
                  <span>{post.comments.length}</span>
                </button>
                <button className="action-btn">
                  <FontAwesomeIcon icon={faShare} />
                </button>
              </div>
              {post.comments.length > 0 && (
                <div className="comments-section">
                  {post.comments.map(comment => (
                    <div key={comment.id} className="comment">
                      <img src={comment.avatar} alt={comment.author} className="comment-avatar" />
                      <div className="comment-content">
                        <span className="comment-author">{comment.author}</span>
                        <p>{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMore && !loading && (
        <button 
          className="load-more-btn"
          onClick={() => loadPosts(currentPage + 1)}
        >
          加载更多
        </button>
      )}

      {showCreateModal && (
        <div className="create-post-modal">
          <div className="modal-content">
            <h2>发布新动态</h2>
            <div className="post-type-selector">
              <button
                className={newPost.type === 'article' ? 'active' : ''}
                onClick={() => setNewPost(prev => ({ ...prev, type: 'article' }))}
              >
                <FontAwesomeIcon icon={faImage} />
                图文
              </button>
              <button
                className={newPost.type === 'video' ? 'active' : ''}
                onClick={() => setNewPost(prev => ({ ...prev, type: 'video' }))}
              >
                <FontAwesomeIcon icon={faVideo} />
                视频
              </button>
            </div>
            <textarea
              placeholder="分享你的故事..."
              value={newPost.content}
              onChange={e => setNewPost(prev => ({ ...prev, content: e.target.value }))}
            />
            {newPost.type === 'article' && (
              <div className="upload-section">
                <label>添加图片</label>
                <div className="upload-area" onClick={() => fileInputRef.current.click()}>
                  <FontAwesomeIcon icon={faImage} />
                  <span>点击上传图片</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
                {uploadingFiles > 0 && (
                  <div className="upload-progress">
                    <FontAwesomeIcon icon={faSpinner} spin />
                    <span>正在上传 {uploadingFiles} 个文件...</span>
                  </div>
                )}
                {newPost.images?.length > 0 && (
                  <div className="image-preview-grid">
                    {newPost.images.map((image, index) => (
                      <div key={index} className="preview-item">
                        <img src={image} alt={`预览 ${index + 1}`} />
                        <button
                          className="remove-image"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {newPost.type === 'video' && (
              <div className="upload-section">
                <label>添加视频</label>
                <input
                  type="text"
                  placeholder="视频链接（支持mp4格式）"
                  value={newPost.videoUrl}
                  onChange={e => setNewPost(prev => ({ ...prev, videoUrl: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="视频封面图片链接（可选）"
                  value={newPost.videoPoster}
                  onChange={e => setNewPost(prev => ({ ...prev, videoPoster: e.target.value }))}
                />
                {newPost.videoUrl && (
                  <div className="video-preview">
                    <video
                      controls
                      poster={newPost.videoPoster}
                      preload="metadata"
                    >
                      <source src={newPost.videoUrl} type="video/mp4" />
                      您的浏览器不支持视频播放
                    </video>
                  </div>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button type="button" onClick={() => setShowCreateModal(false)}>取消</button>
              <button type="button" onClick={handleCreatePost}>发布</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Social;
