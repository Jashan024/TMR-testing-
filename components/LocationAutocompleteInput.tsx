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
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({ label, name, value, onChange, required, icon, placeholder, className, onKeyDown }) => {
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
    <div ref={wrapperRef} className="w-full">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-zinc-700 mb-2">
          {label}
        </label>
      )}
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
          onKeyDown={onKeyDown}
          className={className || `w-full py-2.5 bg-white border border-zinc-200 rounded-2xl text-zinc-900 placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all duration-300 ${icon ? 'pl-11' : 'px-4'}`}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        {isDropdownOpen && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-4 bg-white border border-zinc-100 rounded-3xl shadow-2xl overflow-hidden animate-prompt-in">
            <ul className="divide-y divide-zinc-50">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-6 py-4 text-zinc-700 hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer transition-colors duration-150 font-medium"
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
