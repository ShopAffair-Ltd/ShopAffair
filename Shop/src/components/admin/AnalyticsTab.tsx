import React from 'react';

export const AnalyticsTab: React.FC = () => {
  return (
    <div className="bg-[#020617] p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 className="text-xs font-bold uppercase text-white">Revenue & Sales Distribution Analytics</h3>
        <span className="text-[10px] text-slate-400">Compliance performance metrics</span>
      </div>

      <div className="space-y-4 text-xs font-sans text-left">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-slate-900 rounded-xl text-center">
            <span className="text-[9px] text-slate-400 uppercase block">Settled Escrows Ratio</span>
            <strong className="text-lg text-emerald-400 font-mono mt-1 block">98.4%</strong>
          </div>
          <div className="p-3 bg-slate-900 rounded-xl text-center">
            <span className="text-[9px] text-slate-400 uppercase block">Average Hold Duration</span>
            <strong className="text-lg text-purple-400 font-mono mt-1 block">24 hrs</strong>
          </div>
        </div>

        {/* Styled Micro graph using pure CSS layouts */}
        <div className="p-3 bg-slate-900 rounded-xl space-y-2">
          <span className="text-[10px] font-bold text-slate-300 block">System Transaction Volume Curve</span>
          <div className="h-20 flex items-end justify-between gap-1 pt-4 px-2">
            {[15, 30, 45, 25, 60, 80, 50, 90, 75, 100].map((val, idx) => (
              <div key={idx} className="flex-1 bg-gradient-to-t from-purple-900 to-purple-500 rounded-t" style={{ height: `${val}%` }} />
            ))}
          </div>
          <div className="flex justify-between text-[8px] text-slate-500 font-mono pt-1">
            <span>Jan-Mar</span>
            <span>Apr-Jun</span>
            <span>Jul-Sep</span>
            <span>Oct-Dec</span>
          </div>
        </div>
      </div>
    </div>
  );
};
