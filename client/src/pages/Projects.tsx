import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, FolderGit2, Github, ExternalLink, X, Layers } from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, PaginatedData, Project } from '@devconnect/shared';
import { useAuthStore } from '../store/authStore';
import { useDebounce } from '../hooks/useDebounce';
import { useDiscoveryFilters } from '../hooks/useDiscoveryFilters';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Avatar } from '../components/common/Avatar';
import { Pagination } from '../components/common/Pagination';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { PageContainer } from '../components/common/PageContainer';

const FALLBACK_TECH_FILTERS = [
  'All',
  'React',
  'TypeScript',
  'Node.js',
  'PostgreSQL',
  'Rust',
  'Docker',
  'Kubernetes',
  'Redis',
  'Go',
  'Tailwind CSS',
];

export const Projects: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';
  const urlTech = searchParams.get('tech') || searchParams.get('technology') || 'All';
  const urlPage = parseInt(searchParams.get('page') || '1', 10) || 1;

  const [search, setSearch] = useState(urlSearch);
  const [selectedTech, setSelectedTech] = useState(urlTech);
  const [page, setPage] = useState(urlPage);

  const debouncedSearch = useDebounce(search, 300);

  // Sync state from URL changes (Back/Forward navigation)
  useEffect(() => {
    const currentQ = searchParams.get('search') || searchParams.get('q') || '';
    if (currentQ !== search && debouncedSearch === search) {
      setSearch(currentQ);
    }
    const currentTech = searchParams.get('tech') || searchParams.get('technology') || 'All';
    if (currentTech !== selectedTech) {
      setSelectedTech(currentTech);
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
    if (selectedTech && selectedTech !== 'All') params.set('tech', selectedTech);
    if (page > 1) params.set('page', String(page));

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedTech, page, setSearchParams]);

  // Fetch real technology list from discovery endpoint
  const { data: filtersData } = useDiscoveryFilters();
  const availableTechs = [
    'All',
    ...(filtersData?.techStacks?.length
      ? filtersData.techStacks
      : FALLBACK_TECH_FILTERS.filter((t) => t !== 'All')),
  ];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects-discovery', debouncedSearch, selectedTech, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (selectedTech && selectedTech !== 'All') params.append('tech', selectedTech);
      params.append('page', String(page));
      params.append('limit', '9');

      const res = await apiClient.get<ApiResponse<PaginatedData<Project>>>(
        `/projects?${params.toString()}`
      );
      return res.data.data;
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleTechSelect = (tech: string) => {
    setSelectedTech(tech);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedTech('All');
    setPage(1);
  };

  const hasActiveFilters = Boolean(debouncedSearch.trim() || (selectedTech && selectedTech !== 'All'));
  const totalCount = data?.pagination?.total ?? (data?.items?.length ?? 0);

  return (
    <div className="min-h-screen">
      <PageContainer className="py-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-surface-border">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Projects
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Explore projects built by developers on DevConnect.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
            {!isLoading && (
              <span className="text-xs text-slate-400 font-mono hidden md:inline">
                {totalCount} {totalCount === 1 ? 'project' : 'projects'} {hasActiveFilters ? 'found' : 'showcased'}
              </span>
            )}

            {isAuthenticated && (
              <Link to="/projects/new">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
                >
                  Create Project
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search Field & Tech Filters */}
        <div className="space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <label htmlFor="project-search" className="sr-only">
              Search projects
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="project-search"
              type="text"
              placeholder="Search projects by title, description, technology or author..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-surface-border bg-surface-200 pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Clear search"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </form>

          {/* Technology Filter Chips */}
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none sm:flex-wrap"
            role="toolbar"
            aria-label="Technology filters"
          >
            {availableTechs.map((tech) => {
              const isSelected = selectedTech === tech;
              return (
                <button
                  key={tech}
                  type="button"
                  onClick={() => handleTechSelect(tech)}
                  aria-pressed={isSelected}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 ${
                    isSelected
                      ? 'bg-brand-600 text-white font-semibold shadow-sm'
                      : 'bg-surface-200 border border-surface-border text-slate-400 hover:text-slate-200 hover:border-slate-600'
                  }`}
                >
                  {tech}
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-mono ml-2 flex items-center gap-1 whitespace-nowrap"
              >
                <X className="w-3 h-3" aria-hidden="true" /> Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Project Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="flex flex-col justify-between overflow-hidden p-0">
                <Skeleton className="aspect-[16/9] w-full rounded-none" />
                <div className="p-5 space-y-3 flex-1">
                  <Skeleton className="w-3/4 h-5" />
                  <Skeleton className="w-full h-10" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="w-16 h-5" />
                    <Skeleton className="w-16 h-5" />
                  </div>
                </div>
                <div className="p-4 border-t border-surface-border/60 flex items-center justify-between">
                  <Skeleton className="w-24 h-6" />
                  <Skeleton className="w-20 h-8" />
                </div>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            title="Unable to load projects"
            message="Please check your network connection and try again."
            onRetry={() => refetch()}
          />
        ) : !data?.items || data.items.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={FolderGit2}
              title="No projects found"
              description="Try changing your search keywords or clearing the active technology filter."
              actionText="Reset Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <EmptyState
              icon={FolderGit2}
              title="No projects showcased yet"
              description="Be the first developer to showcase a project on DevConnect."
              actionText={isAuthenticated ? 'Create Project' : undefined}
              onAction={isAuthenticated ? () => window.location.assign('/projects/new') : undefined}
            />
          )
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.items.map((project) => (
                <Card
                  key={project.id}
                  hoverEffect
                  className="flex flex-col justify-between overflow-hidden p-0"
                >
                  <Link to={`/projects/${project.id}`} className="block">
                    {project.imageUrl ? (
                      <div className="aspect-[16/9] w-full overflow-hidden bg-slate-900 border-b border-surface-border">
                        <img
                          src={project.imageUrl}
                          alt={project.title}
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
                      <Link to={`/projects/${project.id}`}>
                        <h3 className="text-base font-semibold text-slate-100 hover:text-brand-300 transition-colors line-clamp-1">
                          {project.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {project.techStack.slice(0, 4).map((tech) => (
                        <Badge key={tech} variant="cyan" size="sm">
                          {tech}
                        </Badge>
                      ))}
                      {project.techStack.length > 4 && (
                        <Badge variant="slate" size="sm">
                          +{project.techStack.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-4 border-t border-surface-border/60 bg-surface-100/40 flex items-center justify-between gap-2">
                    {project.user ? (
                      <Link
                        to={`/profile/${project.user.username}`}
                        className="flex items-center gap-2 group min-w-0 flex-1"
                      >
                        <Avatar
                          src={project.user.avatarUrl}
                          name={project.user.name}
                          size="xs"
                          className="flex-shrink-0"
                        />
                        <span className="text-xs text-slate-300 group-hover:text-white truncate font-medium">
                          {project.user.name}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">Developer</span>
                    )}

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {project.githubUrl && (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-200 rounded-md transition-colors"
                          title="View Repository"
                        >
                          <Github className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}
                      {project.liveDemoUrl && (
                        <a
                          href={project.liveDemoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-surface-200 rounded-md transition-colors"
                          title="Live Demo"
                        >
                          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                        </a>
                      )}
                      <Link to={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm" className="text-xs ml-1">
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="pt-2 flex justify-center">
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  hasNextPage={data.pagination.hasNextPage}
                  hasPrevPage={data.pagination.hasPrevPage}
                  onPageChange={(newPage) => {
                    setPage(newPage);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            )}
          </div>
        )}
      </PageContainer>
    </div>
  );
};
