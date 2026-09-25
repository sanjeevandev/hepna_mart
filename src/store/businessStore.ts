import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BusinessProfile, ContractorProfile, TeamMember } from '@/types';
import toast from 'react-hot-toast';

interface BusinessState {
  businessProfile: BusinessProfile | null;
  contractorProfile: ContractorProfile | null;
  teamMembers: TeamMember[];

  updateBusinessProfile: (updates: Partial<BusinessProfile>) => void;
  updateContractorProfile: (updates: Partial<ContractorProfile>) => void;
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

      updateBusinessProfile: (updates) => {
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

        set({ businessProfile: updated });
        toast.success('Business profile updated');
      },

      updateContractorProfile: (updates) => {
        const current = get().contractorProfile;
        const updated: ContractorProfile = current
          ? { ...current, ...updates }
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

        set({ contractorProfile: updated });
        toast.success('Contractor details updated');
      },

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
