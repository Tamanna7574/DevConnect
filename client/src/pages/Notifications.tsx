import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, UserPlus, ThumbsUp, UserCheck, BookOpen } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { NotificationType } from '@devconnect/shared';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingState } from '../components/common/LoadingState';
import { PageContainer } from '../components/common/PageContainer';

export const Notifications: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.CONNECTION_REQUEST:
        return <UserPlus className="w-4 h-4 text-brand-400" aria-hidden="true" />;
      case NotificationType.CONNECTION_ACCEPTED:
        return <UserCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />;
      case NotificationType.SKILL_ENDORSEMENT:
        return <ThumbsUp className="w-4 h-4 text-cyan-400" aria-hidden="true" />;
      case NotificationType.NEW_BLOG_POST:
        return <BookOpen className="w-4 h-4 text-amber-400" aria-hidden="true" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" aria-hidden="true" />;
    }
  };

  if (isLoading && notifications.length === 0) {
    return <LoadingState message="Loading notifications..." />;
  }

  return (
    <div className="min-h-screen">
      <PageContainer size="narrow" className="py-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Notifications</h1>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed">
              Real-time updates on connection requests, skill endorsements, and community activity.
            </p>
          </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsRead()}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="When other developers connect with you or endorse your skills, updates will appear here in real time."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={`p-4 transition-all ${
                !n.isRead
                  ? 'bg-surface-100/90 border-brand-500/30'
                  : 'bg-surface-200/50 border-surface-border/80 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-surface-50 border border-slate-700/60 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {getIcon(n.type)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-100">{n.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {new Date(n.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!n.isRead && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(n.id)}
                      className="text-xs text-brand-400 hover:text-brand-300"
                    >
                      Mark read
                    </Button>
                  )}
                  {n.type === NotificationType.CONNECTION_REQUEST && (
                    <Link to="/connections">
                      <Button variant="outline" size="sm">
                        Respond
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </PageContainer>
    </div>
  );
};
