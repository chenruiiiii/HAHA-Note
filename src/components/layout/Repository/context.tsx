'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface RepoDetailContextValue {
  docTitles: Record<string, string>;
  setDocTitle: (docsId: string, title: string) => void;
}

const RepoDetailContext = createContext<RepoDetailContextValue | null>(null);

export function RepoDetailProvider({ children }: { children: ReactNode }) {
  const [docTitles, setDocTitles] = useState<Record<string, string>>({});

  const setDocTitle = useCallback((docsId: string, title: string) => {
    setDocTitles((current) => {
      if (current[docsId] === title) {
        return current;
      }

      return {
        ...current,
        [docsId]: title,
      };
    });
  }, []);

  const value = useMemo(() => ({ docTitles, setDocTitle }), [docTitles, setDocTitle]);

  return <RepoDetailContext.Provider value={value}>{children}</RepoDetailContext.Provider>;
}

export function useRepoDetailContext() {
  const context = useContext(RepoDetailContext);

  if (!context) {
    throw new Error('useRepoDetailContext must be used within RepoDetailProvider');
  }

  return context;
}
