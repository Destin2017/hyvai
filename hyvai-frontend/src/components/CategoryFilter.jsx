const CategoryFilter = ({ categories, selectedCategory, onSelect }) => {
    return (
      <div className="flex space-x-4 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelect(category)}
            className={`px-4 py-2 rounded-md ${
              selectedCategory === category ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    );
  };
  
  export default CategoryFilter;
  