import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Phone, MapPin, Briefcase, Languages, DollarSign, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'register-guide'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, register } = useAuth();

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regNationality, setRegNationality] = useState('');

  // Guide-specific fields
  const [guideBio, setGuideBio] = useState('');
  const [guideExperience, setGuideExperience] = useState('');
  const [guideLanguages, setGuideLanguages] = useState('');
  const [guideSpecialties, setGuideSpecialties] = useState('');
  const [guideRate, setGuideRate] = useState('');

  const isValidEmail = (value) => {
    const email = value.trim();
    if (!email) return false;
    // Simple email pattern for client-side validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Keep internal mode in sync with the desired initial mode
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const email = loginEmail.trim();
    const password = loginPassword.trim();

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const isGuide = mode === 'register-guide';
    const name = regName.trim();
    const email = regEmail.trim();
    const password = regPassword.trim();

    if (!name) {
      setError('Full name is required.');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const userData = {
      email,
      password,
      name,
      phone: regPhone || undefined,
      nationality: regNationality || undefined,
      role: isGuide ? 'guide' : 'user',
      ...(isGuide && {
        bio: guideBio || undefined,
        experience_years: guideExperience ? parseInt(guideExperience) : undefined,
        languages: guideLanguages || undefined,
        specialties: guideSpecialties || undefined,
        hourly_rate_npr: guideRate ? parseInt(guideRate) : undefined,
      }),
    };

    const result = await register(userData);
    setLoading(false);

    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  const resetForms = () => {
    setLoginEmail('');
    setLoginPassword('');
    setRegEmail('');
    setRegPassword('');
    setRegName('');
    setRegPhone('');
    setRegNationality('');
    setGuideBio('');
    setGuideExperience('');
    setGuideLanguages('');
    setGuideSpecialties('');
    setGuideRate('');
    setError('');
  };

  const switchMode = (newMode) => {
    resetForms();
    setMode(newMode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Join as Guide'}
            </h2>
            <p className="text-gray-400 text-sm">
              {mode === 'login'
                ? 'Sign in to access your personalized travel plans'
                : mode === 'register'
                ? 'Start planning your Nepal adventure'
                : 'Share your expertise with travelers'}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register Form (User or Guide) */}
          {(mode === 'register' || mode === 'register-guide') && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    placeholder="At least 6 characters"
                    minLength={6}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder="+977..."
                      autoComplete="tel"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">Nationality</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="text"
                      value={regNationality}
                      onChange={(e) => setRegNationality(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder="Country"
                      autoComplete="country-name"
                    />
                  </div>
                </div>
              </div>

              {/* Guide-specific fields */}
              {mode === 'register-guide' && (
                <>
                  <div className="pt-4 border-t border-white/10">
                    <h3 className="text-sm font-medium text-purple-400 mb-3">Guide Information</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Bio / About You</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <textarea
                        value={guideBio}
                        onChange={(e) => setGuideBio(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 min-h-[80px]"
                        placeholder="Tell travelers about yourself..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Experience (years)</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={guideExperience}
                          onChange={(e) => setGuideExperience(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                          placeholder="5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Rate (NPR/day)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={guideRate}
                          onChange={(e) => setGuideRate(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                          placeholder="3000"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Languages</label>
                    <div className="relative">
                      <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        value={guideLanguages}
                        onChange={(e) => setGuideLanguages(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        placeholder="English, Nepali, Hindi"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Specialties</label>
                    <input
                      type="text"
                      value={guideSpecialties}
                      onChange={(e) => setGuideSpecialties(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                      placeholder="Trekking, Cultural Tours, Wildlife"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Creating account...' : mode === 'register-guide' ? 'Register as Guide' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Mode switchers */}
          <div className="mt-6 pt-6 border-t border-white/10">
            {mode === 'login' ? (
              <div className="text-center space-y-3">
                <p className="text-gray-400 text-sm">
                  Don't have an account?{' '}
                  <button
                    onClick={() => switchMode('register')}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Sign up
                  </button>
                </p>
                <p className="text-gray-500 text-sm">
                  Are you a guide?{' '}
                  <button
                    onClick={() => switchMode('register-guide')}
                    className="text-green-400 hover:text-green-300 font-medium"
                  >
                    Join as Guide
                  </button>
                </p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-gray-400 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Sign in
                  </button>
                </p>
                {mode === 'register' ? (
                  <p className="text-gray-500 text-sm">
                    Are you a guide?{' '}
                    <button
                      onClick={() => switchMode('register-guide')}
                      className="text-green-400 hover:text-green-300 font-medium"
                    >
                      Join as Guide
                    </button>
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Just a traveler?{' '}
                    <button
                      onClick={() => switchMode('register')}
                      className="text-purple-400 hover:text-purple-300 font-medium"
                    >
                      Sign up as User
                    </button>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
