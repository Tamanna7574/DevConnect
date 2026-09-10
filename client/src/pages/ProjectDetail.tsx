import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Github, ExternalLink, Calendar, Layers, Edit } from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, Project } from '@devconnect/shared';
import { useAuthStore } from '../store/authStore';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';
import { PageContainer } from '../components/common/PageContainer';

export const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: project, isLoading, isError, refetch } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingState message="Loading project details..." />;
  }

  if (isError || !project) {
    return (
      <PageContainer size="narrow" className="py-16">
        <ErrorState
          title="Project Not Found"
          message="This showcase project could not be found or has been removed."
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const isOwner = user?.id === project.userId;

  return (
    <div className="min-h-screen">
      <PageContainer size="narrow" className="py-10 space-y-8">
        {/* Navigation & Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
            leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
          >
            Back to Projects
          </Button>

          {isOwner && (
            <Link to={`/projects/${project.id}/edit`}>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit className="w-4 h-4" aria-hidden="true" />}
              >
                Edit Project
              </Button>
            </Link>
          )}
        </div>

        {/* Title & Metadata */}
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {project.techStack?.map((tech) => (
              <Badge key={tech} variant="cyan" size="sm">
                {tech}
              </Badge>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {project.title}
          </h1>

          {/* Developer / Owner Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-surface-border/60">
            {project.user && (
              <Link
                to={`/profile/${project.user.username}`}
                className="flex items-center gap-3 group"
              >
                <Avatar src={project.user.avatarUrl} name={project.user.name} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-100 group-hover:text-brand-300 transition-colors">
                      {project.user.name}
                    </p>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-100 text-slate-400 border border-surface-border">
                      Community Showcase
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">@{project.user.username}</p>
                </div>
              </Link>
            )}

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Calendar className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>
                Added on{' '}
                {new Date(project.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Preview Image */}
        {project.imageUrl ? (
          <div className="rounded-2xl overflow-hidden border border-surface-border bg-slate-900 aspect-[16/9] w-full max-h-[460px]">
            <img
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-surface-border bg-surface-200/40 aspect-[16/9] w-full max-h-[300px] flex flex-col items-center justify-center text-slate-500 gap-2">
            <Layers className="w-8 h-8 opacity-60" aria-hidden="true" />
            <span className="text-xs font-mono">No preview image provided</span>
          </div>
        )}

        {/* External Links */}
        {(project.githubUrl || project.liveDemoUrl) && (
          <div className="flex flex-wrap items-center gap-3">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center"
              >
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<Github className="w-4 h-4" aria-hidden="true" />}
                >
                  View on GitHub
                </Button>
              </a>
            )}

            {project.liveDemoUrl && (
              <a
                href={project.liveDemoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center"
              >
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<ExternalLink className="w-4 h-4" aria-hidden="true" />}
                >
                  View Live Demo
                </Button>
              </a>
            )}
          </div>
        )}

        {/* Full Project Description */}
        <Card className="p-6 sm:p-8 bg-surface-200/90 border-slate-800 space-y-4">
          <h2 className="text-lg font-semibold text-white">About the Project</h2>
          <p className="text-sm sm:text-base text-slate-200 whitespace-pre-wrap leading-relaxed">
            {project.description}
          </p>
        </Card>

        {/* Technology Stack Detailed Section */}
        {project.techStack && project.techStack.length > 0 && (
          <Card className="p-6 bg-surface-200/60 border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-300">Technologies Used</h3>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 rounded-lg bg-surface-50 border border-surface-border text-xs font-mono text-slate-200"
                >
                  {tech}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Developer / Owner Card Footer */}
        {project.user && (
          <Card className="p-6 bg-surface-100/60 flex items-start gap-4">
            <Avatar src={project.user.avatarUrl} name={project.user.name} size="lg" />
            <div className="space-y-1.5 flex-1">
              <span className="text-xs text-slate-400 font-mono">Showcased by</span>
              <h4 className="text-base font-semibold text-slate-100">{project.user.name}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {project.user.bio || 'Full stack engineer building on DevConnect.'}
              </p>
              {project.user.location && (
                <p className="text-xs text-slate-400">{project.user.location}</p>
              )}
              <Link
                to={`/profile/${project.user.username}`}
                className="inline-block text-xs text-brand-400 hover:text-brand-300 font-semibold pt-2"
              >
                View full developer profile →
              </Link>
            </div>
          </Card>
        )}
      </PageContainer>
    </div>
  );
};
