// Third party
import React from "react";

const SearchBar = ({
  onKeyUp,
  onEnter,
  placeholder,
  searchText,
  borderShape,
  label,
}) => {
  return (
    <input
      className={`flex-1 lg:col-span-3 col-span-4 input-field-big`}
      onChange={(e) => onKeyUp(e)}
      onKeyDown={(e) => {
        e.key === "Enter" && onEnter && onEnter();
      }}
      value={searchText}
      aria-label={label}
      type="text"
      placeholder={placeholder}
    ></input>
  );
};

export default SearchBar;
