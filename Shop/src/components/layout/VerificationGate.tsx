import React, { useState } from 'react';
import { ShieldCheck, UserPlus, LogIn, AlertTriangle, Sparkles, Clock, X } from 'lucide-react';
import { UserProfile } from '../../types';

interface VerificationGateProps {
  activeProfile: UserProfile;
  onNavigateToMarket: () => void;
  onOpenAuth: (mode: 'login' | 'register' | 'verify-wizard') => void;
  onUpdateUser: (updated: UserProfile) => void;
}

export default function VerificationGate({ activeProfile, onNavigateToMarket, onOpenAuth, onUpdateUser }: VerificationGateProps) {
  const [isSimulatingApproval, setIsSimulatingApproval] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  if (activeProfile.verificationStatus === 'GUEST') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="relative flex items-center justify-center w-20 h-20 rounded-3xl bg-purple-50 text-purple-600 shadow-sm border border-purple-100/50">
          <ShieldCheck className="w-10 h-10 stroke-[2] animate-float" />
          <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full border-2 border-white">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-display font-extrabold text-slate-900 leading-snug">Verified Account Required</h2>
          <p className="text-xs font-sans text-slate-500 max-w-xs leading-relaxed">
            In order to unlock secure multi-sig trades, wallet deposits, and real-time merchant direct messaging, please sign in or register your verified profile.
          </p>
        </div>

        <div className="w-full space-y-2 pt-4">
          <button
            onClick={() => onOpenAuth('register')}
            className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-lg shadow-purple-100 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" /> Create Verified Profile
          </button>

          <button
            onClick={() => onOpenAuth('login')}
            className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-sans font-bold text-xs rounded-xl transition-all border border-slate-200/50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
        </div>

        <div className="pt-6">
          <button
            onClick={onNavigateToMarket}
            className="text-xs font-sans font-bold text-purple-600 hover:text-purple-700 hover:underline"
          >
            Go back to browse the Open Market
          </button>
        </div>
      </div>
    );
  }

  if (activeProfile.verificationStatus === 'UNVERIFIED') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">📋</div>
        <div className="space-y-2">
          <h2 className="text-xl font-display font-bold text-slate-900">Finish Setting Up Profile</h2>
          <p className="text-xs font-sans text-slate-500 leading-relaxed max-w-xs mx-auto">
            Your profile is created under workspace ID <strong className="font-mono text-slate-800">{activeProfile.tempId}</strong>. Finish identity registration to activate trades and wallets.
          </p>
        </div>

        <button
          onClick={() => onOpenAuth('verify-wizard')}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-md cursor-pointer"
        >
          Verify Profile & Fund Account
        </button>
      </div>
    );
  }

  if (activeProfile.verificationStatus === 'PENDING') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        {isSimulatingApproval ? (
          <div className="space-y-6 w-full py-8">
            <div className="relative flex items-center justify-center w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
              <ShieldCheck className="w-8 h-8 text-purple-600 animate-pulse" />
            </div>
            <div className="space-y-3">
              <h3 className="text-base font-sans font-black text-slate-950">Running Automated Verification</h3>
              <div className="space-y-2 max-w-xs mx-auto text-left">
                <p className={`text-xs transition-all duration-300 font-semibold flex items-center gap-1.5 ${simulationStep === 0 ? 'text-purple-600 scale-105 font-bold' : 'text-slate-400'}`}>
                  <span>{simulationStep > 0 ? '✓' : '○'}</span> Checking BVN signature registries...
                </p>
                <p className={`text-xs transition-all duration-300 font-semibold flex items-center gap-1.5 ${simulationStep === 1 ? 'text-purple-600 scale-105 font-bold' : 'text-slate-400'}`}>
                  <span>{simulationStep > 1 ? '✓' : '○'}</span> Matching NUBAN settlement accounts...
                </p>
                <p className={`text-xs transition-all duration-300 font-semibold flex items-center gap-1.5 ${simulationStep === 2 ? 'text-purple-600 scale-105 font-bold' : 'text-slate-400'}`}>
                  <span>{simulationStep > 2 ? '✓' : '○'}</span> Activating secure vault channel...
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-100">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-display font-bold text-slate-900">Verification Pending Review</h2>
              <p className="text-xs font-sans text-slate-500 leading-relaxed max-w-xs mx-auto">
                Your BVN details and virtual deposit account credentials have been submitted securely to the settlement network.
              </p>
            </div>

            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-left w-full">
              <span className="text-[10px] font-sans font-bold text-purple-800 uppercase block mb-1">Sandbox Automatic Bypass</span>
              <p className="text-[10px] font-sans text-purple-700 leading-normal">
                This is a prototype environment. You can trigger an instant simulated verification check to immediately verify your account.
              </p>
            </div>

            <button
              onClick={() => {
                setIsSimulatingApproval(true);
                setSimulationStep(0);
                setTimeout(() => setSimulationStep(1), 1000);
                setTimeout(() => setSimulationStep(2), 2000);
                setTimeout(() => {
                  onUpdateUser({ ...activeProfile, verificationStatus: 'VERIFIED' });
                  setIsSimulatingApproval(false);
                }, 3000);
              }}
              className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-purple-200" /> Run Instant Compliance Verification
            </button>
          </>
        )}
      </div>
    );
  }

  if (activeProfile.verificationStatus === 'REJECTED') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto border border-red-100">
          <X className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-display font-bold text-slate-900">Verification Rejected</h2>
          <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-100 text-xs font-sans">
            <strong>Reason:</strong> {activeProfile.rejectionReason || 'Blurred photo uploads.'}
          </div>
          <p className="text-xs font-sans text-slate-500 leading-relaxed max-w-xs mx-auto">
            Please resubmit document credentials with matching BVN details.
          </p>
        </div>

        <button
          onClick={() => {
            onUpdateUser({ ...activeProfile, verificationStatus: 'UNVERIFIED' });
            onOpenAuth('verify-wizard');
          }}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-sans font-bold text-xs rounded-xl shadow-md cursor-pointer"
        >
          Resubmit Identification Forms
        </button>
      </div>
    );
  }

  return null;
}