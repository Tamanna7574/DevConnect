import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Layers,
  BookOpen,
  Users,
  ThumbsUp,
  Clock,
  Plus,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, DashboardDataResponse } from '@devconnect/shared';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { PageContainer } from '../components/common/PageContainer';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DashboardDataResponse>>('/dashboard');
      return res.data.data;
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading developer dashboard..." />;
  }

  if (isError || !data) {
    return (
      <PageContainer className="py-12">
        <ErrorState onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  const { stats, recentActivity, suggestions, trendingBlogs } = data;

  return (
    <div className="min-h-screen">
      <PageContainer className="py-10 space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-surface-border">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Developer Dashboard
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Welcome back, <span className="text-white font-medium">{user?.name}</span>. Here is an overview of your portfolio activity.
            </p>
          </div>

        <div className="flex items-center gap-2.5">
          <Link to={`/profile/${user?.username}`}>
            <Button variant="outline" size="sm" className="text-xs">
              View Public Profile
            </Button>
          </Link>
          <Link to="/projects/new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />} className="text-xs">
              Add Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="p-4 space-y-2 bg-surface-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Projects</span>
            <Layers className="w-4 h-4 text-brand-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{stats.projectsCount}</p>
          <Link to="/projects" className="text-xs text-brand-400 hover:text-brand-300 font-medium inline-block">
            Manage projects →
          </Link>
        </Card>

        <Card className="p-4 space-y-2 bg-surface-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Publications</span>
            <BookOpen className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{stats.blogPostsCount}</p>
          <Link to="/blogs/manage" className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-block">
            Manage articles →
          </Link>
        </Card>

        <Card className="p-4 space-y-2 bg-surface-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Connections</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{stats.connectionsCount}</p>
          <Link to="/connections" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-block">
            {stats.pendingRequestsCount > 0 ? `${stats.pendingRequestsCount} pending requests →` : 'View network →'}
          </Link>
        </Card>

        <Card className="p-4 space-y-2 bg-surface-200">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Skills</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{stats.skillsCount}</p>
          <Link to={`/profile/${user?.username}`} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-block">
            View skills →
          </Link>
        </Card>

        <Card className="p-4 space-y-2 bg-surface-200 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-mono uppercase tracking-wider">Endorsements</span>
            <ThumbsUp className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{stats.endorsementsCount}</p>
          <Link to={`/profile/${user?.username}`} className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-block">
            View endorsements →
          </Link>
        </Card>
      </div>

      {/* Main Grid: Activity Feed & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-surface-border">
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Activity Feed
            </h2>
            <Link to="/notifications" className="text-xs text-brand-400 hover:text-brand-300">
              View all
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="rounded-xl border border-surface-border bg-surface-200 p-8 text-center text-xs text-slate-400">
              No activity recorded yet. Connect with developers or publish articles to see updates.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl border border-surface-border bg-surface-200 p-4 flex items-start gap-3.5"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-50 border border-surface-border flex items-center justify-center text-brand-400 flex-shrink-0 mt-0.5">
                    {act.type === 'CONNECTION_REQUEST' ? (
                      <Users className="w-4 h-4" />
                    ) : act.type === 'SKILL_ENDORSEMENT' ? (
                      <ThumbsUp className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-200">{act.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{act.message}</p>
                    <p className="text-[10px] text-slate-500 font-mono pt-0.5">
                      {new Date(act.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Connection Suggestions & Trending Publications */}
        <div className="space-y-6">
          {/* Suggested Developers */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
                Suggested Developers
              </h3>
              <Link to="/discover" className="text-xs text-brand-400 hover:text-brand-300">
                Browse
              </Link>
            </div>

            {suggestions.length === 0 ? (
              <div className="rounded-xl border border-surface-border bg-surface-200 p-4 text-center text-xs text-slate-400">
                You are connected with all active developers.
              </div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="rounded-xl border border-surface-border bg-surface-200 p-3 flex items-center justify-between"
                  >
                    <Link
                      to={`/profile/${sug.username}`}
                      className="flex items-center gap-2.5 min-w-0 group"
                    >
                      <Avatar src={sug.avatarUrl} name={sug.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-brand-300 transition-colors truncate">
                          {sug.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono truncate">
                          @{sug.username}
                        </p>
                      </div>
                    </Link>

                    <Link to={`/profile/${sug.username}`}>
                      <Button variant="outline" size="sm" className="text-xs px-2.5 py-1">
                        View
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Publications */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-surface-border">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Trending Publications
              </h3>
              <Link to="/blogs" className="text-xs text-brand-400 hover:text-brand-300">
                All
              </Link>
            </div>

            <div className="space-y-2">
              {trendingBlogs.map((b) => (
                <div
                  key={b.id}
                  className="rounded-xl border border-surface-border bg-surface-200 p-3 space-y-1 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    {b.tags?.slice(0, 2).map((t: string) => (
                      <span key={t} className="text-[10px] font-mono text-cyan-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <Link to={`/blogs/${b.slug || b.id}`}>
                    <h5 className="text-xs font-semibold text-slate-200 hover:text-brand-300 transition-colors line-clamp-2 leading-snug">
                      {b.title}
                    </h5>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </PageContainer>
    </div>
  );
};
