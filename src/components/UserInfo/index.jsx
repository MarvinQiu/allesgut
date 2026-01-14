import React from 'react';

const UserInfo = ({ userInfo }) => {
  return (
    <div className="bg-white">
      {/* 背景装饰 */}
      <div className="gradient-bg h-32 relative">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      </div>
      
      {/* 用户信息 */}
      <div className="px-4 pb-6 -mt-16 relative z-10">
        <div className="flex items-end mb-4">
          <div className="relative">
            <img 
              src={userInfo.avatar} 
              alt={userInfo.nickname}
              className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
            />
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs">
              <i className="fas fa-camera"></i>
            </button>
          </div>
          
          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{userInfo.nickname}</h2>
              <button className="px-4 py-2 bg-primary-500 text-white rounded-full text-sm font-medium">
                编辑资料
              </button>
            </div>
            <p className="text-gray-600 text-sm mt-1">{userInfo.bio}</p>
          </div>
        </div>
        
        {/* 统计数据 */}
        <div className="flex justify-around bg-gray-50 rounded-xl py-4">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{userInfo.postsCount}</div>
            <div className="text-gray-600 text-sm">发布</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{userInfo.followersCount}</div>
            <div className="text-gray-600 text-sm">粉丝</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{userInfo.followingCount}</div>
            <div className="text-gray-600 text-sm">关注</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
