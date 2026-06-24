import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from './store';
import { setUser, setToken, updateSettings } from './store/workspaceSlice';
import { api } from './services/api';
import Layout from './components/Layout';
import { Sparkles, Shield, User, Lock, Mail, ChevronRight, Github } from 'lucide-react';

export default function App() {
  const dispatch = useAppDispatch();
  const token = useAppSelector(state => state.workspace.token);
  
  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Developer');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // MFA simulation
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [tempSessionData, setTempSessionData] = useState<any>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.login({ username, password });
      
      // Simulate MFA if checked (simulated for DevOps/Admin roles for high security)
      if (res.user.role === 'Admin' || res.user.role === 'DevOps Engineer') {
        setMfaRequired(true);
        setTempSessionData(res);
        setLoading(false);
        return;
      }
      
      dispatch(setToken(res.token));
      dispatch(setUser(res.user));
      dispatch(updateSettings(res.settings));
    } catch (err: any) {
      // Offline fallback seeder check
      if (username === 'mygo-user' && password === 'mygodev123') {
        const fallbackUser = { id: 1, username: 'mygo-user', email: 'dev@mygo.internal', role: 'Admin', mfa_enabled: false };
        dispatch(setToken('simulated-jwt-token-1'));
        dispatch(setUser(fallbackUser));
      } else {
        setErrorMsg(err?.response?.data?.detail || 'Invalid credentials. Try mygo-user / mygodev123');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode === '123456' || mfaCode === '000000' || !mfaCode) {
      // Grant access
      dispatch(setToken(tempSessionData.token));
      dispatch(setUser(tempSessionData.user));
      dispatch(updateSettings(tempSessionData.settings));
    } else {
      setErrorMsg("Invalid MFA Verification Code. Hint: enter 123456 or leave blank.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) return;

    setLoading(true);
    setErrorMsg(null);
    try {
      await api.register({ username, email, password, role });
      alert("Registration successful! Please login.");
      setIsRegister(false);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const loginOAuth = (provider: string) => {
    setLoading(true);
    setTimeout(() => {
      const oauthUser = {
        id: Math.floor(Math.random() * 1000) + 10,
        username: `${provider}-developer`,
        email: `${provider}@mygo.internal`,
        role: 'Developer',
        mfa_enabled: false
      };
      dispatch(setToken(`simulated-oauth-token-${provider}`));
      dispatch(setUser(oauthUser));
      setLoading(false);
    }, 800);
  };

  // 1. If authenticated, load full IDE Workspace
  if (token) {
    return <Layout />;
  }

  // 2. Auth view
  return (
    <div className="flex items-center justify-center min-h-screen w-screen bg-bg-primary radial-gradient-glow text-text-main p-4 font-sans select-none">
      
      <div className="w-full max-w-md bg-bg-secondary/70 backdrop-blur-xl border border-border-color/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow overlay */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-accent-cyan/15 rounded-full filter blur-xl" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-accent-violet/15 rounded-full filter blur-xl" />

        {/* Brand Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent-violet to-accent-cyan flex items-center justify-center shadow-lg shadow-accent-violet/20 mb-3 animate-pulse-glow">
            <Sparkles className="text-white" size={24} />
          </div>
          <h2 className="text-xl font-bold tracking-wider uppercase">MYGO IDE</h2>
          <p className="text-xs text-text-muted mt-1 text-center">Secure AI-Powered Cloud Workspace</p>
        </div>

        {/* MFA form */}
        {mfaRequired ? (
          <form onSubmit={handleMfaSubmit} className="flex flex-col gap-4">
            <div className="text-center bg-accent-violet/10 border border-accent-violet/30 rounded-lg p-3 text-xs mb-2">
              <Shield className="text-accent-violet mx-auto mb-1.5" size={20} />
              <span>Multi-Factor Authentication (MFA) is enabled for high-privilege <strong>{tempSessionData?.user?.role}</strong> role.</span>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Enter verification code</label>
              <input 
                type="text" 
                placeholder="6-digit authentication token" 
                value={mfaCode}
                onChange={e => setMfaCode(e.target.value)}
                className="w-full bg-bg-primary border border-border-color rounded-lg px-3 py-2.5 text-xs text-center font-mono tracking-widest text-text-main outline-none focus:border-border-focus"
              />
            </div>
            
            <button 
              type="submit"
              className="w-full bg-accent-violet hover:bg-opacity-80 py-2.5 rounded-lg text-white font-bold text-xs transition"
            >
              Verify Code
            </button>
            
            <button 
              type="button" 
              onClick={() => setMfaRequired(false)}
              className="text-[10px] text-text-muted hover:text-text-main text-center hover:underline mt-2"
            >
              Back to Login
            </button>
          </form>
        ) : (
          /* Normal Login/Register Form */
          <form onSubmit={isRegister ? handleRegister : handleLogin} className="flex flex-col gap-4">
            {errorMsg && (
              <div className="bg-accent-red/10 border border-accent-red/20 text-accent-red text-center py-2 px-3 rounded-lg text-[10px] font-medium font-sans">
                {errorMsg}
              </div>
            )}

            {/* Username Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Username</label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-3.5 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Enter username" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-bg-primary border border-border-color rounded-lg pl-9 pr-3 py-2.5 text-xs text-text-main outline-none focus:border-border-focus"
                />
              </div>
            </div>

            {/* Email (only registration) */}
            {isRegister && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3 top-3.5 text-text-muted" />
                  <input 
                    type="email" 
                    placeholder="Enter email address" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-bg-primary border border-border-color rounded-lg pl-9 pr-3 py-2.5 text-xs text-text-main outline-none focus:border-border-focus"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-3.5 text-text-muted" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-bg-primary border border-border-color rounded-lg pl-9 pr-3 py-2.5 text-xs text-text-main outline-none focus:border-border-focus"
                />
              </div>
            </div>

            {/* Role Select (only registration) */}
            {isRegister && (
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-text-muted font-bold uppercase tracking-wide">Organization Role</label>
                <select 
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full bg-bg-primary border border-border-color rounded-lg px-3 py-2.5 text-xs text-text-main outline-none focus:border-border-focus"
                >
                  <option value="Developer">Developer</option>
                  <option value="Admin">Admin</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            )}

            {/* Actions */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-accent-violet hover:bg-opacity-80 py-2.5 rounded-lg text-white font-bold text-xs transition flex items-center justify-center gap-1 disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : isRegister ? 'Create Account' : 'Sign In'}
              <ChevronRight size={14} />
            </button>

            {/* OAuth Divider */}
            <div className="relative my-3 select-none">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-color" /></div>
              <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-bg-secondary px-2 text-text-muted font-bold">Or login with</span></div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-2 text-xs select-none">
              <button 
                type="button" 
                onClick={() => loginOAuth('github')}
                className="bg-bg-primary hover:bg-border-color border border-border-color p-2 rounded-lg text-text-main flex items-center justify-center gap-2 transition"
              >
                <Github size={13} /> GitHub
              </button>
              <button 
                type="button" 
                onClick={() => loginOAuth('google')}
                className="bg-bg-primary hover:bg-border-color border border-border-color p-2 rounded-lg text-text-main flex items-center justify-center gap-2 transition"
              >
                Google
              </button>
            </div>

            {/* Toggle Login/Register */}
            <button 
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
              }}
              className="text-[10px] text-text-muted hover:text-text-main text-center hover:underline mt-2 font-medium"
            >
              {isRegister ? 'Already have an account? Sign In' : 'New to MYGO IDE? Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
