import React from 'react';

export const ReportsTab: React.FC = () => {
  const triggerDownload = (fileName: string) => {
    alert(`File "${fileName}" compiled and dispatched successfully to authorized compliance officer email address.`);
  };

  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Compliance Spreadsheet Report Dispatcher</h3>
        <span className="text-[10px] text-slate-400">Quarterly tax auditing audits</span>
      </div>

      <div className="space-y-3 text-xs text-left">
        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
          <div>
            <strong className="text-slate-200 block">Q3_Naira_Escrow_Settlement_Audit.csv</strong>
            <span className="text-[10px] text-slate-500 font-mono">1.2 MB • Generated 2 hours ago</span>
          </div>
          <button 
            onClick={() => triggerDownload('Q3_Naira_Escrow_Settlement_Audit.csv')}
            className="text-[10px] font-bold bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-1.5 rounded cursor-pointer transition-colors text-slate-200"
          >
            Download
          </button>
        </div>

        <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
          <div>
            <strong className="text-slate-200 block">KYC_Verified_Traders_List.xlsx</strong>
            <span className="text-[10px] text-slate-500 font-mono">480 KB • Generated Yesterday</span>
          </div>
          <button 
            onClick={() => triggerDownload('KYC_Verified_Traders_List.xlsx')}
            className="text-[10px] font-bold bg-slate-800 hover:bg-slate-750 border border-slate-700 px-3 py-1.5 rounded cursor-pointer transition-colors text-slate-200"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};
