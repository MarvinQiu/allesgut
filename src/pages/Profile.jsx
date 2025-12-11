import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faCog,
  faHeart,
  faBookmark,
  faUser,
  faMapMarkerAlt,
  faLock,
  faThumbsUp,
  faChevronRight,
  faSignOutAlt,
  faCamera
} from '@fortawesome/free-solid-svg-icons';
import { mockUploadFiles } from '../services/upload';
import { getPostsByAuthor } from '../services/db';
import './Profile.css';

const DEFAULT_USER = {
  avatar: 'https://via.placeholder.com/80',
  nickname: '当前用户',
  userId: 'ID: 12345678',
  bio: '',
  location: '',
  stats: {
    following: 128,
    followers: 256,
    likes: 0,
    favorites: 0
  }
};

const STORAGE_KEYS = {
  user: 'profile_user',
  favorites: 'profile_favorites',
  likes: 'profile_likes'
};

const Profile = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [userInfo, setUserInfo] = useState(DEFAULT_USER);
  const [activeTab, setActiveTab] = useState('posts');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: '',
    userId: '',
    bio: '',
    location: ''
  });
  const [userPosts, setUserPosts] = useState([]);
  const [favoritePosts, setFavoritePosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    initProfile();
  }, []);

  useEffect(() => {
    setUserInfo(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        favorites: favoritePosts.length,
        likes: likedPosts.length
      }
    }));
  }, [favoritePosts, likedPosts]);

  const initProfile = async () => {
    const savedUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null');
    const savedFavorites = JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || '[]');
    const savedLikes = JSON.parse(localStorage.getItem(STORAGE_KEYS.likes) || '[]');

    const mergedUser = {
      ...DEFAULT_USER,
      ...savedUser,
      stats: {
        ...DEFAULT_USER.stats,
        ...(savedUser?.stats || {}),
        favorites: savedFavorites.length,
        likes: savedLikes.length
      }
    };

    setUserInfo(mergedUser);
    setFavoritePosts(savedFavorites);
    setLikedPosts(savedLikes);

    await loadUserPosts([mergedUser.nickname, DEFAULT_USER.nickname]);
  };

  const loadUserPosts = async (names = []) => {
    const targets = Array.from(new Set(names.filter(Boolean)));
    if (targets.length === 0) return;
    setLoadingContent(true);
    try {
      const results = await Promise.all(targets.map(name => getPostsByAuthor(name)));
      const merged = results.flat().reduce((acc, post) => {
        if (!acc.find(item => item.id === post.id)) {
          acc.push(post);
        }
        return acc;
      }, []);
      setUserPosts(merged);
    } catch (error) {
      console.error('加载用户内容失败:', error);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setUploadingAvatar(true);
      // 这里应该调用实际的上传API
      const uploadedUrl = await mockUploadFiles([file]);
      setUserInfo(prev => {
        const updated = { ...prev, avatar: uploadedUrl[0] };
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('上传头像失败:', error);
      // 这里可以添加错误提示
    } finally {
      setUploadingAvatar(false);
      event.target.value = '';
    }
  };

  const handleStartEdit = () => {
    setEditForm({
      nickname: userInfo.nickname,
      userId: userInfo.userId,
      bio: userInfo.bio || '',
      location: userInfo.location || ''
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    const updated = {
      ...userInfo,
      nickname: editForm.nickname.trim() || DEFAULT_USER.nickname,
      userId: editForm.userId.trim() || userInfo.userId,
      bio: editForm.bio,
      location: editForm.location
    };

    setUserInfo(updated);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updated));
    setShowEditModal(false);
    await loadUserPosts([updated.nickname, DEFAULT_USER.nickname]);
  };

  const handleMenuClick = (link) => {
    navigate(link);
  };

  const handleToggleFavorite = (post) => {
    setFavoritePosts(prev => {
      const exists = prev.find(item => item.id === post.id);
      const updated = exists ? prev.filter(item => item.id !== post.id) : [...prev, post];
      localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleLike = (post) => {
    setLikedPosts(prev => {
      const exists = prev.find(item => item.id === post.id);
      const updated = exists ? prev.filter(item => item.id !== post.id) : [...prev, post];
      localStorage.setItem(STORAGE_KEYS.likes, JSON.stringify(updated));
      return updated;
    });
  };

  const isFavorite = (postId) => favoritePosts.some(item => item.id === postId);
  const isLiked = (postId) => likedPosts.some(item => item.id === postId);

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.user);
    localStorage.removeItem(STORAGE_KEYS.favorites);
    localStorage.removeItem(STORAGE_KEYS.likes);
    navigate('/');
  };

  const renderEmptyState = (icon, text) => (
    <div className="empty-state">
      <FontAwesomeIcon icon={icon} size="2x" />
      <p>{text}</p>
    </div>
  );

  const renderContentCards = (list, allowActions = false) => {
    if (list.length === 0) {
      return renderEmptyState(faBookmark, '暂无内容');
    }

    return list.map(post => (
      <div key={post.id} className="content-card">
        <div className="content-main">
          <div className="content-title">{post.content || '无标题内容'}</div>
          <div className="content-tags">
            <span className="tag">{post.type === 'video' ? '视频' : '图文'}</span>
            {post.images?.length > 0 && <span className="tag">图片 {post.images.length}</span>}
          </div>
          <div className="content-meta">
            <span>点赞 {post.likes || 0}</span>
            <span>评论 {post.comments?.length || 0}</span>
          </div>
          {allowActions && (
            <div className="content-actions">
              <button 
                className={isFavorite(post.id) ? 'active' : ''} 
                onClick={() => handleToggleFavorite(post)}
              >
                <FontAwesomeIcon icon={faBookmark} />
                {isFavorite(post.id) ? '已收藏' : '收藏'}
              </button>
              <button 
                className={isLiked(post.id) ? 'active' : ''} 
                onClick={() => handleToggleLike(post)}
              >
                <FontAwesomeIcon icon={faThumbsUp} />
                {isLiked(post.id) ? '已点赞' : '点赞'}
              </button>
            </div>
          )}
        </div>
        {post.images?.[0] && (
          <img className="content-cover" src={post.images[0]} alt="封面" />
        )}
      </div>
    ));
  };

  const menuItems = [
    {
      title: '个人资料',
      icon: faUser,
      link: '/profile/edit'
    },
    {
      title: '收货地址',
      icon: faMapMarkerAlt,
      link: '/profile/address'
    },
    {
      title: '账号安全',
      icon: faLock,
      link: '/profile/security'
    },
    {
      title: '内容偏好',
      icon: faCog,
      link: '/profile/preferences'
    }
  ];

  return (
    <div className="profile">
      {/* 用户信息卡片 */}
      <div className="profile-header">
        <button className="edit-profile-btn" onClick={handleStartEdit}>
          <FontAwesomeIcon icon={faEdit} />
          编辑资料
        </button>
        <div className="user-info">
          <div className="avatar-container">
            <img 
              src={userInfo.avatar} 
              alt="用户头像" 
              className={`avatar ${uploadingAvatar ? 'uploading' : ''}`} 
            />
            <button className="edit-avatar" onClick={handleAvatarClick}>
              <FontAwesomeIcon icon={faCamera} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
          </div>
          <div className="user-details">
            <h2>{userInfo.nickname}</h2>
            <p className="user-id">{userInfo.userId}</p>
            <div className="user-stats">
              <div className="stat-item">
                <span className="stat-value">{userInfo.stats.following}</span>
                <span className="stat-label">关注</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{userInfo.stats.followers}</span>
                <span className="stat-label">粉丝</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{userInfo.stats.likes}</span>
                <span className="stat-label">获赞</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{userInfo.stats.favorites}</span>
                <span className="stat-label">收藏</span>
              </div>
            </div>
            {(userInfo.bio || userInfo.location) && (
              <div className="user-extra">
                {userInfo.bio && <p className="bio-text">{userInfo.bio}</p>}
                {userInfo.location && (
                  <div className="location">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                    <span>{userInfo.location}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 设置菜单 */}
      <div className="profile-menu">
        {menuItems.map((item, index) => (
          <div 
            key={index} 
            className="menu-item"
            onClick={() => handleMenuClick(item.link)}
          >
            <div className="menu-item-left">
              <FontAwesomeIcon icon={item.icon} className="menu-icon" />
              <span>{item.title}</span>
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="arrow-icon" />
          </div>
        ))}
      </div>

      {/* 内容标签页 */}
      <div className="content-tabs">
        <button 
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          <FontAwesomeIcon icon={faUser} />
          我的发布 ({userPosts.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          <FontAwesomeIcon icon={faBookmark} />
          我的收藏 ({favoritePosts.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'likes' ? 'active' : ''}`}
          onClick={() => setActiveTab('likes')}
        >
          <FontAwesomeIcon icon={faThumbsUp} />
          我的点赞 ({likedPosts.length})
        </button>
      </div>

      {/* 内容列表 */}
      <div className="content-list">
        {activeTab === 'posts' && (
          <>
            {loadingContent && (
              <div className="empty-state">
                <p>加载中...</p>
              </div>
            )}
            {!loadingContent && renderContentCards(userPosts, true)}
          </>
        )}
        {activeTab === 'favorites' && (
          renderContentCards(favoritePosts, true)
        )}
        {activeTab === 'likes' && (
          renderContentCards(likedPosts, true)
        )}
      </div>

      {/* 退出登录按钮 */}
      <div className="logout-button" onClick={handleLogout}>
        <FontAwesomeIcon icon={faSignOutAlt} className="logout-icon" />
        <span>退出登录</span>
      </div>

      {showEditModal && (
        <div className="profile-modal">
          <div className="profile-modal-content">
            <h3>编辑资料</h3>
            <label>
              昵称
              <input 
                type="text"
                value={editForm.nickname}
                onChange={e => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
              />
            </label>
            <label>
              用户ID
              <input 
                type="text"
                value={editForm.userId}
                onChange={e => setEditForm(prev => ({ ...prev, userId: e.target.value }))}
              />
            </label>
            <label>
              个性签名
              <textarea
                rows="3"
                value={editForm.bio}
                onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="填写一句话介绍自己"
              />
            </label>
            <label>
              所在地
              <input 
                type="text"
                value={editForm.location}
                onChange={e => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                placeholder="城市 / 国家"
              />
            </label>
            <div className="modal-actions">
              <button className="secondary" onClick={() => setShowEditModal(false)}>取消</button>
              <button onClick={handleSaveProfile}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;