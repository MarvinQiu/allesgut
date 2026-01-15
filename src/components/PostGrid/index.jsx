import React from 'react';

const UserPostGrid = ({ posts, emptyMessage = '暂无内容' }) => {
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <i className="fas fa-inbox text-4xl mb-3"></i>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-xl overflow-hidden card-shadow">
          <div className="aspect-square">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-3">
            <h3 className="font-medium text-gray-900 text-sm line-clamp-2 mb-2">
              {post.title}
            </h3>
            <div className="flex items-center text-gray-500 text-xs">
              <i className="far fa-heart mr-1"></i>
              <span>{post.likes}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserPostGrid;
