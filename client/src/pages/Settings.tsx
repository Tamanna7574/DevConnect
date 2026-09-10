import React from 'react';
import { Shield, Key, Bell, Palette, Database } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { PageContainer } from '../components/common/PageContainer';

export const Settings: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen">
      <PageContainer size="narrow" className="py-10 space-y-8">
        <div className="pb-4 border-b border-surface-border">
          <h1 className="text-3xl font-bold tracking-tight text-white">Account Settings</h1>
          <p className="text-sm text-slate-300 mt-1 leading-relaxed">
            Manage your account credentials, security preferences, and session controls.
          </p>
        </div>

      <div className="space-y-6">
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-surface-border">
            <Shield className="w-5 h-5 text-brand-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Account & Credentials</h3>
              <p className="text-xs text-slate-400">Your registered identity details.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400">Registered Email</span>
              <p className="text-slate-200 font-mono mt-0.5">{user?.email}</p>
            </div>
            <div>
              <span className="text-slate-400">Username Handle</span>
              <p className="text-slate-200 font-mono mt-0.5">@{user?.username}</p>
            </div>
            <div>
              <span className="text-slate-400">Account Type</span>
              <p className="text-emerald-400 font-mono mt-0.5">Developer (Verified)</p>
            </div>
            <div>
              <span className="text-slate-400">Authentication Mode</span>
              <p className="text-slate-300 font-mono mt-0.5">JWT (httpOnly Secure Cookies)</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-surface-border">
            <Database className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">System Architecture & Persistence</h3>
              <p className="text-xs text-slate-400">Connected database and runtime configuration.</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300 font-mono">
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-100">
              <span>Database Engine</span>
              <Badge variant="accent" size="sm">PostgreSQL + Prisma ORM</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-100">
              <span>Real-Time Transport</span>
              <Badge variant="cyan" size="sm">Socket.io (Active)</Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-100">
              <span>Asset Upload Pipeline</span>
              <Badge variant="brand" size="sm">Multer + Cloudinary Engine</Badge>
            </div>
          </div>
        </Card>
      </div>
      </PageContainer>
    </div>
  );
};
