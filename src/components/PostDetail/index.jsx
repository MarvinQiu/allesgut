import React, { useState, useEffect } from 'react';
import { postsService } from '../../services/posts';
import { commentsService } from '../../services/comments';
import { usersService } from '../../services/users';

const PostDetail = ({ post, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likes, setLikes] = useState(post?.likes || 0);

  // Initialize from post data
  const [isLiked, setIsLiked] = useState(post?.is_liked || false);
  const [isFavorited, setIsFavorited] = useState(post?.is_favorited || false);
  const [isFollowing, setIsFollowing] = useState(post?.author_is_followed || false);

  // API loading states
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  // Comments state
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Load comments from API when showComments is true
  useEffect(() => {
    const loadComments = async () => {
      if (!showComments || !post?.id) return;
      setCommentsLoading(true);
      try {
        const result = await commentsService.getComments(post.id);
        setComments(result.comments || []);
      } catch (error) {
        console.error('Failed to load comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    };
    loadComments();
  }, [showComments, post?.id]);

  if (!post) return null;

  const images = post.images || [post.image];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleLike = async () => {
    if (isLikeLoading) return;
    setIsLikeLoading(true);
    try {
      if (isLiked) {
        await postsService.unlikePost(post.id);
        setLikes(prev => prev - 1);
      } else {
        await postsService.likePost(post.id);
        setLikes(prev => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to update like:', error);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (isFavoriteLoading) return;
    setIsFavoriteLoading(true);
    try {
      if (isFavorited) {
        await postsService.unfavoritePost(post.id);
      } else {
        await postsService.favoritePost(post.id);
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Failed to update favorite:', error);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleFollow = async () => {
    if (isFollowLoading) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await usersService.unfollowUser(post.author_id);
      } else {
        await usersService.followUser(post.author_id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed to update follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || isCommentSubmitting) return;
    setIsCommentSubmitting(true);
    try {
      const newComment = await commentsService.addComment(post.id, {
        content: commentText.trim()
      });
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

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
          disabled={isFollowLoading}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isFollowing
              ? 'bg-gray-100 text-gray-600'
              : 'bg-primary-500 text-white'
          } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isFollowLoading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            isFollowing ? '已关注' : '关注'
          )}
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
              disabled={isCommentSubmitting}
            />
            <button
              onClick={handleCommentSubmit}
              disabled={isCommentSubmitting || !commentText.trim()}
              className={`ml-2 text-primary-500 font-medium text-sm ${
                isCommentSubmitting || !commentText.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCommentSubmitting ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                '发送'
              )}
            </button>
          </div>

          {/* 互动按钮 - 移到输入框右边 */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={isLikeLoading}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
              } ${isLikeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLikeLoading ? (
                <i className="fas fa-spinner fa-spin text-lg"></i>
              ) : (
                <i className={`${isLiked ? 'fas' : 'far'} fa-heart text-lg`}></i>
              )}
              <span className="text-sm font-medium">{likes}</span>
            </button>

            <button
              onClick={handleFavorite}
              disabled={isFavoriteLoading}
              className={`flex items-center space-x-1 transition-colors ${
                isFavorited ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-400'
              } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isFavoriteLoading ? (
                <i className="fas fa-spinner fa-spin text-lg"></i>
              ) : (
                <i className={`${isFavorited ? 'fas' : 'far'} fa-bookmark text-lg`}></i>
              )}
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
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无评论，快来抢沙发吧
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetail;
