import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Mail, Lock, User, AtSign, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const { success, error } = useToast();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof fieldErrors = {};

    if (!name.trim()) errors.name = 'Full name is required';
    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username.trim())) {
      errors.username = 'Letters, numbers, underscores and hyphens only';
    }
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    if (!password || password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    try {
      setIsLoading(true);
      await register({
        name: name.trim(),
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password,
      });
      success('Welcome to DevConnect!', 'Your account has been created.');
      navigate('/dashboard');
    } catch (err: any) {
      error('Registration failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 items-center justify-center text-white shadow-lg shadow-brand-600/30 mb-2">
            <Code2 className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Join DevConnect</h2>
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <Card className="p-6 sm:p-7 border-surface-border bg-surface-200 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="Ada Lovelace"
              leftIcon={<User className="w-4 h-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={fieldErrors.name}
              disabled={isLoading}
            />

            <Input
              label="Username"
              type="text"
              placeholder="adalovelace"
              leftIcon={<AtSign className="w-4 h-4" />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={fieldErrors.username}
              helperText="Unique developer handle for your portfolio URL"
              disabled={isLoading}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="ada@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              disabled={isLoading}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              helperText="Must be at least 6 characters"
              disabled={isLoading}
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={fieldErrors.confirmPassword}
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Account
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
