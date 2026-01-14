import React, { useState } from 'react';
import SearchBar from '../../components/SearchBar';
import CategoryFilter from '../../components/CategoryFilter';
import ProductCard from '../../components/ProductCard';

const Mall = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    {
      id: 'sensory',
      name: '感统训练',
      children: [
        { id: 'sensory-toys', name: '感统玩具' },
        { id: 'sensory-equipment', name: '训练器材' }
      ]
    },
    {
      id: 'education',
      name: '教育用品',
      children: [
        { id: 'books', name: '图书教材' },
        { id: 'learning-tools', name: '学习工具' }
      ]
    },
    {
      id: 'daily',
      name: '日常用品',
      children: [
        { id: 'care-products', name: '护理用品' },
        { id: 'safety-products', name: '安全用品' }
      ]
    }
  ];

  const mockProducts = [
    {
      id: 1,
      title: '感统训练平衡板',
      price: 168,
      originalPrice: 228,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
      rating: 4.8,
      sales: 1200,
      tags: ['感统训练', '平衡能力']
    },
    {
      id: 2,
      title: '盲文学习板套装',
      price: 89,
      originalPrice: 120,
      image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=300&fit=crop',
      rating: 4.9,
      sales: 856,
      tags: ['盲文学习', '视障辅助']
    },
    {
      id: 3,
      title: '儿童专用营养补充剂',
      price: 128,
      originalPrice: 158,
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=300&h=300&fit=crop',
      rating: 4.7,
      sales: 2100,
      tags: ['营养补充', '健康成长']
    },
    {
      id: 4,
      title: '自闭症儿童社交训练卡片',
      price: 45,
      originalPrice: 68,
      image: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=300&h=300&fit=crop',
      rating: 4.6,
      sales: 980,
      tags: ['社交训练', '自闭症']
    },
    {
      id: 5,
      title: '触觉感知训练球套装',
      price: 78,
      originalPrice: 98,
      image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop',
      rating: 4.8,
      sales: 1500,
      tags: ['触觉训练', '感统发展']
    },
    {
      id: 6,
      title: '语言发育训练图册',
      price: 56,
      originalPrice: 78,
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
      rating: 4.7,
      sales: 720,
      tags: ['语言训练', '认知发展']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部搜索栏 */}
      <div className="sticky top-0 bg-white z-40 shadow-sm">
        <div className="px-4 py-3">
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索商品..."
          />
        </div>
        
        {/* 分类筛选 */}
        <CategoryFilter 
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      {/* 商品列表 */}
      <div className="waterfall-container pt-4 pb-6">
        {mockProducts.map((product) => (
          <div key={product.id} className="waterfall-item">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Mall;
