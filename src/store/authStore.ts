import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, AccountType, UserRole, Permission } from '@/types';
import { hasPermission as checkRolePermission } from '@/utils/rbac';
import {
  apiClient,
  removeAuthToken,
  LoginPayload,
  RegisterPayload,
  BackendUserResponse,
} from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import toast from 'react-hot-toast';


/**
 * =========================================================================
 * AUTHENTICATION STORE & SESSION ADAPTER
 * =========================================================================
 * Authoritative integration with FastAPI backend in Phase 2B.
 * Maintains local development personas for instant testing & offline fallback.
 */

export const PRESET_DEV_USERS: UserProfile[] = [
  {
    id: 'usr-admin-super',
    name: 'Sanjeevan',
    email: 'sanjeevan@hepnamart.com',
    phone: '+91 99000 00001',
    accountType: 'business',
    role: 'super_admin',
    companyName: 'HEPNA MART HQ',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    createdAt: new Date(Date.now() - 86400000 * 120).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-admin-ops',
    name: 'Kavita Verma',
    email: 'kavita.v@hepnamart.com',
    phone: '+91 99000 11111',
    accountType: 'business',
    role: 'admin',
    companyName: 'HEPNA MART Operations',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120',
    createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-admin-procurement',
    name: 'Rajesh Kumar',
    email: 'rajesh.k@hepnamart.com',
    phone: '+91 99000 22222',
    accountType: 'business',
    role: 'procurement_manager',
    companyName: 'HEPNA MART Procurement Division',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120',
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-admin-inventory',
    name: 'Sneha Joshi',
    email: 'sneha.j@hepnamart.com',
    phone: '+91 99000 33333',
    accountType: 'business',
    role: 'inventory_manager',
    companyName: 'HEPNA MART Central Yard',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120',
    createdAt: new Date(Date.now() - 86400000 * 50).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-admin-order',
    name: 'Vikram Singh',
    email: 'vikram.s@hepnamart.com',
    phone: '+91 99000 44444',
    accountType: 'business',
    role: 'order_manager',
    companyName: 'HEPNA MART Logistics Hub',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120',
    createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-admin-support',
    name: 'Ananya Rao',
    email: 'ananya.r@hepnamart.com',
    phone: '+91 99000 55555',
    accountType: 'business',
    role: 'support_staff',
    companyName: 'HEPNA MART Customer Care',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-business-1',
    name: 'Priya Sharma',
    email: 'priya.sharma@apexinfra.com',
    phone: '+91 98112 34567',
    accountType: 'business',
    role: 'customer',
    companyName: 'Apex Infrastructure Pvt Ltd',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-contractor-1',
    name: 'John Doe',
    email: 'john.doe@buildright.in',
    phone: '+91 98765 43210',
    accountType: 'contractor',
    role: 'customer',
    companyName: 'BuildRight Constructions',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'usr-individual-1',
    name: 'Rahul Mehta',
    email: 'rahul.mehta@gmail.com',
    phone: '+91 98220 12345',
    accountType: 'individual',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function transformBackendUser(user: BackendUserResponse): UserProfile {
  return {
    id: user.id,
    name: user.full_name || `${user.first_name} ${user.last_name}`.trim(),
    email: user.email,
    phone: user.phone || '+91 98765 00000',
    accountType: user.account_type as AccountType,
    role: user.role as UserRole,
    companyName: user.company_name || undefined,
    createdAt: user.created_at,
    updatedAt: new Date().toISOString(),
  };
}

interface AuthState {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  serverPermissions: string[];

  // Local / Mock methods
  login: (email: string, role?: UserRole, accountType?: AccountType, name?: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setAccountType: (type: AccountType) => void;
  setRole: (role: UserRole) => void;
  switchDevUser: (userId: string) => void;
  hasPermission: (permission: Permission) => boolean;

  // Backend integration methods
  loginWithBackend: (credentials: LoginPayload) => Promise<boolean>;
  registerWithBackend: (payload: RegisterPayload) => Promise<boolean>;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Default initial state: Super Admin (Sanjeevan) for seamless dev admin panel access
      currentUser: PRESET_DEV_USERS[0],
      isAuthenticated: true,
      serverPermissions: [],

      login: (email, role = 'customer', accountType = 'individual', name) => {
        const existing = PRESET_DEV_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );

        if (existing) {
          set({ currentUser: existing, isAuthenticated: true, serverPermissions: [] });
          toast.success(`Welcome back, ${existing.name}!`);
          return;
        }

        const newUser: UserProfile = {
          id: 'usr-' + Date.now(),
          name: name || email.split('@')[0],
          email,
          phone: '+91 98765 00000',
          accountType,
          role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set({ currentUser: newUser, isAuthenticated: true, serverPermissions: [] });
        toast.success(`Signed in as ${newUser.name}`);
      },

      logout: () => {
        removeAuthToken();
        apiClient.auth.logout().catch(() => {});
        set({ currentUser: null, isAuthenticated: false, serverPermissions: [] });
        // Clear or reset active user cart
        useCartStore.getState().clearCart().catch(() => {});
        toast('Signed out successfully');
      },

      updateProfile: (updates) => {
        const current = get().currentUser;
        if (!current) return;

        const updated: UserProfile = {
          ...current,
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        set({ currentUser: updated });
        toast.success('Profile updated successfully');
      },

      setAccountType: (accountType) => {
        const current = get().currentUser;
        if (!current) return;

        set({
          currentUser: {
            ...current,
            accountType,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      setRole: (role) => {
        const current = get().currentUser;
        if (!current) return;

        set({
          currentUser: {
            ...current,
            role,
            updatedAt: new Date().toISOString(),
          },
        });
        toast.success(`Role switched to ${role.replace('_', ' ')}`);
      },

      switchDevUser: (userId) => {
        const target = PRESET_DEV_USERS.find((u) => u.id === userId);
        if (target) {
          set({ currentUser: target, isAuthenticated: true, serverPermissions: [] });
          toast.success(`Switched active user to "${target.name}" (${target.role})`, {
            icon: '🔄',
          });
        }
      },

      hasPermission: (permission) => {
        const { serverPermissions, currentUser } = get();
        if (serverPermissions && serverPermissions.length > 0) {
          return serverPermissions.includes(permission);
        }
        return checkRolePermission(currentUser?.role, permission);
      },

      loginWithBackend: async (credentials) => {
        try {
          const res = await apiClient.auth.login(credentials);
          if (res.data?.user) {
            const userProfile = transformBackendUser(res.data.user);
            // Fetch complete permissions
            let permissions: string[] = [];
            try {
              const meRes = await apiClient.auth.getMe();
              permissions = meRes.data?.permissions || [];
            } catch {
              // Non-fatal
            }

            set({
              currentUser: userProfile,
              isAuthenticated: true,
              serverPermissions: permissions,
            });

            // Safe merge guest cart & wishlist into backend
            useCartStore.getState().mergeGuestCart().catch(() => {});
            useWishlistStore.getState().mergeGuestWishlist().catch(() => {});

            toast.success(`Welcome back, ${userProfile.name}!`);
            return true;
          }
          return false;
        } catch (err: any) {
          toast.error(err.message || 'Login failed');
          return false;
        }
      },

      registerWithBackend: async (payload) => {
        try {
          const res = await apiClient.auth.register(payload);
          if (res.data?.user) {
            const userProfile = transformBackendUser(res.data.user);
            set({
              currentUser: userProfile,
              isAuthenticated: true,
              serverPermissions: [],
            });

            // Safe merge guest cart & wishlist into backend
            useCartStore.getState().mergeGuestCart().catch(() => {});
            useWishlistStore.getState().mergeGuestWishlist().catch(() => {});

            toast.success(`Welcome to HEPNA MART, ${userProfile.name}!`);
            return true;
          }
          return false;
        } catch (err: any) {
          toast.error(err.message || 'Registration failed');
          return false;
        }
      },

      fetchCurrentUser: async () => {
        try {
          const res = await apiClient.auth.getMe();
          if (res.data) {
            const userProfile = transformBackendUser(res.data);
            set({
              currentUser: userProfile,
              isAuthenticated: true,
              serverPermissions: res.data.permissions || [],
            });
            // Fetch synced cart & wishlist
            useCartStore.getState().fetchCart().catch(() => {});
            useWishlistStore.getState().fetchWishlist().catch(() => {});
          }
        } catch {
          // Token invalid or expired
        }
      },
    }),
    {
      name: 'hepna-auth',
    }
  )
);

