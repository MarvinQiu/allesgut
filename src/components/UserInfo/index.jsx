import React from 'react';

const UserInfo = ({ userInfo }) => {
  return (
    <div className="bg-white">
      {/* Background decoration */}
      <div className="gradient-bg h-32 relative">
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <pattern id="dots" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#dots)" />
          </svg>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 pb-6 -mt-16 relative z-10">
        <div className="flex items-end mb-4">
          <div className="relative">
            <img
              src={userInfo.avatar}
              alt={`${userInfo.nickname}的头像`}
              className="w-20 h-20 rounded-full border-4 border-white shadow-soft-lg"
            />
            <button
              className="absolute -bottom-1 -right-1 w-7 h-7 btn-secondary rounded-full flex items-center justify-center cursor-pointer"
              aria-label="更换头像"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          <div className="ml-4 flex-1">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary-900 font-heading">{userInfo.nickname}</h1>
              <button className="px-4 py-2 btn-primary rounded-full text-sm cursor-pointer">
                编辑资料
              </button>
            </div>
            {userInfo.bio && (
              <p className="text-primary-600 text-sm mt-1">{userInfo.bio}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex justify-around bg-primary-50/80 rounded-2xl py-4 shadow-soft-sm">
          <div className="text-center">
            <div className="text-xl font-bold text-primary-900">{userInfo.postsCount}</div>
            <div className="text-primary-600 text-sm">发布</div>
          </div>
          <div className="text-center border-l border-r border-primary-200/50 px-8">
            <div className="text-xl font-bold text-primary-900">{userInfo.followersCount}</div>
            <div className="text-primary-600 text-sm">粉丝</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-primary-900">{userInfo.followingCount}</div>
            <div className="text-primary-600 text-sm">关注</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserInfo;
