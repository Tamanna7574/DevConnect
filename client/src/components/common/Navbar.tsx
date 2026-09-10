import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Code2,
  Bell,
  Users,
  BookOpen,
  LayoutDashboard,
  FolderGit2,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { ApiResponse } from '@devconnect/shared';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Avatar } from './Avatar';
import { Button } from './Button';
import { PageContainer } from './PageContainer';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAllAsRead } = useNotificationStore();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch pending connections count
  const { data: connectionsData } = useQuery({
    queryKey: ['connections-list'],
    queryFn: async () => {
      const res = await apiClient.get<
        ApiResponse<{
          accepted: any[];
          incoming: any[];
          outgoing: any[];
        }>
      >('/connections');
      return res.data.data;
    },
    enabled: isAuthenticated,
  });

  const pendingIncomingCount = connectionsData?.incoming?.length || 0;

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleLogout = async () => {
    await logout();
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/blogs') {
      return (
        location.pathname === '/blogs' ||
        location.pathname.startsWith('/blogs/') ||
        location.pathname === '/publications' ||
        location.pathname.startsWith('/publications/')
      );
    }
    if (path === '/connections') {
      return (
        location.pathname === '/connections' ||
        location.pathname.startsWith('/connections/') ||
        location.pathname === '/network' ||
        location.pathname.startsWith('/network/')
      );
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-background/95 backdrop-blur">
      <PageContainer>
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand + Nav Links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold">
                <Code2 className="w-4 h-4" />
              </div>
              <span className="font-semibold text-base tracking-tight text-white">DevConnect</span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/discover"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive('/discover')
                    ? 'text-white bg-surface-50 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-50/50'
                }`}
              >
                Discover
              </Link>
              <Link
                to="/developers"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive('/developers')
                    ? 'text-white bg-surface-50 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-50/50'
                }`}
              >
                Developers
              </Link>
              <Link
                to="/projects"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive('/projects')
                    ? 'text-white bg-surface-50 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-50/50'
                }`}
              >
                Projects
              </Link>
              <Link
                to="/blogs"
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isActive('/blogs')
                    ? 'text-white bg-surface-50 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-surface-50/50'
                }`}
              >
                Publications
              </Link>

              {isAuthenticated && (
                <Link
                  to="/network"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive('/network')
                      ? 'text-white bg-surface-50 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-50/50'
                  }`}
                >
                  <span>Network</span>
                  {pendingIncomingCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-brand-500 text-white leading-none">
                      {pendingIncomingCount}
                    </span>
                  )}
                </Link>
              )}
            </nav>
          </div>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <Link to="/blogs/new">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="text-xs"
                  >
                    Write Post
                  </Button>
                </Link>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotificationOpen(!isNotificationOpen);
                      setIsProfileMenuOpen(false);
                    }}
                    className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-50 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {isNotificationOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsNotificationOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 z-40 w-80 rounded-xl border border-surface-border bg-surface-200 p-3 shadow-xl animate-in fade-in-50 zoom-in-95">
                        <div className="flex items-center justify-between pb-2.5 border-b border-surface-border">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-200">
                              Notifications
                            </span>
                            {unreadCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-brand-500/20 text-brand-300 font-mono">
                                {unreadCount} new
                              </span>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead()}
                              className="text-[11px] text-brand-400 hover:text-brand-300"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        <div className="max-h-72 overflow-y-auto divide-y divide-surface-border/40 py-1">
                          {notifications.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-6">
                              No notifications yet
                            </p>
                          ) : (
                            notifications.slice(0, 5).map((n) => (
                              <div
                                key={n.id}
                                className={`py-2 px-1.5 transition-colors ${
                                  !n.isRead ? 'bg-surface-50/50 rounded-md' : ''
                                }`}
                              >
                                <p className="text-xs font-medium text-slate-200">{n.title}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                                  {n.message}
                                </p>
                              </div>
                            ))
                          )}
                        </div>

                        <Link
                          to="/notifications"
                          onClick={() => setIsNotificationOpen(false)}
                          className="block text-center text-xs font-medium text-brand-400 hover:text-brand-300 pt-2 border-t border-surface-border"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                {/* Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(!isProfileMenuOpen);
                      setIsNotificationOpen(false);
                    }}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-surface-50 transition-colors"
                  >
                    <Avatar src={user.avatarUrl} name={user.name} size="sm" />
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setIsProfileMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 z-40 w-52 rounded-xl border border-surface-border bg-surface-200 p-1.5 shadow-xl animate-in fade-in-50 zoom-in-95">
                        <div className="px-3 py-2 border-b border-surface-border mb-1">
                          <p className="text-xs font-semibold text-slate-100 truncate">{user.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono truncate">
                            @{user.username}
                          </p>
                        </div>
                        <Link
                          to={`/profile/${user.username}`}
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-slate-300 hover:text-white hover:bg-surface-50 transition-colors"
                        >
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Profile
                        </Link>
                        <Link
                          to="/profile/edit"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-slate-300 hover:text-white hover:bg-surface-50 transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          Edit Profile
                        </Link>
                        <Link
                          to="/blogs/manage"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs text-slate-300 hover:text-white hover:bg-surface-50 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          Publications
                        </Link>
                        <div className="pt-1 mt-1 border-t border-surface-border">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="text-xs">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-50"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </PageContainer>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-surface-border bg-surface-200 px-4 py-3 space-y-1">
          <Link
            to="/discover"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition-colors ${
              isActive('/discover')
                ? 'text-white bg-surface-50 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-surface-50/50'
            }`}
          >
            <Users className="w-4 h-4 text-brand-400" /> Discover
          </Link>
          <Link
            to="/developers"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition-colors ${
              isActive('/developers')
                ? 'text-white bg-surface-50 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-surface-50/50'
            }`}
          >
            <Users className="w-4 h-4 text-slate-400" /> Developers
          </Link>
          <Link
            to="/projects"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition-colors ${
              isActive('/projects')
                ? 'text-white bg-surface-50 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-surface-50/50'
            }`}
          >
            <FolderGit2 className="w-4 h-4 text-slate-400" /> Projects
          </Link>
          <Link
            to="/blogs"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition-colors ${
              isActive('/blogs')
                ? 'text-white bg-surface-50 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-surface-50/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-slate-400" /> Publications
          </Link>

          {isAuthenticated && (
            <>
              <Link
                to="/network"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg transition-colors ${
                  isActive('/network')
                    ? 'text-white bg-surface-50 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-surface-50/50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-400" /> Network
                </span>
                {pendingIncomingCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-brand-500 text-white leading-none">
                    {pendingIncomingCount}
                  </span>
                )}
              </Link>
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition-colors ${
                  isActive('/dashboard')
                    ? 'text-white bg-surface-50 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-surface-50/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
              </Link>
              <Link
                to={`/profile/${user?.username}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg transition-colors ${
                  isActive(`/profile/${user?.username}`)
                    ? 'text-white bg-surface-50 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-surface-50/50'
                }`}
              >
                <User className="w-4 h-4 text-slate-400" /> Your Profile
              </Link>
              <Link
                to="/notifications"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg transition-colors ${
                  isActive('/notifications')
                    ? 'text-white bg-surface-50 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-surface-50/50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-slate-400" /> Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-brand-500 text-white leading-none">
                    {unreadCount}
                  </span>
                )}
              </Link>
              <div className="pt-2 mt-2 border-t border-surface-border">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-2 rounded-lg w-full text-left transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </>
          )}
          {!isAuthenticated && (
            <div className="flex gap-2 pt-3 border-t border-surface-border">
              <Link to="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" size="sm" className="w-full">
                  Log In
                </Button>
              </Link>
              <Link to="/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full">
                  Join
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
