import React from 'react';

const PostCard = ({ post, onClick }) => {
  return (
    <article
      className="card-soft cursor-pointer overflow-hidden hover-lift"
      onClick={() => onClick && onClick(post)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick && onClick(post);
        }
      }}
      aria-label={`${post.title} - 作者: ${post.author}`}
    >
      {/* Image area */}
      {post.image && (
        <div className="relative overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
          {post.images && post.images.length > 1 && (
            <div className="absolute top-2 right-2 bg-primary-900/60 text-white text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm">
              {post.images.length}
            </div>
          )}
        </div>
      )}

      {/* Content area */}
      <div className="p-4">
        <h3 className="font-semibold text-primary-900 text-sm leading-5 mb-3 line-clamp-2 font-heading">
          {post.title}
        </h3>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Author and interactions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={post.avatar}
              alt={`${post.author}的头像`}
              className="w-6 h-6 rounded-full mr-2 border-2 border-primary-100"
            />
            <span className="text-primary-800 text-xs font-medium">{post.author}</span>
          </div>

          <div className="flex items-center space-x-3 text-primary-600">
            <div className="flex items-center hover:text-secondary-500 transition-colors duration-200 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span className="text-xs ml-1 font-medium">{post.likes}</span>
            </div>
            <div className="flex items-center hover:text-secondary-500 transition-colors duration-200 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-xs ml-1 font-medium">{post.comments}</span>
            </div>
          </div>
        </div>

        <div className="text-primary-500 text-xs mt-2 flex items-center font-medium">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <time>{post.time}</time>
        </div>
      </div>
    </article>
  );
};

export default PostCard;
