import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, BookOpen, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, BlogPost } from '@devconnect/shared';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PageContainer } from '../components/common/PageContainer';

export const BlogManage: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-blogs-manage'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ items: BlogPost[] }>>('/blogs/my/posts');
      return res.data.data?.items || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/blogs/${id}`);
    },
    onSuccess: () => {
      success('Article deleted successfully');
      setPostToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['my-blogs-manage'] });
    },
    onError: (err: any) => {
      error('Failed to delete article', err.message);
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading your articles..." />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div className="min-h-screen">
      <PageContainer className="py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-surface-border">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Manage Publications
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Create, edit, publish, and manage your technical articles and drafts.
            </p>
          </div>
          <Link to="/blogs/new" className="self-start sm:self-auto flex-shrink-0">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" aria-hidden="true" />}>
              New Article
            </Button>
          </Link>
        </div>

      {data?.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No articles written yet"
          description="Write in Markdown with code blocks and publish directly to the developer community."
          actionText="Write First Article"
          onAction={() => window.location.assign('/blogs/new')}
        />
      ) : (
        <div className="space-y-4">
          {data?.map((post) => (
            <Card key={post.id} className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={post.isPublished ? 'accent' : 'amber'} size="sm">
                    {post.isPublished ? 'Published' : 'Draft'}
                  </Badge>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <Link to={`/blogs/${post.slug || post.id}`}>
                  <h3 className="text-base font-semibold text-slate-100 hover:text-brand-300 transition-colors truncate">
                    {post.title}
                  </h3>
                </Link>

                <p className="text-xs text-slate-400 line-clamp-1">{post.excerpt}</p>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/blogs/${post.id}/edit`}>
                  <Button variant="outline" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPostToDelete(post)}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {postToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setPostToDelete(null)}
          onConfirm={() => deleteMutation.mutate(postToDelete.id)}
          title="Delete Article"
          message={`Are you sure you want to delete "${postToDelete.title}"? This cannot be undone.`}
          confirmText="Delete Article"
          isLoading={deleteMutation.isPending}
        />
      )}
      </PageContainer>
    </div>
  );
};
