import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchPlaceholder: string;
  setSearchPlaceholder: (placeholder: string) => void;
  clearSearch: () => void;
  isSearchVisible: boolean;
  setIsSearchVisible: (visible: boolean) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customPlaceholder, setCustomPlaceholder] = useState<string | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const location = useLocation();

  // Compute smart contextual placeholder based on active path
  const defaultPlaceholder = useMemo(() => {
    const path = location.pathname;
    if (path === '/events-manage' || path.startsWith('/admin/events') || path.startsWith('/events')) {
      return 'Search events by title, venue, organizer...';
    }
    if (path === '/admin' || path.startsWith('/admin')) {
      return 'Search residents by name, flat #, phone, vehicle...';
    }
    if (path === '/facilities-manage' || path.startsWith('/facilities') || path.startsWith('/my-bookings')) {
      return 'Search facilities, amenities, bookings...';
    }
    if (path === '/complaints-manage' || path.startsWith('/complaints')) {
      return 'Search complaints by subject, flat, ticket #...';
    }
    if (
      path === '/visitors-manage' ||
      path.startsWith('/my-visitors') ||
      path.startsWith('/security') ||
      path.startsWith('/gate')
    ) {
      return 'Search visitor passes, vehicles, flat...';
    }
    if (path === '/permissions') {
      return 'Search members and roles...';
    }
    if (path === '/communications-manage' || path.startsWith('/announcements')) {
      return 'Search announcements and notices...';
    }
    if (path === '/volunteers-manage' || path.startsWith('/volunteers')) {
      return 'Search volunteer initiatives...';
    }
    if (
      path === '/sponsors-manage' ||
      path.startsWith('/sponsors') ||
      path === '/finance-manage' ||
      path.startsWith('/donations')
    ) {
      return 'Search sponsorships, donations, donors...';
    }
    return 'Search in page...';
  }, [location.pathname]);

  // Reset search query and custom placeholder when navigating between pages
  useEffect(() => {
    setSearchQuery('');
    setCustomPlaceholder(null);
  }, [location.pathname]);

  const clearSearch = () => setSearchQuery('');

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchPlaceholder: customPlaceholder || defaultPlaceholder,
        setSearchPlaceholder: setCustomPlaceholder,
        clearSearch,
        isSearchVisible,
        setIsSearchVisible,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
