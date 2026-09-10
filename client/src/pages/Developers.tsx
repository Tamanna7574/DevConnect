import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, MapPin, Code2, Users, Layers, BookOpen, X, UserPlus, Clock, Check } from 'lucide-react';
import { apiClient } from '../api/client';
import { PaginatedData, ApiResponse } from '@devconnect/shared';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { useDiscoveryFilters } from '../hooks/useDiscoveryFilters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { PageContainer } from '../components/common/PageContainer';

const FALLBACK_SKILLS = ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Rust', 'Docker', 'Kubernetes', 'Go'];

interface DeveloperSkill {
  id: string;
  skillId: string;
  name: string;
  category?: string;
  endorsementsCount: number;
}

interface DeveloperListItem {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  portfolioUrl?: string | null;
  createdAt: string;
  skills: DeveloperSkill[];
  projectsCount: number;
  blogsCount: number;
}

interface ConnectionsData {
  accepted: { id: string; connectedUser: { id: string }; connectedSince: string }[];
  incoming: { id: string; requester: { id: string }; createdAt: string }[];
  outgoing: { id: string; receiver: { id: string }; createdAt: string }[];
}

export const Developers: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';
  const urlSkill = searchParams.get('skill') || '';
  const urlLocation = searchParams.get('location') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10) || 1;

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [selectedSkill, setSelectedSkill] = useState(urlSkill);
  const [selectedLocation, setSelectedLocation] = useState(urlLocation);
  const [page, setPage] = useState(urlPage);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedLocation = useDebounce(selectedLocation, 300);

  // Sync state from URL changes (e.g. Back/Forward navigation)
  useEffect(() => {
    const currentQ = searchParams.get('search') || searchParams.get('q') || '';
    if (currentQ !== searchQuery && debouncedSearch === searchQuery) {
      setSearchQuery(currentQ);
    }
    const currentSkill = searchParams.get('skill') || '';
    if (currentSkill !== selectedSkill) {
      setSelectedSkill(currentSkill);
    }
    const currentLoc = searchParams.get('location') || '';
    if (currentLoc !== selectedLocation && debouncedLocation === selectedLocation) {
      setSelectedLocation(currentLoc);
    }
    const currentPage = parseInt(searchParams.get('page') || '1', 10) || 1;
    if (currentPage !== page) {
      setPage(currentPage);
    }
  }, [searchParams]);

  // Sync state to URL search parameters
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (selectedSkill.trim()) params.set('skill', selectedSkill.trim());
    if (debouncedLocation.trim()) params.set('location', debouncedLocation.trim());
    if (page > 1) params.set('page', String(page));

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedSkill, debouncedLocation, page, setSearchParams]);

  // Fetch real skills from discovery endpoint
  const { data: filtersData } = useDiscoveryFilters();
  const popularSkills = filtersData?.skills?.length ? filtersData.skills.slice(0, 10) : FALLBACK_SKILLS;

  // Fetch developers list from discovery endpoint
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['developers-list', debouncedSearch, selectedSkill, debouncedLocation, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append('q', debouncedSearch.trim());
      if (selectedSkill.trim()) params.append('skill', selectedSkill.trim());
      if (debouncedLocation.trim()) params.append('location', debouncedLocation.trim());
      params.append('page', String(page));
      params.append('limit', '9');

      const res = await apiClient.get<ApiResponse<PaginatedData<DeveloperListItem>>>(
        `/discovery/developers?${params.toString()}`
      );
      return res.data.data;
    },
  });

  // Fetch viewer's connections if authenticated to reflect real connection statuses
  const { data: connectionsData } = useQuery({
    queryKey: ['viewer-connections'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ConnectionsData>>('/connections');
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async (receiverId: string) => {
      setConnectingId(receiverId);
      const res = await apiClient.post('/connections/request', { receiverId });
      return res.data;
    },
    onSuccess: () => {
      success('Connection request sent!');
      queryClient.invalidateQueries({ queryKey: ['viewer-connections'] });
      queryClient.invalidateQueries({ queryKey: ['developers-list'] });
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to send connection request');
    },
    onSettled: () => {
      setConnectingId(null);
    },
  });

  // Respond mutation for incoming requests
  const respondMutation = useMutation({
    mutationFn: async ({ connectionId, action }: { connectionId: string; action: 'ACCEPT' | 'REJECT' }) => {
      await apiClient.put(`/connections/${connectionId}/respond`, { action });
    },
    onSuccess: (_, { action }) => {
      success(`Connection ${action === 'ACCEPT' ? 'accepted' : 'declined'}`);
      queryClient.invalidateQueries({ queryKey: ['viewer-connections'] });
      queryClient.invalidateQueries({ queryKey: ['developers-list'] });
    },
    onError: (err: any) => {
      error(err.response?.data?.message || 'Failed to update connection');
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkill((prev) => (prev === skill ? '' : skill));
    setPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedSkill('');
    setSelectedLocation('');
    setPage(1);
  };

  const handleConnectClick = (devId: string) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    connectMutation.mutate(devId);
  };

  // Determine connection status for developer card
  const getConnectionState = (
    devId: string
  ): 'SELF' | 'CONNECTED' | 'OUTGOING_PENDING' | 'INCOMING_PENDING' | 'NONE' => {
    if (currentUser?.id === devId) return 'SELF';
    if (!isAuthenticated || !connectionsData) return 'NONE';

    const isConnected = connectionsData.accepted?.some(
      (c) => c.connectedUser?.id === devId
    );
    if (isConnected) return 'CONNECTED';

    const isOutgoing = connectionsData.outgoing?.some((c) => c.receiver?.id === devId);
    if (isOutgoing) return 'OUTGOING_PENDING';

    const isIncoming = connectionsData.incoming?.some((c) => c.requester?.id === devId);
    if (isIncoming) return 'INCOMING_PENDING';

    return 'NONE';
  };

  const hasActiveFilters = Boolean(debouncedSearch.trim() || selectedSkill || debouncedLocation.trim());
  const totalCount = data?.pagination?.total ?? (data?.items?.length ?? 0);

  return (
    <div className="min-h-screen">
      <PageContainer className="py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-surface-border">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Developers
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Discover developers, engineers and creators building interesting things.
            </p>
          </div>

          {!isLoading && (
            <span className="text-xs text-slate-400 font-mono">
              {totalCount} {totalCount === 1 ? 'developer' : 'developers'} {hasActiveFilters ? 'found' : 'registered'}
            </span>
          )}
        </div>

        {/* Filter and Search Toolbar */}
        <div className="space-y-3">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Search developers by name, bio, skill..."
                aria-label="Search developers"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-surface-border bg-surface-200 pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="Clear query"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="relative">
              <MapPin
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                placeholder="Filter by location (e.g. San Francisco)"
                aria-label="Filter by location"
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-surface-border bg-surface-200 pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
              {selectedLocation && (
                <button
                  type="button"
                  onClick={() => setSelectedLocation('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title="Clear location"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Code2
                  className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  placeholder="Filter by skill (e.g. React)"
                  aria-label="Filter by skill"
                  value={selectedSkill}
                  onChange={(e) => {
                    setSelectedSkill(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-surface-border bg-surface-200 pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
                />
                {selectedSkill && (
                  <button
                    type="button"
                    onClick={() => setSelectedSkill('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    title="Clear skill"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <Button type="submit" variant="primary" size="sm" className="px-4">
                Search
              </Button>
            </div>
          </form>

          {/* Quick Skill Tags & Clear All */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs text-slate-400 font-mono mr-1">Popular skills:</span>
            {popularSkills.map((skill) => (
              <button
                key={skill}
                type="button"
                onClick={() => handleSkillToggle(skill)}
                aria-pressed={selectedSkill.toLowerCase() === skill.toLowerCase()}
                className={`px-2.5 py-0.5 rounded-md text-xs font-mono transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 ${
                  selectedSkill.toLowerCase() === skill.toLowerCase()
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'bg-surface-200 border border-surface-border text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {skill}
              </button>
            ))}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-mono ml-2 flex items-center gap-1"
              >
                <X className="w-3 h-3" aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Developer Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="w-28 h-4" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                </div>
                <Skeleton className="w-full h-10" />
                <div className="flex gap-2">
                  <Skeleton className="w-16 h-5" />
                  <Skeleton className="w-16 h-5" />
                </div>
                <div className="pt-3 border-t border-surface-border/60 flex justify-between gap-2">
                  <Skeleton className="w-24 h-8" />
                  <Skeleton className="w-20 h-8" />
                </div>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data?.items || data.items.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No developers found"
            description="Try modifying search keywords or clearing active location/skill filters."
            actionText="Reset Filters"
            onAction={clearAllFilters}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.items.map((dev) => {
                const connState = getConnectionState(dev.id);
                const roleHeadline =
                  dev.skills?.[0]?.name
                    ? `${dev.skills[0].name} Specialist`
                    : 'Software Engineer';

                return (
                  <Card
                    key={dev.id}
                    hoverEffect
                    className="flex flex-col justify-between p-5 space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Header: Avatar, Name, Handle, Focus & Location */}
                      <div className="flex items-start gap-3.5">
                        <Link to={`/profile/${dev.username}`} className="flex-shrink-0">
                          <Avatar src={dev.avatarUrl} name={dev.name} size="lg" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link to={`/profile/${dev.username}`}>
                            <h3 className="text-base font-semibold text-slate-100 hover:text-brand-300 transition-colors truncate">
                              {dev.name}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-400 font-mono truncate">@{dev.username}</p>
                          <p className="text-xs font-medium text-brand-400 truncate mt-0.5">
                            {roleHeadline}
                          </p>
                          {dev.location && (
                            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                              <span>{dev.location}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {dev.bio || 'Software engineer exploring distributed systems and modern web technologies.'}
                      </p>

                      {/* Skills Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {dev.skills && dev.skills.length > 0 ? (
                          dev.skills.slice(0, 4).map((s) => (
                            <Badge key={s.id} variant="brand" size="sm">
                              {s.name}
                              {s.endorsementsCount > 0 && ` (${s.endorsementsCount})`}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">No skills listed yet</span>
                        )}
                      </div>

                      {/* Portfolio & Activity Counters */}
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono pt-1">
                        <span className="flex items-center gap-1" title="Projects">
                          <Layers className="w-3.5 h-3.5 text-slate-500" />
                          {dev.projectsCount} {dev.projectsCount === 1 ? 'project' : 'projects'}
                        </span>
                        <span className="flex items-center gap-1" title="Publications">
                          <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                          {dev.blogsCount} {dev.blogsCount === 1 ? 'article' : 'articles'}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons: View Profile & Connect */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-surface-border/60">
                      <Link to={`/profile/${dev.username}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          View Profile
                        </Button>
                      </Link>

                      {connState !== 'SELF' && (
                        <div className="flex-1">
                          {connState === 'CONNECTED' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled
                              className="w-full text-xs text-emerald-400 border border-emerald-500/30"
                              leftIcon={<Check className="w-3.5 h-3.5" />}
                            >
                              Connected
                            </Button>
                          ) : connState === 'OUTGOING_PENDING' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled
                              className="w-full text-xs text-amber-400 border border-amber-500/30"
                              leftIcon={<Clock className="w-3.5 h-3.5" />}
                            >
                              Request Sent
                            </Button>
                          ) : connState === 'INCOMING_PENDING' ? (
                            <div className="flex items-center gap-1.5 w-full">
                              {(() => {
                                const inc = connectionsData?.incoming?.find(
                                  (c) => c.requester?.id === dev.id
                                );
                                return (
                                  <>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      className="flex-1 text-xs px-2"
                                      isLoading={respondMutation.isPending}
                                      onClick={() =>
                                        inc &&
                                        respondMutation.mutate({
                                          connectionId: inc.id,
                                          action: 'ACCEPT',
                                        })
                                      }
                                      leftIcon={<Check className="w-3 h-3" />}
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      className="flex-1 text-xs px-2"
                                      isLoading={respondMutation.isPending}
                                      onClick={() =>
                                        inc &&
                                        respondMutation.mutate({
                                          connectionId: inc.id,
                                          action: 'REJECT',
                                        })
                                      }
                                      leftIcon={<X className="w-3 h-3" />}
                                    >
                                      Decline
                                    </Button>
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              className="w-full text-xs"
                              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                              isLoading={connectingId === dev.id}
                              onClick={() => handleConnectClick(dev.id)}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            <Pagination
              currentPage={data.pagination.page}
              totalPages={data.pagination.totalPages}
              hasNextPage={data.pagination.hasNextPage}
              hasPrevPage={data.pagination.hasPrevPage}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </>
        )}
      </PageContainer>
    </div>
  );
};
