import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LoadingState } from './components/common/LoadingState';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Discover } from './pages/Discover';
import { Developers } from './pages/Developers';
import { Profile } from './pages/Profile';
import { ProfileEdit } from './pages/ProfileEdit';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProjectEditor } from './pages/ProjectEditor';
import { Blogs } from './pages/Blogs';
import { BlogDetail } from './pages/BlogDetail';
import { BlogManage } from './pages/BlogManage';
import { BlogEditor } from './pages/BlogEditor';
import { Connections } from './pages/Connections';
import { Notifications } from './pages/Notifications';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState message="Authenticating session..." className="min-h-[70vh]" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const CurrentUserProfileRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <LoadingState message="Loading profile..." />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={`/profile/${user.username}`} replace />;
};

export const App: React.FC = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-slate-100 selection:bg-brand-500 selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/developers" element={<Developers />} />
          <Route path="/developers/:username" element={<Profile />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/publications" element={<Blogs />} />
          <Route path="/blogs/:id" element={<BlogDetail />} />
          <Route path="/publications/:id" element={<BlogDetail />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />

          {/* Authenticated Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<CurrentUserProfileRedirect />} />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/new"
            element={
              <ProtectedRoute>
                <ProjectEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/create"
            element={
              <ProtectedRoute>
                <ProjectEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id/edit"
            element={
              <ProtectedRoute>
                <ProjectEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blogs/manage"
            element={
              <ProtectedRoute>
                <BlogManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blogs/new"
            element={
              <ProtectedRoute>
                <BlogEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/publications/new"
            element={
              <ProtectedRoute>
                <BlogEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blogs/:id/edit"
            element={
              <ProtectedRoute>
                <BlogEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/publications/:id/edit"
            element={
              <ProtectedRoute>
                <BlogEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <Connections />
              </ProtectedRoute>
            }
          />
          <Route
            path="/network"
            element={
              <ProtectedRoute>
                <Connections />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};
