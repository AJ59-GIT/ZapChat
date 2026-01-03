
import React, { useState } from 'react';
import { useApp } from '../App';
import { mockApi } from '../services/mockBackend';

const Auth: React.FC = () => {
  const { setAuthState, isDarkMode, toggleDarkMode } = useApp();
  const [email, setEmail] = useState('alex@example.com');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const user = await mockApi.login(email);
      setAuthState({ user, isAuthenticated: true, loading: false });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-white dark:bg-slate-900 transition-colors duration-200">
      {/* Visual Side */}
      <div className="hidden md:flex flex-col justify-center items-center w-1/2 bg-blue-600 p-12 text-white">
        <div className="mb-8 p-4 bg-white/10 rounded-3xl backdrop-blur-sm">
          <i className="fa-solid fa-bolt-lightning text-6xl"></i>
        </div>
        <h1 className="text-4xl font-black mb-4">ZapChat</h1>
        <p className="text-xl text-blue-100 text-center max-w-md leading-relaxed">
          The ultimate real-time communication platform for modern teams. Secure, fast, and open-source.
        </p>
        <div className="mt-12 grid grid-cols-2 gap-4 w-full max-w-sm">
          <div className="p-4 bg-white/10 rounded-xl text-center backdrop-blur-sm border border-white/10">
            <div className="text-2xl font-bold">100+</div>
            <div className="text-xs text-blue-200 uppercase tracking-widest mt-1">Users</div>
          </div>
          <div className="p-4 bg-white/10 rounded-xl text-center backdrop-blur-sm border border-white/10">
            <div className="text-2xl font-bold">Free</div>
            <div className="text-xs text-blue-200 uppercase tracking-widest mt-1"> Forever</div>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 relative">
        <button 
          onClick={toggleDarkMode}
          className="absolute top-8 right-8 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-110 transition-transform"
        >
          <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>

        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="p-2 bg-blue-600 rounded-lg">
              <i className="fa-solid fa-bolt-lightning text-white"></i>
            </div>
            <span className="text-2xl font-black text-slate-800 dark:text-white">ZapChat</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Please enter your details to sign in.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-envelope text-slate-400"></i>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fa-solid fa-lock text-slate-400"></i>
                </div>
                <input
                  type="password"
                  disabled
                  className="block w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 dark:text-white opacity-60"
                  placeholder="••••••••"
                  value="demo1234"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-none active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? (
                <i className="fa-solid fa-circle-notch animate-spin mr-2"></i>
              ) : null}
              Sign In
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Use <span className="text-blue-600 font-semibold">alex@example.com</span> or <span className="text-blue-600 font-semibold">sarah@example.com</span> for demo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
