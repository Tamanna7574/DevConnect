import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Trash2, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse, DeveloperProfile, SkillCategory } from '@devconnect/shared';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { Textarea } from '../components/common/Textarea';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { SkillSelector } from '../components/common/SkillSelector';
import { LoadingState } from '../components/common/LoadingState';
import { PageContainer } from '../components/common/PageContainer';

export const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuthStore();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.username],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<DeveloperProfile>>(`/users/profile/${user?.username}`);
      return res.data.data;
    },
    enabled: !!user?.username,
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBio(profile.bio || '');
      setLocation(profile.location || '');
      setGithubUrl(profile.githubUrl || '');
      setLinkedinUrl(profile.linkedinUrl || '');
      setPortfolioUrl(profile.portfolioUrl || '');
      setAvatarPreview(profile.avatarUrl || null);
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      error('Image too large', 'Avatar image must be less than 2MB.');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Update text details
      await apiClient.put('/users/profile', {
        name,
        bio,
        location,
        githubUrl: githubUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        portfolioUrl: portfolioUrl || undefined,
      });

      // 2. Upload avatar if selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const avatarRes = await apiClient.post<ApiResponse<{ avatarUrl: string }>>('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (avatarRes.data.data?.avatarUrl) {
          updateUser({ avatarUrl: avatarRes.data.data.avatarUrl });
        }
      }

      updateUser({ name, bio, location, githubUrl, linkedinUrl, portfolioUrl });
      queryClient.invalidateQueries({ queryKey: ['profile', user?.username] });
      success('Profile updated successfully!');
      navigate(`/profile/${user?.username}`);
    } catch (err: any) {
      error('Failed to update profile', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addSkillMutation = useMutation({
    mutationFn: async (newSkill: { name: string; category: SkillCategory; yearsOfExperience?: number }) => {
      await apiClient.post('/users/skills', newSkill);
    },
    onSuccess: () => {
      success('Skill added to profile!');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.username] });
    },
    onError: (err: any) => {
      error('Failed to add skill', err.message);
    },
  });

  const removeSkillMutation = useMutation({
    mutationFn: async (skillId: string) => {
      await apiClient.delete(`/users/skills/${skillId}`);
    },
    onSuccess: () => {
      success('Skill removed');
      queryClient.invalidateQueries({ queryKey: ['profile', user?.username] });
    },
    onError: (err: any) => {
      error('Failed to remove skill', err.message);
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading profile settings..." />;
  }

  return (
    <div className="min-h-screen">
      <PageContainer size="narrow" className="py-10 space-y-8">
        <div className="flex items-center justify-between pb-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/profile/${user?.username}`)}
              leftIcon={<ArrowLeft className="w-4 h-4" aria-hidden="true" />}
            >
              Back
            </Button>
            <h1 className="text-2xl font-bold text-white">Edit Developer Profile</h1>
          </div>
        </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 space-y-6">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Avatar & Bio
          </h3>

          {/* Avatar upload */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl border border-surface-border bg-surface-100/50">
            <Avatar src={avatarPreview} name={name || user?.name} size="2xl" />
            <div className="space-y-2 text-center sm:text-left">
              <label
                htmlFor="avatar-upload"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-50 border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload New Avatar
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <p className="text-[11px] text-slate-400 font-mono">
                PNG, JPG, or WebP up to 2MB. Scaled automatically.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Location"
              placeholder="e.g. San Francisco, CA / Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <Textarea
            label="Bio & Engineering Focus"
            placeholder="Describe your technical background, current stack, and systems you love building..."
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </Card>

        {/* Social & Portfolio URLs */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Social & Portfolio Links
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="GitHub URL"
              placeholder="https://github.com/username"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
            />
            <Input
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
            />
            <Input
              label="Portfolio / Website URL"
              placeholder="https://yourwebsite.dev"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`/profile/${user?.username}`)}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving} leftIcon={<Check className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* Skills Management Section */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div>
            <h3 className="text-base font-semibold text-white">Technical Skills</h3>
            <p className="text-xs text-slate-400">Add or manage skills on your profile.</p>
          </div>
          <SkillSelector
            onAddSkill={(s) => addSkillMutation.mutateAsync(s)}
            isLoading={addSkillMutation.isPending}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profile?.skills.map((us) => (
            <div
              key={us.id}
              className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface-100/60"
            >
              <div>
                <span className="text-xs font-semibold text-slate-200 font-mono">{us.skill.name}</span>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="slate" size="sm">
                    {us.skill.category}
                  </Badge>
                  {us.yearsOfExperience !== null && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      {us.yearsOfExperience} yrs
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeSkillMutation.mutate(us.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Remove Skill"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>
      </PageContainer>
    </div>
  );
};
