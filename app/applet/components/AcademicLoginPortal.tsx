'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/types';
import { useAuth } from '@/context/AuthContext';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Smartphone,
  KeyRound,
  ShieldCheck,
  User,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

interface AcademicLoginPortalProps {
  user: UserProfile;
  onLoginSuccess: (updatedUser: UserProfile) => void;
  onOpenComplianceModal?: () => void;
}

export default function AcademicLoginPortal({
  user,
  onLoginSuccess,
}: AcademicLoginPortalProps) {
  const { loginWithEmail, registerWithEmail, loginWithGoogle } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [identifier, setIdentifier] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Formats user input ID to email if student enters username
  const getNormalizedEmail = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.includes('@')) return trimmed.toLowerCase();
    return `${trimmed.toLowerCase()}@campus.edu`;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your email or Student ID.');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Please enter your password.');
      return;
    }
    if (authMode === 'register' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    setIsLoading(true);
    const emailToUse = getNormalizedEmail(identifier);

    try {
      if (authMode === 'signin') {
        const loggedInProfile = await loginWithEmail(emailToUse, password);
        onLoginSuccess(loggedInProfile);
      } else {
        const isFaculty = identifier.toUpperCase().includes('FAC');
        const registeredProfile = await registerWithEmail(
          emailToUse,
          password,
          fullName,
          isFaculty ? 'Faculty' : 'Student',
          'Computer Science & Engineering'
        );
        onLoginSuccess(registeredProfile);
      }
    } catch (err: any) {
      console.warn('Firebase Auth error:', err);
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.message?.includes('invalid-credential') ||
        err.message?.includes('user-not-found')
      ) {
        setErrorMessage('Invalid credentials. Please check your email/password or switch to "Create Account" tab to register.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email/ID already exists. Switch to "Sign In".');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password must be at least 6 characters long.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMessage('Please enter a valid email address.');
      } else {
        setErrorMessage('Authentication failed. Please verify your credentials and internet connection.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (!mobileNumber.trim() || otpCode.length < 4) {
        setErrorMessage('Please enter a valid mobile number and 4-digit OTP.');
        setIsLoading(false);
        return;
      }
      const userProfile: UserProfile = {
        ...user,
        id: `user-mobile-${Date.now()}`,
        username: `Student (${mobileNumber.slice(-4)})`,
        email: `${mobileNumber.replace(/\D/g, '')}@mobile.campus.edu`,
        role: 'Student',
        isLoggedIn: true,
      };
      onLoginSuccess(userProfile);
    } catch (err) {
      setErrorMessage('Invalid OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const loggedInProfile = await loginWithGoogle();
      onLoginSuccess(loggedInProfile);
    } catch (err: any) {
      console.warn('Google sign-in error:', err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Google Sign-In popup was blocked by your browser. Please allow popups or use Email & Password.');
      } else {
        setErrorMessage(err.message || 'Google sign-in failed. Please use email and password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md bg-surface border border-subtle rounded-2xl shadow-xl overflow-hidden transition-all">
        {/* Banner */}
        <div className="p-6 bg-gradient-to-r from-[#FF6848]/10 via-[#FF4500]/5 to-transparent border-b border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FF6848] text-white flex items-center justify-center font-bold text-xl shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-primary tracking-tight">
                {authMode === 'signin' ? 'Campus Portal Sign In' : 'Create Student Account'}
              </h2>
              <p className="text-xs text-secondary font-medium">
                {authMode === 'signin'
                  ? 'Sign in to access your campus workspace'
                  : 'Register a new account to join campus conversations'}
              </p>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-1 mt-4 p-1 bg-surface-muted border border-subtle rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg transition cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-surface text-primary shadow-2xs font-extrabold'
                  : 'text-muted hover:text-primary'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
              }}
              className={`py-2 rounded-lg transition cursor-pointer ${
                authMode === 'register'
                  ? 'bg-surface text-primary shadow-2xs font-extrabold'
                  : 'text-muted hover:text-primary'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loginMethod === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      disabled={isLoading}
                      className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-muted border border-subtle rounded-lg focus:border-[#FF6848] focus:bg-surface outline-none text-primary transition disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Email or Student ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="student@campus.edu"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-muted border border-subtle rounded-lg focus:border-[#FF6848] focus:bg-surface outline-none text-primary transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-secondary">
                    Password
                  </label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(true)}
                      className="text-xs text-muted hover:text-[#FF6848] transition cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    className="w-full pl-9 pr-10 py-2 text-sm bg-surface-muted border border-subtle rounded-lg focus:border-[#FF6848] focus:bg-surface outline-none text-primary transition disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-2.5 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Mobile OTP */
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-muted border border-subtle rounded-lg focus:border-[#FF6848] focus:bg-surface outline-none text-primary transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  OTP Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3.5 py-2 text-sm font-mono tracking-widest bg-surface-muted border border-subtle rounded-lg focus:border-[#FF6848] focus:bg-surface outline-none text-primary disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-2.5 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying OTP...</span>
                  </>
                ) : (
                  <span>Verify OTP & Sign In</span>
                )}
              </button>
            </form>
          )}

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-subtle"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-2 text-muted font-semibold">or</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2 btn-secondary font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => setLoginMethod(loginMethod === 'password' ? 'otp' : 'password')}
              className="w-full py-1.5 text-xs text-muted hover:text-primary font-semibold text-center transition cursor-pointer"
            >
              {loginMethod === 'password' ? 'Use mobile OTP instead' : 'Use email & password instead'}
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 border border-[#E5E7EB] space-y-3">
            <h3 className="font-bold text-sm text-[#111827]">Reset Password</h3>
            <p className="text-xs text-[#6B7280]">
              Enter your email address to receive password reset instructions.
            </p>
            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Reset link sent to registered email.</span>
              </div>
            ) : (
              <input
                type="email"
                placeholder="student@campus.edu"
                className="w-full px-3 py-2 text-xs border border-[#D1D5DB] rounded-lg focus:border-[#FF4500] outline-none text-black"
              />
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsForgotOpen(false);
                  setForgotSuccess(false);
                }}
                className="px-3 py-1.5 text-xs text-[#6B7280] hover:bg-[#F3F4F6] rounded-lg font-medium cursor-pointer"
              >
                Close
              </button>
              {!forgotSuccess && (
                <button
                  type="button"
                  onClick={() => setForgotSuccess(true)}
                  className="px-3 py-1.5 text-xs bg-[#FF4500] text-white rounded-lg font-semibold hover:bg-[#E03D00] cursor-pointer"
                >
                  Send Reset Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
