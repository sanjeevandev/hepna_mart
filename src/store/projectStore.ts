import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Project, ProjectMaterialItem, ProjectType, ProjectStage, ProjectMember, OrgRole, ProjectActivityEvent } from '@/types';
import { products } from '@/data/products';
import { apiClient, getAuthToken, BackendProject } from '@/lib/api';
import toast from 'react-hot-toast';

function transformBackendProject(bp: BackendProject): Project {
  return {
    id: bp.id,
    name: bp.name,
    type: bp.project_type as ProjectType,
    builtUpArea: bp.built_up_area,
    areaUnit: (bp.area_unit as 'sq.ft' | 'sq.m') || 'sq.ft',
    floors: bp.floors,
    stage: (bp.stage as ProjectStage) || 'Foundation',
    city: bp.city,
    pincode: bp.pincode,
    createdAt: typeof bp.created_at === 'string' ? bp.created_at : new Date(bp.created_at).toISOString(),
    updatedAt: typeof bp.updated_at === 'string' ? bp.updated_at : new Date(bp.updated_at).toISOString(),
    completedStages: bp.completed_stages || [],
    organizationId: bp.organization_id || null,
    organization_id: bp.organization_id || null,
    organizationName: bp.organization_name || null,
    organization_name: bp.organization_name || null,
    currentUserRole: bp.current_user_role || null,
    current_user_role: bp.current_user_role || null,
    memberCount: bp.member_count ?? (bp.members ? bp.members.length : 0),
    member_count: bp.member_count ?? (bp.members ? bp.members.length : 0),
    isShared: Boolean(bp.is_shared || bp.organization_id),
    is_shared: Boolean(bp.is_shared || bp.organization_id),
    members: (bp.members || []).map((m) => ({
      id: m.id,
      projectId: m.project_id,
      userId: m.user_id,
      role: m.role,
      email: m.email || null,
      name: m.name || null,
      createdAt: m.created_at,
      updatedAt: m.updated_at || null,
    })),
    materials: (bp.materials || []).map((bm) => ({
      productId: bm.product_id,
      quantity: bm.quantity,
      unit: bm.unit,
      purchasedQuantity: bm.purchased_quantity,
      wastagePercent: bm.wastage_percent,
      stage: bm.stage || undefined,
      notes: bm.notes || '',
      addedAt: typeof bm.added_at === 'string' ? bm.added_at : new Date(bm.added_at).toISOString(),
      priceAtAddition: bm.price_at_addition,
    })),
  };
}

interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;
  isLoading: boolean;

  fetchProjects: () => Promise<void>;
  fetchProjectById: (projectId: string) => Promise<Project | null>;
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

  // Project Members & Transfer Collaboration
  fetchProjectMembers: (projectId: string) => Promise<ProjectMember[]>;
  addProjectMember: (projectId: string, userId: string, role: OrgRole) => Promise<boolean>;
  updateProjectMemberRole: (projectId: string, userId: string, role: OrgRole) => Promise<boolean>;
  removeProjectMember: (projectId: string, userId: string) => Promise<boolean>;
  transferProjectOrganization: (projectId: string, targetOrgId: string | null) => Promise<boolean>;
  activities: Record<string, ProjectActivityEvent[]>;
  fetchProjectActivity: (projectId: string, params?: { page?: number; limit?: number; action?: string }) => Promise<ProjectActivityEvent[]>;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [
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
          isShared: false,
          materials: [
            {
              productId: 'prod-1',
              quantity: 450,
              unit: 'Bag',
              purchasedQuantity: 250,
              wastagePercent: 5,
              stage: 'Foundation',
              notes: 'Store in dry covered shed, stack max 10 bags high',
              priceAtAddition: 375,
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
              priceAtAddition: 8,
              addedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
            },
          ],
          completedStages: ['Foundation'],
        },
      ],
      activeProjectId: 'proj-sample-1',
      isLoading: false,

      fetchProjects: async () => {
        const token = getAuthToken();
        if (!token) return;
        set({ isLoading: true });
        try {
          const res = await apiClient.projects.list();
          if (res.data?.projects) {
            const transformed = res.data.projects.map(transformBackendProject);
            set({ projects: transformed, isLoading: false });
            if (transformed.length > 0 && !get().activeProjectId) {
              set({ activeProjectId: transformed[0].id });
            }
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      },

      fetchProjectById: async (projectId: string) => {
        if (!getAuthToken()) return get().getProject(projectId) || null;
        try {
          const res = await apiClient.projects.get(projectId);
          if (res.data) {
            const transformed = transformBackendProject(res.data);
            set((state) => ({
              projects: state.projects.some((p) => p.id === projectId)
                ? state.projects.map((p) => (p.id === projectId ? transformed : p))
                : [transformed, ...state.projects],
            }));
            return transformed;
          }
        } catch {}
        return get().getProject(projectId) || null;
      },

      createProject: (data) => {
        const id = 'proj-' + Date.now();
        const newProject: Project = {
          ...data,
          id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          materials: [],
          completedStages: [],
          isShared: Boolean(data.organizationId || data.organization_id),
          is_shared: Boolean(data.organizationId || data.organization_id),
          members: [],
        };

        set((state) => ({
          projects: [newProject, ...state.projects],
          activeProjectId: id,
        }));

        toast.success(`Project "${data.name}" created successfully!`);

        if (getAuthToken()) {
          apiClient.projects.create({
            name: data.name,
            organization_id: data.organizationId || data.organization_id || null,
            project_type: data.type,
            built_up_area: data.builtUpArea,
            area_unit: data.areaUnit,
            floors: data.floors,
            stage: data.stage,
            city: data.city,
            pincode: data.pincode,
          }).then((res) => {
            if (res.data?.id && res.data.id !== id) {
              const serverProject = transformBackendProject(res.data);
              set((state) => ({
                projects: state.projects.map((p) => (p.id === id ? serverProject : p)),
                activeProjectId: state.activeProjectId === id ? serverProject.id : state.activeProjectId,
              }));
            }
          }).catch((err) => {
            toast.error(err.message || 'Failed to sync project creation to server');
          });
        }

        return id;
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        }));
        toast.success('Project details updated');

        if (getAuthToken()) {
          apiClient.projects.update(id, {
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.organizationId !== undefined ? { organization_id: updates.organizationId } : {}),
            ...(updates.type !== undefined ? { project_type: updates.type } : {}),
            ...(updates.builtUpArea !== undefined ? { built_up_area: updates.builtUpArea } : {}),
            ...(updates.areaUnit !== undefined ? { area_unit: updates.areaUnit } : {}),
            ...(updates.floors !== undefined ? { floors: updates.floors } : {}),
            ...(updates.stage !== undefined ? { stage: updates.stage } : {}),
            ...(updates.city !== undefined ? { city: updates.city } : {}),
            ...(updates.pincode !== undefined ? { pincode: updates.pincode } : {}),
            ...(updates.completedStages !== undefined ? { completed_stages: updates.completedStages } : {}),
          }).catch((err) => {
            toast.error(err.message || 'Failed to update project on server');
          });
        }
      },

      deleteProject: (id) => {
        const target = get().projects.find((p) => p.id === id);
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
        toast.success(`Project "${target?.name || 'Project'}" deleted`);

        if (getAuthToken()) {
          apiClient.projects.delete(id).catch((err) => {
            toast.error(err.message || 'Failed to delete project on server');
          });
        }
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

        if (getAuthToken()) {
          if (existingMaterialIndex >= 0) {
            const targetMat = updatedMaterials[existingMaterialIndex];
            apiClient.projects.updateMaterial(projectId, productId, {
              quantity: targetMat.quantity,
              unit: targetMat.unit,
              purchased_quantity: targetMat.purchasedQuantity,
              wastage_percent: targetMat.wastagePercent,
              notes: targetMat.notes,
            }).catch((err) => {
              toast.error(err.message || 'Failed to update BOQ material');
            });
          } else {
            apiClient.projects.addMaterial(projectId, {
              product_id: productId,
              quantity,
              unit,
              stage: stage || project.stage || 'Foundation',
              wastage_percent: wastagePercent,
              purchased_quantity: purchasedQuantity,
              price_at_addition: resolvedPrice,
              notes,
            }).catch((err) => {
              toast.error(err.message || 'Failed to add BOQ material');
            });
          }
        }

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

        if (getAuthToken()) {
          apiClient.projects.removeMaterial(projectId, productId).catch((err) => {
            toast.error(err.message || 'Failed to remove material from server');
          });
        }
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

        if (getAuthToken()) {
          apiClient.projects.updateMaterial(projectId, productId, {
            quantity,
            ...(unit ? { unit } : {}),
          }).catch((err) => {
            toast.error(err.message || 'Failed to update quantity on server');
          });
        }
      },

      updatePurchasedQuantity: (projectId, productId, purchasedQuantity) => {
        const safePurchased = Math.max(0, purchasedQuantity);
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  materials: p.materials.map((m) =>
                    m.productId === productId
                      ? { ...m, purchasedQuantity: safePurchased }
                      : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));

        if (getAuthToken()) {
          apiClient.projects.updateMaterial(projectId, productId, {
            purchased_quantity: safePurchased,
          }).catch((err) => {
            toast.error(err.message || 'Failed to update purchased quantity');
          });
        }
      },

      updateWastagePercent: (projectId, productId, wastagePercent) => {
        const safeWastage = Math.max(0, Math.min(50, wastagePercent));
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  materials: p.materials.map((m) =>
                    m.productId === productId
                      ? { ...m, wastagePercent: safeWastage }
                      : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        }));

        if (getAuthToken()) {
          apiClient.projects.updateMaterial(projectId, productId, {
            wastage_percent: safeWastage,
          }).catch((err) => {
            toast.error(err.message || 'Failed to update wastage percentage');
          });
        }
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

        if (getAuthToken()) {
          apiClient.projects.updateMaterial(projectId, productId, {
            notes,
          }).catch((err) => {
            toast.error(err.message || 'Failed to update notes');
          });
        }
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

        if (getAuthToken()) {
          apiClient.projects.refreshBOQPricing(projectId).catch((err) => {
            toast.error(err.message || 'Failed to refresh prices on server');
          });
        }
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

        if (getAuthToken()) {
          apiClient.projects.toggleStage(projectId, stage).catch((err) => {
            toast.error(err.message || 'Failed to toggle stage on server');
          });
        }
      },

      setActiveProjectId: (id) => {
        set({ activeProjectId: id });
      },

      // Project Collaboration Methods
      fetchProjectMembers: async (projectId: string) => {
        if (!getAuthToken()) return [];
        try {
          const res = await apiClient.projects.listMembers(projectId);
          if (res.data) {
            const mapped: ProjectMember[] = res.data.map((m) => ({
              id: m.id,
              projectId: m.project_id,
              userId: m.user_id,
              role: m.role,
              email: m.email || null,
              name: m.name || null,
              createdAt: m.created_at,
              updatedAt: m.updated_at || null,
            }));
            set((state) => ({
              projects: state.projects.map((p) =>
                p.id === projectId ? { ...p, members: mapped, memberCount: mapped.length } : p
              ),
            }));
            return mapped;
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to fetch project collaborators');
        }
        return [];
      },

      addProjectMember: async (projectId: string, userId: string, role: OrgRole) => {
        try {
          const res = await apiClient.projects.addMember(projectId, { user_id: userId, role });
          if (res.data) {
            toast.success('Collaborator added to project');
            await get().fetchProjectById(projectId);
            return true;
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to add collaborator');
        }
        return false;
      },

      updateProjectMemberRole: async (projectId: string, userId: string, role: OrgRole) => {
        try {
          const res = await apiClient.projects.updateMemberRole(projectId, userId, { role });
          if (res.data) {
            toast.success('Collaborator role updated');
            await get().fetchProjectById(projectId);
            return true;
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to update role');
        }
        return false;
      },

      removeProjectMember: async (projectId: string, userId: string) => {
        try {
          await apiClient.projects.removeMember(projectId, userId);
          toast.success('Collaborator removed from project');
          await get().fetchProjectById(projectId);
          return true;
        } catch (err: any) {
          toast.error(err.message || 'Failed to remove collaborator');
        }
        return false;
      },

      transferProjectOrganization: async (projectId: string, targetOrgId: string | null) => {
        try {
          const res = await apiClient.projects.transferOrganization(projectId, {
            target_organization_id: targetOrgId,
          });
          if (res.data) {
            toast.success('Project organization transferred successfully');
            await get().fetchProjects();
            return true;
          }
        } catch (err: any) {
          toast.error(err.message || 'Failed to transfer project organization');
        }
        return false;
      },
    }),
    {
      name: 'hepna-projects',
    }
  )
);
