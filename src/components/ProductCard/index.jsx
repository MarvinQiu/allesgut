import React from 'react';

const ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-2xl card-shadow hover-scale overflow-hidden">
      {/* 商品图片 */}
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.title}
          className="w-full h-auto object-cover"
        />
        {product.originalPrice > product.price && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md">
            特价
          </div>
        )}
      </div>
      
      {/* 商品信息 */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 text-sm leading-5 mb-2 line-clamp-2">
          {product.title}
        </h3>
        
        {/* 价格 */}
        <div className="flex items-center mb-2">
          <span className="text-red-500 font-bold text-lg">¥{product.price}</span>
          {product.originalPrice > product.price && (
            <span className="text-gray-400 text-sm line-through ml-2">
              ¥{product.originalPrice}
            </span>
          )}
        </div>
        
        {/* 评分和销量 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <div className="flex text-yellow-400 text-xs">
              {[...Array(5)].map((_, i) => (
                <i 
                  key={i} 
                  className={i < Math.floor(product.rating) ? 'fas fa-star' : 'far fa-star'}
                ></i>
              ))}
            </div>
            <span className="text-gray-600 text-xs ml-1">{product.rating}</span>
          </div>
          <span className="text-gray-500 text-xs">{product.sales}人购买</span>
        </div>
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-1">
          {product.tags.slice(0, 2).map((tag) => (
            <span 
              key={tag}
              className="px-2 py-1 bg-secondary-50 text-secondary-600 text-xs rounded-md"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
