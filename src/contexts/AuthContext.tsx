import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type AccessModule =
  | 'dashboard'
  | 'crm'
  | 'calls'
  | 'call_review'
  | 'clients'
  | 'hr'
  | 'attendance'
  | 'finance'
  | 'settings';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: 'admin' | 'user';
  accesses: AccessModule[];
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  allUsers: User[];
  loading: boolean;
  login: (role?: string) => void;
  logout: () => Promise<void>;
  hasAccess: (module: AccessModule) => boolean;
  createUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'healthfirst_pure_token';
const ADMIN_SESSION_KEY = 'ss_healthcare_admin_session';

const ADMIN_ACCESSES: AccessModule[] = [
  'dashboard',
  'crm',
  'calls',
  'clients',
  'hr',
  'attendance',
  'finance',
  'settings',
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const setAdminUser = (name = 'System Admin') => {
    setUser({
      id: 'admin',
      username: 'admin',
      name,
      role: 'admin',
      accesses: ADMIN_ACCESSES,
      avatar: 'SA',
    });
  };

  const loadSupabaseProfile = async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (!supabaseUser) {
      setUser(null);
      return;
    }

    const { data: profile } = await supabase
      .from('employees')
      .select('id, username, full_name, role, accesses, photo_url')
      .eq('username', supabaseUser.email?.split('@')[0])
      .single();

    if (profile) {
      setUser({
        id: profile.id,
        username: profile.username,
        name: profile.full_name,
        role: profile.role,
        accesses: profile.role === 'admin' ? ADMIN_ACCESSES : (profile.accesses || []),
        avatar: profile.photo_url || profile.full_name?.[0] || 'U',
      });
      return;
    }

    setUser(null);
  };

  useEffect(() => {
    const checkUser = async () => {
      const localToken = localStorage.getItem(LOCAL_STORAGE_KEY);
      const adminSession = localStorage.getItem(ADMIN_SESSION_KEY);
      if (localToken === 'admin-token' && adminSession) {
        try {
          const parsed = JSON.parse(adminSession) as { name?: string };
          setAdminUser(parsed.name || 'System Admin');
        } catch {
          setAdminUser();
        }
        setLoading(false);
        return;
      }

      await loadSupabaseProfile();
      setLoading(false);
    };

    checkUser();
  }, []);

  const login = async (adminName?: string) => {
    if (adminName) {
      localStorage.setItem(LOCAL_STORAGE_KEY, 'admin-token');
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ name: adminName }));
      setAdminUser(adminName);
      return;
    }

    await loadSupabaseProfile();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setUser(null);
  };

  const hasAccess = (module: AccessModule) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (module === 'calls' && user.accesses.includes('call_review')) return true;
    return user.accesses.includes(module);
  };

  const createUser = () => {};
  const updateUser = () => {};
  const deleteUser = () => {};

  return (
    <AuthContext.Provider value={{ user, allUsers, loading, login, logout, hasAccess, createUser, updateUser, deleteUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
