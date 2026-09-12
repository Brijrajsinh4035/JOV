import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import { Lock, Mail, Building2, Eye, EyeOff, ShieldCheck } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const result = await login({ email, password });
    if (result.success) {
      navigate('/');
    } else {
      setErrorMessage(
        result.error || 'Authentication failed. Please verify your government portal credentials.'
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3.5 sm:p-6 bg-slate-50 relative">
      {/* Top Tricolor Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 shadow-xs fixed top-0 left-0 z-10" />

      <div className="w-full max-w-md flex flex-col gap-4 sm:gap-5 my-auto">
        {/* National Header Branding */}
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-slate-950 to-blue-950 border-2 border-amber-500 flex items-center justify-center text-white mb-2.5 sm:mb-3 shadow-md shrink-0">
            <Building2 size={24} className="text-white sm:hidden" />
            <Building2 size={28} className="text-white hidden sm:block" />
          </div>

          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600">
            Government of India
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
            Project Monitoring Platform
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm px-2 leading-relaxed">
            Centralized National Infrastructure Surveillance & Milestone Management
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-7 flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed">
                {errorMessage}
              </div>
            )}

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
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex items-center p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
            />

            <div className="flex items-start sm:items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
              <ShieldCheck size={16} className="text-blue-700 shrink-0 mt-0.5 sm:mt-0" />
              <span className="leading-snug">
                Secured by 256-bit TLS encryption. Access restricted to authorized national project nodal officers.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 sm:py-3 rounded-lg shadow-sm transition-all text-sm sm:text-base cursor-pointer"
            >
              Authenticate & Access Dashboard
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
