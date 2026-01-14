import React, { useState } from 'react';

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }) => {
  const [expandedCategory, setExpandedCategory] = useState('');

  const handleCategoryClick = (categoryId) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory('');
    } else {
      setExpandedCategory(categoryId);
    }
  };

  const handleSubCategoryClick = (subCategoryId) => {
    onCategoryChange(subCategoryId);
    setExpandedCategory('');
  };

  return (
    <div className="px-4 pb-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onCategoryChange('')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedCategory === ''
              ? 'bg-secondary-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          全部
        </button>
        
        {categories.map((category) => (
          <div key={category.id} className="relative">
            <button
              onClick={() => handleCategoryClick(category.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                expandedCategory === category.id
                  ? 'bg-secondary-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.name}
              <i className="fas fa-chevron-down ml-1 text-xs"></i>
            </button>
            
            {expandedCategory === category.id && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-32">
                {category.children.map((subCategory) => (
                  <button
                    key={subCategory.id}
                    onClick={() => handleSubCategoryClick(subCategory.id)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {subCategory.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
