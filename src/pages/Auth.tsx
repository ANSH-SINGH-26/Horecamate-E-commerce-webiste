import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/auth';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  
  const { fetchProfile } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
      }
      
      await fetchProfile();
      navigate(redirect);
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 relative overflow-hidden">
      {/* Decorative background blocks */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-red-600 border-4 border-black -translate-x-1/2 -translate-y-1/2 rotate-12"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-black border-4 border-red-600 translate-x-1/3 translate-y-1/3 -rotate-12"></div>

      <div className="max-w-md w-full space-y-8 bg-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(220,38,38,1)] relative z-10">
        <div className="border-b-4 border-black pb-6">
          <h2 className="text-center text-3xl font-black text-black uppercase tracking-widest">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h2>
          <p className="text-center text-sm font-bold text-zinc-500 mt-2 uppercase tracking-wide">
             {isLogin ? 'Welcome back to your account' : 'Create an account to continue'}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Full Name</label>
                <Input 
                  required 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="JOHN DOE"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Email address</label>
              <Input 
                required 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="BUSINESS EMAIL"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-black uppercase tracking-widest mb-2">Password</label>
              <Input 
                required 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          </div>

          {error && <div className="text-white text-sm font-bold text-center bg-red-600 p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase tracking-wider">{error}</div>}

          <div>
            <Button type="submit" className="w-full h-14 text-lg" isLoading={isLoading}>
              {isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </Button>
          </div>
          
          <div className="text-center pt-6 border-t-2 border-zinc-100">
            <button
              type="button"
              className="text-xs font-black text-black hover:text-red-600 transition-colors uppercase tracking-widest border-b-2 border-transparent hover:border-red-600 pb-1"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
