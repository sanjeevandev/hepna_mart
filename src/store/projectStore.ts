import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, ProjectMaterialItem, ProjectType, ProjectStage } from '@/types';
import { products } from '@/data/products';
import toast from 'react-hot-toast';

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;

  createProject: (
    data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'materials' | 'completedStages'>
  ) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  addMaterialToProject: (
    projectId: string,
    productId: string,
    quantity?: number,
    unit?: string,
    stage?: string,
    wastagePercent?: number,
    purchasedQuantity?: number,
    priceAtAddition?: number,
    notes?: string
  ) => boolean;
  removeMaterialFromProject: (projectId: string, productId: string) => void;
  updateMaterialQuantity: (
    projectId: string,
    productId: string,
    quantity: number,
    unit?: string
  ) => void;
  updatePurchasedQuantity: (
    projectId: string,
    productId: string,
    purchasedQuantity: number
  ) => void;
  updateWastagePercent: (
    projectId: string,
    productId: string,
    wastagePercent: number
  ) => void;
  updateMaterialNotes: (
    projectId: string,
    productId: string,
    notes: string
  ) => void;
  refreshBOQPricing: (projectId: string) => void;
  toggleStageComplete: (projectId: string, stage: string) => void;
  setActiveProjectId: (id: string | null) => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [
        // Default sample project showcasing full procurement lifecycle & price differences
        {
          id: 'proj-sample-1',
          name: 'Green Villa Construction',
          type: 'Villa',
          builtUpArea: 1800,
          areaUnit: 'sq.ft',
          floors: 2,
          stage: 'Foundation',
          city: 'Pune',
          pincode: '411045',
          createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          updatedAt: new Date().toISOString(),
          materials: [
            {
              productId: 'prod-1',
              quantity: 450,
              unit: 'Bag',
              purchasedQuantity: 250,
              wastagePercent: 5,
              stage: 'Foundation',
              notes: 'Store in dry covered shed, stack max 10 bags high',
              priceAtAddition: 375, // Old rate vs current 390 (price increased)
              addedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
            },
            {
              productId: 'prod-6',
              quantity: 6500,
              unit: 'Piece',
              purchasedQuantity: 6500,
              wastagePercent: 8,
              stage: 'Masonry',
              notes: 'Class I kiln burnt, soak in water before laying',
              priceAtAddition: 8, // Same as catalog
              addedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            },
            {
              productId: 'prod-16',
              quantity: 120,
              unit: 'Piece',
              purchasedQuantity: 40,
              wastagePercent: 5,
              stage: 'Plumbing & Electrical',
              notes: 'Rigid PVC 6kg/cm² for drainage & soil waste',
              priceAtAddition: 420, // vs catalog
              addedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            },
            {
              productId: 'prod-26',
              quantity: 180,
              unit: 'Sq. Ft.',
              purchasedQuantity: 0,
              wastagePercent: 10,
              stage: 'Flooring',
              notes: 'Premium vitrified glazed floor tiles for living room',
              priceAtAddition: 65,
              addedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
            {
              productId: 'prod-36',
              quantity: 35,
              unit: 'Litre',
              purchasedQuantity: 0,
              wastagePercent: 0,
              stage: 'Finishing',
              notes: 'Exterior weather defense coating, 2 coats',
              priceAtAddition: 450,
              addedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
            },
          ],
          completedStages: ['Foundation'],
        },
      ],
      activeProjectId: 'proj-sample-1',

      createProject: (data) => {
        const id = 'proj-' + Date.now();
        const newProject: Project = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          materials: [],
          completedStages: [],
        };

        set((state) => ({
          projects: [newProject, ...state.projects],
          activeProjectId: id,
        }));

        toast.success(`Project "${data.name}" created successfully!`);
        return id;
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
        toast.success('Project details updated');
      },

      deleteProject: (id) => {
        const target = get().projects.find((p) => p.id === id);
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
        toast.success(`Project "${target?.name || 'Project'}" deleted`);
      },

      getProject: (id) => {
        return get().projects.find((p) => p.id === id);
      },

      addMaterialToProject: (
        projectId,
        productId,
        quantity = 1,
        unit = 'Piece',
        stage,
        wastagePercent = 0,
        purchasedQuantity = 0,
        priceAtAddition,
        notes = ''
      ) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) {
          toast.error('Project not found');
          return false;
        }

        const catProduct = products.find((p) => p.id === productId);
        const resolvedPrice = priceAtAddition !== undefined ? priceAtAddition : (catProduct?.price || 0);

        const existingMaterialIndex = project.materials.findIndex(
          (m) => m.productId === productId
        );

        let updatedMaterials: ProjectMaterialItem[];
        if (existingMaterialIndex >= 0) {
          updatedMaterials = project.materials.map((m, idx) =>
            idx === existingMaterialIndex
              ? {
                  ...m,
                  quantity: m.quantity + quantity,
                  ...(wastagePercent !== undefined ? { wastagePercent } : {}),
                  ...(purchasedQuantity !== undefined ? { purchasedQuantity: (m.purchasedQuantity || 0) + purchasedQuantity } : {}),
                  ...(notes ? { notes } : {}),
                }
              : m
          );
          toast.success(`Updated material quantity in "${project.name}"`);
        } else {
          updatedMaterials = [
            ...project.materials,
            {
              productId,
              quantity,
              unit,
              stage: stage || project.stage || 'Foundation',
              wastagePercent,
              purchasedQuantity,
              priceAtAddition: resolvedPrice,
              notes,
              addedAt: new Date().toISOString(),
            },
          ];
          toast.success(`Added to "${project.name}"`);
        }

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? { ...p, materials: updatedMaterials, updatedAt: new Date().toISOString() }
              : p
          ),
        }));

        return true;
      },

      removeMaterialFromProject: (projectId, productId) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  materials: p.materials.filter((m) => m.productId !== productId),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
        toast.success('Material removed from project BOQ');
      },

      updateMaterialQuantity: (projectId, productId, quantity, unit) => {
        if (quantity <= 0) {
          get().removeMaterialFromProject(projectId, productId);
          return;
        }

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  materials: p.materials.map((m) =>
                    m.productId === productId
                      ? { ...m, quantity, ...(unit ? { unit } : {}) }
                      : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      updatePurchasedQuantity: (projectId, productId, purchasedQuantity) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  materials: p.materials.map((m) =>
                    m.productId === productId
                      ? { ...m, purchasedQuantity: Math.max(0, purchasedQuantity) }
                      : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      updateWastagePercent: (projectId, productId, wastagePercent) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  materials: p.materials.map((m) =>
                    m.productId === productId
                      ? { ...m, wastagePercent: Math.max(0, Math.min(50, wastagePercent)) }
                      : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      updateMaterialNotes: (projectId, productId, notes) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  materials: p.materials.map((m) =>
                    m.productId === productId
                      ? { ...m, notes }
                      : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));
      },

      refreshBOQPricing: (projectId) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p;
            const updatedMaterials = p.materials.map((m) => {
              const liveProd = products.find((prod) => prod.id === m.productId);
              return {
                ...m,
                priceAtAddition: liveProd ? liveProd.price : m.priceAtAddition,
              };
            });
            return {
              ...p,
              materials: updatedMaterials,
              updatedAt: new Date().toISOString(),
            };
          }),
        }));
        toast.success('BOQ prices updated to current HEPNA MART catalog rates!', { icon: '✨' });
      },

      toggleStageComplete: (projectId, stage) => {
        const project = get().projects.find((p) => p.id === projectId);
        if (!project) return;

        const isCompleted = project.completedStages.includes(stage);
        const updatedCompletedStages = isCompleted
          ? project.completedStages.filter((s) => s !== stage)
          : [...project.completedStages, stage];

        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  completedStages: updatedCompletedStages,
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));

        if (!isCompleted) {
          toast.success(`Stage "${stage}" marked as completed!`, { icon: '🎉' });
        } else {
          toast(`Stage "${stage}" moved back to in-progress`, { icon: 'ℹ️' });
        }
      },

      setActiveProjectId: (id) => {
        set({ activeProjectId: id });
      },
    }),
    {
      name: 'hepna-projects',
    }
  )
);
