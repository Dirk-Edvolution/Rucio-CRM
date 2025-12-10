
import React, { useState, useEffect, useRef } from 'react';

interface SmartSearchBarProps {
  onSearch: (query: string) => void;
  currentUserRole: string;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({ onSearch, currentUserRole }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  const handleChipClick = (prefix: string) => {
    const newQuery = query ? `${query} ${prefix}:` : `${prefix}:`;
    setQuery(newQuery);
    // Focus input after click
    const input = wrapperRef.current?.querySelector('input');
    if (input) {
      input.focus();
      // Slight delay to allow value update before setting selection
      setTimeout(() => input.setSelectionRange(newQuery.length, newQuery.length), 0);
    }
  };

  const suggestions = [
    { label: 'Stage', prefix: 'stage', icon: '📊' },
    { label: 'Country', prefix: 'country', icon: '🌍' },
    { label: 'Company', prefix: 'company', icon: '🏢' },
    { label: 'Owner', prefix: 'owner', icon: '👤' },
    { label: 'Tag', prefix: 'tag', icon: '🏷️' },
  ];

  return (
    <div ref={wrapperRef} className="relative w-full max-w-2xl">
      <div className="relative flex items-center w-full bg-slate-100 hover:bg-slate-50 focus-within:bg-white focus-within:shadow-md border border-transparent focus-within:border-slate-300 rounded-lg transition-all duration-200">
        <div className="pl-3 text-slate-400">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <input
          type="text"
          className="w-full px-3 py-2.5 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
          placeholder={`Search deals, contacts, or type 'country:USA'...`}
          value={query}
          onChange={handleChange}
          onFocus={() => setShowSuggestions(true)}
        />
        {query && (
            <button 
                onClick={() => { setQuery(''); onSearch(''); }}
                className="pr-3 text-slate-400 hover:text-slate-600"
            >
                ✕
            </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 pt-1">
              Smart Filters
           </div>
           <div className="flex flex-wrap gap-2 px-2 pb-2">
              {suggestions.map(s => (
                  <button
                    key={s.prefix}
                    onClick={() => handleChipClick(s.prefix)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                  >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                  </button>
              ))}
           </div>
           {currentUserRole !== 'SALES_REP' && (
               <div className="px-3 py-2 text-xs text-slate-400 border-t border-slate-50 mt-1 italic">
                   Showing all deals (Admin/Manager view)
               </div>
           )}
           {currentUserRole === 'SALES_REP' && (
               <div className="px-3 py-2 text-xs text-blue-600 border-t border-slate-50 mt-1 bg-blue-50/50 rounded-b-lg flex items-center gap-2">
                   <span>🔒</span> Only showing your owned opportunities
               </div>
           )}
        </div>
      )}
    </div>
  );
};
