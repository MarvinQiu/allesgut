import React, { useState } from 'react';
import UserInfo from '../../components/UserInfo';
import TabNavigation from '../../components/TabNavigation';
import UserPostGrid from '../../components/PostGrid';
import OrderList from '../../components/OrderList';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('posts');

  const tabs = [
    { id: 'posts', label: '我的发布', icon: 'fas fa-edit' },
    { id: 'favorites', label: '我的收藏', icon: 'fas fa-heart' },
    { id: 'orders', label: '我的订单', icon: 'fas fa-shopping-bag' }
  ];

  const mockUserInfo = {
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face',
    nickname: '小雨妈妈',
    bio: '自闭症儿童家长，分享康复训练经验',
    postsCount: 23,
    followersCount: 1200,
    followingCount: 89
  };

  const mockPosts = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=200&h=200&fit=crop',
      title: '感统训练小技巧',
      likes: 128
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop',
      title: '日常作息建立',
      likes: 203
    }
  ];

  const mockOrders = [
    {
      id: 'ORD001',
      status: 'delivered',
      statusText: '已完成',
      date: '2024-01-15',
      total: 168,
      items: [
        {
          name: '感统训练平衡板',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
          price: 168,
          quantity: 1
        }
      ]
    },
    {
      id: 'ORD002',
      status: 'shipping',
      statusText: '配送中',
      date: '2024-01-18',
      total: 217,
      items: [
        {
          name: '盲文学习板套装',
          image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=100&h=100&fit=crop',
          price: 89,
          quantity: 1
        },
        {
          name: '儿童专用营养补充剂',
          image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=100&h=100&fit=crop',
          price: 128,
          quantity: 1
        }
      ]
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return <UserPostGrid posts={mockPosts} />;
      case 'favorites':
        return <UserPostGrid posts={mockPosts} />;
      case 'orders':
        return <OrderList orders={mockOrders} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 用户信息区域 */}
      <UserInfo userInfo={mockUserInfo} />
      
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
