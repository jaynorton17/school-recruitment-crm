import React, { useState, useRef, useEffect } from 'react';
import { SearchIcon, MenuIcon, RefreshIcon, SpinnerIcon, MegaphoneIcon } from './icons';
import GlobalSearchResults from './GlobalSearchResults';
import { SearchResult } from '../types';

interface HeaderProps {
  activeView: string;
  user: { name: string; email: string; profilePicture?: string };
  userStatus: 'online' | 'away' | 'offline' | 'on a call';
  onLogout: () => void;
  onToggleSidebar: () => void;
  onSync: () => void;
  onOpenAnnouncementModal: () => void;
  onOpenProfileModal: () => void;
  isSyncing: boolean;
  globalSearchQuery: string;
  onGlobalSearchChange: (query: string) => void;
  searchResults: SearchResult[];
  isSearchResultsVisible: boolean;
  onResultClick: (result: SearchResult) => void;
  onSearchResultsBlur: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    activeView, 
    user, 
    userStatus, 
    onLogout, 
    onToggleSidebar, 
    onSync, 
    onOpenAnnouncementModal, 
    onOpenProfileModal, 
    isSyncing,
    globalSearchQuery,
    onGlobalSearchChange,
    searchResults,
    isSearchResultsVisible,
    onResultClick,
    onSearchResultsBlur
}) => {

  const handleSyncClick = async () => {
    await onSync();
  };

  const statusIndicatorClasses = {
    online: 'bg-green-500',
    away: 'bg-amber-500',
    offline: 'bg-slate-500',
    'on a call': 'bg-red-500'
  };

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        onSearchResultsBlur();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onSearchResultsBlur]);

  return (
    <header className="h-16 bg-slate-900 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
      <div className="flex items-center">
        <button onClick={onToggleSidebar} className="md:hidden mr-4 p-1 text-slate-400">
            <MenuIcon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white hidden sm:block">{activeView.replace(/([A-Z])/g, ' $1').trim()}</h1>
      </div>
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="relative" ref={searchContainerRef}>
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"/>
            <input 
              type="text" 
              placeholder="Search everything..." 
              value={globalSearchQuery}
              onChange={(e) => onGlobalSearchChange(e.target.value)}
              onFocus={() => onGlobalSearchChange(globalSearchQuery)}
              className="pl-10 pr-4 py-2 w-32 sm:w-48 lg:w-64 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition placeholder-slate-500" 
            />
            {isSearchResultsVisible && (
              <GlobalSearchResults 
                results={searchResults}
                onResultClick={onResultClick}
                query={globalSearchQuery}
              />
            )}
        </div>
        
        <button
          onClick={onOpenAnnouncementModal}
          className="flex items-center justify-center text-sm font-medium text-slate-300 hover:text-white transition-colors p-2.5 rounded-lg hover:bg-slate-700"
          title="Make an Announcement"
        >
          <MegaphoneIcon className="w-5 h-5" />
        </button>
        
        <button
          onClick={handleSyncClick}
          disabled={isSyncing}
          className="flex items-center justify-center text-sm font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-wait p-2.5 rounded-lg hover:bg-slate-700"
          title="Refresh Data"
        >
          {isSyncing ? (
            <SpinnerIcon className="w-5 h-5" />
          ) : (
            <RefreshIcon className="w-5 h-5" />
          )}
        </button>
        
        <button
            onClick={onOpenProfileModal}
            className="flex items-center space-x-3 pl-2 border-l border-slate-700 cursor-pointer group"
        >
             <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-white truncate group-hover:text-sky-400">{user.name}</p>
            </div>
            <div className="relative">
                {user.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-10 h-10 rounded-full object-cover"/>
                ) : (
                    <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
                        {user.name.charAt(0)}
                    </div>
                )}
                <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full border-2 border-slate-900 ${statusIndicatorClasses[userStatus]}`} />
            </div>
        </button>

      </div>
    </header>
  );
};

export default Header;