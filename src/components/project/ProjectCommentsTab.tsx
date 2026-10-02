import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  Users,
  AtSign,
  MessageSquarePlus,
  RefreshCw,
} from 'lucide-react';
import { Project, ProjectComment, ProjectMember } from '@/types';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface ProjectCommentsTabProps {
  projectId: string;
  project: Project;
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-600 text-white',
    'bg-orange-600 text-white',
    'bg-emerald-600 text-white',
    'bg-purple-600 text-white',
    'bg-indigo-600 text-white',
    'bg-amber-600 text-white',
    'bg-teal-600 text-white',
    'bg-rose-600 text-white',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'TM';
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ProjectCommentsTab: React.FC<ProjectCommentsTabProps> = ({ projectId, project }) => {
  const { user } = useAuthStore();
  const {
    comments,
    fetchProjectComments,
    addProjectComment,
    updateProjectComment,
    deleteProjectComment,
    fetchProjectActivity,
  } = useProjectStore();

  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchProjectComments(projectId);
    }
  }, [projectId, fetchProjectComments]);

  const projectComments = comments[projectId] || [];

  const role = project.currentUserRole || project.current_user_role;
  const isShared = Boolean(project.isShared || project.organizationId || project.organization_id);
  const isManagerOrAdmin = !isShared || role === 'owner' || role === 'admin' || role === 'project_manager';

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newComment.trim();
    if (!clean || !projectId) return;

    setIsSubmitting(true);
    const created = await addProjectComment(projectId, clean);
    if (created) {
      setNewComment('');
      fetchProjectActivity(projectId);
    }
    setIsSubmitting(false);
  };

  const handleStartEdit = (comment: ProjectComment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (commentId: string) => {
    const clean = editingContent.trim();
    if (!clean || !projectId) return;

    setIsUpdating(true);
    const ok = await updateProjectComment(projectId, commentId, clean);
    if (ok) {
      setEditingCommentId(null);
      setEditingContent('');
      fetchProjectActivity(projectId);
    }
    setIsUpdating(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!projectId) return;
    const ok = await deleteProjectComment(projectId, commentId);
    if (ok) {
      setDeletingCommentId(null);
      fetchProjectActivity(projectId);
    }
  };

  const handleInsertMention = (nameOrEmail: string) => {
    const handle = nameOrEmail.split('@')[0].replace(/\s+/g, '');
    setNewComment((prev) => {
      const space = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
      return `${prev}${space}@${handle} `;
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProjectComments(projectId);
    setIsRefreshing(false);
    toast.success('Discussions updated');
  };

  // Render comment text with highlighted mentions
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(@[a-zA-Z0-9_.+-]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="inline-block px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-xs mx-0.5"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header & Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-lg sm:text-xl text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-accent" />
                <span>Project Discussions & Notes</span>
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
                {projectComments.length} {projectComments.length === 1 ? 'Message' : 'Messages'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Collaborate, share field updates, coordinate materials, and document decisions with your team.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Comment Composer */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <form onSubmit={handleSubmitComment} className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="hidden sm:flex w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-xs items-center justify-center shrink-0">
              {getInitials(user?.name, user?.email)}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Post a message, milestone update, or question for project collaborators..."
                rows={3}
                maxLength={5000}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                {/* Mentions quick picker */}
                {project.members && project.members.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                      <AtSign className="w-3 h-3" /> Mention:
                    </span>
                    {project.members.slice(0, 4).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleInsertMention(m.name || m.email || m.userId)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 text-[11px] font-medium transition-colors"
                      >
                        @{m.name?.split(' ')[0] || m.email?.split('@')[0] || 'member'}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 ml-auto">
                  <span className="text-[11px] text-slate-400">
                    {newComment.length}/5000
                  </span>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting || newComment.trim().length === 0}
                    className="!bg-accent hover:!bg-accent-dark !text-white flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Posting...' : 'Post Message'}</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Comments Feed */}
      <div className="space-y-3">
        {projectComments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-orange-50 text-accent mx-auto flex items-center justify-center mb-3">
              <MessageSquarePlus className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No project discussions yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Start the conversation with your team to share site progress, coordinate deliveries, or document specs.
            </p>
          </div>
        ) : (
          projectComments.map((c) => {
            const isAuthor = user?.id === c.userId;
            const canDelete = isAuthor || isManagerOrAdmin;
            const isEditing = editingCommentId === c.id;
            const authorName = c.author?.name || c.author?.email || 'Team Member';
            const authorRole = c.author?.role ? c.author.role.replace('_', ' ') : 'collaborator';
            const avatarColor = getAvatarColor(authorName);

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
                  isAuthor ? 'border-blue-100 bg-blue-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* User Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full ${avatarColor} font-bold text-xs flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      {getInitials(c.author?.name, c.author?.email)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                          {authorName}
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold capitalize">
                          {authorRole}
                        </span>

                        {isAuthor && (
                          <span className="px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">
                            You
                          </span>
                        )}

                        <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(c.createdAt)}
                        </span>

                        {c.isEdited && (
                          <span className="text-[10px] text-slate-400 italic">
                            (edited)
                          </span>
                        )}
                      </div>

                      {/* Comment Body / Edit View */}
                      {isEditing ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            rows={3}
                            maxLength={5000}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(c.id)}
                              disabled={isUpdating || editingContent.trim().length === 0}
                              className="px-3 py-1 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isUpdating ? 'Saving...' : 'Save'}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed mt-1 break-words">
                          {renderFormattedContent(c.content)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Dropdown / Buttons */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 shrink-0">
                      {isAuthor && (
                        <button
                          type="button"
                          onClick={() => handleStartEdit(c)}
                          title="Edit Comment"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canDelete && (
                        <>
                          {deletingCommentId === c.id ? (
                            <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200">
                              <button
                                type="button"
                                onClick={() => handleDelete(c.id)}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingCommentId(null)}
                                className="p-0.5 text-slate-500 hover:text-slate-800"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeletingCommentId(c.id)}
                              title="Delete Comment"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
