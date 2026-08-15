import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, Bell, Lock, Shield, Eye, ShieldCheck, 
  RefreshCw, Check, AlertTriangle, Fingerprint, EyeOff
} from 'lucide-react';
import { UserProfile } from '../../types';

interface SettingsViewProps {
  activeProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
}

export default function SettingsView({ activeProfile, onUpdateProfile }: SettingsViewProps) {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [securityPin, setSecurityPin] = useState('4829');
  const [showPin, setShowPin] = useState(false);
  const [biometricLogin, setBiometricLogin] = useState(false);
  const [autoSettle, setAutoSettle] = useState(true);

  const handleUpdatePin = () => {
    const input = prompt('Enter new 4-digit security PIN:');
    if (input && input.length === 4 && !isNaN(Number(input))) {
      setSecurityPin(input);
      alert('Security PIN updated successfully!');
    } else if (input) {
      alert('Invalid PIN. Please enter exactly 4 numbers.');
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-6 max-w-md mx-auto font-sans text-xs">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
        <Settings className="w-5 h-5 text-purple-600" />
        <div>
          <h3 className="text-sm font-sans font-black text-slate-900 leading-none">Security & Preferences</h3>
          <p className="text-[10px] text-slate-400 mt-1">Configure trade parameters & auth signatures.</p>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
          <Bell className="w-3.5 h-3.5 text-slate-400" /> Notifications
        </span>
        
        <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 font-medium">Email Alerts</span>
            <input 
              type="checkbox" 
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500"
            />
          </div>
          <p className="text-[9px] text-slate-400">Receive copy of Escrow Agreement and settlement receipt.</p>
          
          <div className="flex items-center justify-between pt-2 border-t border-slate-150/50 mt-2">
            <span className="text-slate-700 font-medium">Instant Push Notifications</span>
            <input 
              type="checkbox" 
              checked={pushAlerts}
              onChange={(e) => setPushAlerts(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500"
            />
          </div>
          <p className="text-[9px] text-slate-400">Get alerts on buyer funding, delivery confirmation, and active chats.</p>
        </div>
      </div>

      {/* Security Section */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-slate-400" /> Security Controls
        </span>

        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          {/* PIN */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-slate-700 font-bold block">4-Digit Security PIN</span>
              <span className="text-[9px] text-slate-400 block">Required for all funding & refunds.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm tracking-widest bg-white px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800">
                {showPin ? securityPin : '••••'}
              </span>
              <button 
                onClick={() => setShowPin(!showPin)}
                className="p-1.5 hover:bg-slate-200/50 rounded-lg text-slate-500"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button 
                onClick={handleUpdatePin}
                className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-[10px] font-bold"
              >
                Change
              </button>
            </div>
          </div>

          {/* 2FA */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-150/50">
            <div>
              <span className="text-slate-700 font-bold block">2-Factor Escrow Clearance</span>
              <span className="text-[9px] text-slate-400 block">Verify high-value payouts via SMS OTP.</span>
            </div>
            <input 
              type="checkbox" 
              checked={twoFactor}
              onChange={(e) => setTwoFactor(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500"
            />
          </div>

          {/* Biometrics */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-150/50">
            <div>
              <span className="text-slate-700 font-bold block flex items-center gap-1">
                <Fingerprint className="w-3.5 h-3.5 text-slate-500" /> Face ID / Fingerprint Auth
              </span>
              <span className="text-[9px] text-slate-400 block">Quick login to TESM wallet.</span>
            </div>
            <input 
              type="checkbox" 
              checked={biometricLogin}
              onChange={(e) => setBiometricLogin(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Escrow Parameters */}
      <div className="space-y-3">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-slate-400" /> Escrow Parameters
        </span>

        <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-700 font-medium">Automatic Settlement</span>
            <input 
              type="checkbox" 
              checked={autoSettle}
              onChange={(e) => setAutoSettle(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded-md"
            />
          </div>
          <p className="text-[9px] text-slate-400">Release escrow funds exactly 24 hours post-delivery verification if no dispute is opened.</p>
        </div>
      </div>
    </div>
  );
}
