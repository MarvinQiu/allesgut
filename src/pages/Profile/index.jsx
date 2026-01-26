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
        <div className="flex justify-center py-12">
          <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50/30 font-body">
      {/* User info section */}
      <UserInfo userInfo={userInfo} />

      {/* Logout button */}
      <div className="flex justify-end px-4 -mt-2 mb-2">
        <button
          onClick={logout}
          className="px-4 py-2 text-primary-500 text-sm font-medium hover:text-primary-700 transition-colors duration-200 cursor-pointer"
        >
          退出登录
        </button>
      </div>

      {/* Tab navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content area */}
      <main className="px-4 py-4 pb-24">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default Profile;
