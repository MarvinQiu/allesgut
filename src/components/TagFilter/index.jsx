import React from 'react';

const TagFilter = ({ tags, selectedTags, onTagChange }) => {
  const handleTagClick = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagChange([...selectedTags, tag]);
    }
  };

  return (
    <nav className="px-4 pb-3 overflow-x-auto scrollbar-hide" aria-label="标签筛选">
      <div className="flex gap-2" role="group">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              aria-pressed={isSelected}
              className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-brand-500 text-white'
                  : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default TagFilter;
