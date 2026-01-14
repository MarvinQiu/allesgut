import React from 'react';

const PostCard = ({ post, onClick }) => {
  return (
    <div 
      className="bg-white rounded-2xl card-shadow hover-scale overflow-hidden cursor-pointer"
      onClick={() => onClick && onClick(post)}
    >
      {/* 图片区域 */}
      {post.image && (
        <div className="relative">
          <img 
            src={post.image} 
            alt={post.title}
            className="w-full h-auto object-cover"
          />
        </div>
      )}
      
      {/* 内容区域 */}
      <div className="p-3">
        <h3 className="font-normal text-gray-900 text-sm leading-5 mb-3 line-clamp-2">
          {post.title}
        </h3>
        
        {/* 用户信息和互动 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img 
              src={post.avatar} 
              alt={post.author}
              className="w-5 h-5 rounded-full mr-1.5"
            />
            <span className="text-gray-600 text-[10px]">{post.author}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-gray-500">
            <div className="flex items-center">
              <i className="far fa-heart text-[10px] mr-0.5"></i>
              <span className="text-[10px]">{post.likes}</span>
            </div>
            <div className="flex items-center">
              <i className="far fa-comment text-[10px] mr-0.5"></i>
              <span className="text-[10px]">{post.comments}</span>
            </div>
          </div>
        </div>
        
        <div className="text-gray-400 text-[10px] mt-2">
          {post.time}
        </div>
      </div>
    </div>
  );
};

export default PostCard;
