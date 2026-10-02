import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HardHat,
  Building,
  Ruler,
  CheckCircle2,
  Circle,
  FileText,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Calculator,
  Users,
  UserPlus,
  Shield,
  Edit3,
  LogOut,
  RefreshCw,
  History,
  Activity,
  ArrowRightLeft,
  Calendar,
  Layers,
  Clock,
  Filter,
  MessageSquare,
} from 'lucide-react';
import { useProjectStore } from '@/store/projectStore';
import { useBusinessStore } from '@/store/businessStore';
import { products } from '@/data/products';
import { categories } from '@/data/categories';
import { OrgRole, ProjectMember, ProjectActivityEvent } from '@/types';
import { ProjectCommentsTab } from '@/components/project/ProjectCommentsTab';
import { formatPrice } from '@/utils/formatPrice';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const STAGES = [
  'Foundation',
  'Structure',
  'Masonry',
  'Plumbing & Electrical',
  'Flooring',
  'Finishing',
];

const AVAILABLE_PROJECT_ROLES: { role: OrgRole; label: string; desc: string }[] = [
  { role: 'project_manager', label: 'Project Manager', desc: 'Full project planning, BOQ and collaborator management' },
  { role: 'procurement_manager', label: 'Procurement Officer', desc: 'Can manage BOQ items, rates, and purchase tracking' },
  { role: 'site_supervisor', label: 'Site Supervisor', desc: 'Can update received quantities and toggle milestones' },
  { role: 'viewer', label: 'Read-Only Viewer', desc: 'Audit and inspection access only' },
];

function formatActionTitle(act: ProjectActivityEvent): string {
  const m = act.metadata || {};
  switch (act.action) {
    case 'PROJECT_CREATED':
      return `Created project workspace "${m.name || 'Project'}"`;
    case 'PROJECT_UPDATED':
      return `Updated project properties (${(m.updated_fields || []).join(', ') || 'metadata'})`;
    case 'PROJECT_DELETED':
      return `Deleted project workspace "${m.name || 'Project'}"`;
    case 'PROJECT_TRANSFERRED':
    case 'PROJECT_MOVED_TO_ORGANIZATION':
      return 'Transferred workspace to Organization';
    case 'PROJECT_MOVED_TO_PERSONAL':
      return 'Converted workspace to Private Personal Project';
    case 'BOQ_MATERIAL_ADDED':
      return `Added ${m.quantity ?? ''} ${m.unit || 'unit'} of ${m.product_name || 'Material'} to BOQ`;
    case 'BOQ_MATERIAL_UPDATED':
      return `Updated ${m.product_name || 'Material'} quantity (${m.old_quantity ?? ''} → ${m.new_quantity ?? ''})`;
    case 'PURCHASED_QUANTITY_UPDATED':
      return `Updated purchased quantity for ${m.product_name || 'Material'} (${m.new_purchased_quantity ?? 0} received)`;
    case 'PROCUREMENT_NOTE_UPDATED':
      return `Updated procurement notes on ${m.product_name || 'Material'}`;
    case 'BOQ_MATERIAL_REMOVED':
      return `Removed ${m.product_name || 'Material'} from BOQ`;
    case 'BOQ_PRICING_REFRESHED':
      return `Refreshed pricing snapshots for ${m.items_count ?? 0} BOQ items`;
    case 'PROJECT_STAGE_UPDATED':
      return `Milestone stage "${m.stage}" marked as ${m.is_completed ? 'Completed ✓' : 'In-Progress'}`;
    case 'PROJECT_MEMBER_ADDED':
      return `Assigned ${m.member_name || m.member_email || 'collaborator'} as ${m.role || 'member'}`;
    case 'PROJECT_MEMBER_ROLE_UPDATED':
      return `Changed ${m.member_name || 'collaborator'}'s role from ${m.old_role || ''} to ${m.new_role || ''}`;
    case 'PROJECT_MEMBER_REMOVED':
      return `Removed ${m.member_name || 'collaborator'} from project`;
    case 'ESTIMATE_TRANSFERRED_TO_BOQ':
      return `Transferred ${m.transferred_items ?? 0} materials from Estimate ${m.estimate_id ? '#' + m.estimate_id : ''}`;
    default:
      return act.action.replace(/_/g, ' ');
  }
}

function getActionBadgeStyle(action: string) {
  if (action.includes('CREATED') || action.includes('ADDED')) {
    return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Plus };
  }
  if (action.includes('REMOVED') || action.includes('DELETED')) {
    return { bg: 'bg-red-50 text-red-700 border-red-200', icon: Trash2 };
  }
  if (action.includes('STAGE') || action.includes('COMPLETE')) {
    return { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 };
  }
  if (action.includes('MEMBER') || action.includes('ROLE')) {
    return { bg: 'bg-purple-50 text-purple-700 border-purple-200', icon: Users };
  }
  if (action.includes('PRICING') || action.includes('ESTIMATE') || action.includes('PURCHASED')) {
    return { bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Sparkles };
  }
  return { bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: Activity };
}

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    getProject,
    fetchProjectById,
    toggleStageComplete,
    removeMaterialFromProject,
    addProjectMember,
    updateProjectMemberRole,
    removeProjectMember,
    transferProjectOrganization,
    activities,
    fetchProjectActivity,
    comments,
    fetchProjectComments,
  } = useProjectStore();

  const {
    organizations,
    members: orgMembers,
    fetchOrganizations,
    fetchMembers,
  } = useBusinessStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'collaboration'>('overview');
  const [activityFilter,
  MessageSquare, setActivityFilter] = useState<string>('all');
  const [isRefreshingActivity, setIsRefreshingActivity] = useState(false);

  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<OrgRole>('viewer');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [targetOrgId, setTargetOrgId] = useState<string>('');

  useEffect(() => {
    if (projectId) {
      fetchProjectById(projectId);
      fetchProjectActivity(projectId);
      fetchProjectComments(projectId);
    }
    fetchOrganizations();
  }, [projectId, fetchProjectById, fetchProjectActivity, fetchOrganizations]);

  const project = projectId ? getProject(projectId) : undefined;
  const projectActivities = (projectId && activities[projectId]) ? activities[projectId] : [];
  const projectComments = (projectId && comments[projectId]) ? comments[projectId] : [];

  useEffect(() => {
    if (project?.organizationId || project?.organization_id) {
      const oid = (project.organizationId || project.organization_id) as string;
      fetchMembers(oid);
    }
  }, [project?.organizationId, project?.organization_id, fetchMembers]);

  if (!project) {
    return (
      <div className="container-custom py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Project Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">The project you are looking for does not exist on this device.</p>
        <Link to="/projects">
          <Button variant="primary" size="md">Return to Projects Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Calculate project financial metrics
  const totalMaterialValue = (project.materials || []).reduce((acc, m) => {
    const prod = products.find((p) => p.id === m.productId);
    return acc + (prod?.price || 0) * m.quantity;
  }, 0);

  const progressPct = Math.round(
    ((project.completedStages || []).length / STAGES.length) * 100
  );

  const isShared = Boolean(project.isShared || project.organizationId || project.organization_id);
  const role = project.currentUserRole || project.current_user_role;
  const isManagerOrAdmin = !isShared || role === 'owner' || role === 'admin' || role === 'project_manager';
  const isOwnerOrAdmin = !isShared || role === 'owner' || role === 'admin';

  // Filter org members who are not yet added to this project
  const existingProjectUserIds = new Set((project.members || []).map((m) => m.userId));
  const availableOrgMembersToAdd = orgMembers.filter((om) => !existingProjectUserIds.has(om.user_id));

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToAdd || !projectId) return;

    const ok = await addProjectMember(projectId, selectedUserToAdd, selectedRoleToAdd);
    if (ok) {
      setIsAddMemberOpen(false);
      setSelectedUserToAdd('');
      setSelectedRoleToAdd('viewer');
      fetchProjectActivity(projectId);
      fetchProjectComments(projectId);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    const ok = await transferProjectOrganization(projectId, targetOrgId || null);
    if (ok) {
      setIsTransferModalOpen(false);
      fetchProjectActivity(projectId);
      fetchProjectComments(projectId);
    }
  };

  const handleRefreshActivity = async () => {
    if (!projectId) return;
    setIsRefreshingActivity(true);
    await fetchProjectActivity(projectId);
    setIsRefreshingActivity(false);
    toast.success('Activity log updated');
  };

  // Filter activities
  const filteredActivities = projectActivities.filter((act) => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'boq') return act.action.startsWith('BOQ_') || act.action.startsWith('PURCHASED') || act.action.startsWith('PROCUREMENT');
    if (activityFilter === 'stages') return act.action.includes('STAGE');
    if (activityFilter === 'team') return act.action.includes('MEMBER');
    if (activityFilter === 'workspace') return act.action.startsWith('PROJECT_') || act.action.includes('TRANSFERRED') || act.action.includes('ESTIMATE');
    return true;
  });

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-8 sm:py-12">
      <div className="container-custom">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Projects</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to={`/calculator?projectId=${project.id}`}>
              <button
                type="button"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Calculator className="w-4 h-4 text-accent" />
                <span>Calculate Cost</span>
              </button>
            </Link>

            <Link to={`/projects/${project.id}/boq`}>
              <button
                type="button"
                className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Open BOQ Matrix</span>
              </button>
            </Link>
          </div>
        </div>

        {/* Project Header Hero Card */}
        <div className="bg-[#071A2B] text-white p-6 sm:p-8 rounded-2xl mb-8 border border-white/10 shadow-lg relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {isShared ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-200 text-xs font-bold">
                    <Building className="w-3.5 h-3.5" />
                    <span>{project.organizationName || project.organization_name || 'Organization Project'}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-slate-300 text-xs font-medium">
                    <span>👤 Personal Workspace</span>
                  </div>
                )}

                {role && isShared && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-accent/20 border border-accent/40 text-accent-light capitalize">
                    Your Role: {role.replace('_', ' ')}
                  </span>
                )}

                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider">
                  <span>{project.type}</span>
                  <span>•</span>
                  <span>{project.city}</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-4xl font-heading font-black text-white">
                {project.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-3">
                <span>📏 {project.builtUpArea} {project.areaUnit}</span>
                <span>•</span>
                <span>🏢 {project.floors} Floor{project.floors > 1 ? 's' : ''}</span>
                <span>•</span>
                <span>📍 Active Stage: {project.stage}</span>
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm text-center">
              <div>
                <div className="text-xs text-slate-400 font-medium">BOQ Items</div>
                <div className="text-lg sm:text-xl font-bold text-white">{(project.materials || []).length}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Est. Value</div>
                <div className="text-lg sm:text-xl font-bold text-accent">{formatPrice(totalMaterialValue)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Milestone</div>
                <div className="text-lg sm:text-xl font-bold text-emerald-400">{progressPct}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'bg-[#071A2B] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Workspace Overview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'bg-[#071A2B] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <History className="w-4 h-4 text-accent" />
            <span>Activity & Audit History</span>
            {projectActivities.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-accent/20 text-accent font-extrabold">
                {projectActivities.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collaboration')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'collaboration'
                ? 'bg-[#071A2B] text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-accent" />
            <span>Discussions & Notes</span>
            {projectComments.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-accent/20 text-accent font-extrabold">
                {projectComments.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <>
            {/* Milestone Stage Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                    Construction Stage Progress
                  </h2>
                  <p className="text-xs text-slate-500">
                    Click a stage to mark it as completed or in-progress
                  </p>
                </div>
                <span className="text-xs font-bold text-accent bg-orange-50 px-3 py-1 rounded-full border border-orange-200/60">
                  {(project.completedStages || []).length} of {STAGES.length} Completed
                </span>
              </div>

              <div className="py-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {STAGES.map((st, idx) => {
                    const isCompleted = (project.completedStages || []).includes(st);
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={async () => {
                          await toggleStageComplete(project.id, st);
                          fetchProjectActivity(project.id);
                        }}
                        className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isCompleted
                            ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950 shadow-sm'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Stage 0{idx + 1}
                          </span>
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                        </div>
                        <div className="font-bold text-xs sm:text-sm">{st}</div>
                        <div className="text-[10px] mt-1 font-medium text-slate-500">
                          {isCompleted ? '✓ Completed' : 'Click to complete'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Team & Collaborators Section (Phase 2L.3) */}
            {isShared && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                        Team & Collaborators
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/50">
                        {(project.members || []).length} Assigned
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Assigned organization members collaborating on this Bill of Quantities (BOQ).
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwnerOrAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsTransferModalOpen(true)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Building className="w-3.5 h-3.5" />
                        <span>Transfer Workspace</span>
                      </button>
                    )}

                    {isManagerOrAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsAddMemberOpen(true)}
                        className="px-3.5 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Collaborator</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Members List */}
                <div className="divide-y divide-slate-100">
                  {(project.members || []).map((m) => {
                    return (
                      <div key={m.id} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {m.name ? m.name.charAt(0).toUpperCase() : m.email ? m.email.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs sm:text-sm text-slate-900 truncate flex items-center gap-2">
                              <span>{m.name || m.email || 'Team Member'}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {m.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isManagerOrAdmin && role !== 'viewer' && role !== 'site_supervisor' ? (
                            <select
                              value={m.role}
                              onChange={async (e) => {
                                await updateProjectMemberRole(project.id, m.userId, e.target.value as OrgRole);
                                fetchProjectActivity(project.id);
                              }}
                              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-accent"
                            >
                              {AVAILABLE_PROJECT_ROLES.map((r) => (
                                <option key={r.role} value={r.role}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-bold capitalize">
                              {m.role.replace('_', ' ')}
                            </span>
                          )}

                          {isManagerOrAdmin && (
                            <button
                              type="button"
                              onClick={async () => {
                                await removeProjectMember(project.id, m.userId);
                                fetchProjectActivity(project.id);
                              }}
                              className="p-1.5 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove collaborator"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2-Column Content Layout: BOQ Items & Category Explorers */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left 2 Cols: Project Materials List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                    <div>
                      <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                        Project Materials in BOQ ({(project.materials || []).length})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Materials actively mapped to this project
                      </p>
                    </div>

                    <Link
                      to={`/projects/${project.id}/boq`}
                      className="text-xs text-accent hover:underline font-bold flex items-center gap-1"
                    >
                      <span>Edit Full BOQ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {(project.materials || []).length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <HardHat className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">Your project is ready!</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Start adding materials from our catalog to calculate quantities and establish your project BOQ.
                      </p>
                      <Link to="/shop">
                        <Button variant="primary" size="sm" className="mt-2">
                          Browse Materials Catalog
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {project.materials.map((item) => {
                        const product = products.find((p) => p.id === item.productId);
                        if (!product) return null;
                        const lineTotal = product.price * item.quantity;

                        return (
                          <div
                            key={item.productId}
                            className="py-3.5 flex items-center justify-between gap-4 group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={product.images?.[0] || 'https://placehold.co/100?text=HEPNA'}
                                alt={product.name}
                                className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                              />
                              <div className="min-w-0">
                                <Link
                                  to={`/product/${product.slug}`}
                                  className="font-bold text-xs sm:text-sm text-slate-900 hover:text-accent transition-colors truncate block"
                                >
                                  {product.name}
                                </Link>
                                <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                  <span className="font-semibold text-slate-700">
                                    {item.quantity} {item.unit}
                                  </span>
                                  <span>•</span>
                                  <span>{formatPrice(product.price)} / {product.unit}</span>
                                  {item.stage && (
                                    <>
                                      <span>•</span>
                                      <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium text-[10px]">
                                        {item.stage}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className="font-extrabold text-xs sm:text-sm text-slate-900">
                                  {formatPrice(lineTotal)}
                                </div>
                                <div className="text-[10px] text-emerald-600 font-medium">
                                  In Stock
                                </div>
                              </div>

                              {role !== 'viewer' && role !== 'site_supervisor' && (
                                <button
                                  onClick={async () => {
                                    removeMaterialFromProject(project.id, item.productId);
                                    fetchProjectActivity(project.id);
                                  }}
                                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove from project"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right 1 Col: Material Categories Shortcut Grid */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="font-heading font-bold text-base text-slate-900 mb-1">
                    Explore Project Materials
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Select a category to browse supplies and add directly into this project:
                  </p>

                  <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        className="p-2.5 rounded-xl border border-slate-100 hover:border-accent/40 bg-slate-50/60 hover:bg-orange-50/50 flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-8 h-8 rounded-lg object-cover bg-white shrink-0 border border-slate-200"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 group-hover:text-accent truncate">
                              {cat.name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {cat.productCount}+ certified supplies
                            </div>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-accent shrink-0 pl-2">
                          + Add
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Direct Logistics Banner */}
                <div className="p-4 bg-[#071A2B] text-white rounded-2xl border border-white/10 shadow-sm space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-accent font-bold">
                    <Truck className="w-4 h-4" />
                    <span>Site Vehicle Dispatch Available</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    HEPNA MART coordinates scheduled vehicle drops directly at your site in {project.city}.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab 3: COLLABORATION & DISCUSSIONS (Phase 2L.6) */}
        {activeTab === 'collaboration' && (
          <ProjectCommentsTab projectId={project.id} project={project} />
        )}

        {/* Tab 2: ACTIVITY & AUDIT HISTORY */}
        {activeTab === 'activity' && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-accent" />
                  <h2 className="font-heading font-bold text-lg text-slate-900">
                    Project Activity & Audit Trail
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Chronological, immutable audit record of workspace modifications, material revisions, and membership changes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshActivity}
                  disabled={isRefreshingActivity}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingActivity ? 'animate-spin' : ''}`} />
                  <span>Refresh Trail</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {[
                { id: 'all', label: 'All Events' },
                { id: 'boq', label: 'BOQ & Materials' },
                { id: 'stages', label: 'Milestones' },
                { id: 'team', label: 'Collaborators' },
                { id: 'workspace', label: 'Workspace & Transfers' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActivityFilter(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activityFilter === f.id
                      ? 'bg-accent text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Timeline Stream */}
            {filteredActivities.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">No activity recorded for this filter</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Modifications to BOQs, project specifications, and collaborators are automatically recorded here.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {filteredActivities.map((act) => {
                  const badge = getActionBadgeStyle(act.action);
                  const IconComponent = badge.icon;
                  const dateStr = new Date(act.created_at).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });

                  return (
                    <div key={act.id} className="relative group">
                      {/* Timeline Node Dot */}
                      <div className="absolute -left-6 sm:-left-8 top-1 w-6 h-6 rounded-full bg-white border-2 border-slate-300 group-hover:border-accent flex items-center justify-center transition-colors">
                        <div className="w-2 h-2 rounded-full bg-slate-400 group-hover:bg-accent transition-colors" />
                      </div>

                      {/* Event Box Card */}
                      <div className="bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-slate-300 p-4 rounded-xl transition-all shadow-2xs space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${badge.bg}`}>
                              <IconComponent className="w-3 h-3" />
                              <span>{act.action.replace(/_/g, ' ')}</span>
                            </span>

                            <span className="font-bold text-xs sm:text-sm text-slate-900">
                              {formatActionTitle(act)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{dateStr}</span>
                          </div>
                        </div>

                        {/* Actor & Metadata Details */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-600">Actor:</span>
                            <span className="font-semibold text-slate-800">
                              {act.actor?.name || act.actor?.email || act.actor_user_id || 'System'}
                            </span>
                            {act.actor?.email && act.actor.name && (
                              <span className="text-[11px] text-slate-400">({act.actor.email})</span>
                            )}
                          </div>

                          {act.metadata && Object.keys(act.metadata).length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {act.metadata.stage && (
                                <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                                  Stage: {act.metadata.stage}
                                </span>
                              )}
                              {act.metadata.quantity !== undefined && (
                                <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                                  Qty: {act.metadata.quantity} {act.metadata.unit || ''}
                                </span>
                              )}
                              {act.metadata.price !== undefined && (
                                <span className="bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">
                                  Rate: ₹{act.metadata.price}
                                </span>
                              )}
                              {act.metadata.target_organization_id && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-medium">
                                  Target Org: {act.metadata.target_organization_id}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Collaborator Modal */}
        {isAddMemberOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-base text-slate-900">
                    Assign Team Collaborator
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {availableOrgMembersToAdd.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-slate-500 mb-3">
                    All organization members are already assigned to this project.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setIsAddMemberOpen(false)}>
                    Close
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Select Organization Member
                    </label>
                    <select
                      value={selectedUserToAdd}
                      onChange={(e) => setSelectedUserToAdd(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="">Choose a member...</option>
                      {availableOrgMembersToAdd.map((om) => (
                        <option key={om.user_id} value={om.user_id}>
                          {om.name || om.email} ({om.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assign Project Role
                    </label>
                    <select
                      value={selectedRoleToAdd}
                      onChange={(e) => setSelectedRoleToAdd(e.target.value as OrgRole)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      {AVAILABLE_PROJECT_ROLES.map((r) => (
                        <option key={r.role} value={r.role}>
                          {r.label} — {r.desc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddMemberOpen(false)}
                      className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!selectedUserToAdd}
                      className="flex-1 py-2 rounded-xl bg-accent hover:bg-accent-dark text-white font-bold text-xs disabled:opacity-50"
                    >
                      Assign to Project
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Transfer Workspace Modal */}
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-base text-slate-900">
                    Transfer Project Workspace
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Transfer this project to another organization or convert it into a private personal project. Non-organization collaborators will be cleanly purged upon transfer.
              </p>

              <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Destination Workspace
                  </label>
                  <select
                    value={targetOrgId}
                    onChange={(e) => setTargetOrgId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                  >
                    <option value="">👤 Convert to Personal Project (Private)</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        🏢 {org.name} ({org.business_type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#071A2B] hover:bg-[#0B2742] text-white font-bold text-xs"
                  >
                    Confirm Transfer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
