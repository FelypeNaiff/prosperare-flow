'use client';

import { useEffect, useState } from 'react';

import { useUser } from '@/firebase';
import { fetchAccessibleCompanies } from '@/lib/fiscal/client';
import type { AccessibleCompany } from '@/lib/fiscal/types';

export function useAccessibleCompanies() {
  const { user, userLoaded } = useUser();
  const [companies, setCompanies] = useState<AccessibleCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userLoaded) return;
    if (!user) {
      setCompanies([]);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    fetchAccessibleCompanies(user)
      .then((items) => active && setCompanies(items))
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Falha ao carregar empresas.');
      })
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [user, userLoaded]);

  return { companies, isLoading, error };
}
