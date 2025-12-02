import React from 'react';
import PropTypes from "prop-types";

function CategoryList({ categories, categoryId, handleCategoryChange }) {

  if (!categories) return <></>

  return (
    <>
      {categories.map(cat => (
        <li key={cat.id} className="nav-item">
          {cat.children && cat.children.length > 0 ? (
            <>
              <a href={`#menu-${cat.id}`} className="nav-link" data-bs-toggle="collapse" aria-expanded="false">
                {cat.name}
                <span className="nav-link-toggle"></span>
              </a>
              <ul className="nav nav-pills collapse" id={`menu-${cat.id}`}>
                <CategoryList
                  categories={cat.children}
                  categoryId={categoryId}
                  handleCategoryChange={handleCategoryChange}
                />
              </ul>
            </>
          ) : (
            <a className={`nav-link ${categoryId == cat.id ? 'active' : ''}`} href="#" onClick={e => handleCategoryChange(e, cat.id)} >
              {cat.name}
            </a>
          )}
        </li>
      ))}
    </>
  );
}

CategoryList.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      parentCategoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      children: PropTypes.array, // recursive nesting
    })
  ).isRequired,
  categoryId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  handleCategoryChange: PropTypes.func.isRequired,
};

export default CategoryList;
