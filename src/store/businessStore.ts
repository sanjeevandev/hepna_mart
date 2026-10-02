import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BusinessProfile,
  ContractorProfile,
  TeamMember,
  BackendOrganization,
  BackendOrgMember,
  BackendInvitation,
  OrgRole,
  CreateOrganizationPayload,
  UpdateOrganizationPayload,
} from '@/types';
import {
  apiClient,
  BackendBusinessProfile,
  BackendContractorProfile,
  BusinessProfilePayload,
  ContractorProfilePayload,
} from '@/lib/api';
import toast from 'react-hot-toast';

function mapBackendBusinessProfile(b: BackendBusinessProfile): BusinessProfile {
  return {
    id: b.id,
    userId: b.user_id,
    businessName: b.business_name,
    businessType: b.business_type,
    gstin: b.gstin || undefined,
    pan: b.pan || undefined,
    registeredAddress: b.registered_address,
    city: b.city,
    state: b.state,
    pincode: b.pincode,
    contactPerson: b.contact_person,
    contactPhone: b.contact_phone,
    contactEmail: b.contact_email || undefined,
    taxVerificationStatus: b.tax_verification_status,
    taxVerificationNotes: b.tax_verification_notes || undefined,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

function mapBackendContractorProfile(c: BackendContractorProfile): ContractorProfile {
  return {
    contractorId: c.id,
    userId: c.user_id,
    businessName: c.business_name,
    specialization: (c.specialization || []) as any,
    yearsOfExperience: c.years_of_experience,
    serviceArea: c.service_area,
    licenseNumber: c.license_number || undefined,
    projectCount: c.project_count,
    preferredMaterials: c.preferred_materials || [],
    verificationStatus: c.verification_status,
    verificationNotes: c.verification_notes || undefined,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

interface BusinessState {
  businessProfile: BusinessProfile | null;
  contractorProfile: ContractorProfile | null;
  teamMembers: TeamMember[];
  isLoading: boolean;
  error: string | null;

  // Phase 2L.2 Organization & RBAC State
  organizations: BackendOrganization[];
  activeOrganization: BackendOrganization | null;
  members: BackendOrgMember[];
  invitations: BackendInvitation[];
  isOrgLoading: boolean;

  fetchProfiles: () => Promise<void>;
  fetchBusinessProfile: () => Promise<void>;
  fetchContractorProfile: () => Promise<void>;
  updateBusinessProfile: (updates: Partial<BusinessProfile>) => Promise<void>;
  updateContractorProfile: (updates: Partial<ContractorProfile>) => Promise<void>;
  clearProfiles: () => void;

  // Organization Actions
  fetchOrganizations: () => Promise<void>;
  setActiveOrganization: (org: BackendOrganization | null) => Promise<void>;
  createOrganization: (name: string, businessType?: string) => Promise<BackendOrganization | null>;
  updateOrganization: (orgId: string, updates: UpdateOrganizationPayload) => Promise<void>;
  fetchMembers: (orgId: string) => Promise<void>;
  fetchInvitations: (orgId: string) => Promise<void>;
  inviteMember: (orgId: string, email: string, role: OrgRole) => Promise<boolean>;
  updateMemberRole: (orgId: string, userId: string, role: OrgRole) => Promise<boolean>;
  removeMember: (orgId: string, userId: string) => Promise<boolean>;
  revokeInvitation: (orgId: string, invitationId: string) => Promise<boolean>;
  acceptInvitation: (token: string) => Promise<boolean>;

  // Legacy fallback mock methods
  addTeamMember: (data: Omit<TeamMember, 'id' | 'joinedAt'>) => void;
  removeTeamMember: (id: string) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
}

const DEFAULT_CONTRACTOR_PROFILE: ContractorProfile = {
  contractorId: 'cont-7821',
  userId: 'usr-contractor-1',
  businessName: 'BuildRight Constructions',
  specialization: ['Residential Construction', 'Civil Works', 'Renovation'],
  yearsOfExperience: 12,
  serviceArea: 'Pune & Pimpri-Chinchwad Metropolitan Region',
  projectCount: 42,
  preferredMaterials: ['OPC 53 Cement', 'Fe 550D TMT Rebars', 'Vitrified Tiles'],
  createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
};

const DEFAULT_BUSINESS_PROFILE: BusinessProfile = {
  id: 'biz-9041',
  userId: 'usr-business-1',
  businessName: 'Apex Infrastructure Pvt Ltd',
  businessType: 'Private Limited Company',
  gstin: '27AAAAA0000A1Z5',
  pan: 'AAAAA0000A',
  registeredAddress: 'Apex Towers, 5th Floor, Senapati Bapat Road',
  city: 'Pune',
  state: 'Maharashtra',
  pincode: '411016',
  contactPerson: 'Priya Sharma',
  contactPhone: '+91 98112 34567',
  createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  updatedAt: new Date().toISOString(),
};

const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-1',
    businessId: 'biz-9041',
    name: 'Priya Sharma',
    email: 'priya.sharma@apexinfra.com',
    role: 'Owner',
    status: 'active',
    joinedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'tm-2',
    businessId: 'biz-9041',
    name: 'Karan Desai',
    email: 'karan.d@apexinfra.com',
    role: 'Procurement Manager',
    status: 'active',
    joinedAt: new Date(Date.now() - 86400000 * 20).toISOString(),
  },
  {
    id: 'tm-3',
    businessId: 'biz-9041',
    name: 'Suresh Patil',
    email: 'suresh.p@apexinfra.com',
    role: 'Project Manager',
    status: 'active',
    joinedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      businessProfile: DEFAULT_BUSINESS_PROFILE,
      contractorProfile: DEFAULT_CONTRACTOR_PROFILE,
      teamMembers: DEFAULT_TEAM_MEMBERS,
      isLoading: false,
      error: null,

      organizations: [],
      activeOrganization: null,
      members: [],
      invitations: [],
      isOrgLoading: false,

      fetchProfiles: async () => {
        await Promise.allSettled([
          get().fetchBusinessProfile(),
          get().fetchContractorProfile(),
          get().fetchOrganizations(),
        ]);
      },

      fetchBusinessProfile: async () => {
        const token = localStorage.getItem('hepna_auth_token');
        if (!token) return;
        set({ isLoading: true, error: null });
        try {
          const res = await apiClient.profile.getBusiness();
          if (res.data) {
            set({ businessProfile: mapBackendBusinessProfile(res.data), isLoading: false });
          }
        } catch (err: any) {
          set({ isLoading: false });
          if (err.status !== 404 && err.response?.status !== 404) {
            set({ error: err.message || 'Failed to fetch business profile' });
          }
        }
      },

      fetchContractorProfile: async () => {
        const token = localStorage.getItem('hepna_auth_token');
        if (!token) return;
        set({ isLoading: true, error: null });
        try {
          const res = await apiClient.profile.getContractor();
          if (res.data) {
            set({ contractorProfile: mapBackendContractorProfile(res.data), isLoading: false });
          }
        } catch (err: any) {
          set({ isLoading: false });
          if (err.status !== 404 && err.response?.status !== 404) {
            set({ error: err.message || 'Failed to fetch contractor profile' });
          }
        }
      },

      updateBusinessProfile: async (updates) => {
        const current = get().businessProfile;
        const updated: BusinessProfile = current
          ? { ...current, ...updates, updatedAt: new Date().toISOString() }
          : {
              id: 'biz-' + Date.now(),
              userId: 'usr-current',
              businessName: updates.businessName || 'My Business',
              businessType: updates.businessType || 'Proprietorship',
              registeredAddress: updates.registeredAddress || '',
              city: updates.city || '',
              state: updates.state || '',
              pincode: updates.pincode || '',
              contactPerson: updates.contactPerson || '',
              contactPhone: updates.contactPhone || '',
              ...updates,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

        set({ businessProfile: updated, error: null });

        const token = localStorage.getItem('hepna_auth_token');
        if (token) {
          try {
            const payload: BusinessProfilePayload = {
              business_name: updated.businessName,
              business_type: updated.businessType,
              gstin: updated.gstin ? updated.gstin.trim() : null,
              pan: updated.pan ? updated.pan.trim() : null,
              registered_address: updated.registeredAddress || 'Registered Office Address',
              city: updated.city || 'Pune',
              state: updated.state || 'Maharashtra',
              pincode: updated.pincode || '411001',
              contact_person: updated.contactPerson || 'Authorized Representative',
              contact_phone: updated.contactPhone || '+91 98765 43210',
              contact_email: updated.contactEmail ? updated.contactEmail.trim() : null,
            };
            const res = await apiClient.profile.updateBusiness(payload);
            if (res.data) {
              set({ businessProfile: mapBackendBusinessProfile(res.data) });
            }
          } catch (err: any) {
            console.warn('Backend business profile sync failed, preserved optimistic state', err);
            if (err.status === 422 || err.response?.status === 422) {
              toast.error(err.message || 'Invalid GSTIN or PAN format');
              return;
            }
          }
        }
        toast.success('Business profile updated');
      },

      updateContractorProfile: async (updates) => {
        const current = get().contractorProfile;
        const updated: ContractorProfile = current
          ? { ...current, ...updates, updatedAt: new Date().toISOString() }
          : {
              contractorId: 'cont-' + Date.now(),
              userId: 'usr-current',
              businessName: updates.businessName || 'My Contracting Enterprise',
              specialization: updates.specialization || ['Residential Construction'],
              yearsOfExperience: updates.yearsOfExperience || 1,
              serviceArea: updates.serviceArea || 'Local District',
              createdAt: new Date().toISOString(),
              ...updates,
            };

        set({ contractorProfile: updated, error: null });

        const token = localStorage.getItem('hepna_auth_token');
        if (token) {
          try {
            const payload: ContractorProfilePayload = {
              business_name: updated.businessName,
              specialization: updated.specialization as string[],
              years_of_experience: updated.yearsOfExperience,
              service_area: updated.serviceArea,
              license_number: updated.licenseNumber ? updated.licenseNumber.trim() : null,
              project_count: updated.projectCount || 0,
              preferred_materials: updated.preferredMaterials || [],
            };
            const res = await apiClient.profile.updateContractor(payload);
            if (res.data) {
              set({ contractorProfile: mapBackendContractorProfile(res.data) });
            }
          } catch (err: any) {
            console.warn('Backend contractor profile sync failed, preserved optimistic state', err);
            if (err.status === 422 || err.response?.status === 422) {
              toast.error(err.message || 'Invalid contractor profile data');
              return;
            }
          }
        }
        toast.success('Contractor details updated');
      },

      clearProfiles: () => {
        set({
          businessProfile: null,
          contractorProfile: null,
          organizations: [],
          activeOrganization: null,
          members: [],
          invitations: [],
          error: null,
        });
      },

      // --- Organization Actions (Phase 2L.2) ---

      fetchOrganizations: async () => {
        const token = localStorage.getItem('hepna_auth_token');
        if (!token) return;
        set({ isOrgLoading: true });
        try {
          const res = await apiClient.organizations.list();
          const orgs = res.data || [];
          const currentActive = get().activeOrganization;
          let nextActive: BackendOrganization | null = null;

          if (currentActive && orgs.some((o) => o.id === currentActive.id)) {
            nextActive = orgs.find((o) => o.id === currentActive.id) || null;
          } else if (orgs.length > 0) {
            nextActive = orgs[0];
          }

          set({ organizations: orgs, activeOrganization: nextActive, isOrgLoading: false });

          if (nextActive) {
            await Promise.allSettled([
              get().fetchMembers(nextActive.id),
              get().fetchInvitations(nextActive.id),
            ]);
          }
        } catch (err: any) {
          set({ isOrgLoading: false });
          console.warn('Failed to fetch organizations', err);
        }
      },

      setActiveOrganization: async (org: BackendOrganization | null) => {
        set({ activeOrganization: org, members: [], invitations: [] });
        if (org) {
          await Promise.allSettled([
            get().fetchMembers(org.id),
            get().fetchInvitations(org.id),
          ]);
        }
      },

      createOrganization: async (name: string, businessType = 'Proprietorship') => {
        set({ isOrgLoading: true });
        try {
          const payload: CreateOrganizationPayload = {
            name: name.trim(),
            business_type: businessType.trim(),
          };
          const res = await apiClient.organizations.create(payload);
          if (res.data) {
            const newOrg = res.data;
            const updatedList = [newOrg, ...get().organizations];
            set({
              organizations: updatedList,
              activeOrganization: newOrg,
              isOrgLoading: false,
            });
            toast.success(`Organization "${newOrg.name}" created successfully`);
            await get().fetchMembers(newOrg.id);
            return newOrg;
          }
          set({ isOrgLoading: false });
          return null;
        } catch (err: any) {
          set({ isOrgLoading: false });
          toast.error(err.message || 'Failed to create organization');
          return null;
        }
      },

      updateOrganization: async (orgId: string, updates: UpdateOrganizationPayload) => {
        try {
          const res = await apiClient.organizations.update(orgId, updates);
          if (res.data) {
            const updatedOrg = res.data;
            set({
              organizations: get().organizations.map((o) => (o.id === orgId ? updatedOrg : o)),
              activeOrganization:
                get().activeOrganization?.id === orgId ? updatedOrg : get().activeOrganization,
            });
            toast.success('Organization updated successfully');
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to update organization');
        }
      },

      fetchMembers: async (orgId: string) => {
        try {
          const res = await apiClient.organizations.listMembers(orgId);
          if (res.data) {
            set({ members: res.data });
          }
        } catch (err: any) {
          console.warn('Failed to fetch org members', err);
        }
      },

      fetchInvitations: async (orgId: string) => {
        try {
          const res = await apiClient.organizations.listInvitations(orgId);
          if (res.data) {
            set({ invitations: res.data });
          }
        } catch (err: any) {
          // If non-admin, 403 is normal
          if (err.status !== 403 && err.response?.status !== 403) {
            console.warn('Failed to fetch org invitations', err);
          }
        }
      },

      inviteMember: async (orgId: string, email: string, role: OrgRole) => {
        try {
          const res = await apiClient.organizations.createInvitation(orgId, {
            email: email.trim(),
            role,
          });
          if (res.data) {
            toast.success(`Invitation sent to ${email}`);
            await get().fetchInvitations(orgId);
            return true;
          }
          return false;
        } catch (err: any) {
          toast.error(err.message || 'Failed to send invitation');
          return false;
        }
      },

      updateMemberRole: async (orgId: string, userId: string, role: OrgRole) => {
        try {
          const res = await apiClient.organizations.updateMemberRole(orgId, userId, role);
          if (res.data) {
            const updated = res.data;
            set({
              members: get().members.map((m) => (m.user_id === userId ? updated : m)),
            });
            toast.success('Member role updated');
            return true;
          }
          return false;
        } catch (err: any) {
          toast.error(err.message || 'Failed to update role');
          return false;
        }
      },

      removeMember: async (orgId: string, userId: string) => {
        try {
          await apiClient.organizations.removeMember(orgId, userId);
          toast.success('Member removed from organization');
          await Promise.allSettled([
            get().fetchOrganizations(),
            get().fetchMembers(orgId),
          ]);
          return true;
        } catch (err: any) {
          toast.error(err.message || 'Failed to remove member');
          return false;
        }
      },

      revokeInvitation: async (orgId: string, invitationId: string) => {
        try {
          await apiClient.organizations.revokeInvitation(orgId, invitationId);
          toast.success('Invitation revoked');
          await get().fetchInvitations(orgId);
          return true;
        } catch (err: any) {
          toast.error(err.message || 'Failed to revoke invitation');
          return false;
        }
      },

      acceptInvitation: async (token: string) => {
        try {
          const res = await apiClient.invitations.accept(token.trim());
          if (res.data) {
            toast.success(res.data.message || 'Successfully joined organization');
            await get().fetchOrganizations();
            return true;
          }
          return false;
        } catch (err: any) {
          toast.error(err.message || 'Failed to accept invitation');
          return false;
        }
      },

      // --- Legacy Mock Fallback Actions ---
      addTeamMember: (data) => {
        const newMember: TeamMember = {
          ...data,
          id: 'tm-' + Date.now(),
          joinedAt: new Date().toISOString(),
        };

        set((state) => ({
          teamMembers: [...state.teamMembers, newMember],
        }));
        toast.success(`Added ${newMember.name} to team`);
      },

      removeTeamMember: (id) => {
        set((state) => ({
          teamMembers: state.teamMembers.filter((tm) => tm.id !== id),
        }));
        toast.success('Team member removed');
      },

      updateTeamMember: (id, updates) => {
        set((state) => ({
          teamMembers: state.teamMembers.map((tm) =>
            tm.id === id ? { ...tm, ...updates } : tm
          ),
        }));
        toast.success('Team member permissions updated');
      },
    }),
    {
      name: 'hepna-business',
    }
  )
);
