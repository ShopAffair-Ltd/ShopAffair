import React from 'react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      no: '01',
      title: 'Initiate Agreement',
      desc: 'Buyer and seller agree on items or service specifications and delivery details.'
    },
    {
      no: '02',
      title: 'Fund Escrow',
      desc: 'Buyer pays securely into our multi-signature secure account. Funds are safely locked.'
    },
    {
      no: '03',
      title: 'Delivery & Verify',
      desc: 'Seller dispatches item via verified couriers. Buyer inspects goods upon arrival.'
    },
    {
      no: '04',
      title: 'Instant Release',
      desc: 'Buyer approves verification and system disburses funds directly to seller wallet.'
    }
  ];

  return (
    <section className="py-20 text-left px-6">
      <div className="max-w-4xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-mono font-extrabold text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-md">COMPLIANCE STREAM</span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-slate-900">How Escrow Works</h2>
          <p className="text-xs md:text-sm text-slate-500 max-w-sm mx-auto">Four simple stages to guarantee bulletproof safety for both parties.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg border border-purple-50/50 space-y-4 hover:border-purple-200 transition-colors">
              <span className="text-3xl font-black text-purple-100 font-display block">{step.no}</span>
              <h3 className="text-xs font-black text-slate-900">{step.title}</h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};