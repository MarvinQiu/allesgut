import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usersService } from '../../services/users';
import UserInfo from '../../components/UserInfo';
import TabNavigation from '../../components/TabNavigation';
import UserPostGrid from '../../components/PostGrid';

const Profile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'posts', label: '我的发布', icon: 'fas fa-edit' },
    { id: 'favorites', label: '我的收藏', icon: 'fas fa-heart' }
  ];

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        if (activeTab === 'posts') {
          const result = await usersService.getUserPosts(user.id);
          setPosts(result.posts || []);
        } else if (activeTab === 'favorites') {
          const result = await usersService.getMyFavorites();
          setFavorites(result.posts || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab, user]);

  const userInfo = {
    avatar: user?.avatar_url || 'https://via.placeholder.com/200',
    nickname: user?.nickname || '用户',
    bio: user?.bio || '',
    postsCount: user?.posts_count || 0,
    followersCount: user?.followers_count || 0,
    followingCount: user?.following_count || 0
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <i className="fas fa-spinner fa-spin text-gray-400"></i>
        </div>
      );
    }

    switch (activeTab) {
      case 'posts':
        return <UserPostGrid posts={posts} emptyMessage="还没有发布内容" />;
      case 'favorites':
        return <UserPostGrid posts={favorites} emptyMessage="还没有收藏内容" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 用户信息区域 */}
      <UserInfo userInfo={userInfo} />

      {/* 退出登录按钮 */}
      <div className="flex justify-end px-4 -mt-2 mb-2">
        <button
          onClick={logout}
          className="px-4 py-2 text-gray-500 text-sm"
        >
          退出登录
        </button>
      </div>

      {/* 标签导航 */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 内容区域 */}
      <div className="px-4 py-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Profile;
