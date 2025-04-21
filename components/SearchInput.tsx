"use client";

import { Search } from "lucide-react";
import { useState } from "react";

interface SearchInputProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

const SearchInput = ({ placeholder = "Search...", onSearch }: SearchInputProps) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-full bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
        placeholder={placeholder}
      />
      <button 
        type="submit" 
        className="absolute inset-y-0 right-0 pr-3 flex items-center"
        aria-label="Search"
      >
        {query.length > 0 && (
          <div className="bg-gray-200 hover:bg-gray-300 rounded-full p-1">
            <Search className="h-4 w-4 text-gray-600" />
          </div>
        )}
      </button>
    </form>
  );
};

export default SearchInput; 