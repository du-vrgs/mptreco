import { useState, useCallback, useRef } from 'react';
import { Track } from '@/shared/types';

export const useSearchHelper = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const executeSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!res.ok) throw new Error('Erro na busca');
      const data = await res.json();
      setResults(data.tracks || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Falha na busca:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Debounce de 600ms para digitação suave
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(value);
    }, 600);
  }, [executeSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  }, []);

  return {
    query,
    results,
    isSearching,
    hasSearched,
    handleQueryChange,
    executeSearch,
    clearSearch,
  };
};
