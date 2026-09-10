import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Github,
  Linkedin,
  Globe,
  Calendar,
  Layers,
  BookOpen,
  Edit,
  ExternalLink,
  Users,
  Code2,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, DeveloperProfile } from '@devconnect/shared';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ConnectionButton } from '../components/common/ConnectionButton';
import { EndorsementButton } from '../components/common/EndorsementButton';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { PageContainer } from '../components/common/PageContainer';

export const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const queryClient = useQueryClient();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { success, error } = useToast();

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ['profile', username],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DeveloperProfile>>(`/users/profile/${username}`);
      return res.data.data;
    },
    enabled: !!username,
  });

  // Connection Mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      await apiClient.post('/connections/request', { receiverId: profile.id });
    },
    onSuccess: () => {
      success('Connection request sent!');
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    },
    onError: (err: any) => {
      error('Failed to send request', err.message);
    },
  });

  // Respond Mutation
  const respondMutation = useMutation({
    mutationFn: async (action: 'ACCEPT' | 'REJECT') => {
      if (!profile?.connectionStatus?.id) return;
      await apiClient.put(`/connections/${profile.connectionStatus.id}/respond`, { action });
    },
    onSuccess: (_, action) => {
      success(`Connection request ${action === 'ACCEPT' ? 'accepted' : 'declined'}!`);
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    },
    onError: (err: any) => {
      error('Failed to update request', err.message);
    },
  });

  // Remove Connection Mutation
  const removeConnectionMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.connectionStatus?.id) return;
      await apiClient.delete(`/connections/${profile.connectionStatus.id}`);
    },
    onSuccess: () => {
      success('Connection removed');
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    },
    onError: (err: any) => {
      error('Failed to remove connection', err.message);
    },
  });

  // Endorse Skill Mutation
  const endorseMutation = useMutation({
    mutationFn: async (userSkillId: string) => {
      await apiClient.post('/endorsements', { userSkillId });
    },
    onSuccess: () => {
      success('Skill endorsed!');
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    },
    onError: (err: any) => {
      error('Endorsement failed', err.response?.data?.message || err.message);
    },
  });

  // Remove Endorsement Mutation
  const removeEndorsementMutation = useMutation({
    mutationFn: async (userSkillId: string) => {
      await apiClient.delete(`/endorsements/${userSkillId}`);
    },
    onSuccess: () => {
      success('Endorsement removed');
      queryClient.invalidateQueries({ queryKey: ['profile', username] });
    },
    onError: (err: any) => {
      error('Failed to remove endorsement', err.response?.data?.message || err.message);
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading developer profile..." />;
  }

  if (isError || !profile) {
    return (
      <PageContainer className="py-16">
        <ErrorState
          title="Profile Not Found"
          message="We couldn't find a developer profile matching this username."
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const isOwner = currentUser?.id === profile.id;
  const isConnected = profile.connectionStatus?.status === 'ACCEPTED';

  return (
    <div className="min-h-screen">
      <PageContainer className="py-10 space-y-10">
      {/* GitHub/Substack styled Profile Header */}
      <Card className="p-6 sm:p-8 bg-surface-200 border-surface-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <Avatar src={profile.avatarUrl} name={profile.name} size="2xl" />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {profile.name}
                </h1>
                {isOwner && (
                  <Badge variant="cyan" size="sm">
                    You
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-mono">@{profile.username}</p>
              {profile.location && (
                <p className="flex items-center gap-1.5 text-xs text-slate-300 pt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {profile.location}
                </p>
              )}
            </div>
          </div>

          {/* Action Button: Edit Profile or Connect */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isOwner ? (
              <Link to="/profile/edit" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full text-xs" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                  Edit Profile
                </Button>
              </Link>
            ) : isAuthenticated ? (
              <ConnectionButton
                status={profile.connectionStatus?.status}
                connectionId={profile.connectionStatus?.id}
                isRequester={profile.connectionStatus?.isRequester}
                onConnect={() => connectMutation.mutateAsync()}
                onRespond={(action) => respondMutation.mutateAsync(action)}
                onRemove={() => removeConnectionMutation.mutateAsync()}
                isLoading={
                  connectMutation.isPending ||
                  respondMutation.isPending ||
                  removeConnectionMutation.isPending
                }
              />
            ) : (
              <Link to="/login">
                <Button variant="primary" size="sm" className="text-xs">
                  Sign in to Connect
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="mt-5 pt-5 border-t border-surface-border">
            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">{profile.bio}</p>
          </div>
        )}

        {/* Stats & External Links */}
        <div className="mt-5 pt-5 border-t border-surface-border/60 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-5 text-slate-400 font-mono">
            <span className="flex items-center gap-1.5 text-slate-200 font-medium">
              <Users className="w-3.5 h-3.5 text-brand-400" />
              {profile.connectionsCount} Connections
            </span>
            {profile.mutualConnectionsCount !== undefined && profile.mutualConnectionsCount > 0 && (
              <span className="text-slate-400">
                ({profile.mutualConnectionsCount} mutual)
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-2">
            {profile.githubUrl && (
              <a
                href={profile.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-surface-border bg-surface-100 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
            )}
            {profile.linkedinUrl && (
              <a
                href={profile.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-surface-border bg-surface-100 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </a>
            )}
            {profile.portfolioUrl && (
              <a
                href={profile.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-surface-border bg-surface-100 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                Portfolio
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* Skills & Endorsements Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Code2 className="w-4 h-4 text-brand-400" />
            Skills & Verified Endorsements
          </h2>
          {isOwner && (
            <Link to="/profile/edit" className="text-xs text-brand-400 hover:text-brand-300 font-medium">
              Manage Skills →
            </Link>
          )}
        </div>

        {profile.skills.length === 0 ? (
          <EmptyState
            title="No skills listed"
            description={
              isOwner
                ? 'Add your technical skills to receive verified endorsements from your network.'
                : 'This developer has not added technical skills yet.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {profile.skills.map((us) => (
              <div
                key={us.id}
                className="p-3.5 rounded-xl border border-surface-border bg-surface-200 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-100 font-mono">{us.skill.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                      {us.skill.category}
                    </span>
                    {us.yearsOfExperience !== null && (
                      <span className="text-[10px] text-slate-500 font-mono">
                        • {us.yearsOfExperience} {us.yearsOfExperience === 1 ? 'yr' : 'yrs'} exp
                      </span>
                    )}
                  </div>
                </div>

                <EndorsementButton
                  userSkillId={us.id}
                  endorsements={us.endorsements}
                  currentUserId={currentUser?.id}
                  isConnectedWithProfileUser={isConnected}
                  isOwner={isOwner}
                  onEndorse={(skillId) => endorseMutation.mutateAsync(skillId)}
                  onRemoveEndorsement={(skillId) => removeEndorsementMutation.mutateAsync(skillId)}
                  isLoading={endorseMutation.isPending || removeEndorsementMutation.isPending}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Projects Showcase Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            Projects Showcase ({profile.projects.length})
          </h2>
          {isOwner && (
            <Link to="/projects/new">
              <Button size="sm" variant="primary" className="text-xs">
                Add Project
              </Button>
            </Link>
          )}
        </div>

        {profile.projects.length === 0 ? (
          <EmptyState
            title="No projects showcased"
            description={
              isOwner
                ? 'Add your open source apps, tools, and platforms to showcase your coding abilities.'
                : 'This developer has not showcased any projects yet.'
            }
            actionText={isOwner ? 'Create Project' : undefined}
            onAction={isOwner ? () => window.location.assign('/projects/new') : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.projects.map((proj) => (
              <div
                key={proj.id}
                className="group rounded-xl border border-surface-border bg-surface-200 overflow-hidden flex flex-col justify-between hover:border-slate-600 transition-colors"
              >
                <div>
                  {proj.imageUrl ? (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900 border-b border-surface-border">
                      <img
                        src={proj.imageUrl}
                        alt={proj.title}
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/9] w-full bg-surface-100 flex items-center justify-center border-b border-surface-border">
                      <Layers className="w-8 h-8 text-slate-600" aria-hidden="true" />
                    </div>
                  )}
                  <div className="p-5 space-y-2.5">
                    <Link to={`/projects/${proj.id}`}>
                      <h3 className="text-base font-semibold text-slate-100 hover:text-brand-300 transition-colors line-clamp-1">
                        {proj.title}
                      </h3>
                    </Link>
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {proj.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.techStack.map((tech) => (
                        <Badge key={tech} variant="cyan" size="sm">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3.5 border-t border-surface-border/60 bg-surface-300/40">
                  <Link to={`/projects/${proj.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      View Project
                    </Button>
                  </Link>

                  <div className="flex items-center gap-3">
                    {proj.githubUrl && (
                      <a
                        href={proj.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
                        title="GitHub Repository"
                      >
                        <Github className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {proj.liveDemoUrl && (
                      <a
                        href={proj.liveDemoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                        title="Live Demo"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Publications Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-surface-border">
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            Publications ({profile.blogPosts.length})
          </h2>
          {isOwner && (
            <Link to="/publications/new">
              <Button size="sm" variant="outline" className="text-xs">
                Write Publication
              </Button>
            </Link>
          )}
        </div>

        {profile.blogPosts.length === 0 ? (
          <EmptyState
            title="No publications yet"
            description={
              isOwner
                ? 'Share architectural insights, tutorials, or engineering breakdowns with the community.'
                : 'This developer has not published any articles yet.'
            }
            actionText={isOwner ? 'Write First Publication' : undefined}
            onAction={isOwner ? () => window.location.assign('/publications/new') : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profile.blogPosts.map((post) => {
              const primaryTag = post.tags?.[0] || 'ENGINEERING';
              const words = (post.content || post.excerpt || '').split(/\s+/).length;
              const readTime = `${Math.max(3, Math.ceil(words / 180))} min read`;

              return (
                <article
                  key={post.id}
                  className="group rounded-xl border border-surface-border bg-surface-200 overflow-hidden flex flex-col justify-between hover:border-slate-600 transition-colors"
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
                        <span className="text-slate-600 text-xs" aria-hidden="true">·</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {readTime}
                        </span>
                      </div>

                      <Link to={`/publications/${post.slug || post.id}`} className="block">
                        <h4 className="text-base font-semibold text-slate-100 hover:text-brand-300 transition-colors line-clamp-2 leading-snug">
                          {post.title}
                        </h4>
                      </Link>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-3 border-t border-surface-border/60 bg-surface-300/40 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>
                      {new Date(post.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <Link
                      to={`/publications/${post.slug || post.id}`}
                      className="text-brand-400 hover:text-brand-300 font-sans font-semibold text-xs transition-colors"
                    >
                      Read Article →
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      </PageContainer>
    </div>
  );
};
