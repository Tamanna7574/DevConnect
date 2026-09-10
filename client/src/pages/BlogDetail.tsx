import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Share2, Edit } from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, BlogPost } from '@devconnect/shared';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { MarkdownViewer } from '../components/common/MarkdownViewer';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { PageContainer } from '../components/common/PageContainer';

function calculateReadTime(text: string): string {
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(3, Math.ceil(words / 180));
  return `${minutes} min read`;
}

export const BlogDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const { success } = useToast();

  const { data: post, isLoading, isError, refetch } = useQuery({
    queryKey: ['blog-post', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BlogPost>>(`/blogs/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      success('Link copied to clipboard!');
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading technical publication..." />;
  }

  if (isError || !post) {
    return (
      <PageContainer size="narrow" className="py-16">
        <ErrorState
          title="Article Not Found"
          message="This technical blog post doesn't exist or has been unpublished."
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const isAuthor = user?.id === post.authorId;
  const readTime = calculateReadTime(post.content || post.excerpt);

  return (
    <div className="min-h-screen">
      <PageContainer size="narrow" className="py-10 space-y-8">
        {/* Back button and author action */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <Link to="/publications">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Publications
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthor && (
              <Link to={`/publications/${post.id}/edit`}>
                <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
                  Edit Publication
                </Button>
              </Link>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleShare}
              leftIcon={<Share2 className="w-4 h-4" />}
            >
              Share
            </Button>
          </div>
        </div>

        {/* Header Info */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="cyan" size="sm">
                #{tag}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-surface-border/60">
            <Link
              to={`/profile/${post.author?.username}`}
              className="flex items-center gap-3 group"
            >
              <Avatar src={post.author?.avatarUrl} name={post.author?.name} size="md" />
              <div>
                <p className="text-sm font-semibold text-slate-100 group-hover:text-brand-300 transition-colors">
                  {post.author?.name}
                </p>
                <p className="text-xs text-slate-400 font-mono">@{post.author?.username}</p>
              </div>
            </Link>

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>{readTime}</span>
              </div>
            </div>
          </div>
        </div>

      {/* Cover Image */}
      {post.coverImage && (
        <div className="rounded-2xl overflow-hidden border border-surface-border bg-slate-900 max-h-[420px]">
          <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Main Markdown Content */}
      <Card className="p-6 sm:p-10 bg-surface-200/90 border-slate-800">
        <MarkdownViewer content={post.content} />
      </Card>

      {/* Author Card Footer */}
      <Card className="p-6 bg-surface-100/60 flex items-start gap-4">
        <Avatar src={post.author?.avatarUrl} name={post.author?.name} size="lg" />
        <div className="space-y-1.5 flex-1">
          <h4 className="text-sm font-semibold text-slate-100">Written by {post.author?.name}</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {post.author?.bio || 'Full stack engineer building on DevConnect.'}
          </p>
          <Link
            to={`/profile/${post.author?.username}`}
            className="inline-block text-xs text-brand-400 hover:text-brand-300 font-semibold pt-1"
          >
            View full developer profile →
          </Link>
        </div>
      </Card>
      </PageContainer>
    </div>
  );
};
