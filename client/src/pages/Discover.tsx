import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Users,
  FolderGit2,
  BookOpen,
  ArrowRight,
  Layers,
  Sparkles,
  MapPin,
  X,
  Code2,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, GlobalSearchResult, Project, BlogPost } from '@devconnect/shared';
import { useDebounce } from '../hooks/useDebounce';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { PageContainer } from '../components/common/PageContainer';

type ContentTypeFilter = 'All' | 'Developers' | 'Projects' | 'Publications';

interface DeveloperListItem {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  skills: { id: string; name: string; endorsementsCount: number }[];
  projectsCount: number;
  blogsCount: number;
  createdAt: string;
}

export const Discover: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';
  const rawType = (searchParams.get('type') || 'All').toLowerCase();
  const initialFilter: ContentTypeFilter =
    rawType === 'developers'
      ? 'Developers'
      : rawType === 'projects'
      ? 'Projects'
      : rawType === 'publications'
      ? 'Publications'
      : 'All';
  const initialPage = parseInt(searchParams.get('page') || '1', 10) || 1;

  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [activeFilter, setActiveFilter] = useState<ContentTypeFilter>(initialFilter);
  const [page, setPage] = useState(initialPage);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Sync state from URL changes (back/forward navigation)
  useEffect(() => {
    const currentQ = searchParams.get('search') || searchParams.get('q') || '';
    if (currentQ !== searchQuery && debouncedSearch === searchQuery) {
      setSearchQuery(currentQ);
    }
    const currentType = (searchParams.get('type') || 'All').toLowerCase();
    const validFilter: ContentTypeFilter =
      currentType === 'developers'
        ? 'Developers'
        : currentType === 'projects'
        ? 'Projects'
        : currentType === 'publications'
        ? 'Publications'
        : 'All';
    if (validFilter !== activeFilter) {
      setActiveFilter(validFilter);
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
    if (activeFilter !== 'All') params.set('type', activeFilter.toLowerCase());
    if (page > 1 && activeFilter !== 'All') params.set('page', String(page));

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, activeFilter, page, setSearchParams]);

  // Determine limit based on active filter
  const limit = activeFilter === 'All' ? 6 : activeFilter === 'Developers' ? 12 : 9;

  // Single targeted search query using backend globalSearch
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['discover-global-search', debouncedSearch, activeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append('q', debouncedSearch.trim());
      params.append('type', activeFilter.toLowerCase());
      params.append('page', String(page));
      params.append('limit', String(limit));

      const res = await apiClient.get<ApiResponse<GlobalSearchResult>>(
        `/discovery/search?${params.toString()}`
      );
      return res.data.data;
    },
  });

  const developers: DeveloperListItem[] = data?.developers?.items || [];
  const projects: Project[] = data?.projects?.items || [];
  const publications: BlogPost[] = data?.publications?.items || [];
  const counts = data?.counts || { developers: 0, projects: 0, publications: 0, total: 0 };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleFilterChange = (filter: ContentTypeFilter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setPage(1);
  };

  // Featured Item (First project or first publication)
  const featuredProject = projects[0];
  const featuredPublication = publications[0];

  const totalLoaded =
    activeFilter === 'All'
      ? counts.total
      : activeFilter === 'Developers'
      ? counts.developers
      : activeFilter === 'Projects'
      ? counts.projects
      : counts.publications;

  const totalPagesForCategory =
    activeFilter === 'Developers'
      ? Math.ceil(counts.developers / 12)
      : activeFilter === 'Projects'
      ? Math.ceil(counts.projects / 9)
      : activeFilter === 'Publications'
      ? Math.ceil(counts.publications / 9)
      : 1;

  return (
    <div className="min-h-screen">
      <PageContainer className="py-10 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-surface-border">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Discover
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Explore developers, projects, and ideas from the DevConnect community.
            </p>
          </div>
        </div>

        {/* Global Search & Content-Type Filters */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <label htmlFor="discover-search" className="sr-only">
              Search developers, projects, publications
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="discover-search"
              type="text"
              placeholder="Search developers, projects, publications..."
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
                onClick={clearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </form>

          {/* Filter Pills & Result Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist">
              {(['All', 'Developers', 'Projects', 'Publications'] as ContentTypeFilter[]).map((tab) => {
                const isSelected = activeFilter === tab;
                const count =
                  tab === 'All'
                    ? counts.total
                    : tab === 'Developers'
                    ? counts.developers
                    : tab === 'Projects'
                    ? counts.projects
                    : counts.publications;

                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => handleFilterChange(tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 ${
                      isSelected
                        ? 'bg-brand-600 text-white font-semibold shadow-sm'
                        : 'bg-surface-200 border border-surface-border text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    {tab} {!isLoading && count !== undefined ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>

            {/* Active search indication and clear button */}
            {(debouncedSearch.trim() || activeFilter !== 'All') && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>
                  {totalLoaded} {totalLoaded === 1 ? 'result' : 'results'}
                  {debouncedSearch.trim() ? ` for "${debouncedSearch.trim()}"` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearSearch();
                    setActiveFilter('All');
                  }}
                  className="text-brand-400 hover:text-brand-300 underline underline-offset-2 ml-1"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Global Loading / Error State */}
        {isLoading ? (
          <div className="space-y-8">
            <div className="space-y-3">
              <Skeleton className="w-48 h-6" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
              </div>
            </div>
          </div>
        ) : isError ? (
          <ErrorState
            title="Unable to load Discover"
            message="Please check your connection and try again."
            onRetry={() => refetch()}
          />
        ) : totalLoaded === 0 ? (
          <EmptyState
            icon={Sparkles}
            title={debouncedSearch ? 'No matches found' : 'Nothing to discover yet'}
            description={
              debouncedSearch
                ? `No ${activeFilter.toLowerCase()} match your search query. Try searching for different keywords or clear filters.`
                : 'New developers, projects and publications will appear here as the community grows.'
            }
            actionText={debouncedSearch || activeFilter !== 'All' ? 'Clear Search & Filters' : undefined}
            onAction={
              debouncedSearch || activeFilter !== 'All'
                ? () => {
                    clearSearch();
                    setActiveFilter('All');
                  }
                : undefined
            }
          />
        ) : (
          <div className="space-y-12">
            {/* 1. Featured on DevConnect Section (Shown on 'All' tab when search is clear) */}
            {activeFilter === 'All' && !debouncedSearch.trim() && (featuredProject || featuredPublication) && (
              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-400" aria-hidden="true" />
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    Featured on DevConnect
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Featured Project */}
                  {featuredProject && (
                    <Card
                      hoverEffect
                      className="flex flex-col justify-between overflow-hidden p-0 border-brand-500/20 bg-surface-200/90"
                    >
                      {featuredProject.imageUrl && (
                        <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900 border-b border-surface-border">
                          <img
                            src={featuredProject.imageUrl}
                            alt={featuredProject.title}
                            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="cyan" size="sm">
                              Featured Project
                            </Badge>
                          </div>
                          <Link to={`/projects/${featuredProject.id}`}>
                            <h3 className="text-lg font-bold text-white hover:text-brand-300 transition-colors">
                              {featuredProject.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {featuredProject.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-surface-border/60">
                          {featuredProject.user ? (
                            <Link
                              to={`/profile/${featuredProject.user.username}`}
                              className="flex items-center gap-2"
                            >
                              <Avatar
                                src={featuredProject.user.avatarUrl}
                                name={featuredProject.user.name}
                                size="xs"
                              />
                              <span className="text-xs text-slate-300 hover:text-white">
                                {featuredProject.user.name}
                              </span>
                            </Link>
                          ) : (
                            <span />
                          )}
                          <Link to={`/projects/${featuredProject.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              View Project
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Featured Publication */}
                  {featuredPublication && (
                    <Card
                      hoverEffect
                      className="flex flex-col justify-between overflow-hidden p-0 border-brand-500/20 bg-surface-200/90"
                    >
                      {featuredPublication.coverImage && (
                        <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900 border-b border-surface-border">
                          <img
                            src={featuredPublication.coverImage}
                            alt={featuredPublication.title}
                            className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="accent" size="sm">
                              Featured Publication
                            </Badge>
                          </div>
                          <Link to={`/blogs/${featuredPublication.id}`}>
                            <h3 className="text-lg font-bold text-white hover:text-brand-300 transition-colors">
                              {featuredPublication.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {featuredPublication.excerpt}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-surface-border/60">
                          {featuredPublication.author ? (
                            <Link
                              to={`/profile/${featuredPublication.author.username}`}
                              className="flex items-center gap-2"
                            >
                              <Avatar
                                src={featuredPublication.author.avatarUrl}
                                name={featuredPublication.author.name}
                                size="xs"
                              />
                              <span className="text-xs text-slate-300 hover:text-white">
                                {featuredPublication.author.name}
                              </span>
                            </Link>
                          ) : (
                            <span />
                          )}
                          <Link to={`/blogs/${featuredPublication.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              Read Article
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              </section>
            )}

            {/* 2. Developers Section */}
            {(activeFilter === 'All' || activeFilter === 'Developers') && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-brand-400" aria-hidden="true" />
                    <h2 className="text-xl font-bold tracking-tight text-white">
                      {activeFilter === 'Developers' ? 'Developers' : 'Rising Developers'}
                    </h2>
                    {activeFilter === 'All' && counts.developers > 0 && (
                      <span className="text-xs font-mono text-slate-400">
                        ({counts.developers} total)
                      </span>
                    )}
                  </div>
                  <Link
                    to={debouncedSearch ? `/developers?search=${encodeURIComponent(debouncedSearch)}` : '/developers'}
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium inline-flex items-center gap-1 group"
                  >
                    View All Developers
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {developers.length === 0 ? (
                  <Card className="p-6 text-center text-xs text-slate-400">
                    No developers match your query.
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {developers.map((dev) => (
                      <Card
                        key={dev.id}
                        hoverEffect
                        className="flex flex-col justify-between p-5 space-y-3"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-start gap-3">
                            <Link to={`/profile/${dev.username}`}>
                              <Avatar src={dev.avatarUrl} name={dev.name} size="md" />
                            </Link>
                            <div className="min-w-0 flex-1">
                              <Link to={`/profile/${dev.username}`}>
                                <h4 className="text-sm font-semibold text-slate-100 hover:text-brand-300 truncate">
                                  {dev.name}
                                </h4>
                              </Link>
                              <p className="text-xs text-slate-400 font-mono truncate">
                                @{dev.username}
                              </p>
                              {dev.location && (
                                <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5 truncate">
                                  <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                  <span>{dev.location}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {dev.bio || 'Software engineer exploring technologies on DevConnect.'}
                          </p>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {dev.skills?.slice(0, 3).map((s) => (
                              <Badge key={s.id} variant="brand" size="sm">
                                {s.name}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-surface-border/60 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400 font-mono">
                            {dev.projectsCount} projects • {dev.blogsCount} articles
                          </span>
                          <Link to={`/profile/${dev.username}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {activeFilter === 'Developers' && totalPagesForCategory > 1 && (
                  <div className="pt-4 flex justify-center">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPagesForCategory}
                      hasNextPage={page < totalPagesForCategory}
                      hasPrevPage={page > 1}
                      onPageChange={(p) => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </div>
                )}
              </section>
            )}

            {/* 3. Projects Section */}
            {(activeFilter === 'All' || activeFilter === 'Projects') && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                    <h2 className="text-xl font-bold tracking-tight text-white">
                      {activeFilter === 'Projects' ? 'Projects' : 'Featured Projects'}
                    </h2>
                    {activeFilter === 'All' && counts.projects > 0 && (
                      <span className="text-xs font-mono text-slate-400">
                        ({counts.projects} total)
                      </span>
                    )}
                  </div>
                  <Link
                    to={debouncedSearch ? `/projects?search=${encodeURIComponent(debouncedSearch)}` : '/projects'}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1 group"
                  >
                    View All Projects
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {projects.length === 0 ? (
                  <Card className="p-6 text-center text-xs text-slate-400">
                    No projects match your query.
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((proj) => (
                      <Card
                        key={proj.id}
                        hoverEffect
                        className="flex flex-col justify-between overflow-hidden p-0"
                      >
                        <Link to={`/projects/${proj.id}`} className="block">
                          {proj.imageUrl ? (
                            <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900 border-b border-surface-border">
                              <img
                                src={proj.imageUrl}
                                alt={proj.title}
                                className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="aspect-[16/9] w-full flex flex-col items-center justify-center bg-surface-100/50 border-b border-surface-border text-slate-500 gap-1">
                              <Layers className="w-6 h-6 opacity-50" aria-hidden="true" />
                              <span className="text-[10px] font-mono">Showcase Project</span>
                            </div>
                          )}
                        </Link>

                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <Link to={`/projects/${proj.id}`}>
                              <h4 className="text-sm font-semibold text-slate-100 hover:text-brand-300 truncate">
                                {proj.title}
                              </h4>
                            </Link>
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                              {proj.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {proj.techStack?.slice(0, 3).map((tech) => (
                              <Badge key={tech} variant="cyan" size="sm">
                                {tech}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 border-t border-surface-border/60 bg-surface-100/40 flex items-center justify-between gap-2">
                          {proj.user ? (
                            <Link
                              to={`/profile/${proj.user.username}`}
                              className="flex items-center gap-2 group min-w-0 flex-1"
                            >
                              <Avatar
                                src={proj.user.avatarUrl}
                                name={proj.user.name}
                                size="xs"
                                className="flex-shrink-0"
                              />
                              <span className="text-xs text-slate-300 group-hover:text-white truncate font-medium">
                                {proj.user.name}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">Developer</span>
                          )}

                          <Link to={`/projects/${proj.id}`} className="flex-shrink-0">
                            <Button variant="outline" size="sm" className="text-xs">
                              View Project
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {activeFilter === 'Projects' && totalPagesForCategory > 1 && (
                  <div className="pt-4 flex justify-center">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPagesForCategory}
                      hasNextPage={page < totalPagesForCategory}
                      hasPrevPage={page > 1}
                      onPageChange={(p) => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </div>
                )}
              </section>
            )}

            {/* 4. Publications Section */}
            {(activeFilter === 'All' || activeFilter === 'Publications') && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <h2 className="text-xl font-bold tracking-tight text-white">
                      {activeFilter === 'Publications' ? 'Publications' : 'Latest Publications'}
                    </h2>
                    {activeFilter === 'All' && counts.publications > 0 && (
                      <span className="text-xs font-mono text-slate-400">
                        ({counts.publications} total)
                      </span>
                    )}
                  </div>
                  <Link
                    to={debouncedSearch ? `/publications?search=${encodeURIComponent(debouncedSearch)}` : '/publications'}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 group"
                  >
                    View All Publications
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

                {publications.length === 0 ? (
                  <Card className="p-6 text-center text-xs text-slate-400">
                    No publications match your query.
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {publications.map((post) => (
                      <Card
                        key={post.id}
                        hoverEffect
                        className="flex flex-col justify-between overflow-hidden p-0"
                      >
                        <Link to={`/blogs/${post.id}`} className="block">
                          {post.coverImage ? (
                            <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900 border-b border-surface-border">
                              <img
                                src={post.coverImage}
                                alt={post.title}
                                className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                              />
                            </div>
                          ) : (
                            <div className="aspect-[16/9] w-full flex flex-col items-center justify-center bg-surface-100/50 border-b border-surface-border text-slate-500 gap-1">
                              <BookOpen className="w-6 h-6 opacity-50" aria-hidden="true" />
                              <span className="text-[10px] font-mono">Technical Publication</span>
                            </div>
                          )}
                        </Link>

                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <Link to={`/blogs/${post.id}`}>
                              <h4 className="text-sm font-semibold text-slate-100 hover:text-brand-300 truncate">
                                {post.title}
                              </h4>
                            </Link>
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                              {post.excerpt}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 pt-1">
                            {post.tags?.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="slate" size="sm">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 border-t border-surface-border/60 bg-surface-100/40 flex items-center justify-between gap-2">
                          {post.author ? (
                            <Link
                              to={`/profile/${post.author.username}`}
                              className="flex items-center gap-2 group min-w-0 flex-1"
                            >
                              <Avatar
                                src={post.author.avatarUrl}
                                name={post.author.name}
                                size="xs"
                                className="flex-shrink-0"
                              />
                              <span className="text-xs text-slate-300 group-hover:text-white truncate font-medium">
                                {post.author.name}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-500 font-mono">Author</span>
                          )}

                          <Link to={`/blogs/${post.id}`} className="flex-shrink-0">
                            <Button variant="outline" size="sm" className="text-xs">
                              Read
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {activeFilter === 'Publications' && totalPagesForCategory > 1 && (
                  <div className="pt-4 flex justify-center">
                    <Pagination
                      currentPage={page}
                      totalPages={totalPagesForCategory}
                      hasNextPage={page < totalPagesForCategory}
                      hasPrevPage={page > 1}
                      onPageChange={(p) => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    />
                  </div>
                )}
              </section>
            )}

            {/* 5. Mixed Discovery Feed ("Latest from the Community") - Active only on 'All' view when search is empty */}
            {activeFilter === 'All' && !debouncedSearch.trim() && (
              <section className="space-y-4 pt-4 border-t border-surface-border">
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" aria-hidden="true" />
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    Latest from the Community
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* Mixed list derived from recent items */}
                  {developers.slice(0, 2).map((dev) => (
                    <Card
                      key={`activity-dev-${dev.id}`}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-200/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                          <Users className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wide text-brand-400">
                            Developer Spotlight
                          </span>
                          <Link to={`/profile/${dev.username}`} className="block">
                            <h4 className="text-sm font-semibold text-slate-100 hover:text-brand-300">
                              {dev.name} <span className="text-slate-400 font-mono text-xs">(@{dev.username})</span>
                            </h4>
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        <span className="text-xs text-slate-400 font-mono">
                          {dev.skills?.[0]?.name ? `${dev.skills[0].name} Specialist` : 'Software Engineer'}
                        </span>
                        <Link to={`/profile/${dev.username}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}

                  {projects.slice(0, 2).map((proj) => (
                    <Card
                      key={`activity-proj-${proj.id}`}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-200/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                          <FolderGit2 className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wide text-cyan-400">
                            Showcase Project
                          </span>
                          <Link to={`/projects/${proj.id}`} className="block">
                            <h4 className="text-sm font-semibold text-slate-100 hover:text-cyan-300">
                              {proj.title}
                            </h4>
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {proj.user && (
                          <span className="text-xs text-slate-400 font-mono">
                            Showcased by {proj.user.name}
                          </span>
                        )}
                        <Link to={`/projects/${proj.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            View Project
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}

                  {publications.slice(0, 2).map((post) => (
                    <Card
                      key={`activity-post-${post.id}`}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-200/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <BookOpen className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wide text-emerald-400">
                            Technical Publication
                          </span>
                          <Link to={`/blogs/${post.id}`} className="block">
                            <h4 className="text-sm font-semibold text-slate-100 hover:text-emerald-300">
                              {post.title}
                            </h4>
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-auto">
                        {post.author && (
                          <span className="text-xs text-slate-400 font-mono">
                            By {post.author.name}
                          </span>
                        )}
                        <Link to={`/blogs/${post.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            Read Article
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
};
