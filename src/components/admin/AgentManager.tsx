import React, { useState } from 'react';
import { Agent } from '../../types';
import { StorageService } from '../../services/storage';
import { CalculationUtils } from '../../utils/calculations';
import { CSVExportService } from '../../utils/csvExport';
import { useToast } from '../../context/ToastContext';
import { Users, Plus, CheckCircle2, Building2, Phone, Edit2, Trash2, ShieldCheck, Download } from 'lucide-react';

export const AgentManager: React.FC = () => {
  const { showToast } = useToast();
  const [agents, setAgents] = useState<Agent[]>(StorageService.getAgents());
  const bookings = StorageService.getBookings();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Partial<Agent>>({});

  const handleOpenNewAgent = () => {
    setEditingAgent({
      id: `agt-${Date.now()}`,
      code: `AGT-${100 + agents.length + 1}`,
      name: '',
      agencyName: '',
      phone: '',
      commissionRate: 0,
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent({ ...agent });
    setIsModalOpen(true);
  };

  const handleDeleteAgent = (id: string, name: string) => {
    if (confirm(`আপনি কি নিশ্চিত যে এজেন্ট "${name}" স্থায়ীভাবে মুছে ফেলতে চান?`)) {
      StorageService.deleteAgent(id);
      setAgents(StorageService.getAgents());
      showToast(`এজেন্ট "${name}" স্থায়ীভাবে মুছে ফেলা হয়েছে!`, 'info');
    }
  };

  const handleSaveAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent.name || !editingAgent.code) return;

    const agentObj = {
      ...editingAgent,
      commissionRate: 0,
    } as Agent;

    let updated: Agent[];
    if (agents.some((a) => a.id === agentObj.id)) {
      updated = agents.map((a) => (a.id === agentObj.id ? agentObj : a));
    } else {
      updated = [...agents, agentObj];
    }

    setAgents(updated);
    StorageService.saveAgents(updated);
    setIsModalOpen(false);
    showToast('এজেন্ট প্রোফাইল সফলভাবে সংরক্ষণ করা হয়েছে!', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            এজেন্ট ও বুকার ডিরেক্টরি
          </span>
          <h1 className="text-xl font-black text-white mt-1">
            এজেন্ট প্রোফাইল ও বুকিং পারফরম্যান্স
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => CSVExportService.exportAgents(agents)}
            className="px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            title="এজেন্ট তালিকা CSV ডাউনলোড করুন"
          >
            <Download className="w-4 h-4" />
            <span>CSV এক্সপোর্ট</span>
          </button>

          <button
            onClick={handleOpenNewAgent}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন এজেন্ট যুক্ত করুন</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => {
          const agentBookings = bookings.filter(
            (b) => (b.agentId === agent.id || b.bookerCode === agent.code) && b.bookingStatus !== 'Cancelled'
          );

          const totalPassengers = agentBookings.reduce((acc, b) => acc + b.passengerCount, 0);
          const totalRevenue = agentBookings.reduce((acc, b) => acc + b.payableAmount, 0);

          return (
            <div
              key={agent.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4 relative group"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-md">
                  {agent.code}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditAgent(agent)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                    title="এজেন্ট এডিট করুন"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id, agent.name)}
                    className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 rounded-lg transition-colors"
                    title="এজেন্ট মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{agent.agencyName}</h3>
                <p className="text-xs text-slate-300 font-medium">প্রতিনিধি: {agent.name}</p>
                <p className="text-xs text-slate-400">মোবাইল: {agent.phone}</p>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">বুকিং</span>
                  <span className="font-bold text-white">{agentBookings.length} টি</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">যাত্রী</span>
                  <span className="font-bold text-emerald-400">{totalPassengers} জন</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">মোট কালেকশন</span>
                  <span className="font-bold text-white">{CalculationUtils.formatCurrency(totalRevenue)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSaveAgent}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">
              {editingAgent.id && agents.some((a) => a.id === editingAgent.id)
                ? 'এজেন্ট প্রোফাইল এডিট করুন'
                : 'নতুন এজেন্ট যুক্ত করুন'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">এজেন্ট কোড *</label>
                <input
                  type="text"
                  required
                  value={editingAgent.code || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, code: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">এজেন্সি / ট্রাভেলসের নাম *</label>
                <input
                  type="text"
                  required
                  value={editingAgent.agencyName || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, agencyName: e.target.value })}
                  placeholder="e.g. ABC Travels Dhaka"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">এজেন্টের নাম *</label>
                <input
                  type="text"
                  required
                  value={editingAgent.name || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, name: e.target.value })}
                  placeholder="e.g. আবদুর রহিম"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">মোবাইল নম্বর *</label>
                <input
                  type="text"
                  required
                  value={editingAgent.phone || ''}
                  onChange={(e) => setEditingAgent({ ...editingAgent, phone: e.target.value })}
                  placeholder="01711xxxxxx"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs"
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
