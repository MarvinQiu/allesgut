import React, { useState, useEffect } from 'react';
import { postsService } from '../../services/posts';
import { commentsService } from '../../services/comments';
import { usersService } from '../../services/users';

const PostDetail = ({ post, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [likes, setLikes] = useState(post?.likes || 0);

  const [isLiked, setIsLiked] = useState(post?.is_liked || false);
  const [isFavorited, setIsFavorited] = useState(post?.is_favorited || false);
  const [isFollowing, setIsFollowing] = useState(post?.author_is_followed || false);

  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

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
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto animate-fade-in font-body" role="dialog" aria-modal="true" aria-labelledby="post-detail-title">
      {/* Header */}
      <header className="sticky top-0 glass border-b border-primary-100/50 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-primary-100/80 flex items-center justify-center text-primary-700 hover:bg-primary-200/80 transition-colors duration-200 cursor-pointer"
            aria-label="关闭"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 id="post-detail-title" className="font-semibold text-primary-900 font-heading">详情</h1>
          <button
            className="w-10 h-10 rounded-xl bg-primary-100/80 flex items-center justify-center text-primary-700 hover:bg-primary-200/80 transition-colors duration-200 cursor-pointer"
            aria-label="分享"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Author info */}
      <div className="flex items-center justify-between p-4 bg-white">
        <div className="flex items-center">
          <img
            src={post.avatar}
            alt={`${post.author}的头像`}
            className="w-12 h-12 rounded-full mr-3 border-2 border-primary-100"
          />
          <div>
            <h2 className="font-semibold text-primary-900">{post.author}</h2>
            <p className="text-primary-500 text-sm">{post.time}</p>
          </div>
        </div>
        <button
          onClick={handleFollow}
          disabled={isFollowLoading}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
            isFollowing
              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
              : 'btn-primary'
          } ${isFollowLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isFollowLoading ? (
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
          ) : (
            isFollowing ? '已关注' : '关注'
          )}
        </button>
      </div>

      {/* Image gallery */}
      <div className="relative bg-primary-900">
        <img
          src={images[currentImageIndex]}
          alt={`${post.title} - 图片 ${currentImageIndex + 1}`}
          className="w-full h-80 object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors duration-200 cursor-pointer"
              aria-label="上一张图片"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors duration-200 cursor-pointer"
              aria-label="下一张图片"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
                    index === currentImageIndex ? 'bg-white w-4' : 'bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`查看图片 ${index + 1}`}
                  aria-current={index === currentImageIndex}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <article className="p-4 bg-white">
        <h3 className="font-semibold text-primary-900 text-lg mb-3 leading-7 font-heading">
          {post.title}
        </h3>

        <div className="text-primary-700 text-sm leading-7 mb-4">
          {post.content}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-primary-100 text-primary-700 text-sm rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Comment input and actions */}
      <div className="p-4 bg-white border-t border-primary-100/50">
        <div className="flex items-center space-x-3">
          <div className="flex-1 flex items-center input-soft px-4 py-3">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的想法..."
              className="flex-1 bg-transparent text-sm text-primary-900 placeholder-primary-400 outline-none"
              disabled={isCommentSubmitting}
              aria-label="评论内容"
            />
            <button
              onClick={handleCommentSubmit}
              disabled={isCommentSubmitting || !commentText.trim()}
              className={`ml-2 text-primary-600 font-semibold text-sm cursor-pointer hover:text-primary-700 transition-colors duration-200 ${
                isCommentSubmitting || !commentText.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isCommentSubmitting ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                '发送'
              )}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              disabled={isLikeLoading}
              className={`flex items-center space-x-1 transition-colors duration-200 cursor-pointer ${
                isLiked ? 'text-secondary-500' : 'text-primary-500 hover:text-secondary-400'
              } ${isLikeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isLiked ? '取消点赞' : '点赞'}
              aria-pressed={isLiked}
            >
              {isLikeLoading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
              <span className="text-sm font-medium">{likes}</span>
            </button>

            <button
              onClick={handleFavorite}
              disabled={isFavoriteLoading}
              className={`flex items-center space-x-1 transition-colors duration-200 cursor-pointer ${
                isFavorited ? 'text-accent-500' : 'text-primary-500 hover:text-accent-400'
              } ${isFavoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isFavorited ? '取消收藏' : '收藏'}
              aria-pressed={isFavorited}
            >
              {isFavoriteLoading ? (
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill={isFavorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              )}
              <span className="text-sm font-medium">{post.favorites || 0}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 text-primary-500 hover:text-primary-700 transition-colors duration-200 cursor-pointer"
              aria-expanded={showComments}
              aria-label={showComments ? '收起评论' : '查看评论'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">{post.comments}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <section className="bg-white border-t border-primary-100/50 animate-fade-in" aria-label="评论区">
          <div className="p-4">
            <h4 className="font-semibold text-primary-900 mb-4 font-heading">全部评论</h4>
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-primary-500">暂无评论，快来抢沙发吧</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <article key={comment.id} className="flex space-x-3">
                    <img
                      src={comment.avatar}
                      alt={`${comment.author}的头像`}
                      className="w-8 h-8 rounded-full border border-primary-100"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-primary-900 text-sm">{comment.author}</span>
                        <span className="text-primary-400 text-xs">{comment.time}</span>
                      </div>
                      <p className="text-primary-700 text-sm leading-6">{comment.content}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default PostDetail;
