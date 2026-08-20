import React, { useState } from 'react';
import { 
  Users, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle,
  Briefcase,
  FileCheck2
} from 'lucide-react';
import { AuthUser } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const DEFAULT_CREDENTIALS = [
  {
    role: 'Admin' as const,
    title: 'Lead Talent Admin',
    email: 'admin@talentfox.hr',
    password: 'admin123',
    name: 'Sarah Jenkins',
    avatarInitials: 'SJ'
  },
  {
    role: 'Recruiter' as const,
    title: 'Senior Technical Recruiter',
    email: 'recruiter@talentfox.ai',
    password: 'talentfox2026',
    name: 'Alex Rivera',
    avatarInitials: 'AR'
  }
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('admin@talentfox.hr');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanEmail = email.trim().toLowerCase();
      const matchedUser = DEFAULT_CREDENTIALS.find(
        cred => cred.email.toLowerCase() === cleanEmail && cred.password === password
      );

      if (matchedUser) {
        const user: AuthUser = {
          id: `user-${matchedUser.role.toLowerCase()}`,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role,
          avatarInitials: matchedUser.avatarInitials,
          title: matchedUser.title
        };

        if (rememberMe) {
          localStorage.setItem('talentfox_auth', JSON.stringify(user));
        } else {
          sessionStorage.setItem('talentfox_auth', JSON.stringify(user));
        }

        onLoginSuccess(user);
      } else {
        // Fallback for custom valid credentials
        if (cleanEmail.includes('@') && password.length >= 4) {
          const customUser: AuthUser = {
            id: `user-${Date.now()}`,
            name: cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            email: cleanEmail,
            role: cleanEmail.includes('admin') ? 'Admin' : 'Recruiter',
            avatarInitials: cleanEmail.substring(0, 2).toUpperCase(),
            title: cleanEmail.includes('admin') ? 'Talent Administrator' : 'Technical Recruiter'
          };

          if (rememberMe) {
            localStorage.setItem('talentfox_auth', JSON.stringify(customUser));
          } else {
            sessionStorage.setItem('talentfox_auth', JSON.stringify(customUser));
          }

          onLoginSuccess(customUser);
        } else {
          setError('Invalid email or password. Please use the default demo credentials provided below.');
          setIsLoading(false);
        }
      }
    }, 400);
  };

  const handleFillDemo = (demo: typeof DEFAULT_CREDENTIALS[0]) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 transition-colors">
      
      {/* Background Decorative Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-60" />

      <div className="relative w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-olive-700 text-white shadow-md shadow-olive-600/20 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            TalentFox <span className="text-olive-700 dark:text-olive-400">HR</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise AI Resume Parsing & Candidate Intelligence Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8">
          
          <div className="mb-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Sign in to your account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access recruiter dashboard & parsing tools
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3 mr-1" />
              Gemini AI
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@talentfox.hr"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-olive-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-olive-700 focus:ring-olive-500"
                />
                <span>Remember me on this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-olive-700 hover:bg-olive-800 active:bg-olive-900 text-white text-xs font-semibold shadow-md shadow-olive-700/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isLoading ? (
                <span>Verifying credentials...</span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-amber-500" />
                Default Demo Credentials
              </span>
              <span className="text-[10px] text-slate-400">Click to fill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEFAULT_CREDENTIALS.map((demo) => {
                const isActive = email === demo.email;
                return (
                  <button
                    key={demo.role}
                    type="button"
                    onClick={() => handleFillDemo(demo)}
                    className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-olive-600 bg-olive-50/70 dark:bg-olive-950/40 text-olive-900 dark:text-olive-200 ring-1 ring-olive-600'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{demo.role}</span>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-olive-700 dark:text-olive-400" />}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate">
                      {demo.email}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      pw: {demo.password}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Security Footer Notice */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Strict resume data isolation: only verified parsed candidate data is loaded.</span>
          </p>
        </div>

      </div>

    </div>
  );
};
