import React from 'react';

interface SearchBarProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  isListening: boolean;
  onVoiceSearchClick: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, onSearchTermChange, isListening, onVoiceSearchClick }) => {
  return (
    <div className="flex-grow relative">
      <span className="absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: 'var(--color-text-secondary)'}}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </span>
      <input
        type="text"
        placeholder="Search for places or ask..." 
        value={searchTerm}
        onChange={(e) => onSearchTermChange(e.target.value)}
        className="input-base w-full pl-11 pr-12"
        aria-label="Search for places by name or type"
      />
       <button 
        onClick={onVoiceSearchClick} 
        className={`absolute right-0 top-1/2 transform -translate-y-1/2 p-3 rounded-full transition-colors duration-200 ${isListening ? 'animate-pulse-glow' : ''}`}
        aria-label="Search by voice"
        style={{ color: isListening ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
      >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
      </button>
    </div>
  );
};

export default SearchBar;