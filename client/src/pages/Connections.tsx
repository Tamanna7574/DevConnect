import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Check, X, UserMinus, Clock, UserCheck, AlertCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { ApiResponse } from '@devconnect/shared';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { LoadingState } from '../components/common/LoadingState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PageContainer } from '../components/common/PageContainer';

export const Connections: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'connected' | 'incoming' | 'outgoing'>('connected');
  const [connectionToRemove, setConnectionToRemove] = useState<{ id: string; name: string } | null>(null);
  const [requestToCancel, setRequestToCancel] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['connections-list'],
    queryFn: async () => {
      const res = await apiClient.get<
        ApiResponse<{
          accepted: { id: string; connectedUser: any; connectedSince: string }[];
          incoming: { id: string; requester: any; createdAt: string }[];
          outgoing: { id: string; receiver: any; createdAt: string }[];
        }>
      >('/connections');
      return res.data.data;
    },
  });

  // Respond Mutation (Accept / Decline)
  const respondMutation = useMutation({
    mutationFn: async ({ connectionId, action }: { connectionId: string; action: 'ACCEPT' | 'REJECT' }) => {
      await apiClient.put(`/connections/${connectionId}/respond`, { action });
    },
    onSuccess: (_, { action }) => {
      success(`Connection ${action === 'ACCEPT' ? 'accepted' : 'declined'}`);
      queryClient.invalidateQueries({ queryKey: ['connections-list'] });
      queryClient.invalidateQueries({ queryKey: ['viewer-connections'] });
    },
    onError: (err: any) => {
      error('Action failed', err.response?.data?.message || err.message);
    },
  });

  // Remove Connection Mutation
  const removeMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      await apiClient.delete(`/connections/${connectionId}`);
    },
    onSuccess: () => {
      success('Connection removed');
      setConnectionToRemove(null);
      setRequestToCancel(null);
      queryClient.invalidateQueries({ queryKey: ['connections-list'] });
      queryClient.invalidateQueries({ queryKey: ['viewer-connections'] });
    },
    onError: (err: any) => {
      error('Failed to remove connection', err.response?.data?.message || err.message);
    },
  });

  if (isLoading) {
    return <LoadingState message="Loading your developer network..." />;
  }

  if (isError) {
    return (
      <PageContainer className="py-16">
        <ErrorState
          title="Unable to load your network"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
        />
      </PageContainer>
    );
  }

  const acceptedList = data?.accepted || [];
  const incomingList = data?.incoming || [];
  const outgoingList = data?.outgoing || [];

  return (
    <div className="min-h-screen">
      <PageContainer className="py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-surface-border">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Network
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Manage your developer connections and connection requests.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {acceptedList.length} {acceptedList.length === 1 ? 'connection' : 'connections'}
          </span>
        </div>

        {/* Tabs: Connections, Requests, Sent */}
        <div className="flex items-center gap-2 border-b border-surface-border overflow-x-auto scrollbar-none" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'connected'}
            onClick={() => setActiveTab('connected')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 ${
              activeTab === 'connected'
                ? 'border-brand-500 text-brand-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Connections ({acceptedList.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'incoming'}
            onClick={() => setActiveTab('incoming')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors relative focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 ${
              activeTab === 'incoming'
                ? 'border-brand-500 text-brand-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Requests ({incomingList.length})
            {incomingList.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-brand-400" />
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'outgoing'}
            onClick={() => setActiveTab('outgoing')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 ${
              activeTab === 'outgoing'
                ? 'border-brand-500 text-brand-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Sent ({outgoingList.length})
          </button>
        </div>

      {/* Tab Contents */}
      {activeTab === 'connected' && (
        <div>
          {acceptedList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No connections yet"
              description="Start building your developer network by connecting with other developers."
              actionText="Discover Developers"
              onAction={() => window.location.assign('/developers')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {acceptedList.map((c) => (
                <Card key={c.id} className="p-5 flex flex-col justify-between space-y-4">
                  <div className="flex items-start gap-3.5">
                    <Link to={`/profile/${c.connectedUser?.username}`}>
                      <Avatar src={c.connectedUser?.avatarUrl} name={c.connectedUser?.name} size="lg" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link to={`/profile/${c.connectedUser?.username}`}>
                        <h3 className="text-sm sm:text-base font-semibold text-slate-100 hover:text-brand-300 transition-colors truncate">
                          {c.connectedUser?.name}
                        </h3>
                      </Link>
                      <p className="text-xs text-slate-400 font-mono truncate">
                        @{c.connectedUser?.username}
                      </p>
                      {c.connectedUser?.bio && (
                        <p className="text-xs text-slate-300 line-clamp-1 mt-1">
                          {c.connectedUser?.bio}
                        </p>
                      )}
                      {c.connectedUser?.location && (
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {c.connectedUser?.location}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-surface-border/60">
                    <Link to={`/profile/${c.connectedUser?.username}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        View Profile
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setConnectionToRemove({
                          id: c.id,
                          name: c.connectedUser?.name || 'this developer',
                        })
                      }
                      className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs"
                      title="Remove Connection"
                    >
                      <UserMinus className="w-3.5 h-3.5 mr-1" />
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'incoming' && (
        <div>
          {incomingList.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No pending requests"
              description="You're all caught up."
            />
          ) : (
            <div className="space-y-3 max-w-2xl">
              {incomingList.map((req) => (
                <Card key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Link to={`/profile/${req.requester?.username}`}>
                      <Avatar src={req.requester?.avatarUrl} name={req.requester?.name} size="md" />
                    </Link>
                    <div className="min-w-0">
                      <Link to={`/profile/${req.requester?.username}`}>
                        <h4 className="text-sm font-semibold text-slate-100 hover:text-brand-300 transition-colors truncate">
                          {req.requester?.name}
                        </h4>
                      </Link>
                      <p className="text-xs text-slate-400 font-mono truncate">
                        @{req.requester?.username}
                      </p>
                      <p className="text-[11px] text-brand-400 mt-0.5 font-medium">
                        Wants to connect with you
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      className="text-xs px-3"
                      onClick={() =>
                        respondMutation.mutate({ connectionId: req.id, action: 'ACCEPT' })
                      }
                      isLoading={respondMutation.isPending}
                      leftIcon={<Check className="w-3.5 h-3.5" />}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-xs px-3"
                      onClick={() =>
                        respondMutation.mutate({ connectionId: req.id, action: 'REJECT' })
                      }
                      isLoading={respondMutation.isPending}
                      leftIcon={<X className="w-3.5 h-3.5" />}
                    >
                      Decline
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'outgoing' && (
        <div>
          {outgoingList.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No pending sent requests"
              description="You have no pending requests awaiting responses."
            />
          ) : (
            <div className="space-y-3 max-w-2xl">
              {outgoingList.map((req) => (
                <Card key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Link to={`/profile/${req.receiver?.username}`}>
                      <Avatar src={req.receiver?.avatarUrl} name={req.receiver?.name} size="md" />
                    </Link>
                    <div className="min-w-0">
                      <Link to={`/profile/${req.receiver?.username}`}>
                        <h4 className="text-sm font-semibold text-slate-100 hover:text-brand-300 transition-colors truncate">
                          {req.receiver?.name}
                        </h4>
                      </Link>
                      <p className="text-xs text-slate-400 font-mono truncate">
                        @{req.receiver?.username}
                      </p>
                      <p className="text-[11px] text-amber-400 mt-0.5">
                        Request sent
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Badge variant="amber" size="sm">
                      Pending
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setRequestToCancel({
                          id: req.id,
                          name: req.receiver?.name || 'this request',
                        })
                      }
                      className="text-slate-400 hover:text-rose-400 text-xs"
                      title="Cancel Request"
                    >
                      Cancel Request
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Remove Connection Confirmation Dialog */}
      {connectionToRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Connection"
          message={`Are you sure you want to remove your connection with ${connectionToRemove.name}?`}
          confirmText="Remove"
          cancelText="Cancel"
          isDestructive={true}
          isLoading={removeMutation.isPending}
          onConfirm={() => removeMutation.mutate(connectionToRemove.id)}
          onClose={() => setConnectionToRemove(null)}
        />
      )}

      {/* Cancel Request Confirmation Dialog */}
      {requestToCancel && (
        <ConfirmDialog
          isOpen={true}
          title="Cancel Connection Request"
          message={`Are you sure you want to cancel your connection request to ${requestToCancel.name}?`}
          confirmText="Cancel Request"
          cancelText="Keep"
          isDestructive={true}
          isLoading={removeMutation.isPending}
          onConfirm={() => removeMutation.mutate(requestToCancel.id)}
          onClose={() => setRequestToCancel(null)}
        />
      )}
      </PageContainer>
    </div>
  );
};
