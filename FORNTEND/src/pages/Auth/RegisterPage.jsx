import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import {
  Lock,
  Mail,
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Briefcase,
  Shield,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    designation: '',
    role: 'manager', // Default Manager
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Ensure email and password fields start blank and are not populated by browser autofill
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      email: '',
      password: '',
      confirmPassword: '',
    }));

    const timer = setTimeout(() => {
      setFormData((prev) => ({
        ...prev,
        email: '',
        password: '',
        confirmPassword: '',
      }));
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Please provide your full official name.');
      return;
    }

    if (!formData.email.trim()) {
      setErrorMessage('Please provide an official email ID.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      department: formData.department.trim() || 'Central Infrastructure Wing',
      designation: formData.designation.trim() || 'Project Monitoring Officer',
      role: 'manager',
      password: formData.password,
    };

    const result = await register(payload);
    if (result.success) {
      navigate('/');
    } else {
      setErrorMessage(
        result.error || 'Registration could not be completed. Please try again or verify your details.'
      );
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-3.5 sm:p-6 bg-slate-50 dark:bg-slate-950 transition-colors relative py-10">
      {/* Top Tricolor Ribbon */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 shadow-xs fixed top-0 left-0 z-10" />

      <div className="w-full max-w-xl flex flex-col gap-4 sm:gap-5 my-auto">
        {/* Top Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={15} />
            <span>Back to Login</span>
          </Link>
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Nodal Registration
          </span>
        </div>

        {/* National Header Branding */}
        <div className="text-center flex flex-col items-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-slate-950 to-blue-950 border-2 border-amber-500 flex items-center justify-center text-white mb-2 shadow-md shrink-0">
            <Building2 size={24} className="text-white sm:hidden" />
            <Building2 size={28} className="text-white hidden sm:block" />
          </div>

          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">
            Government of India • PMIS
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 tracking-tight">
            Officer Registration Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md px-2 leading-relaxed">
            Register authorized nodal officer credentials for the Integrated Project Monitoring & Surveillance Platform.
          </p>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-7 flex flex-col gap-4 transition-colors">
          <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
            {/* Decoy inputs to absorb browser password autofill */}
            <input
              type="text"
              name="prevent_browser_autofill_email"
              id="prevent_browser_autofill_email"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
            />
            <input
              type="password"
              name="prevent_browser_autofill_password"
              id="prevent_browser_autofill_password"
              tabIndex={-1}
              aria-hidden="true"
              autoComplete="off"
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
            />

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs leading-relaxed">
                {errorMessage}
              </div>
            )}

            {/* Officer Name & Email Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Official Name"
                type="text"
                icon={User}
                placeholder="e.g. Er. Pooja Sharma"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />

              <Input
                id="reg-gov-email"
                name="reg_portal_gov_email"
                label="Government Email ID"
                type="email"
                icon={Mail}
                placeholder="e.g. pooja.sharma@gov.in"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
                required
              />
            </div>

            {/* Department & Designation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ministry / Department"
                type="text"
                icon={Building2}
                placeholder="e.g. Ministry of Railways"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                required
              />

              <Input
                label="Official Designation"
                type="text"
                icon={Briefcase}
                placeholder="e.g. Executive Director"
                value={formData.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                required
              />
            </div>

            {/* Password & Confirm Password Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="reg-secure-password"
                name="reg_portal_secure_password"
                label="Secure Password"
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
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

              <Input
                id="reg-confirm-password"
                name="reg_portal_confirm_password"
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer flex items-center p-1"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                required
              />
            </div>

            {/* Register Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2.5 sm:py-3 rounded-lg shadow-sm transition-all text-sm sm:text-base cursor-pointer"
            >
              Register Nodal Officer Account
            </Button>

            {/* Switch to Login */}
            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
              Already have an active government account?{' '}
              <Link
                to="/login"
                className="font-bold text-blue-700 dark:text-blue-400 hover:underline"
              >
                Authenticate Here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
