import React, { useState, useEffect } from 'react';
import SearchBar from '../../components/SearchBar';
import TagFilter from '../../components/TagFilter';
import PostCard from '../../components/PostCard';
import PostDetail from '../../components/PostDetail';
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
      title: '自闭症儿童感统训练的日常小技巧',
      content: '分享一些在家就能做的感统训练方法，帮助孩子提升专注力和协调能力。感统训练是帮助自闭症儿童改善感觉统合能力的重要方法。通过日常生活中的小游戏和练习，我们可以有效地帮助孩子提升触觉、前庭觉、本体觉等感觉系统的协调性。',
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
      title: '视障儿童学习盲文的心得体会',
      content: '从零开始学习盲文的经历分享，包括选择教材、学习方法和注意事项。作为视障儿童的家长，我深知盲文学习的重要性。',
      author: '阳光爸爸',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=250&fit=crop',
      tags: ['盲文学习', '视障', '教育'],
      likes: 89,
      comments: 15,
      time: '4小时前'
    },
    {
      id: 3,
      title: '特殊儿童的营养搭配指南',
      content: '针对不同特殊需求儿童的营养搭配建议，让孩子健康成长。特殊儿童由于身体条件的特殊性，在营养需求上往往与普通儿童有所不同。',
      author: '营养师小李',
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face',
      image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&h=180&fit=crop',
      tags: ['营养搭配', '健康饮食', '儿童护理'],
      likes: 156,
      comments: 31,
      time: '6小时前'
    },
    {
      id: 4,
      title: '如何为自闭症孩子建立日常作息',
      content: '建立稳定的日常作息对自闭症儿童非常重要，分享我们家的经验。自闭症孩子往往需要规律和可预测的环境来减少焦虑。',
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

  // Load posts
  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await postsService.getPosts({
        feed_type: feedType,
        search: searchQuery || undefined,
        tag: selectedTags[0] || undefined,
        page: 1,
      });
      setPosts(result.data || []);
    } catch {
      setPosts(fallbackPosts);
      setError('使用离线数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [feedType, searchQuery, selectedTags]);

  const refreshPosts = async () => {
    await loadPosts();
  };

  // Client-side filtering for fallback data
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => post.tags && post.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50/30 font-body">
      {/* Sticky header with search and filters */}
      <header className="sticky top-0 glass z-40 shadow-soft-sm">
        <div className="px-4 py-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索相关内容..."
          />
        </div>

        {/* Feed type tabs */}
        <div className="flex border-b border-primary-100/50" role="tablist">
          <button
            role="tab"
            aria-selected={feedType === 'recommended'}
            className={`flex-1 py-3.5 text-center font-semibold font-heading transition-all duration-200 cursor-pointer ${
              feedType === 'recommended'
                ? 'text-primary-700 border-b-2 border-primary-500 bg-primary-50/50'
                : 'text-primary-500 hover:text-primary-700 hover:bg-primary-50/30'
            }`}
            onClick={() => setFeedType('recommended')}
          >
            推荐
          </button>
          <button
            role="tab"
            aria-selected={feedType === 'following'}
            className={`flex-1 py-3.5 text-center font-semibold font-heading transition-all duration-200 cursor-pointer ${
              feedType === 'following'
                ? 'text-primary-700 border-b-2 border-primary-500 bg-primary-50/50'
                : 'text-primary-500 hover:text-primary-700 hover:bg-primary-50/30'
            }`}
            onClick={() => setFeedType('following')}
          >
            关注
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
        <div className="mx-4 mt-4 p-4 bg-secondary-50 border border-secondary-200 rounded-2xl shadow-soft-sm animate-fade-in" role="alert">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <span className="text-secondary-800 text-sm font-medium">{error}</span>
            </div>
            <button
              onClick={refreshPosts}
              className="px-4 py-2 btn-secondary text-sm cursor-pointer"
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
            <div className="w-12 h-12 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-primary-600 font-medium">加载中...</p>
          </div>
        </div>
      )}

      {/* Posts grid */}
      {(!loading || posts.length > 0) && (
        <main className="waterfall-container pt-4 pb-24">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <div key={post.id} className="waterfall-item">
                <PostCard
                  post={post}
                  onClick={setSelectedPost}
                />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 px-4">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-primary-600 font-medium">没有找到相关内容</p>
              <p className="text-primary-400 text-sm mt-1">试试其他关键词或标签</p>
            </div>
          )}
        </main>
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
