'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  documentId,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';

import { useAccessibleCompanies } from '@/hooks/use-accessible-companies';
import {
  chunkAuthorizedCompanyIds,
  mergeAuthorizedCompanyResults,
  type AuthorizedResultOptions,
} from '@/lib/fiscal/company-query';

const DEFAULT_RESULT_OPTIONS = {};

export function useAuthorizedCompanyCollection<T extends DocumentData = DocumentData>(
  firestore: Firestore,
  collectionName: string,
  companyField: string = 'canonicalClientId',
  enabled = true,
  resultOptions: AuthorizedResultOptions<T & { id: string }> = DEFAULT_RESULT_OPTIONS,
) {
  const { companies, isLoading: companiesLoading, error: companiesError } = useAccessibleCompanies();
  const companyIds = useMemo(() => companies.map((company) => company.id).sort(), [companies]);
  const [data, setData] = useState<Array<T & { id: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || companiesLoading) return;
    if (companiesError) {
      setError(new Error(companiesError));
      setIsLoading(false);
      return;
    }
    if (companyIds.length === 0) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const chunks = chunkAuthorizedCompanyIds(companyIds);
    const results = new Map<number, Array<T & { id: string }>>();
    const loaded = new Set<number>();
    const unsubscribers = chunks.map((ids, index) => {
      const field = companyField === '__name__' ? documentId() : companyField;
      const constrained = query(collection(firestore, collectionName), where(field, 'in', ids));
      return onSnapshot(
        constrained,
        (snapshot) => {
          results.set(index, snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as T & { id: string })));
          loaded.add(index);
          setData(mergeAuthorizedCompanyResults(results.values(), resultOptions));
          if (loaded.size === chunks.length) setIsLoading(false);
        },
        (cause) => {
          setError(cause);
          setIsLoading(false);
        },
      );
    });

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [collectionName, companiesError, companiesLoading, companyField, companyIds, enabled, firestore, resultOptions]);

  return { data, isLoading: companiesLoading || isLoading, error, companyIds };
}
