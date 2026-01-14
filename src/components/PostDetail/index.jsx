import React, { useState } from 'react';

const PostDetail = ({ post, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likes, setLikes] = useState(post.likes);

  if (!post) return null;

  const images = post.images || [post.image];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      // 这里可以添加评论提交逻辑
      setCommentText('');
    }
  };

  const mockComments = [
    {
      id: 1,
      author: '阳光妈妈',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face',
      content: '非常实用的分享，我家孩子也在做类似的训练',
      time: '1小时前'
    },
    {
      id: 2,
      author: '星星爸爸',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
      content: '请问这个训练每天需要多长时间呢？',
      time: '2小时前'
    }
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <span className="font-medium text-gray-900">详情</span>
          <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
            <i className="fas fa-share"></i>
          </button>
        </div>
      </div>

      {/* 作者信息 */}
      <div className="flex items-center justify-between p-4 bg-white">
        <div className="flex items-center">
          <img 
            src={post.avatar} 
            alt={post.author}
            className="w-12 h-12 rounded-full mr-3"
          />
          <div>
            <h3 className="font-medium text-gray-900">{post.author}</h3>
            <p className="text-gray-500 text-sm">{post.time}</p>
          </div>
        </div>
        <button 
          onClick={handleFollow}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isFollowing 
              ? 'bg-gray-100 text-gray-600' 
              : 'bg-primary-500 text-white'
          }`}
        >
          {isFollowing ? '已关注' : '关注'}
        </button>
      </div>

      {/* 图片/视频区域 */}
      <div className="relative bg-black">
        <img 
          src={images[currentImageIndex]} 
          alt={post.title}
          className="w-full h-80 object-contain"
        />
        
        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
            
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* 内容区域 */}
      <div className="p-4 bg-white">
        <h2 className="font-medium text-gray-900 text-lg mb-3 leading-6">
          {post.title}
        </h2>
        
        <div className="text-gray-700 text-sm leading-6 mb-4">
          {post.content}
        </div>
        
        {/* 标签 */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span 
                key={tag}
                className="px-3 py-1.5 bg-primary-50 text-primary-600 text-sm rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 评论输入区域 */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="flex-1 flex items-center bg-gray-50 rounded-full px-4 py-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的想法..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <button
              onClick={handleCommentSubmit}
              className="ml-2 text-primary-500 font-medium text-sm"
            >
              发送
            </button>
          </div>

          {/* 互动按钮 - 移到输入框右边 */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <i className={`${isLiked ? 'fas' : 'far'} fa-heart text-lg`}></i>
              <span className="text-sm font-medium">{likes}</span>
            </button>

            <button
              onClick={handleFavorite}
              className={`flex items-center space-x-1 transition-colors ${
                isFavorited ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-400'
              }`}
            >
              <i className={`${isFavorited ? 'fas' : 'far'} fa-bookmark text-lg`}></i>
              <span className="text-sm font-medium">{post.favorites || 0}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-gray-500 hover:text-blue-400 transition-colors"
            >
              <i className="far fa-comment text-lg"></i>
              <span className="text-sm font-medium">{post.comments}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      {showComments && (
        <div className="bg-white border-t border-gray-100">
          <div className="p-4">
            <h3 className="font-medium text-gray-900 mb-4">全部评论</h3>
            <div className="space-y-4">
              {mockComments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <img 
                    src={comment.avatar} 
                    alt={comment.author}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">{comment.author}</span>
                      <span className="text-gray-500 text-xs">{comment.time}</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-5">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
