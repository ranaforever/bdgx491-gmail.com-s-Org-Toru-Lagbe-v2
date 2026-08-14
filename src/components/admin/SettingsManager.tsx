import React, { useState } from 'react';
import { SystemSettings } from '../../types';
import { StorageService } from '../../services/storage';
import { useToast } from '../../context/ToastContext';
import {
  Save,
  CheckCircle2,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck,
  Database,
  Trash2,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react';

export const SettingsManager: React.FC = () => {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<SystemSettings>(StorageService.getSettings());
  
  // Wipe All Data Modal State
  const [showWipeModal, setShowWipeModal] = useState<boolean>(false);
  const [wipeConfirmText, setWipeConfirmText] = useState<string>('');
  const [isWiping, setIsWiping] = useState<boolean>(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    showToast('সিস্টেম সেটিংস সফলভাবে আপডেট ও সংরক্ষিত হয়েছে!', 'success');
  };

  const handleResetData = () => {
    if (confirm('আপনি কি নিশ্চিত যে সকল ডেমো ডাটা রিসেট করতে চান? আপনার তৈরি করা ডাটা হারিয়ে যেতে পারে!')) {
      StorageService.resetAll();
      setSettings(StorageService.getSettings());
      showToast('সকল ডাটা সফলভাবে রিসেট ও রি-ইনিশিয়ালাইজ করা হয়েছে!', 'info');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleWipeAllData = async () => {
    if (wipeConfirmText.trim().toUpperCase() !== 'WIPE ALL' && wipeConfirmText.trim() !== 'মুছে ফেলুন') {
      showToast('নিশ্চিত করতে বক্সে "WIPE ALL" অথবা "মুছে ফেলুন" টাইপ করুন!', 'warning');
      return;
    }

    try {
      setIsWiping(true);
      await StorageService.wipeAllData();
      showToast('⚠️ সিস্টেমের সকল ডাটা সফলভাবে মুছে ফেলা (Wipe) হয়েছে!', 'success');
      setShowWipeModal(false);
      setWipeConfirmText('');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error(err);
      showToast('ডাটা ওয়াইপ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।', 'error');
    } finally {
      setIsWiping(false);
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
    showToast('ব্যাকআপ ডাউনলোড সম্পন্ন হয়েছে!', 'success');
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

          showToast('ব্যাকআপ ফাইল হতে ডাটা সফলভাবে রিস্টোর হয়েছে!', 'success');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('অবৈধ ব্যাকআপ ফাইল ফরম্যাট!', 'error');
        }
      } catch (err) {
        showToast('ফাইল রিড করতে ব্যর্থ হয়েছে! সঠিক JSON ফাইল নির্বাচন করুন।', 'error');
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-amber-400 border-b border-slate-800 pb-3 flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>ডেমো ডাটা রিসেট (Factory Reset)</span>
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              সিস্টেমে প্রাথমিক নমুনা ট্যুর, এজেন্ট, এবং ডেমো বুকিং ডাটা পুনরায় রিলোড করতে চাইলে রিসেট করুন।
            </p>

            <button
              onClick={handleResetData}
              className="w-full py-2.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>নমুনা / ডেমো ডাটা রিসেট করুন</span>
            </button>
          </div>

          {/* Wipe All Data - Danger Zone */}
          <div className="bg-slate-900 border border-rose-900/60 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>সকল ডাটা সম্পূর্ণ মুছে ফেলুন (Wipe All Data)</span>
              </h2>
              <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black px-2 py-0.5 rounded">
                DANGER ZONE
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              এই অপশন ব্যবহার করলে আপনার সকল বুকিং, ট্যুর, হোটেল, এজেন্ট এবং বাস সিট রেকর্ডস স্থায়ীভাবে একবারে সম্পূর্ণ মুছে (Wipe out) যাবে।
            </p>

            <button
              onClick={() => {
                setWipeConfirmText('');
                setShowWipeModal(true);
              }}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>এক ক্লিকে সকল ডাটা মুছুন (Wipe All)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Wipe All Data Confirmation Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-rose-900/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowWipeModal(false)}
              className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-white">
                  আপনি কি সত্যিই সব ডাটা একবারে মুছে ফেলতে চান?
                </h3>
                <p className="text-xs text-rose-400 font-semibold">
                  এই কাজটি অপরিবর্তনীয় (Irreversible)! মুছে ফেলা ডাটা আর ফেরত পাওয়া যাবে না।
                </p>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-2 text-xs text-slate-300">
              <div className="font-bold text-slate-200">নিচের সকল রেকর্ডস স্থায়ীভাবে মুছে যাবে:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li>সকল ট্যুর ও ইভেন্ট প্যাকেজ</li>
                <li>সকল বুকিং, যাত্রী তালিকা ও পেমেন্ট রেকর্ড</li>
                <li>সকল এজেন্ট ও হোস্ট বুকিং আইডি</li>
                <li>সকল হোটেল ও রুম অ্যাসাইনমেন্ট</li>
                <li>সকল কাস্টম বাস লেআউট ও নোটিফিকেশন</li>
              </ul>
            </div>

            {/* Backup option before wipe */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <span className="text-emerald-300 text-[11px]">
                মুছে ফেলার আগে একটি ব্যাকআপ ফাইল সেভ করে রাখতে চান?
              </span>
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ব্যাকআপ ডাউনলোড</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                নিশ্চিত করতে নিচে <span className="text-rose-400 font-mono">WIPE ALL</span> অথবা <span className="text-rose-400 font-mono">মুছে ফেলুন</span> লিখুন:
              </label>
              <input
                type="text"
                value={wipeConfirmText}
                onChange={(e) => setWipeConfirmText(e.target.value)}
                placeholder="এখানে WIPE ALL লিখুন"
                className="w-full bg-slate-950 border border-rose-800/60 rounded-xl px-4 py-2.5 text-rose-300 font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWipeModal(false)}
                disabled={isWiping}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
              >
                বাতিল করুন
              </button>

              <button
                type="button"
                onClick={handleWipeAllData}
                disabled={
                  isWiping ||
                  (wipeConfirmText.trim().toUpperCase() !== 'WIPE ALL' &&
                    wipeConfirmText.trim() !== 'মুছে ফেলুন')
                }
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isWiping ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>মুছে ফেলা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>হ্যাঁ, সম্পূর্ণ ডাটা মুছে ফেলুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
