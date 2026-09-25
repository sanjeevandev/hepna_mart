import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConstructionSite } from '@/types';
import toast from 'react-hot-toast';

interface SiteState {
  sites: ConstructionSite[];
  activeSiteId: string | null;

  addSite: (data: Omit<ConstructionSite, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateSite: (id: string, updates: Partial<ConstructionSite>) => void;
  deleteSite: (id: string) => void;
  setDefaultSite: (id: string) => void;
  getSite: (id: string) => ConstructionSite | undefined;
  setActiveSiteId: (id: string | null) => void;
}

const DEFAULT_SITES: ConstructionSite[] = [
  {
    id: 'site-pune-villa',
    userId: 'usr-contractor-1',
    projectId: 'proj-sample-1',
    siteName: 'Green Villa Site (Phase 1)',
    contactPerson: 'Ramesh (Site Foreman)',
    contactPhone: '+91 98765 11223',
    address: 'Plot 48, Baner-Pashan Link Road, Near Symphony Club',
    landmark: 'Opposite Hill View Residency',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    pincode: '411045',
    accessRoad: '12m Wide Tar Road',
    vehicleAccess: '10-Wheeler Tipper / Transit Mixer Accessible',
    unloadingInstructions: 'Unload cement bags inside dry covered shed. Stack steel on timber sleepers near Gate 2.',
    isDefault: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'site-mumbai-comm',
    userId: 'usr-contractor-1',
    siteName: 'Apex Commercial Plaza Yard',
    contactPerson: 'Sunil Verma (Logistics In-charge)',
    contactPhone: '+91 98200 44556',
    address: 'Survey No. 112, MIDC Industrial Corridor',
    landmark: 'Behind Metro Substation',
    city: 'Mumbai',
    district: 'Thane',
    state: 'Maharashtra',
    pincode: '400708',
    accessRoad: 'Highway Access 18m',
    vehicleAccess: 'Trailer / Flatbed & Multi-Axle Trucks Permitted',
    unloadingInstructions: 'Entry only between 8:00 AM - 6:00 PM. Gate pass required at Security Post 1.',
    isDefault: false,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useSiteStore = create<SiteState>()(
  persist(
    (set, get) => ({
      sites: DEFAULT_SITES,
      activeSiteId: 'site-pune-villa',

      addSite: (data) => {
        const id = 'site-' + Date.now();
        const isFirst = get().sites.length === 0;

        const newSite: ConstructionSite = {
          ...data,
          id,
          isDefault: data.isDefault || isFirst,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // If newly added site is marked default, unset others
        let updatedSites = [...get().sites, newSite];
        if (newSite.isDefault) {
          updatedSites = updatedSites.map((s) =>
            s.id === id ? s : { ...s, isDefault: false }
          );
        }

        set({
          sites: updatedSites,
          activeSiteId: id,
        });

        toast.success(`Saved site "${newSite.siteName}"`);
        return id;
      },

      updateSite: (id, updates) => {
        set((state) => {
          let updatedSites = state.sites.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          );

          if (updates.isDefault) {
            updatedSites = updatedSites.map((s) =>
              s.id === id ? s : { ...s, isDefault: false }
            );
          }

          return { sites: updatedSites };
        });
        toast.success('Construction site updated');
      },

      deleteSite: (id) => {
        const target = get().sites.find((s) => s.id === id);
        set((state) => ({
          sites: state.sites.filter((s) => s.id !== id),
          activeSiteId: state.activeSiteId === id ? null : state.activeSiteId,
        }));
        toast.success(`Removed site "${target?.siteName || 'Site'}"`);
      },

      setDefaultSite: (id) => {
        set((state) => ({
          sites: state.sites.map((s) => ({
            ...s,
            isDefault: s.id === id,
          })),
        }));
        toast.success('Default construction site updated');
      },

      getSite: (id) => {
        return get().sites.find((s) => s.id === id);
      },

      setActiveSiteId: (id) => {
        set({ activeSiteId: id });
      },
    }),
    {
      name: 'hepna-sites',
    }
  )
);
