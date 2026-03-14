import { useState, useEffect } from 'react';
import { User, UserProfile } from '@/lib/types';

const MOCK_USER: User = {
  id: 'user_1',
  name: 'Felype Naiff',
  email: 'felype.naiff@prosperare.com.br',
  profile: 'ADMINISTRADOR',
  avatarUrl: 'https://picsum.photos/seed/felype/100/100',
  status: 'ATIVO',
  department: 'Diretoria'
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tenta carregar usuário da sessão simulada
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('prosperare_auth') : null;
    
    const timer = setTimeout(() => {
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(MOCK_USER);
        localStorage.setItem('prosperare_auth', JSON.stringify(MOCK_USER));
      }
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const loginWithGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      setUser(MOCK_USER);
      localStorage.setItem('prosperare_auth', JSON.stringify(MOCK_USER));
      setLoading(false);
    }, 1000);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('prosperare_auth');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const hasAccess = (requiredProfiles: UserProfile[]) => {
    if (!user) return false;
    return requiredProfiles.includes(user.profile);
  };

  return { user, loading, loginWithGoogle, logout, hasAccess };
}
