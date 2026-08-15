import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

export const Contact: React.FC = () => {
  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-extrabold text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-md">SUPPORT CENTRE</span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-slate-900">Get In Touch</h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">We are here 24/7 to resolve disputes or answer compliance questions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-lg border border-purple-100/50 space-y-3 shadow-xs">
            <Mail className="w-5 h-5 text-purple-600" />
            <h3 className="text-xs font-black text-slate-900">Email Support</h3>
            <p className="text-[11px] text-slate-400">support@shopaffair.ng</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-purple-100/50 space-y-3 shadow-xs">
            <Phone className="w-5 h-5 text-purple-600" />
            <h3 className="text-xs font-black text-slate-900">Phone Hotline</h3>
            <p className="text-[11px] text-slate-400">+234 (0) 803 219 4837</p>
          </div>

          <div className="bg-white p-6 rounded-lg border border-purple-100/50 space-y-3 shadow-xs">
            <MapPin className="w-5 h-5 text-purple-600" />
            <h3 className="text-xs font-black text-slate-900">Headquarters</h3>
            <p className="text-[11px] text-slate-400">Ikeja, Lagos, Nigeria</p>
          </div>
        </div>
      </div>
    </section>
  );
};