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
  const [feedType, setFeedType] = useState('recommended'); // 'recommended' | 'following'
  const [tags, setTags] = useState([]);

  // 控制底部导航栏显示/隐藏
  useEffect(() => {
    const bottomNav = document.querySelector('.bottom-navigation');
    if (bottomNav) {
      if (selectedPost) {
        bottomNav.style.display = 'none';
      } else {
        bottomNav.style.display = 'block';
      }
    }
  }, [selectedPost]);

  // 静态兜底数据
  const fallbackPosts = [
    {
      id: 1,
      title: '自闭症儿童感统训练的日常小技巧',
      content: '分享一些在家就能做的感统训练方法，帮助孩子提升专注力和协调能力。感统训练是帮助自闭症儿童改善感觉统合能力的重要方法。通过日常生活中的小游戏和练习，我们可以有效地帮助孩子提升触觉、前庭觉、本体觉等感觉系统的协调性。比如可以让孩子在不同材质的地毯上行走，或者进行简单的平衡训练。这些训练不仅能改善孩子的感觉统合能力，还能增强亲子关系，让孩子在快乐中成长。',
      author: '小雨妈妈',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      image: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
        'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=300&h=200&fit=crop'
      ],
      tags: ['感统训练', '自闭症', '日常护理'],
      likes: 128,
      comments: 23,
      time: '2小时前'
    },
    {
      id: 2,
      title: '视障儿童学习盲文的心得体会',
      content: '从零开始学习盲文的经历分享，包括选择教材、学习方法和注意事项。作为视障儿童的家长，我深知盲文学习的重要性。刚开始时，我们选择了适合初学者的盲文教材，从最基础的字母开始学习。学习过程中要保持耐心，每天坚持练习触摸识别。建议家长也一起学习，这样能更好地辅导孩子。同时要注意保护孩子的手指敏感度，避免过度练习造成疲劳。通过系统的学习和练习，孩子的阅读能力会逐步提升，为今后的学习生活打下坚实基础。',
      author: '阳光爸爸',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=250&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=250&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=250&fit=crop'
      ],
      tags: ['盲文学习', '视障', '教育'],
      likes: 89,
      comments: 15,
      time: '4小时前'
    },
    {
      id: 3,
      title: '特殊儿童的营养搭配指南',
      content: '针对不同特殊需求儿童的营养搭配建议，让孩子健康成长。特殊儿童由于身体条件的特殊性，在营养需求上往往与普通儿童有所不同。我们需要根据孩子的具体情况，制定个性化的营养方案。比如自闭症儿童可能存在挑食问题，需要循序渐进地引入新食物；视障儿童需要补充更多的维生素A和叶黄素；听障儿童要注意锌和维生素B的补充。同时要保证蛋白质、维生素和矿物质的均衡摄入，避免过度依赖营养补充剂。建议家长咨询专业营养师，制定适合自己孩子的营养计划。',
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
      content: '建立稳定的日常作息对自闭症儿童非常重要，分享我们家的经验。自闭症孩子往往需要规律和可预测的环境来减少焦虑。我们从简单的作息开始，每天固定的起床、吃饭、学习、游戏和睡觉时间。使用视觉时间表帮助孩子理解一天的安排，每完成一个环节就打勾。刚开始可能会有抗拒，但要坚持下去。逐渐地，孩子会适应这种规律，行为问题也会减少。同时要保持灵活性，根据孩子的状态适当调整。建立作息不是一蹴而就的，需要家长的耐心和坚持，但效果是显著的。',
      author: '星星妈妈',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=220&fit=crop',
      images: [
        'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&h=220&fit=crop',
        'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=220&fit=crop'
      ],
      tags: ['作息规律', '自闭症', '行为训练'],
      likes: 203,
      comments: 45,
      time: '8小时前'
    }
  ];

  // 加载标签
  useEffect(() => {
    const loadTags = async () => {
      try {
        const apiTags = await postsService.getTags();
        setTags(apiTags.map(t => t.name));
      } catch (error) {
        // Fallback to hardcoded tags
        setTags(['感统训练', '自闭症', '视障', '营养搭配', '教育', '日常护理']);
      }
    };
    loadTags();
  }, []);

  // 加载帖子
  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await postsService.getPosts({
        feed_type: feedType,
        search: searchQuery || undefined,
        tag: selectedTags[0] || undefined, // API takes single tag
        page: 1,
      });
      setPosts(result.posts || []);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setPosts(fallbackPosts); // Keep fallback for offline
      setError('使用离线数据');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [feedType, searchQuery, selectedTags]);

  // 刷新数据的方法
  const refreshPosts = async () => {
    await loadPosts();
  };

  // 过滤帖子 (client-side filtering for fallback data)
  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags = selectedTags.length === 0 ||
      selectedTags.some(tag => post.tags && post.tags.includes(tag));

    return matchesSearch && matchesTags;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部搜索栏 */}
      <div className="sticky top-0 bg-white z-40 shadow-sm">
        <div className="px-4 py-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索相关内容..."
          />
        </div>

        {/* Feed Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-3 text-center font-medium ${
              feedType === 'recommended'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-500'
            }`}
            onClick={() => setFeedType('recommended')}
          >
            推荐
          </button>
          <button
            className={`flex-1 py-3 text-center font-medium ${
              feedType === 'following'
                ? 'text-primary-500 border-b-2 border-primary-500'
                : 'text-gray-500'
            }`}
            onClick={() => setFeedType('following')}
          >
            关注
          </button>
        </div>

        {/* 标签筛选 */}
        <TagFilter
          tags={tags}
          selectedTags={selectedTags}
          onTagChange={setSelectedTags}
        />
      </div>

      {/* 错误提示和刷新按钮 */}
      {error && (
        <div className="px-4 py-2 bg-yellow-50 border-l-4 border-yellow-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-yellow-400 mr-2"></i>
              <span className="text-yellow-700 text-sm">{error}</span>
            </div>
            <button
              onClick={refreshPosts}
              className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
              disabled={loading}
            >
              {loading ? '刷新中...' : '重试'}
            </button>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {loading && posts.length === 0 && (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
            <p className="text-gray-500">加载中...</p>
          </div>
        </div>
      )}

      {/* 内容区域 */}
      {!loading || posts.length > 0 ? (
        <div className="waterfall-container pt-4 pb-6">
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
            <div className="col-span-full text-center py-12">
              <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">没有找到相关内容</p>
            </div>
          )}
        </div>
      ) : null}

      {/* 卡片详情弹窗 */}
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
