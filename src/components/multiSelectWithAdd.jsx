import React, { useState } from 'react';
import PropTypes from 'prop-types';

const MultiSelectWithAdd = ({ options }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [suggestedOptions, setSuggestedOptions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const handleAddItem = () => {
    const newItemLowerCase = newItem.toLowerCase();
    if (newItem.trim() !== '' && !selectedItems.includes(newItemLowerCase)) {
      setSelectedItems([...selectedItems, newItem]);
      setNewItem('');
      setSuggestedOptions([]); // Clear suggestions
    }
  };

  const handleRemoveItem = (itemToRemove) => {
    const newItemToRemove = itemToRemove.toLowerCase();
    setSelectedItems(selectedItems.filter((item) => item.toLowerCase() !== newItemToRemove));
    // Re-populate suggestions without the removed item
    setSuggestedOptions(
      suggestedOptions.filter((option) => option.toLowerCase() !== newItemToRemove)
    );
  };

  const handleInputChange = (e) => {
    const inputText = e.target.value;
    setNewItem(inputText);

    // Filter and set suggested options based on user input (case-insensitive)
    const inputTextLower = inputText.toLowerCase();
    const filteredOptions = options.filter((option) =>
      option.toLowerCase().includes(inputTextLower)
    );

    setSuggestedOptions(filteredOptions);
    setSelectedIndex(-1); // Reset selection when input changes
  };

  const handleOptionSelect = (option) => {
    if (!selectedItems.includes(option.toLowerCase())) {
      setNewItem(option);
      handleAddItem();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (suggestedOptions.length > 0) {
        handleOptionSelect(suggestedOptions[0]);
      } else {
        handleAddItem();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : prevIndex
      );
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prevIndex) =>
        prevIndex < suggestedOptions.length - 1 ? prevIndex + 1 : prevIndex
      );
    }
  };

  return (
    <div>
      <div>
        <input
          type="text"
          className="form-control"
          value={newItem}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Add new item"
        />
        <button onClick={handleAddItem} className="btn btn-primary">
          Add
        </button>
      </div>

      {suggestedOptions.length > 0 && (
        <ul className="suggested-options">
          {suggestedOptions.map((option, index) => (
            <li
              key={option}
              className={index === selectedIndex ? 'active' : ''}
              onClick={() => handleOptionSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}

      <div>
        {selectedItems.map((item) => (
          <div key={item} className="selected-item">
            {item}
            <button onClick={() => handleRemoveItem(item)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

MultiSelectWithAdd.propTypes = {
  options: PropTypes.array.isRequired,
};

export default MultiSelectWithAdd;
