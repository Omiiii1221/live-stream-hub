import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radio, Mail, Lock, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>(
    (searchParams.get('mode') as 'login' | 'register') || 'login'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
      } else {
        await register(email, password, username, role);
        toast({
          title: 'Account created!',
          description: 'Welcome to Streamify.',
        });
      }
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 group">
            <Radio className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold gradient-text">Streamify</span>
          </Link>

          <h1 className="text-3xl font-bold mb-2">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {mode === 'login'
              ? 'Enter your credentials to access your account'
              : 'Join the community and start streaming'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-3">
                <Label>I want to...</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('viewer')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      role === 'viewer'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">👀</div>
                    <div className="font-medium">Watch Streams</div>
                    <div className="text-xs text-muted-foreground">Join as a viewer</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('host')}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      role === 'host'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="text-2xl mb-2">📡</div>
                    <div className="font-medium">Go Live</div>
                    <div className="text-xs text-muted-foreground">Stream content</div>
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Loading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-primary hover:underline font-medium"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </motion.div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary/5 via-background to-purple-600/10 border-l border-border/40 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="relative z-10 text-center px-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <div className="live-badge">LIVE</div>
            <span className="text-sm">1,247 watching now</span>
          </div>
          
          <h2 className="text-4xl font-bold mb-4">
            Stream. Watch.
            <br />
            <span className="gradient-text">Connect.</span>
          </h2>
          
          <p className="text-muted-foreground max-w-sm mx-auto">
            Join thousands of creators and viewers in real-time streaming experiences.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
