import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, Check, X, Layers } from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, Project } from '@devconnect/shared';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Textarea } from '../components/common/Textarea';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingState } from '../components/common/LoadingState';
import { PageContainer } from '../components/common/PageContainer';

export const ProjectEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const isEditMode = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [techInput, setTechInput] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [liveDemoUrl, setLiveDemoUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch project if editing
  const { data: existingProject, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
      return res.data.data;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingProject) {
      setTitle(existingProject.title);
      setDescription(existingProject.description);
      setTechStack(existingProject.techStack || []);
      setGithubUrl(existingProject.githubUrl || '');
      setLiveDemoUrl(existingProject.liveDemoUrl || '');
      setImagePreview(existingProject.imageUrl || null);
    }
  }, [existingProject]);

  const handleAddTech = () => {
    if (!techInput.trim()) return;
    const items = techInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    const unique = Array.from(new Set([...techStack, ...items]));
    setTechStack(unique);
    setTechInput('');
  };

  const handleRemoveTech = (item: string) => {
    setTechStack((prev) => prev.filter((t) => t !== item));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      error('File too large', 'Image size must be less than 2MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      error('Validation error', 'Title and description are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('techStack', JSON.stringify(techStack));
      if (githubUrl.trim()) formData.append('githubUrl', githubUrl.trim());
      if (liveDemoUrl.trim()) formData.append('liveDemoUrl', liveDemoUrl.trim());
      if (imageFile) formData.append('image', imageFile);

      if (isEditMode) {
        await apiClient.put(`/projects/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        success('Project updated successfully!');
      } else {
        await apiClient.post('/projects', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        success('Project published successfully!');
      }

      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      navigate('/projects');
    } catch (err: any) {
      error(isEditMode ? 'Failed to update project' : 'Failed to create project', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && isLoading) {
    return <LoadingState message="Loading project details..." />;
  }

  return (
    <div className="min-h-screen">
      <PageContainer size="narrow" className="py-10 space-y-8">
        <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/projects')}
            leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
          >
            Back to Projects
          </Button>
          <h1 className="text-2xl font-bold text-white">
            {isEditMode ? 'Edit Project' : 'Create New Showcase Project'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-5">
            <Input
              label="Project Title"
              placeholder="e.g. Distributed Task Orchestrator"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

          <Textarea
            label="Project Description"
            placeholder="Explain the architectural highlights, technical problems solved, and performance results..."
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          {/* Tech Stack Input */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Technology Stack
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. React, TypeScript, Rust, Docker (press Enter or Add)"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTech();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddTech}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-xs font-mono"
                >
                  {tech}
                  <button
                    type="button"
                    onClick={() => handleRemoveTech(tech)}
                    className="text-cyan-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GitHub Repository URL"
              placeholder="https://github.com/user/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            <Input
              label="Live Demo URL"
              placeholder="https://demo.app"
              value={liveDemoUrl}
              onChange={(e) => setLiveDemoUrl(e.target.value)}
            />
          </div>

          {/* Project Screenshot / Image */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-medium text-slate-300">
              Project Preview Image (Max 2MB)
            </label>
            {imagePreview && (
              <div className="relative rounded-xl overflow-hidden border border-surface-border mb-3 max-h-56 bg-slate-900">
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-rose-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <label
              htmlFor="project-image-upload"
              className="flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-700 bg-surface-100/50 hover:bg-surface-100 hover:border-slate-500 cursor-pointer transition-colors text-xs font-medium text-slate-300"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              {imagePreview ? 'Change Image' : 'Upload Project Image'}
            </label>
            <input
              id="project-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate('/projects')}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}
          >
            {isEditMode ? 'Update Project' : 'Publish Project'}
          </Button>
        </div>
      </form>
      </PageContainer>
    </div>
  );
};
