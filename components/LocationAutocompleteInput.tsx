import React, { useState, useEffect, useRef } from 'react';
import { locations } from '../lib/locations';

interface LocationAutocompleteInputProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  required?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
}

const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({ label, name, value, onChange, required, icon, placeholder }) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value); // Sync with parent state
  }, [value]);

  useEffect(() => {
    if (query.length > 1) {
      const filteredLocations = locations.filter(location =>
        location.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5); // Limit to top 5 suggestions
      setSuggestions(filteredLocations);
      setIsDropdownOpen(filteredLocations.length > 0);
    } else {
      setSuggestions([]);
      setIsDropdownOpen(false);
    }
  }, [query]);

  // Handle clicks outside the component to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e); // Propagate change to parent form
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    // Create a synthetic event to pass to the parent's onChange handler
    const syntheticEvent = {
      target: { name, value: suggestion }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
    setIsDropdownOpen(false);
  };

  return (
    <div ref={wrapperRef}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 text-gray-400' })}
          </div>
        )}
        <input
          id={name}
          name={name}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length > 1 && suggestions.length > 0 && setIsDropdownOpen(true)}
          className={`w-full py-2.5 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transform transition-all duration-300 focus:scale-[1.02] ${icon ? 'pl-11' : 'px-4'}`}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        {isDropdownOpen && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto animate-fade-in-up" style={{ animationDuration: '200ms' }}>
            <ul>
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-3 text-gray-300 hover:bg-gray-700/80 cursor-pointer transition-colors duration-150"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationAutocompleteInput;
