import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Upload, Check, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, BlogPost } from '@devconnect/shared';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { MarkdownEditor } from '../components/common/MarkdownEditor';
import { LoadingState } from '../components/common/LoadingState';
import { PageContainer } from '../components/common/PageContainer';

export const BlogEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error } = useToast();

  const isEditMode = Boolean(id);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch blog if in edit mode
  const { data: existingBlog, isLoading } = useQuery({
    queryKey: ['blog-post', id],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<BlogPost>>(`/blogs/${id}`);
      return res.data.data;
    },
    enabled: isEditMode,
  });

  useEffect(() => {
    if (existingBlog) {
      setTitle(existingBlog.title);
      setContent(existingBlog.content);
      setTags(existingBlog.tags || []);
      setIsPublished(existingBlog.isPublished);
      setCoverPreview(existingBlog.coverImage || null);
    }
  }, [existingBlog]);

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    const items = tagInput.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean);
    const unique = Array.from(new Set([...tags, ...items]));
    setTags(unique);
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      error('Please provide both a title and article content');
      return;
    }

    try {
      setIsSubmitting(true);
      let coverImageUrl = existingBlog?.coverImage;

      if (coverFile) {
        const formData = new FormData();
        formData.append('cover', coverFile);
        const uploadRes = await apiClient.post<ApiResponse<{ url: string }>>('/upload/cover', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        coverImageUrl = uploadRes.data.data?.url;
      }

      if (isEditMode) {
        await apiClient.put(`/blogs/${id}`, {
          title,
          content,
          tags,
          isPublished,
          coverImage: coverImageUrl,
        });
        success('Article updated successfully!');
      } else {
        await apiClient.post('/blogs', {
          title,
          content,
          tags,
          isPublished,
          coverImage: coverImageUrl,
        });
        success('Technical publication published!');
      }

      queryClient.invalidateQueries({ queryKey: ['blogs-feed'] });
      queryClient.invalidateQueries({ queryKey: ['my-blogs-manage'] });
      navigate('/blogs/manage');
    } catch (err: any) {
      error(isEditMode ? 'Failed to update article' : 'Failed to publish article', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditMode && isLoading) {
    return <LoadingState message="Loading article content..." />;
  }

  return (
    <div className="min-h-screen">
      <PageContainer size="narrow" className="py-10 space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/blogs/manage')}
              leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
            >
              Back
            </Button>
            <h1 className="text-2xl font-bold text-white">
              {isEditMode ? 'Edit Article' : 'Write Technical Publication'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 space-y-5">
            <Input
              label="Article Title"
              placeholder="e.g. Scaling Distributed Cache Invalidation in Microservices"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

          {/* Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">Topic Tags</label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. TypeScript, Redis, Architecture (press Enter or Add)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddTag}>
                Add Tag
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-300 text-xs font-mono"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-cyan-400 hover:text-white ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Cover image */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">Cover Banner Image (Optional)</label>
            {coverPreview && (
              <div className="relative rounded-xl overflow-hidden border border-surface-border mb-3 max-h-56 bg-slate-900">
                <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white hover:bg-rose-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <label
              htmlFor="cover-image-upload"
              className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-dashed border-slate-700 bg-surface-100/50 hover:bg-surface-100 hover:border-slate-500 cursor-pointer transition-colors text-xs font-medium text-slate-300"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              {coverPreview ? 'Change Cover Image' : 'Upload Cover Banner'}
            </label>
            <input
              id="cover-image-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleCoverChange}
            />
          </div>

          {/* Markdown Editor with Preview */}
          <MarkdownEditor
            label="Article Body (Markdown Supported with Code Blocks)"
            value={content}
            onChange={setContent}
            placeholder="Write in Markdown. Use ```typescript to render syntax-highlighted code blocks..."
            minHeight="min-h-[420px]"
          />

          {/* Published Toggle */}
          <div className="flex items-center gap-3 pt-2">
            <input
              id="isPublished"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-surface-100 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="isPublished" className="text-xs text-slate-300 select-none cursor-pointer">
              Publish immediately to developer directory and feed
            </label>
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => navigate('/blogs/manage')}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Check className="w-4 h-4" aria-hidden="true" />}
          >
            {isEditMode ? 'Update Article' : isPublished ? 'Publish Article' : 'Save Draft'}
          </Button>
        </div>
      </form>
      </PageContainer>
    </div>
  );
};
