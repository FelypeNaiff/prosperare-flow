import { useState, useEffect } from 'react';
import { User, UserProfile } from '@/lib/types';

const MOCK_USER: User = {
  id: 'user_1',
  name: 'Gestor ContaHub',
  email: 'gestor@contahub.com.br',
  profile: 'ADMINISTRADOR',
  avatarUrl: 'https://picsum.photos/seed/user1/100/100',
  status: 'ATIVO',
  department: 'Diretoria'
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => {
      setUser(MOCK_USER);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const loginWithGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      setUser(MOCK_USER);
      setLoading(false);
    }, 1000);
  };

  const logout = () => {
    setUser(null);
  };

  const hasAccess = (requiredProfiles: UserProfile[]) => {
    if (!user) return false;
    return requiredProfiles.includes(user.profile);
  };

  return { user, loading, loginWithGoogle, logout, hasAccess };
}
