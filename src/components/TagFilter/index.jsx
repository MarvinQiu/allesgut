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
    <nav className="px-4 pb-4" aria-label="标签筛选">
      <div className="flex flex-wrap gap-2" role="group">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              aria-pressed={isSelected}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'tag-soft active'
                  : 'tag-soft hover:shadow-soft-sm'
              } font-body`}
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
