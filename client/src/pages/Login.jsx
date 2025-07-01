import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '../context/UserContext';
import { Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/ui/use-toast.js';
import { login as apiLogin } from '../lib/api';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useUser();
  const { toast } = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await apiLogin(formData);

      if (data.success) {
        login(data.user);
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.user.fullName}!`,
        });
        setLocation('/dashboard');
      } else {
        setError(data.message || 'Login failed');
        toast({
          title: "Login failed",
          description: data.message || 'Invalid email or password',
          variant: "destructive",
        });
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
      toast({
        title: "Error",
        description: err.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center relative px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1619467416348-6a782839e95f?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")',
      }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Main container */}
      <div className="relative z-10 flex flex-col lg:flex-row w-full max-w-6xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden min-h-[600px]">
        
        {/* Left section with travel content */}
        <div className="flex-1 p-6 sm:p-8 lg:p-12 text-white flex flex-col justify-center bg-gradient-to-br from-black/30 to-black/50">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-wide mb-2">
              Navigate the Visa Journey with Confidence
              </h1>
              <p className=" font-bold mb-4">
              Welcome to Visa CRM<br />
              your smart companion for managing applications, tracking progress, and keeping every detail under control.
              </p>
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-lg sm:text-xl font-medium">
                Where Your Dream Destinations<br />
                Become Reality
              </h3>
              <p className="text-white/80 text-sm sm:text-base leading-relaxed max-w-md">
                Your secure portal to manage visa applications,<br />
                clients, and appointments — all in one place.
              </p>
            </div>
          </div>
        </div>

        {/* Right section with login form */}
        <div className="flex-1 p-4 sm:p-6 lg:p-6 bg-amber-100/95 backdrop-blur-sm flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <div className="text-center mb-6 sm:mb-8">
              <img className='h-[20%]' alt='logo' src='https://sin1.contabostorage.com/d1fa3867924f4c149226431ef8cbe8ee:visa-crm/mianlogo.png' />
              <p className="text-gray-600 text-xs sm:text-sm">
                Log in to continue your journey
              </p>
            </div>

            <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-200 text-gray-800 bg-sky-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                  />
                </div>

                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-200 text-gray-800 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm sm:text-base"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 sm:top-3.5 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 sm:py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {isLoading ? 'Signing in...' : 'LOG IN'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}