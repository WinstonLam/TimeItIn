import React, { FC, useState, useRef, useEffect } from "react";
import "../styles/component-styles/Autocomplete.css";
import FormField from "./formfield";

interface AutocompleteInputProps {
  suggestions: [string, string][];
  onSelect: (uid: string, name: string) => void;
}

const AutocompleteInput: FC<AutocompleteInputProps> = ({
  suggestions,
  onSelect,
}) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    [string, string][]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const autocompleteRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ensure that autocompleteRef.current is not null
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false); // Close dropdown if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (userInput: string) => {
    const newFilteredSuggestions = suggestions.filter(
      (suggestion) =>
        suggestion[1].toLowerCase().indexOf(userInput.toLowerCase()) === 0
    );
    setInputValue(userInput);
    setFilteredSuggestions(newFilteredSuggestions);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: [string, string]) => {
    setInputValue(suggestion[1]);
    setShowSuggestions(false);
    onSelect(suggestion[0], suggestion[1]);
  };

  const handleDropdownClick = () => {
    setShowSuggestions(!showSuggestions);
    setFilteredSuggestions(suggestions);
  };

  let suggestionsListComponent;

  if (showSuggestions && filteredSuggestions.length) {
    suggestionsListComponent = (
      <ul className="suggestions">
        {filteredSuggestions.map((suggestion, index) => (
          <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
            {suggestion[1]}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="autocomplete-input" ref={autocompleteRef}>
      <div className="title">Select Name:</div>
      <div className="selector">
        <FormField
          required={false}
          value={inputValue}
          id="name"
          label=""
          onChange={handleChange}
        />
        <button onClick={handleDropdownClick}>&#9660;</button>
        {suggestionsListComponent}
      </div>
    </div>
  );
};

export default AutocompleteInput;
