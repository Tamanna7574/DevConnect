import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { SkillCategory } from '@devconnect/shared';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';

export interface SkillSelectorProps {
  onAddSkill: (skill: { name: string; category: SkillCategory; yearsOfExperience?: number }) => Promise<void>;
  isLoading?: boolean;
}

const CATEGORY_OPTIONS = [
  { value: SkillCategory.FRONTEND, label: 'Frontend' },
  { value: SkillCategory.BACKEND, label: 'Backend' },
  { value: SkillCategory.DATABASE, label: 'Database' },
  { value: SkillCategory.DEVOPS, label: 'DevOps & Cloud' },
  { value: SkillCategory.MOBILE, label: 'Mobile' },
  { value: SkillCategory.AI_ML, label: 'AI & Machine Learning' },
  { value: SkillCategory.TOOLS, label: 'Tools & Utilities' },
  { value: SkillCategory.OTHER, label: 'Other' },
];

export const SkillSelector: React.FC<SkillSelectorProps> = ({ onAddSkill, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SkillCategory>(SkillCategory.FRONTEND);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(2);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Skill name is required');
      return;
    }
    setError('');
    await onAddSkill({
      name: name.trim(),
      category,
      yearsOfExperience: Number(yearsOfExperience) || 0,
    });
    setName('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        leftIcon={<Plus className="w-3.5 h-3.5" />}
      >
        Add Skill
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-xl border border-surface-border bg-surface-100/90 space-y-3 animate-in fade-in"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-200">Add New Technical Skill</h4>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input
          label="Skill Name"
          placeholder="e.g. React, Rust, GraphQL"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
        />
        <Select
          label="Category"
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(e) => setCategory(e.target.value as SkillCategory)}
        />
        <Input
          label="Years Experience"
          type="number"
          min="0"
          max="50"
          value={yearsOfExperience}
          onChange={(e) => setYearsOfExperience(Number(e.target.value))}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
          Add Skill
        </Button>
      </div>
    </form>
  );
};
