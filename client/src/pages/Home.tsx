import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  ArrowRight,
  ShieldCheck,
  Layers,
  BookOpen,
  Clock,
  Plus,
  PenTool,
  Compass,
  Settings,
  User,
  ThumbsUp,
  MapPin,
  ExternalLink,
  Github,
  Check,
  X,
  Sparkles,
  TrendingUp,
  FolderGit2,
  Bell,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, BlogPost, DashboardDataResponse } from '@devconnect/shared';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { PageContainer } from '../components/common/PageContainer';

function calculateReadTime(text: string): string {
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(3, Math.ceil(words / 180));
  return `${minutes} min read`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthStore();
  const { success, error } = useToast();

  // Public Landing Page: Trending blogs
  const { data: publicBlogData } = useQuery({
    queryKey: ['trending-blogs-public'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ items: BlogPost[] }>>('/blogs?limit=3');
      return res.data.data?.items || [];
    },
    enabled: !isAuthenticated,
  });

  // Authenticated Home: Comprehensive Dashboard Data
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    refetch: refetchDashboard,
  } = useQuery<DashboardDataResponse>({
    queryKey: ['home-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DashboardDataResponse>>('/dashboard');
      return res.data.data!;
    },
    enabled: isAuthenticated,
  });

  // Connection Request Response Mutation (Accept / Reject)
  const respondMutation = useMutation({
    mutationFn: async ({
      connectionId,
      action,
    }: {
      connectionId: string;
      action: 'ACCEPT' | 'REJECT';
    }) => {
      await apiClient.put(`/connections/${connectionId}/respond`, { action });
    },
    onSuccess: (_, { action }) => {
      success(`Connection request ${action === 'ACCEPT' ? 'accepted' : 'declined'}`);
      queryClient.invalidateQueries({ queryKey: ['home-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['connections-list'] });
    },
    onError: (err: any) => {
      error('Action failed', err.response?.data?.message || err.message);
    },
  });

  // =========================================================================
  // LOGGED-IN HOME EXPERIENCE
  // =========================================================================
  if (isAuthenticated) {
    if (isDashboardLoading) {
      return <LoadingState message="Loading your developer dashboard..." />;
    }

    if (isDashboardError || !dashboardData) {
      return (
        <PageContainer className="py-12">
          <ErrorState
            title="Failed to load your dashboard"
            message="We could not fetch your personalized dashboard. Please try again."
            onRetry={() => refetchDashboard()}
          />
        </PageContainer>
      );
    }

    const {
      stats,
      userProjects,
      userBlogs,
      network,
      recentActivity,
      suggestions,
      latestProjects,
      trendingBlogs,
    } = dashboardData;

    return (
      <div className="min-h-screen pb-16">
        <PageContainer className="py-8 space-y-8">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-surface-border">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {getGreeting()},{' '}
                <span className="text-brand-400">{user?.name || user?.username}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300">
                Welcome to your developer workspace. Here is an overview of your portfolio, network,
                and community activity.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link to={`/profile/${user?.username}`}>
                <Button variant="secondary" size="sm" leftIcon={<User className="w-3.5 h-3.5" />}>
                  View Profile
                </Button>
              </Link>
              <Link to="/profile/edit">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<Settings className="w-3.5 h-3.5" />}
                >
                  Edit Profile
                </Button>
              </Link>
            </div>
          </div>

          {/* Profile Snapshot Card */}
          <Card className="p-5 sm:p-6 bg-surface-200 border-surface-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start sm:items-center gap-4">
                <Avatar
                  src={user?.avatarUrl}
                  name={user?.name || user?.username}
                  size="lg"
                  className="ring-2 ring-brand-500/20"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-white leading-tight">{user?.name}</h2>
                    <span className="text-xs font-mono text-slate-400">@{user?.username}</span>
                  </div>
                  {user?.bio && (
                    <p className="text-xs text-slate-300 max-w-xl line-clamp-2 leading-relaxed">
                      {user.bio}
                    </p>
                  )}
                  {user?.location && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {user.location}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-surface-border/60">
                <Link to={`/profile/${user?.username}`}>
                  <Button variant="outline" size="sm" className="text-xs">
                    Public Portfolio
                  </Button>
                </Link>
                <Link to="/projects/new">
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Add Project
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <Link to="/projects" className="group block">
              <Card className="p-4 bg-surface-200 border-surface-border transition-all duration-150 hover:border-brand-500/40 hover:bg-surface-100/60">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider">Projects</span>
                  <FolderGit2 className="w-4 h-4 text-brand-400" />
                </div>
                <p className="text-2xl font-bold text-white font-mono">{stats.projectsCount}</p>
                <span className="text-[11px] text-brand-400 group-hover:text-brand-300 mt-1 inline-block">
                  View projects →
                </span>
              </Card>
            </Link>

            <Link to="/blogs/manage" className="group block">
              <Card className="p-4 bg-surface-200 border-surface-border transition-all duration-150 hover:border-cyan-500/40 hover:bg-surface-100/60">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider">Articles</span>
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                </div>
                <p className="text-2xl font-bold text-white font-mono">{stats.blogPostsCount}</p>
                <span className="text-[11px] text-cyan-400 group-hover:text-cyan-300 mt-1 inline-block">
                  Manage articles →
                </span>
              </Card>
            </Link>

            <Link to="/connections" className="group block">
              <Card className="p-4 bg-surface-200 border-surface-border transition-all duration-150 hover:border-emerald-500/40 hover:bg-surface-100/60">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider">Network</span>
                  <Users className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white font-mono">{stats.connectionsCount}</p>
                <span className="text-[11px] text-emerald-400 group-hover:text-emerald-300 mt-1 inline-block">
                  {stats.pendingRequestsCount > 0
                    ? `${stats.pendingRequestsCount} pending requests`
                    : 'Manage network →'}
                </span>
              </Card>
            </Link>

            <Link to={`/profile/${user?.username}`} className="group block">
              <Card className="p-4 bg-surface-200 border-surface-border transition-all duration-150 hover:border-indigo-500/40 hover:bg-surface-100/60">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider">Skills</span>
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-2xl font-bold text-white font-mono">{stats.skillsCount}</p>
                <span className="text-[11px] text-indigo-400 group-hover:text-indigo-300 mt-1 inline-block">
                  Your skills →
                </span>
              </Card>
            </Link>

            <Link to={`/profile/${user?.username}`} className="group block col-span-2 sm:col-span-1">
              <Card className="p-4 bg-surface-200 border-surface-border transition-all duration-150 hover:border-amber-500/40 hover:bg-surface-100/60">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider">Endorsements</span>
                  <ThumbsUp className="w-4 h-4 text-amber-400" />
                </div>
                <p className="text-2xl font-bold text-white font-mono">{stats.endorsementsCount}</p>
                <span className="text-[11px] text-amber-400 group-hover:text-amber-300 mt-1 inline-block">
                  Received →
                </span>
              </Card>
            </Link>
          </div>

          {/* Quick Actions Bar */}
          <div className="p-3.5 rounded-xl border border-surface-border bg-surface-200/60 flex items-center gap-2.5 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mr-1 pl-1 whitespace-nowrap">
              Quick Actions:
            </span>
            <Link to="/projects/new">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-xs whitespace-nowrap"
              >
                Create Project
              </Button>
            </Link>
            <Link to="/blogs/new">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<PenTool className="w-3.5 h-3.5" />}
                className="text-xs whitespace-nowrap"
              >
                Write Publication
              </Button>
            </Link>
            <Link to="/discover">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Compass className="w-3.5 h-3.5" />}
                className="text-xs whitespace-nowrap"
              >
                Discover Developers
              </Button>
            </Link>
            <Link to="/projects">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Layers className="w-3.5 h-3.5" />}
                className="text-xs whitespace-nowrap"
              >
                Explore Projects
              </Button>
            </Link>
            <Link to="/profile/edit">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Settings className="w-3.5 h-3.5" />}
                className="text-xs whitespace-nowrap"
              >
                Edit Profile
              </Button>
            </Link>
          </div>

          {/* Main 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Area (2 Columns on Desktop) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Personal Projects Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-brand-400" />
                    <h2 className="text-base font-bold text-slate-100">Your Projects</h2>
                    <span className="text-xs font-mono text-slate-400">({stats.projectsCount})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to="/projects"
                      className="text-xs font-medium text-brand-400 hover:text-brand-300"
                    >
                      View all →
                    </Link>
                  </div>
                </div>

                {userProjects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="p-4 bg-surface-200 border-surface-border flex flex-col justify-between hover:border-slate-600 transition-colors"
                      >
                        <div className="space-y-2">
                          <Link to={`/projects/${project.id}`}>
                            <h3 className="text-sm font-semibold text-slate-100 hover:text-brand-300 transition-colors line-clamp-1">
                              {project.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {project.techStack.slice(0, 3).map((tech) => (
                              <Badge key={tech} variant="slate" size="sm">
                                {tech}
                              </Badge>
                            ))}
                            {project.techStack.length > 3 && (
                              <span className="text-[10px] text-slate-500 font-mono self-center">
                                +{project.techStack.length - 3}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-surface-border/60 text-xs">
                          <div className="flex items-center gap-3">
                            {project.githubUrl && (
                              <a
                                href={project.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-slate-200 transition-colors"
                                title="GitHub Repository"
                              >
                                <Github className="w-3.5 h-3.5" />
                              </a>
                            )}
                            {project.liveDemoUrl && (
                              <a
                                href={project.liveDemoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-slate-200 transition-colors"
                                title="Live Demo"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <Link
                            to={`/projects/${project.id}`}
                            className="text-[11px] font-medium text-brand-400 hover:text-brand-300"
                          >
                            Details →
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No projects showcased yet"
                    description="Highlight your technical depth with live demos, tech stack architecture, and GitHub repositories."
                    actionText="Add Project"
                    onAction={() => navigate('/projects/new')}
                  />
                )}
              </section>

              {/* Personal Publications Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <h2 className="text-base font-bold text-slate-100">Your Publications</h2>
                    <span className="text-xs font-mono text-slate-400">({stats.blogPostsCount})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to="/blogs/manage"
                      className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
                    >
                      Manage articles →
                    </Link>
                  </div>
                </div>

                {userBlogs.length > 0 ? (
                  <div className="space-y-3">
                    {userBlogs.map((blog) => (
                      <div
                        key={blog.id}
                        className="rounded-xl border border-surface-border bg-surface-200 p-4 hover:border-slate-600 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {blog.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-mono font-semibold text-cyan-400"
                              >
                                #{tag}
                              </span>
                            ))}
                            <span className="text-slate-600 text-xs">•</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {calculateReadTime(blog.content || blog.excerpt)}
                            </span>
                          </div>
                          <Link to={`/blogs/${blog.slug || blog.id}`}>
                            <h3 className="text-sm font-semibold text-slate-100 hover:text-cyan-300 transition-colors truncate">
                              {blog.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-400 line-clamp-1">{blog.excerpt}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link to={`/blogs/${blog.slug || blog.id}`}>
                            <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                              Read
                            </Button>
                          </Link>
                          <Link to={`/blogs/${blog.id}/edit`}>
                            <Button variant="secondary" size="sm" className="text-xs py-1 px-2.5">
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No publications yet"
                    description="Write engineering tutorials, system design breakdowns, and postmortems to share knowledge with peer engineers."
                    actionText="Write Publication"
                    onAction={() => navigate('/blogs/new')}
                  />
                )}
              </section>

              {/* Community Showcase Section */}
              <section className="space-y-4 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <h2 className="text-base font-bold text-slate-100">Discover Something New</h2>
                  </div>
                  <Link
                    to="/discover"
                    className="text-xs font-medium text-brand-400 hover:text-brand-300"
                  >
                    Open Discover hub →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Latest Community Projects */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-brand-400" /> Community Projects
                      </h3>
                      <Link to="/projects" className="text-[11px] text-slate-400 hover:text-slate-200">
                        All
                      </Link>
                    </div>

                    <div className="space-y-2">
                      {latestProjects.length > 0 ? (
                        latestProjects.map((p) => (
                          <div
                            key={p.id}
                            className="rounded-xl border border-surface-border bg-surface-200 p-3 hover:border-slate-600 transition-colors space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <Link to={`/projects/${p.id}`} className="min-w-0">
                                <h4 className="text-xs font-semibold text-slate-200 hover:text-brand-300 truncate">
                                  {p.title}
                                </h4>
                              </Link>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{p.description}</p>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                                by @{p.user?.username}
                              </span>
                              <Link
                                to={`/projects/${p.id}`}
                                className="text-[10px] font-semibold text-brand-400 hover:text-brand-300"
                              >
                                View →
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-xl border border-surface-border bg-surface-200 text-center text-xs text-slate-400">
                          No community projects found.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trending Community Publications */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Trending Articles
                      </h3>
                      <Link to="/blogs" className="text-[11px] text-slate-400 hover:text-slate-200">
                        All
                      </Link>
                    </div>

                    <div className="space-y-2">
                      {trendingBlogs.length > 0 ? (
                        trendingBlogs.map((b) => (
                          <div
                            key={b.id}
                            className="rounded-xl border border-surface-border bg-surface-200 p-3 hover:border-slate-600 transition-colors space-y-1.5"
                          >
                            <div className="flex items-center gap-1.5">
                              {b.tags?.slice(0, 2).map((t) => (
                                <span key={t} className="text-[10px] font-mono text-cyan-400">
                                  #{t}
                                </span>
                              ))}
                            </div>
                            <Link to={`/blogs/${b.slug || b.id}`}>
                              <h4 className="text-xs font-semibold text-slate-200 hover:text-brand-300 line-clamp-2 leading-snug">
                                {b.title}
                              </h4>
                            </Link>
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                                by @{b.author?.username}
                              </span>
                              <Link
                                to={`/blogs/${b.slug || b.id}`}
                                className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300"
                              >
                                Read →
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 rounded-xl border border-surface-border bg-surface-200 text-center text-xs text-slate-400">
                          No trending articles found.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar (1 Column on Desktop) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Network Snapshot & Pending Requests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      Network Snapshot
                    </h3>
                  </div>
                  <Link
                    to="/connections"
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    Manage ({network.totalConnections})
                  </Link>
                </div>

                {/* Pending Requests Alert & Immediate Action */}
                {network.incomingRequests.length > 0 ? (
                  <div className="space-y-2.5">
                    <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium flex items-center justify-between">
                      <span>Pending Requests</span>
                      <span className="font-mono font-bold">{network.incomingRequests.length}</span>
                    </div>

                    {network.incomingRequests.map((req) => (
                      <div
                        key={req.id}
                        className="rounded-xl border border-surface-border bg-surface-200 p-3 space-y-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            src={req.requester.avatarUrl}
                            name={req.requester.name}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <Link
                              to={`/profile/${req.requester.username}`}
                              className="text-xs font-semibold text-slate-200 hover:text-brand-300 transition-colors truncate block"
                            >
                              {req.requester.name}
                            </Link>
                            <p className="text-[11px] text-slate-400 font-mono truncate">
                              @{req.requester.username}
                            </p>
                          </div>
                        </div>

                        {req.requester.skills && req.requester.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {req.requester.skills.slice(0, 2).map((s) => (
                              <Badge key={s.id} variant="slate" size="sm">
                                {s.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="primary"
                            size="sm"
                            className="flex-1 text-xs py-1"
                            leftIcon={<Check className="w-3.5 h-3.5" />}
                            isLoading={
                              respondMutation.isPending &&
                              respondMutation.variables?.connectionId === req.id &&
                              respondMutation.variables?.action === 'ACCEPT'
                            }
                            onClick={() =>
                              respondMutation.mutate({ connectionId: req.id, action: 'ACCEPT' })
                            }
                          >
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs py-1"
                            leftIcon={<X className="w-3.5 h-3.5" />}
                            isLoading={
                              respondMutation.isPending &&
                              respondMutation.variables?.connectionId === req.id &&
                              respondMutation.variables?.action === 'REJECT'
                            }
                            onClick={() =>
                              respondMutation.mutate({ connectionId: req.id, action: 'REJECT' })
                            }
                          >
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-surface-border bg-surface-200/50 p-4 text-center space-y-1">
                    <p className="text-xs font-medium text-slate-300">All caught up!</p>
                    <p className="text-[11px] text-slate-500">
                      No pending connection requests at this time.
                    </p>
                  </div>
                )}

                {/* Recent Connections preview */}
                {network.recentConnections.length > 0 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-[11px] font-mono text-slate-400 block uppercase">
                      Recent Connections
                    </span>
                    <div className="space-y-1.5">
                      {network.recentConnections.map((conn) => (
                        <Link
                          key={conn.id}
                          to={`/profile/${conn.connectedUser.username}`}
                          className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-100 transition-colors group"
                        >
                          <Avatar
                            src={conn.connectedUser.avatarUrl}
                            name={conn.connectedUser.name}
                            size="xs"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-200 group-hover:text-brand-300 truncate">
                              {conn.connectedUser.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 truncate">
                              @{conn.connectedUser.username}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Notifications / Activity Feed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-slate-400" />
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      Recent Activity
                    </h3>
                  </div>
                  <Link to="/notifications" className="text-xs text-brand-400 hover:text-brand-300">
                    View all
                  </Link>
                </div>

                {recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {recentActivity.slice(0, 4).map((act) => (
                      <div
                        key={act.id}
                        className="rounded-xl border border-surface-border bg-surface-200 p-3 flex items-start gap-3"
                      >
                        <div className="w-7 h-7 rounded-lg bg-surface-100 border border-surface-border flex items-center justify-center text-brand-400 flex-shrink-0 mt-0.5">
                          {act.type === 'CONNECTION_REQUEST' ? (
                            <Users className="w-3.5 h-3.5 text-emerald-400" />
                          ) : act.type === 'SKILL_ENDORSEMENT' ? (
                            <ThumbsUp className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-200 line-clamp-1">
                            {act.title}
                          </p>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {act.message}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono pt-0.5">
                            {new Date(act.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-surface-border bg-surface-200/50 p-4 text-center text-xs text-slate-400">
                    No recent activity recorded yet.
                  </div>
                )}
              </div>

              {/* Discover Developers */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-brand-400" />
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                      Discover Developers
                    </h3>
                  </div>
                  <Link to="/discover" className="text-xs text-brand-400 hover:text-brand-300">
                    Browse all
                  </Link>
                </div>

                {suggestions.length > 0 ? (
                  <div className="space-y-2">
                    {suggestions.map((dev) => (
                      <div
                        key={dev.id}
                        className="rounded-xl border border-surface-border bg-surface-200 p-3 flex items-center justify-between gap-2"
                      >
                        <Link
                          to={`/profile/${dev.username}`}
                          className="flex items-center gap-2.5 min-w-0 group"
                        >
                          <Avatar src={dev.avatarUrl} name={dev.name} size="sm" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 group-hover:text-brand-300 transition-colors truncate">
                              {dev.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              @{dev.username}
                            </p>
                          </div>
                        </Link>

                        <Link to={`/profile/${dev.username}`} className="flex-shrink-0">
                          <Button variant="outline" size="sm" className="text-[11px] px-2.5 py-1">
                            View
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-surface-border bg-surface-200/50 p-4 text-center text-xs text-slate-400">
                    You are connected with all active developers.
                  </div>
                )}
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    );
  }

  // =========================================================================
  // LOGGED-OUT PUBLIC LANDING EXPERIENCE
  // =========================================================================
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-16 pb-20 border-b border-surface-border">
        <PageContainer>
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-surface-border bg-surface-200 text-slate-300 text-xs font-mono mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
              Developer Networking & Technical Publications
            </div>

            {/* Hero Heading */}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
              Build your developer identity.{' '}
              <span className="text-brand-400">Showcase code that matters.</span>
            </h1>

            {/* Hero Subtitle */}
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              DevConnect empowers software engineers to create verified portfolios, publish
              technical architecture breakdowns, connect with engineering peers, and receive
              verifiable skill endorsements.
            </p>

            {/* Hero CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
              <Link to="/register" className="w-full sm:w-auto">
                <Button
                  size="md"
                  variant="primary"
                  className="w-full sm:w-auto"
                  rightIcon={<ArrowRight className="w-4 h-4" aria-hidden="true" />}
                >
                  Join DevConnect
                </Button>
              </Link>
              <Link to="/discover" className="w-full sm:w-auto">
                <Button
                  size="md"
                  variant="secondary"
                  className="w-full sm:w-auto"
                  leftIcon={<Users className="w-4 h-4" aria-hidden="true" />}
                >
                  Explore Developers
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Core Platform Pillars / Feature Section */}
      <section className="py-16">
        <PageContainer>
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Built for engineering credibility
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Everything you need to showcase technical depth and build high-signal professional
              relationships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              hoverEffect
              className="space-y-4 p-6 bg-surface-200 border-surface-border flex flex-col justify-between h-full"
            >
              <div className="space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                  <Layers className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Project Portfolios</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Showcase architecture, tech stacks, live interactive demos, and GitHub source
                  repositories directly on your developer profile.
                </p>
              </div>
            </Card>

            <Card
              hoverEffect
              className="space-y-4 p-6 bg-surface-200 border-surface-border flex flex-col justify-between h-full"
            >
              <div className="space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <ShieldCheck className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Verified Peer Endorsements</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Only verified, connected developers can endorse technical skills, ensuring
                  endorsements represent real professional recognition.
                </p>
              </div>
            </Card>

            <Card
              hoverEffect
              className="space-y-4 p-6 bg-surface-200 border-surface-border flex flex-col justify-between h-full md:col-span-2 lg:col-span-1"
            >
              <div className="space-y-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">Technical Publications</h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Publish engineering deep-dives, postmortems, and tutorials with native Markdown
                  support, code formatting, and topic tags.
                </p>
              </div>
            </Card>
          </div>
        </PageContainer>
      </section>

      {/* Latest Technical Publications Feed */}
      {publicBlogData && publicBlogData.length > 0 && (
        <section className="py-16 border-t border-surface-border bg-surface-300/40">
          <PageContainer>
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-surface-border">
              <div>
                <h3 className="text-xl font-bold text-slate-100">Latest Technical Publications</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Engineering breakdowns and architectural lessons written by developers on the
                  platform.
                </p>
              </div>
              <Link
                to="/blogs"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                View all publications <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicBlogData.map((post) => {
                const primaryTag = post.tags?.[0] || 'ENGINEERING';
                const readTime = calculateReadTime(post.content || post.excerpt);

                return (
                  <article
                    key={post.id}
                    className="group rounded-xl border border-surface-border bg-surface-200 overflow-hidden flex flex-col justify-between transition-all duration-150 hover:border-slate-600 hover:bg-surface-100/60"
                  >
                    <div>
                      {post.coverImage ? (
                        <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900 border-b border-surface-border">
                          <img
                            src={post.coverImage}
                            alt={post.title}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] w-full bg-surface-100 flex items-center justify-center border-b border-surface-border">
                          <BookOpen className="w-8 h-8 text-slate-600" aria-hidden="true" />
                        </div>
                      )}

                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-semibold text-brand-400 uppercase tracking-wider">
                            {primaryTag}
                          </span>
                          <span className="text-slate-600 text-xs" aria-hidden="true">
                            •
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" aria-hidden="true" />
                            {readTime}
                          </span>
                        </div>

                        <Link to={`/blogs/${post.slug || post.id}`} className="block">
                          <h4 className="text-[17px] font-semibold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-2 leading-snug">
                            {post.title}
                          </h4>
                        </Link>

                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3.5 border-t border-surface-border/60 bg-surface-300/40 flex items-center justify-between">
                      <Link
                        to={`/profile/${post.author?.username}`}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
                      >
                        <Avatar src={post.author?.avatarUrl} name={post.author?.name} size="xs" />
                        <span className="text-xs font-medium text-slate-300 truncate">
                          {post.author?.name}
                        </span>
                      </Link>

                      <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">
                        {new Date(post.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          </PageContainer>
        </section>
      )}
    </div>
  );
};
