import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/authApi';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import {
  Lock,
  Mail,
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  Smartphone,
  KeyRound,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

const MSG91_WIDGET_ID = '36696c703751313130363936';
const MSG91_TOKEN_AUTH = '570604TgXYKOeyu6aa58512P1';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithOtp, loginViaWidget, isLoading: authLoading } = useAuth();

  // Authentication Mode: 'mobile' | 'email'
  const [authMode, setAuthMode] = useState('mobile');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mobile OTP state
  const [mobileNumber, setMobileNumber] = useState('');
  const [otpStep, setOtpStep] = useState('input_phone'); // 'input_phone' | 'input_otp'
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Refs for 6-digit OTP inputs
  const otpInputRefs = useRef([]);

  // On-demand loader for MSG91 Official SendOTP Widget Script (only when user clicks the popup button)
  const loadWidgetScript = () => {
    return new Promise((resolve) => {
      if (window.initSendOTP) return resolve(true);
      if (document.getElementById('msg91-otp-script')) {
        let attempts = 0;
        const check = setInterval(() => {
          attempts++;
          if (window.initSendOTP || attempts > 20) {
            clearInterval(check);
            resolve(!!window.initSendOTP);
          }
        }, 100);
        return;
      }

      const s = document.createElement('script');
      s.id = 'msg91-otp-script';
      s.src = 'https://verify.msg91.com/otp-provider.js';
      s.type = 'text/javascript';
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
  };

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Handle Email & Password Submit
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const result = await login({ email, password });
    if (result.success) {
      navigate('/');
    } else {
      setErrorMessage(
        result.error || 'Authentication failed. Please verify your government portal credentials.'
      );
    }
  };

  // Launch Official MSG91 Widget Popup
  const handleLaunchMsg91Widget = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (typeof window.initSendOTP !== 'function') {
      setSuccessMessage('Loading MSG91 Widget...');
      const loaded = await loadWidgetScript();
      setSuccessMessage('');
      if (!loaded || typeof window.initSendOTP !== 'function') {
        setErrorMessage(
          'MSG91 Widget script is unavailable or blocked in this browser network. Please use the In-Page Verification form.'
        );
        return;
      }
    }

    const cleanMobile = mobileNumber.replace(/[^\d]/g, '');
    const identifier = cleanMobile ? (cleanMobile.startsWith('91') ? cleanMobile : '91' + cleanMobile) : undefined;

    const configuration = {
      widgetId: MSG91_WIDGET_ID,
      tokenAuth: MSG91_TOKEN_AUTH,
      identifier: identifier,
      exposeMethods: false,
      success: async (data) => {
        console.log('[MSG91 Widget Success]', data);
        try {
          const res = await loginViaWidget({
            mobile: cleanMobile || '7203045055',
            widgetData: data,
          });
          if (res.success) {
            navigate('/');
          }
        } catch (err) {
          setErrorMessage(err.message || 'MSG91 Widget authentication failed.');
        }
      },
      failure: (error) => {
        console.log('[MSG91 Widget Failure]', error);
        const rawErr = typeof error === 'string' ? error : error?.message;
        const errCode = error?.code || '';
        if (rawErr === 'IPBlocked' || String(errCode) === '408' || rawErr?.includes?.('IPBlocked')) {
          setErrorMessage(
            'MSG91 Widget blocked client browser IP (Error 408: IPBlocked). Your client internet IP is restricted in your MSG91 security settings. Please use the In-Page Verification form below (works 100% via backend).'
          );
        } else if (rawErr === 'AuthenticationFailure' || rawErr?.includes?.('AuthenticationFailure')) {
          setErrorMessage(
            'MSG91 Widget Authentication Failure. Please use the In-Page Verification form below (Test Code: 123456).'
          );
        } else {
          setErrorMessage(rawErr || 'MSG91 Widget closed or cancelled.');
        }
      },
    };

    try {
      window.initSendOTP(configuration);
    } catch (err) {
      console.warn('[MSG91 init error]', err);
      setErrorMessage('Failed to initialize MSG91 Widget. Please use the in-page form below.');
    }
  };

  // Handle Send Mobile OTP (In-Page)
  const handleSendOtp = async (e) => {
    e?.preventDefault?.();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanMobile = mobileNumber.replace(/[^\d]/g, '');
    if (cleanMobile.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    try {
      setIsSendingOtp(true);
      const res = await authApi.sendMobileOtp(cleanMobile);
      const data = res?.data || res;

      setOtpStep('input_otp');
      setResendCountdown(30);
      setSuccessMessage(data.message || `OTP dispatched successfully to +91 ${cleanMobile}`);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to dispatch OTP. Please check the mobile number.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP digit change & auto-advance
  const handleOtpDigitChange = (index, value) => {
    if (value.length > 1) {
      const pasted = value.replace(/[^\d]/g, '').slice(0, 6);
      if (pasted) {
        const nextDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          nextDigits[i] = pasted[i] || '';
        }
        setOtpDigits(nextDigits);
        const focusIdx = Math.min(pasted.length, 5);
        otpInputRefs.current[focusIdx]?.focus();
        return;
      }
    }

    const digit = value.replace(/[^\d]/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key in OTP digits
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // Handle Verify Mobile OTP Submit
  const handleVerifyOtp = async (e) => {
    e?.preventDefault?.();
    setErrorMessage('');
    setSuccessMessage('');

    const otpCode = otpDigits.join('');
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const cleanMobile = mobileNumber.replace(/[^\d]/g, '');
      const result = await loginWithOtp({ mobile: cleanMobile, otp: otpCode });
      if (result.success) {
        navigate('/');
      } else {
        setErrorMessage(result.error || 'Invalid OTP. Please enter 123456 or check your SMS.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isResendingOtp) return;
    setErrorMessage('');
    setSuccessMessage('');

    try {
      setIsResendingOtp(true);
      const cleanMobile = mobileNumber.replace(/[^\d]/g, '');
      const res = await authApi.resendMobileOtp(cleanMobile);
      const data = res?.data || res;

      setResendCountdown(30);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMessage(data.message || 'Fresh OTP code has been dispatched.');
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend OTP. Please try again later.');
    } finally {
      setIsResendingOtp(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3.5 sm:p-6 bg-slate-50 dark:bg-slate-950 transition-colors relative">
      {/* Top Tricolor Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 shadow-xs fixed top-0 left-0 z-10" />

      <div className="w-full max-w-md flex flex-col gap-4 sm:gap-5 my-auto">
        {/* National Header Branding */}
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-slate-950 to-blue-950 border-2 border-amber-500 flex items-center justify-center text-white mb-2.5 sm:mb-3 shadow-md shrink-0">
            <Building2 size={24} className="text-white sm:hidden" />
            <Building2 size={28} className="text-white hidden sm:block" />
          </div>

          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
            Government of India
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight">
            Project Monitoring Platform
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm px-2 leading-relaxed">
            Centralized National Infrastructure Surveillance & Milestone Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-7 flex flex-col gap-4 transition-colors">
          {/* Segmented Auth Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setAuthMode('mobile');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                authMode === 'mobile'
                  ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone size={14} />
              <span>Mobile OTP </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('email');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                authMode === 'email'
                  ? 'bg-white dark:bg-slate-900 text-blue-900 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Mail size={14} />
              <span>Official Email</span>
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs leading-relaxed flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MODE 1: MOBILE OTP AUTHENTICATION */}
          {authMode === 'mobile' && (
            /*<div className="flex flex-col gap-4">
              otpStep === 'input_phone' ? (
                /* Step 1: Phone Input 
                <form onSubmit={handleSendOtp} className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Registered Mobile Number *
                    </label>
                    <div className="flex items-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all overflow-hidden">
                      <div className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 select-none">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 7203045055"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/[^\d]/g, ''))}
                        className="w-full px-3 py-2.5 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none tracking-wider font-mono font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSendingOtp}
                    disabled={isSendingOtp || mobileNumber.length < 10}
                    className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 sm:py-3 rounded-lg shadow-sm transition-all text-sm sm:text-base cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Send Verification Code</span>
                  </Button>
                </form>
              ) : (
                /* Step 2: 6-Digit OTP Verification 
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Enter Verification Code
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Sent to <strong className="text-slate-800 dark:text-slate-200">+91 {mobileNumber}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep('input_phone');
                        setOtpDigits(['', '', '', '', '', '']);
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft size={12} />
                      <span>Change Number</span>
                    </button>
                  </div>

                  {/* 6 Digit Input Boxes 
                  <div className="flex justify-between gap-1.5 sm:gap-2">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-10 sm:w-12 h-12 text-center text-lg sm:text-xl font-bold font-mono bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    ))}
                  </div>

                  {/* Test Mode Quick Auto-Fill Helper 
                  <div className="p-2 sm:p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-medium text-[11px] sm:text-xs">
                      <KeyRound size={14} className="shrink-0 text-blue-700 dark:text-blue-400" />
                      <span>Test Code: <strong className="font-mono font-bold bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">123456</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const testDigits = ['1', '2', '3', '4', '5', '6'];
                        setOtpDigits(testDigits);
                        otpInputRefs.current[5]?.focus();
                      }}
                      className="px-2.5 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-md font-bold text-[11px] cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      Auto-Fill Test Code
                    </button>
                  </div>

                  {/* Resend OTP & Countdown 
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 dark:text-slate-400">Didn't receive SMS?</span>
                    {resendCountdown > 0 ? (
                      <span className="text-slate-400 dark:text-slate-500 font-mono font-medium">
                        Resend in {resendCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isResendingOtp}
                        className="font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={12} className={isResendingOtp ? 'animate-spin' : ''} />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isVerifyingOtp || authLoading}
                    disabled={otpDigits.join('').length !== 6 || isVerifyingOtp}
                    className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 sm:py-3 rounded-lg shadow-sm transition-all text-sm sm:text-base cursor-pointer"
                  >
                    Verify & Authenticate
                  </Button>
                </form>
              )} */

             
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleLaunchMsg91Widget}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <ExternalLink size={13} />
                  <span>Click Here To Get Otp</span>
                </button>
                {/* <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-tight">
                  * Note: Popup widget requires client IP whitelisted in MSG91 (otherwise Error 408 IPBlocked occurs). In-page form above connects directly.
                </p> */}
              </div>
            )}

          {/* MODE 2: EMAIL & PASSWORD AUTHENTICATION */}
          {authMode === 'email' && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <Input
                label="Official Government Email ID"
                type="email"
                icon={Mail}
                placeholder="e.g. admin@gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Secure Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer flex items-center p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={authLoading}
                className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 sm:py-3 rounded-lg shadow-sm transition-all text-sm sm:text-base cursor-pointer"
              >
                Authenticate & Access Dashboard
              </Button>
            </form>
          )}

          {/* Security Footnote */}
          <div className="flex items-start sm:items-center gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck size={16} className="text-blue-700 dark:text-blue-400 shrink-0 mt-0.5 sm:mt-0" />
            <span className="leading-snug">
              Secured by 256-bit TLS encryption & TRAI DLT Compliant MSG91 SendOTP Service. Access restricted to authorized project nodal officers.
            </span>
          </div>

          {/* Link to Register */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
            Don't have an official account?{' '}
            <Link
              to="/register"
              className="font-bold text-blue-700 dark:text-blue-400 hover:underline"
            >
              Register Nodal Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
