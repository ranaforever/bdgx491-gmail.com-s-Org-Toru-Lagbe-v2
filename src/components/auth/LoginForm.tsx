import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { UserSession } from '../../types';
import { Shield, KeyRound, UserCheck, ArrowRight, Lock, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [loginType, setLoginType] = useState<'agent' | 'admin'>('agent');
  const [agentCodeInput, setAgentCodeInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const agents = StorageService.getAgents();

  const handleAgentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCode = agentCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('অনুগ্রহ করে আপনার এজেন্ট কোড (Agent Code) প্রবেশ করান!');
      return;
    }

    // Check if code exists in agents
    const matchedAgent = agents.find(
      (a) => a.code.toUpperCase() === cleanCode || a.id.toUpperCase() === cleanCode
    );

    if (matchedAgent) {
      if (matchedAgent.status === 'Inactive') {
        setErrorMsg('আপনার এজেন্ট অ্যাকাউন্টটি বর্তমানে নিষ্ক্রিয় (Inactive)। অ্যাডমিনের সাথে যোগাযোগ করুন।');
        return;
      }

      const session: UserSession = {
        role: 'agent',
        agentCode: matchedAgent.code,
        agentName: matchedAgent.name,
        agencyName: matchedAgent.agencyName,
        loggedInAt: new Date().toISOString(),
      };
      StorageService.saveAuthSession(session);
      onLoginSuccess(session);
    } else {
      setErrorMsg(`এজেন্ট কোডটি সঠিক নয়। অনুগ্রহ করে আপনার সঠিক এজেন্ট কোড দিয়ে পুনরায় চেষ্টা করুন।`);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (adminPasswordInput === '@Rana&01625@') {
      const session: UserSession = {
        role: 'admin',
        agentCode: 'MASTER-ADMIN',
        agentName: 'Master Admin',
        agencyName: 'Tour লাগবে HQ',
        loggedInAt: new Date().toISOString(),
      };
      StorageService.saveAuthSession(session);
      onLoginSuccess(session);
    } else {
      setErrorMsg('ভুল অ্যাডমিন পাসওয়ার্ড! সঠিক মাস্টার পাসওয়ার্ড লিখুন।');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-emerald-500 selection:text-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Top Glow Background */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="text-center space-y-2 relative z-10">
          <img
            src="/logo.svg"
            alt="Tour লাগবে Logo"
            className="h-20 mx-auto object-contain drop-shadow-md"
          />
          <span className="inline-block bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
            পোর্টাল অ্যাক্সেস সিকিউরিটি
          </span>
          <h1 className="text-xl font-black text-white">সিস্টেমে লগইন করুন</h1>
          <p className="text-xs text-slate-400">
            বুকিং সম্পন্ন করতে আপনার এজেন্ট কোড অথবা মাস্টার অ্যাডমিন পাসওয়ার্ড ব্যবহার করুন
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-bold relative z-10">
          <button
            type="button"
            onClick={() => {
              setLoginType('agent');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              loginType === 'agent'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>এজেন্ট / বুকার</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setLoginType('admin');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 ${
              loginType === 'admin'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>মাস্টার অ্যাডমিন</span>
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-950/80 border border-rose-800 text-rose-300 text-xs p-3.5 rounded-2xl font-semibold flex items-start gap-2.5 relative z-10">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        {loginType === 'agent' ? (
          <form onSubmit={handleAgentLogin} className="space-y-4 relative z-10">
            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1.5">
                এজেন্ট কোড (Agent Code) *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={agentCodeInput}
                  onChange={(e) => setAgentCodeInput(e.target.value)}
                  placeholder="আপনার এজেন্ট কোড লিখুন..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white font-mono uppercase tracking-wider font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span>এজেন্ট পোর্টাল প্রবেশ করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin} className="space-y-4 relative z-10">
            <div>
              <label className="block text-slate-300 font-semibold text-xs mb-1.5">
                মাস্টার অ্যাডমিন পাসওয়ার্ড *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="পাসওয়ার্ড লিখুন..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  title={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <span>মাস্টার কন্ট্রোল প্যানেলে প্রবেশ করুন</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
