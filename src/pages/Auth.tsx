import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase, SUPABASE_URL } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AuthView = 'login' | 'signup' | 'forgot' | 'reset';

const Auth = () => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUserRole = async (userId: string) => {
      try {
        const { data: profile, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          console.log('No profile found, defaulting to home page');
          navigate('/');
          return;
        }

        if (profile?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.log('Error checking user role:', error);
        navigate('/');
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === 'PASSWORD_RECOVERY') {
          // User clicked the reset link in their email — show the reset form
          setView('reset');
          return;
        }

        if (session?.user && event === 'SIGNED_IN') {
          await checkUserRole(session.user.id);
        } else if (session?.user && event !== 'SIGNED_OUT') {
          await checkUserRole(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await checkUserRole(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // ── Login / Sign-up ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    console.log('Auth request starting - using Supabase URL:', SUPABASE_URL);

    try {
      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          console.error('Login error:', error);
          toast({
            title: 'Login Failed',
            description: error.message.includes('Invalid login credentials')
              ? "Invalid email or password. Please check your credentials and try again. If you don't have an account, please create one first."
              : error.message,
            variant: 'destructive',
          });
          return;
        }

        toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
      } else {
        // Sign up
        if (password.length < 6) {
          toast({
            title: 'Password Too Short',
            description: 'Password must be at least 6 characters long.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });

        if (error) {
          toast({
            title: error.message.includes('User already registered') ? 'Account Exists' : 'Sign Up Failed',
            description: error.message.includes('User already registered')
              ? 'An account with this email already exists. Please try logging in instead.'
              : error.message,
            variant: 'destructive',
          });
          return;
        }

        if (data.user && !data.session) {
          toast({ title: 'Account Created!', description: 'Please check your email to verify your account.' });
        } else if (data.session) {
          toast({ title: 'Account Created!', description: 'You have been automatically signed in.' });

          if (data.user) {
            try {
              await supabase.from('profiles').insert({
                user_id: data.user.id,
                full_name: fullName || '',
                company_name: '',
                role: 'user',
              });
            } catch (profileError) {
              console.error('Error creating profile manually:', profileError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({ title: 'Error', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Forgot password ────────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }

      setForgotSent(true);
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Reset password (after clicking email link) ─────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please make sure both passwords are the same.', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Password Too Short', description: 'Password must be at least 6 characters long.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({ title: 'Reset Failed', description: error.message, variant: 'destructive' });
        setLoading(false);
        return;
      }

      toast({ title: 'Password Updated!', description: 'Your password has been changed. You are now logged in.' });
      // Hard redirect to clear any stale auth state from the recovery flow
      setTimeout(() => { window.location.href = '/'; }, 1000);
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const cardMeta = {
    login:  { title: 'Welcome Back',      desc: 'Sign in to your TablePilot account' },
    signup: { title: 'Create Account',    desc: 'Join TablePilot to manage your bookings' },
    forgot: { title: 'Forgot Password',   desc: 'Enter your email and we\'ll send a reset link' },
    reset:  { title: 'Set New Password',  desc: 'Choose a new password for your account' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {cardMeta[view].title}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {cardMeta[view].desc}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* ── Forgot password sent confirmation ── */}
            {view === 'forgot' && forgotSent ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-gray-700 font-medium">Check your inbox!</p>
                <p className="text-sm text-gray-500">
                  We've sent a password reset link to <strong>{email}</strong>. Follow the link in the email to set a new password.
                </p>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => { setView('login'); setForgotSent(false); setEmail(''); }}
                >
                  Back to Sign In
                </Button>
              </div>
            ) : view === 'forgot' ? (
              /* ── Forgot password form ── */
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </Button>

                <button
                  type="button"
                  onClick={() => { setView('login'); setEmail(''); }}
                  className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Sign In
                </button>
              </form>
            ) : view === 'reset' ? (
              /* ── Reset password form ── */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
                  {loading ? 'Updating…' : 'Set New Password'}
                </Button>
              </form>
            ) : (
              /* ── Login / Sign-up form ── */
              <form onSubmit={handleSubmit} className="space-y-4">
                {view === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => { setView('forgot'); setPassword(''); }}
                        className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700" disabled={loading}>
                  {loading ? 'Please wait…' : view === 'login' ? 'Sign In' : 'Create Account'}
                </Button>

                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setView(view === 'login' ? 'signup' : 'login');
                      setEmail('');
                      setPassword('');
                      setFullName('');
                    }}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    {view === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
