import React, { useState, useEffect, useRef, useCallback } from 'react';
import SearchBar from '../../components/SearchBar';
import TagFilter from '../../components/TagFilter';
import PostCard from '../../components/PostCard';
import PostDetail from '../../components/PostDetail';
import Masonry from '../../components/Masonry';
import { postsService } from '../../services/posts';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedType, setFeedType] = useState('recommended');
  const [tags, setTags] = useState([]);

  // Paging state (0-based)
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  const sentinelRef = useRef(null);

  // Hide bottom navigation when post detail is open
  useEffect(() => {
    const bottomNav = document.querySelector('.bottom-navigation');
    if (bottomNav) {
      bottomNav.style.display = selectedPost ? 'none' : 'block';
    }
  }, [selectedPost]);

  // Fallback data for offline mode
  const fallbackPosts = [
    {
      id: 1,
      title: '训练的日常小技巧',
      content: '分享一些在家就能做的感统训练方法，帮助孩子提升专注力和协调能力。通过日常生活中的小游戏和练习，我们可以有效地帮助孩子提升触觉、前庭觉、本体觉等感觉系统的协调性。',
      author: '小雨妈妈',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
      ],
      tags: ['感统训练', '自闭症', '日常护理'],
      likes: 128,
      comments: 23,
      time: '2小时前'
    },
    {
      id: 2,
      title: '如何为孩子建立日常作息',
      content: '建立稳定的日常作息对自闭症儿童非常重要，分享我们家的经验。',
      author: '星星妈妈',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=220&fit=crop',
      tags: ['作息规律', '自闭症', '行为训练'],
      likes: 203,
      comments: 45,
      time: '8小时前'
    }
  ];

  // Load tags
  useEffect(() => {
    const loadTags = async () => {
      try {
        const apiTags = await postsService.getTags();
        setTags(apiTags.map(t => t.name));
      } catch {
        setTags(['感统训练', '自闭症', '视障', '营养搭配', '教育', '日常护理']);
      }
    };
    loadTags();
  }, []);

  // Load posts (initial page load)
  const loadPosts = async (requestedPage = 0) => {
    setLoading(true);
    setError(null);

    try {
      const result = await postsService.getPosts({
        feed_type: feedType,
        search: searchQuery || undefined,
        tag: selectedTags[0] || undefined,
        page: requestedPage,
      });

      const totalPages = Number.isFinite(result?.totalPages) ? result.totalPages : 1;
      setPosts(result?.data || []);
      setPage(requestedPage);
      setHasMore(requestedPage + 1 < totalPages);
      setOfflineMode(false);
    } catch {
      setPosts(fallbackPosts);
      setOfflineMode(true);
      setHasMore(false);
      setError('使用离线数据');
    } finally {
      setLoading(false);
    }
  };

  // Reset paging state when query changes
  useEffect(() => {
    // Clear current list immediately while we fetch page 0 for the new query
    setPosts([]);
    setHasMore(true);
    setLoadingMore(false);
    loadPosts(0);
  }, [feedType, searchQuery, selectedTags]);

  const refreshPosts = async () => {
    await loadPosts(0);
  };

  const loadMore = useCallback(async () => {
    if (offlineMode || loading || loadingMore || !hasMore) return;

    const nextPage = page + 1;
    setLoadingMore(true);
    setError(null);

    try {
      const result = await postsService.getPosts({
        feed_type: feedType,
        search: searchQuery || undefined,
        tag: selectedTags[0] || undefined,
        page: nextPage,
      });

      const resultPage = Number.isFinite(result?.page) ? result.page : nextPage;
      const totalPages = Number.isFinite(result?.totalPages) ? result.totalPages : 1;
      const newPosts = result?.data || [];

      setPosts(prev => [...prev, ...newPosts]);
      setPage(resultPage);
      setHasMore(resultPage + 1 < totalPages);
      setOfflineMode(false);
    } catch {
      // If load-more fails, stop further paging to avoid request storms.
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [offlineMode, loading, loadingMore, hasMore, page, feedType, searchQuery, selectedTags]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (offlineMode) return;
    const node = sentinelRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some(e => e.isIntersecting)) {
          loadMore();
        }
      },
      { root: null, rootMargin: '200px 0px', threshold: 0 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [offlineMode, loadMore]);

  // Client-side filtering only for offline fallback data
  const filteredPosts = offlineMode
    ? posts.filter(post => {
        const matchesSearch =
          !searchQuery ||
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTags =
          selectedTags.length === 0 ||
          selectedTags.some(tag => post.tags && post.tags.includes(tag));

        return matchesSearch && matchesTags;
      })
    : posts;

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header with search and filters */}
      <header className="sticky top-0 bg-white z-40 border-b border-primary-100">
        <div className="px-4 pt-4 pb-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索内容或用户"
          />
        </div>

        {/* Feed type tabs */}
        <div className="flex" role="tablist">
          <button
            role="tab"
            aria-selected={feedType === 'recommended'}
            className={`flex-1 py-3 text-center font-semibold transition-all duration-200 cursor-pointer relative ${
              feedType === 'recommended'
                ? 'text-brand-500'
                : 'text-primary-600 hover:text-primary-800'
            }`}
            onClick={() => setFeedType('recommended')}
          >
            推荐
            {feedType === 'recommended' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-brand-500 rounded-full"></div>
            )}
          </button>
          <button
            role="tab"
            aria-selected={feedType === 'following'}
            className={`flex-1 py-3 text-center font-semibold transition-all duration-200 cursor-pointer relative ${
              feedType === 'following'
                ? 'text-brand-500'
                : 'text-primary-600 hover:text-primary-800'
            }`}
            onClick={() => setFeedType('following')}
          >
            关注
            {feedType === 'following' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-brand-500 rounded-full"></div>
            )}
          </button>
        </div>

        {/* Tag filter */}
        <div className="pt-3">
          <TagFilter
            tags={tags}
            selectedTags={selectedTags}
            onTagChange={setSelectedTags}
          />
        </div>
      </header>

      {/* Error/offline notice */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in" role="alert">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-amber-800 text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={refreshPosts}
              className="px-4 py-1.5 bg-white border border-amber-300 rounded-lg text-amber-700 text-sm font-medium hover:bg-amber-50 cursor-pointer transition-colors"
              disabled={loading}
            >
              {loading ? '刷新中...' : '重试'}
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && posts.length === 0 && (
        <div className="flex justify-center items-center py-16">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-primary-200 border-t-brand-500 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-primary-600 text-sm">加载中...</p>
          </div>
        </div>
      )}

      {/* Posts grid */}
      {(!loading || posts.length > 0) && (
        <div className="pt-4 pb-24">
          {filteredPosts.length > 0 ? (
            <Masonry
              items={filteredPosts}
              getKey={(post) => post.id}
              gap={12}
              className="px-4 max-w-[1200px] mx-auto"
              renderItem={(post) => (
                <PostCard
                  post={post}
                  onClick={setSelectedPost}
                />
              )}
            />
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-primary-700 font-medium text-sm">没有找到相关内容</p>
              <p className="text-primary-400 text-xs mt-1">试试其他关键词或标签</p>
            </div>
          )}

          {/* Infinite scroll sentinel (must be outside Masonry) */}
          {!offlineMode && (
            <div
              ref={sentinelRef}
              aria-hidden="true"
              className="w-full h-px"
            />
          )}

          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="w-6 h-6 border-2 border-primary-200 border-t-brand-500 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Post detail modal */}
      {selectedPost && (
        <PostDetail
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default Home;
