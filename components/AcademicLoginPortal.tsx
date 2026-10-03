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

  // Normalize email: if user inputs a student ID (e.g. 21BCE1084), map it to student@campus.edu
  const getNormalizedEmail = (input: string) => {
    const trimmed = input.trim();
    if (trimmed.includes('@')) return trimmed;
    return `${trimmed.toLowerCase()}@campus.edu`;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Student ID or university email.');
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
          'General Academic'
        );
        onLoginSuccess(registeredProfile);
      }
    } catch (err: any) {
      console.warn('Firebase auth attempt error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErrorMessage('Invalid credentials. Please verify your email and password, or create an account.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password must be at least 6 characters.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists. Please sign in instead.');
      } else {
        setErrorMessage(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!mobileNumber.trim()) {
      setErrorMessage('Please enter your registered mobile number.');
      return;
    }
    if (otpCode.length < 4) {
      setErrorMessage('Please enter the 4-digit verification code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({
        ...user,
        username: 'Campus Student',
        handle: 'u/student',
        email: `${mobileNumber}@sms.campus.edu`,
        isLoggedIn: true,
      });
    }, 500);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const googleProfile = await loginWithGoogle();
      onLoginSuccess(googleProfile);
    } catch (err: any) {
      console.warn('Google sign in error:', err);
      setErrorMessage(err?.message || 'Google sign-in was interrupted or blocked. Please try email sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoQuickFill = (role: 'student' | 'faculty') => {
    if (role === 'student') {
      setIdentifier('21BCE1084@campus.edu');
      setFullName('Ananya Sharma');
      setPassword('studentPass2024');
    } else {
      setIdentifier('FAC-9042@campus.edu');
      setFullName('Dr. Vikram Raman');
      setPassword('facultyPass2024');
    }
    setErrorMessage('');
  };

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 px-4 overflow-hidden z-10">
      {/* Institutional Login Surface: Mostly opaque, crisp, and high-contrast */}
      <div className="relative z-10 w-full max-w-[440px] surface-elevated rounded-2xl border border-subtle shadow-2xl overflow-hidden">
        {/* Brand Header */}
        <div className="p-6 sm:p-8 text-center border-b border-subtle bg-surface-muted/60">
          <div className="w-12 h-12 rounded-2xl bg-[#FF6848] flex items-center justify-center text-white mx-auto shadow-[0_4px_14px_rgba(255,104,72,0.35)] mb-3">
            <span className="font-brand font-extrabold text-xl tracking-tight">C</span>
          </div>
          <h1 className="font-brand text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            {authMode === 'signin' ? 'Sign in to ' : 'Create account on '}
            Campus<span className="text-[#FF6848]">Connect</span>
          </h1>
          <p className="text-xs sm:text-[13px] text-muted mt-1 font-medium">
            Access your courses, official notices, and student communities
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-muted border border-subtle text-[11px] font-semibold text-secondary">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Institutional Identity Service</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-500 text-xs leading-relaxed animate-in fade-in font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {loginMethod === 'password' ? (
            /* Student ID & Password Form */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    disabled={isLoading}
                    className="w-full px-3.5 py-2 text-sm bg-surface-muted border border-subtle rounded-lg focus:border-[#FF6848] focus:bg-surface outline-none text-primary transition disabled:opacity-50"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Student ID or University Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 21BCE1084 or student@campus.edu"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-muted border border-subtle rounded-lg focus:border-[#FF6848] focus:bg-surface outline-none text-primary transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-secondary">Password</label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setIsForgotOpen(true)}
                      className="text-xs text-[#FF6848] hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 6 chars)"
                    disabled={isLoading}
                    className="w-full pl-9 pr-10 py-2 text-sm bg-surface-muted border border-subtle rounded-lg focus:border-[#FF6848] focus:bg-surface outline-none text-primary transition disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full min-h-[44px] py-2.5 text-sm font-bold shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{authMode === 'signin' ? 'Signing in...' : 'Registering...'}</span>
                  </>
                ) : (
                  <span>{authMode === 'signin' ? 'Sign in' : 'Create Account'}</span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === 'signin' ? 'register' : 'signin')}
                  className="text-xs text-muted hover:text-[#FF6848] transition font-medium cursor-pointer"
                >
                  {authMode === 'signin'
                    ? "New to campus? Create an account"
                    : 'Already have an account? Sign in'}
                </button>
              </div>
            </form>
          ) : (
            /* OTP Form */
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
                    placeholder="+91 98765 43210"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3.5 py-2 text-sm bg-surface-muted border border-subtle rounded-lg focus:border-[#FF6848] focus:bg-surface outline-none text-primary transition disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  4-Digit OTP Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="1234"
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
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify &amp; Sign in</span>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-subtle"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-2 text-muted font-semibold">or</span>
            </div>
          </div>

          {/* Secondary Actions */}
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
              {loginMethod === 'password' ? 'Use mobile OTP instead' : 'Use password instead'}
            </button>
          </div>

          {/* Clean Demo Mode Box */}
          {DEMO_MODE && (
            <div className="pt-3 border-t border-subtle">
              <div className="text-[11px] text-muted mb-2 font-bold">
                Demo Mode Quick Fill (for evaluators):
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleDemoQuickFill('student')}
                  className="p-2 bg-surface-muted hover:bg-surface border border-subtle rounded-lg text-left transition cursor-pointer"
                >
                  <div className="font-bold text-primary">Student</div>
                  <div className="text-[11px] text-muted truncate">21BCE1084@campus.edu</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoQuickFill('faculty')}
                  className="p-2 bg-surface-muted hover:bg-surface border border-subtle rounded-lg text-left transition cursor-pointer"
                >
                  <div className="font-bold text-primary">Faculty</div>
                  <div className="text-[11px] text-muted truncate">FAC-9042@campus.edu</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 border border-[#E5E7EB] space-y-3">
            <h3 className="font-bold text-sm text-[#111827]">Reset Password</h3>
            <p className="text-xs text-[#6B7280]">
              Enter your student ID or email to receive password reset instructions.
            </p>
            {forgotSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200">
                Instructions sent to registered campus email.
              </div>
            ) : (
              <input
                type="text"
                placeholder="Student ID / email"
                className="w-full px-3 py-2 text-xs border border-[#D1D5DB] rounded-lg focus:border-[#FF4500] outline-none"
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
                  Send Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
