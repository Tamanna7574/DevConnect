import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, BookOpen, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, PaginatedData, BlogPost } from '@devconnect/shared';
import { useAuthStore } from '../store/authStore';
import { useDebounce } from '../hooks/useDebounce';
import { useDiscoveryFilters } from '../hooks/useDiscoveryFilters';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { Pagination } from '../components/common/Pagination';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { PageContainer } from '../components/common/PageContainer';

const FALLBACK_TOPIC_FILTERS = [
  'All',
  'Architecture',
  'React',
  'Backend',
  'Database',
  'AI',
  'DevOps',
  'Performance',
  'TypeScript',
  'Rust',
];

function calculateReadTime(text: string): string {
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(3, Math.ceil(words / 180));
  return `${minutes} min read`;
}

export const Blogs: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlSearch = searchParams.get('search') || searchParams.get('q') || '';
  const urlTopic = searchParams.get('tag') || searchParams.get('topic') || searchParams.get('category') || 'All';
  const urlPage = parseInt(searchParams.get('page') || '1', 10) || 1;

  const [search, setSearch] = useState(urlSearch);
  const [selectedTopic, setSelectedTopic] = useState(urlTopic);
  const [page, setPage] = useState(urlPage);

  const debouncedSearch = useDebounce(search, 300);

  // Sync state from URL changes (Back/Forward navigation)
  useEffect(() => {
    const currentQ = searchParams.get('search') || searchParams.get('q') || '';
    if (currentQ !== search && debouncedSearch === search) {
      setSearch(currentQ);
    }
    const currentTopic = searchParams.get('tag') || searchParams.get('topic') || searchParams.get('category') || 'All';
    if (currentTopic !== selectedTopic) {
      setSelectedTopic(currentTopic);
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
    if (selectedTopic && selectedTopic !== 'All') params.set('tag', selectedTopic);
    if (page > 1) params.set('page', String(page));

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, selectedTopic, page, setSearchParams]);

  // Fetch real topic tags from discovery endpoint
  const { data: filtersData } = useDiscoveryFilters();
  const availableTopics = [
    'All',
    ...(filtersData?.blogTags?.length
      ? filtersData.blogTags
      : FALLBACK_TOPIC_FILTERS.filter((t) => t !== 'All')),
  ];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['blogs-feed', debouncedSearch, selectedTopic, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch.trim()) params.append('search', debouncedSearch.trim());
      if (selectedTopic && selectedTopic !== 'All') params.append('tag', selectedTopic);
      params.append('page', String(page));
      params.append('limit', '12');

      const res = await apiClient.get<ApiResponse<PaginatedData<BlogPost>>>(
        `/blogs?${params.toString()}`
      );
      return res.data.data;
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    refetch();
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedTopic('All');
    setPage(1);
  };

  const hasActiveFilters = Boolean(debouncedSearch.trim() || (selectedTopic && selectedTopic !== 'All'));
  const totalCount = data?.pagination?.total ?? (data?.items?.length ?? 0);
  const countLabel = totalCount === 1 ? '1 publication' : `${totalCount} publications`;

  return (
    <div className="min-h-screen">
      <PageContainer className="py-10 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-surface-border">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Technical Publications
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Learn from developers, share what you know, and explore technical ideas.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto flex-shrink-0">
            {!isLoading && (
              <span className="text-xs text-slate-400 font-mono hidden md:inline">
                {totalCount} {totalCount === 1 ? 'publication' : 'publications'} {hasActiveFilters ? 'found' : 'published'}
              </span>
            )}

            {isAuthenticated && (
              <Link to="/publications/new" className="self-start sm:self-auto flex-shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}
                >
                  Write Publication
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Search & Topic Filters */}
        <div className="space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <label htmlFor="publication-search" className="sr-only">
              Search publications
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="publication-search"
              type="text"
              placeholder="Search publications by title, excerpt, topic or author..."
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

          {/* Topic Filter Chips */}
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none sm:flex-wrap"
            role="toolbar"
            aria-label="Category filters"
          >
            {availableTopics.map((topic) => {
              const isSelected = selectedTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => handleTopicSelect(topic)}
                  aria-pressed={isSelected}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                    isSelected
                      ? 'bg-brand-600 border border-brand-500 text-white font-semibold shadow-sm'
                      : 'bg-surface-200 border border-surface-border text-slate-300 hover:text-white hover:border-slate-600 hover:bg-surface-100'
                  }`}
                >
                  {topic}
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

          {/* Publication Count Indicator & Clear Option */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs font-mono text-slate-400">
              {isLoading ? (
                <span className="animate-pulse">Loading publications...</span>
              ) : (
                <span>
                  {countLabel} {hasActiveFilters ? 'matching filters' : ''}
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Editorial Publications Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-surface-border bg-surface-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <Skeleton className="aspect-[16/9] w-full rounded-none" />
                  <div className="p-5 space-y-3">
                    <Skeleton className="w-20 h-3.5" />
                    <Skeleton className="w-full h-5" />
                    <Skeleton className="w-4/5 h-5" />
                    <Skeleton className="w-full h-10" />
                  </div>
                </div>
                <div className="px-5 py-3.5 border-t border-surface-border/60 bg-surface-300/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-6 h-6 rounded-full" />
                    <Skeleton className="w-20 h-3.5" />
                  </div>
                  <Skeleton className="w-24 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !data?.items || data.items.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No publications found"
            description="Try a different search term or category."
            actionText={
              hasActiveFilters
                ? 'Reset Filters'
                : isAuthenticated
                ? 'Write First Publication'
                : undefined
            }
            onAction={() => {
              if (hasActiveFilters) {
                handleResetFilters();
              } else if (isAuthenticated) {
                window.location.assign('/publications/new');
              }
            }}
          />
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.items.map((blog) => (
                <article
                  key={blog.id}
                  className="group rounded-xl border border-surface-border bg-surface-200 hover:border-slate-600 hover:bg-surface-100/60 transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    {/* Fixed Aspect Ratio Cover Media Container */}
                    <Link
                      to={`/publications/${blog.id}`}
                      className="block aspect-[16/9] w-full overflow-hidden bg-surface-300/50 border-b border-surface-border relative"
                    >
                      {blog.coverImage ? (
                        <img
                          src={blog.coverImage}
                          alt={blog.title}
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-1.5 p-4 bg-gradient-to-b from-surface-200 to-surface-300/60">
                          <BookOpen className="w-7 h-7 text-slate-500/70" aria-hidden="true" />
                          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-500">
                            {blog.tags[0] || 'Technical Article'}
                          </span>
                        </div>
                      )}
                    </Link>

                    {/* Editorial Content */}
                    <div className="p-5 space-y-3">
                      {/* Topic Category Pill */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold text-brand-400 bg-brand-500/10 border border-brand-500/20">
                            {blog.tags[0]}
                          </span>
                          {blog.tags.slice(1, 3).map((tag) => (
                            <span
                              key={tag}
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-surface-100 border border-surface-border"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Headline */}
                      <Link to={`/publications/${blog.id}`} className="block group">
                        <h2 className="text-lg font-semibold text-slate-100 group-hover:text-brand-300 transition-colors line-clamp-2 leading-snug">
                          {blog.title}
                        </h2>
                      </Link>

                      {/* Excerpt */}
                      <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                        {blog.excerpt || 'Read this full technical article on DevConnect.'}
                      </p>
                    </div>
                  </div>

                  {/* Metadata Footer */}
                  <div className="px-5 py-3.5 border-t border-surface-border/60 bg-surface-300/30 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {blog.author ? (
                        <Link
                          to={`/profile/${blog.author.username}`}
                          className="flex items-center gap-2 hover:text-slate-200 transition-colors truncate"
                        >
                          <Avatar
                            src={blog.author.avatarUrl}
                            name={blog.author.name}
                            size="xs"
                            className="flex-shrink-0"
                          />
                          <span className="font-medium truncate text-slate-300">
                            {blog.author.name}
                          </span>
                        </Link>
                      ) : (
                        <span className="font-mono">Author</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 flex-shrink-0 ml-2">
                      <time dateTime={blog.publishedAt || blog.createdAt}>
                        {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                      <span aria-hidden="true">·</span>
                      <span>{calculateReadTime(blog.content)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {data.pagination && data.pagination.totalPages > 1 && (
              <div className="pt-4 flex justify-center">
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
