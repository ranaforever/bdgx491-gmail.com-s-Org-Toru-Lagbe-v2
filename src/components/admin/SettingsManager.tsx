import React, { useState } from 'react';
import { SystemSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { Save, CheckCircle2, RotateCcw, Download, Upload, ShieldCheck, Database } from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    setSuccessMsg('সিস্টেম সেটিংস সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleResetData = () => {
    if (confirm('আপনি কি নিশ্চিত যে সকল ডেমো ডাটা রিসেট করতে চান? আপনার তৈরি করা ডাটা হারিয়ে যেতে পারে!')) {
      StorageService.resetAll();
      setSettings(StorageService.getSettings());
      setSuccessMsg('সকল ডাটা সফলভাবে রিসেট ও রি-ইনিশিয়ালাইজ করা হয়েছে!');
      setTimeout(() => setSuccessMsg(''), 3000);
      window.location.reload();
    }
  };

  const handleExportBackup = () => {
    const data = {
      tours: StorageService.getTours(),
      hotels: StorageService.getHotels(),
      bookings: StorageService.getBookings(),
      agents: StorageService.getAgents(),
      busTemplates: StorageService.getTemplates(),
      settings: StorageService.getSettings(),
      exportedAt: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tour_lagbe_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.tours && json.hotels && json.bookings) {
          if (json.tours) StorageService.saveTours(json.tours);
          if (json.hotels) StorageService.saveHotels(json.hotels);
          if (json.bookings) StorageService.saveBookings(json.bookings);
          if (json.agents) StorageService.saveAgents(json.agents);
          if (json.busTemplates) StorageService.saveTemplates(json.busTemplates);
          if (json.settings) StorageService.saveSettings(json.settings);

          setSuccessMsg('ব্যাকআপ ফাইল হতে ডাটা সফলভাবে রিস্টোর হয়েছে!');
          setTimeout(() => setSuccessMsg(''), 3000);
          window.location.reload();
        } else {
          setErrorMsg('অবৈধ ব্যাকআপ ফাইল ফরম্যাট!');
        }
      } catch (err) {
        setErrorMsg('ফাইল রিড করতে ব্যর্থ হয়েছে! সঠিক JSON ফাইল নির্বাচন করুন।');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            সিস্টেম কনফিগারেশন & ডাটাবেজ
          </span>
          <h1 className="text-xl font-black text-white mt-1">
            সিস্টেম প্রোফাইল সেটিংস ও ব্যাকআপ রিস্টোর
          </h1>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>পরিবর্তন সেভ করুন</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs p-3.5 rounded-2xl font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-950/60 border border-rose-800 text-rose-300 text-xs p-3.5 rounded-2xl font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form: Business Identity */}
        <form onSubmit={handleSaveSettings} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
            বিজনেস আইডেন্টিটি ও কন্টাক্ট ইনফরমেশন
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">প্রতিষ্ঠানের নাম (Business Name)</label>
              <input
                type="text"
                required
                value={settings.businessName}
                onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">ট্যাগলাইন / শ্লোগান (Tagline)</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">মোবাইল / হেল্পলাইন</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">ইমেইল এড্রেস</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">অফিস এড্রেস / ঠিকানা</label>
              <textarea
                rows={2}
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">মুদ্রা (Currency Symbol)</label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-28 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-emerald-400 font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md"
            >
              সেটিংস সেভ করুন
            </button>
          </div>
        </form>

        {/* Right Section: Database Management */}
        <div className="lg:col-span-5 space-y-6">
          {/* Backup & Restore */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>ডাটাবেজ ব্যাকআপ ও রিস্টোর</span>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              আপনার সকল ট্যুর, বুকিং, বাস সিট এবং রুম অ্যাসাইনমেন্ট তথ্য এক ক্লিকে JSON ফাইলেই সেভ করুন অথবা পরে রিস্টোর করুন।
            </p>

            <div className="space-y-3 pt-2">
              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>JSON ব্যাকআপ ফাইল ডাউনলোড করুন</span>
              </button>

              <label className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-teal-400" />
                <span>JSON ব্যাকআপ ফাইল আপলোড/রিস্টোর</span>
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>

          {/* Reset Factory Defaults */}
          <div className="bg-slate-900 border border-rose-900/40 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-rose-400 border-b border-slate-800 pb-3 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-rose-400" />
              <span>ডেমো ডাটা রিসেট (Danger Zone)</span>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              সকল ডাটা মুছে দিয়ে অরিজিনাল ডেমো ডাটা রিসেট করতে নিচের বাটনে ক্লিক করুন।
            </p>

            <button
              onClick={handleResetData}
              className="w-full py-2.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>সকল ডেমো ডাটা রিসেট করুন</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
