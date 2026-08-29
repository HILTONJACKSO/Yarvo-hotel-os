'use client';

import { useState, useEffect } from 'react';
import { Landmark, TrendingUp, TrendingDown, Scale, Calculator, Download } from 'lucide-react';

export default function FinancialsPage() {
  const [activeTab, setActiveTab] = useState<'PNL' | 'BALANCE_SHEET' | 'TRIAL_BALANCE'>('PNL');
  
  const [pnlData, setPnlData] = useState<any>(null);
  const [bsData, setBsData] = useState<any>(null);
  const [tbData, setTbData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const [pnlRes, bsRes, tbRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/analytics/reports/pnl`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/analytics/reports/balance-sheet`, { credentials: 'include' }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/analytics/reports/trial-balance`, { credentials: 'include' })
        ]);

        if (pnlRes.ok) setPnlData((await pnlRes.json()).data);
        if (bsRes.ok) setBsData((await bsRes.json()).data);
        if (tbRes.ok) setTbData((await tbRes.json()).data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Landmark className="text-emerald-500" />
            Financial Reports
          </h1>
          <p className="text-slate-400">View Profit & Loss, Balance Sheet, and Trial Balance</p>
        </div>
        <button className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <Download size={18} />
          Export PDF
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        <button 
          onClick={() => setActiveTab('PNL')}
          className={`px-4 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'PNL' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <TrendingUp size={16} />
          Profit & Loss
        </button>
        <button 
          onClick={() => setActiveTab('BALANCE_SHEET')}
          className={`px-4 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'BALANCE_SHEET' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Scale size={16} />
          Balance Sheet
        </button>
        <button 
          onClick={() => setActiveTab('TRIAL_BALANCE')}
          className={`px-4 py-3 font-medium text-sm flex items-center gap-2 transition-colors border-b-2 ${activeTab === 'TRIAL_BALANCE' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Calculator size={16} />
          Trial Balance
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
            Generating reports...
          </div>
        ) : (
          <>
            {activeTab === 'PNL' && pnlData && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-100">Income Statement (P&L)</h2>
                  <p className="text-slate-400">Yarvo Hotel</p>
                </div>

                {/* Revenue */}
                <div>
                  <h3 className="text-lg font-bold text-emerald-400 border-b border-slate-700 pb-2 mb-4">Revenue</h3>
                  <div className="space-y-3">
                    {pnlData.revenues.map((rev: any) => (
                      <div key={rev.category} className="flex justify-between items-center text-slate-300">
                        <span>{rev.category.replace('_', ' ')} Revenue</span>
                        <span>${Number(rev.amount).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-emerald-400 font-bold pt-2 border-t border-slate-700/50">
                      <span>Total Revenue</span>
                      <span>${Number(pnlData.totalRevenue).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses */}
                <div>
                  <h3 className="text-lg font-bold text-rose-400 border-b border-slate-700 pb-2 mb-4 mt-8">Expenses</h3>
                  <div className="space-y-3">
                    {pnlData.expenses.map((exp: any) => (
                      <div key={exp.category} className="flex justify-between items-center text-slate-300">
                        <span>{exp.category.replace('_', ' ')}</span>
                        <span>${Number(exp.amount).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center text-rose-400 font-bold pt-2 border-t border-slate-700/50">
                      <span>Total Expenses</span>
                      <span>${Number(pnlData.totalExpenses).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Net Profit */}
                <div className={`flex justify-between items-center text-xl font-bold pt-4 border-t-2 border-slate-700 mt-8 ${pnlData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <span>NET PROFIT / LOSS</span>
                  <div className="flex items-center gap-2">
                    {pnlData.netProfit >= 0 ? <TrendingUp /> : <TrendingDown />}
                    <span>${Number(pnlData.netProfit).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'BALANCE_SHEET' && bsData && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-100">Balance Sheet</h2>
                  <p className="text-slate-400">Yarvo Hotel</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Assets */}
                  <div>
                    <h3 className="text-lg font-bold text-emerald-400 border-b border-slate-700 pb-2 mb-4">Assets</h3>
                    <div className="space-y-3">
                      {bsData.assets.map((asset: any) => (
                        <div key={asset.name} className="flex justify-between items-center text-slate-300">
                          <span>{asset.name}</span>
                          <span>${Number(asset.amount).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center text-emerald-400 font-bold pt-2 border-t border-slate-700/50">
                        <span>Total Assets</span>
                        <span>${Number(bsData.totalAssets).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities & Equity */}
                  <div>
                    <h3 className="text-lg font-bold text-rose-400 border-b border-slate-700 pb-2 mb-4">Liabilities</h3>
                    <div className="space-y-3 mb-8">
                      {bsData.liabilities.length === 0 ? (
                        <div className="text-slate-500 italic">No recorded liabilities</div>
                      ) : (
                        bsData.liabilities.map((liab: any) => (
                          <div key={liab.name} className="flex justify-between items-center text-slate-300">
                            <span>{liab.name}</span>
                            <span>${Number(liab.amount).toFixed(2)}</span>
                          </div>
                        ))
                      )}
                      <div className="flex justify-between items-center text-rose-400 font-bold pt-2 border-t border-slate-700/50">
                        <span>Total Liabilities</span>
                        <span>${Number(bsData.totalLiabilities).toFixed(2)}</span>
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-indigo-400 border-b border-slate-700 pb-2 mb-4">Equity</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Owner's Equity / Net Income</span>
                        <span>${Number(bsData.equity).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-indigo-400 font-bold pt-2 border-t border-slate-700/50">
                        <span>Total Equity</span>
                        <span>${Number(bsData.equity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'TRIAL_BALANCE' && tbData && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-slate-100">Trial Balance</h2>
                  <p className="text-slate-400">Yarvo Hotel</p>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-slate-700 text-slate-400">
                      <th className="pb-3 font-bold">Account Name</th>
                      <th className="pb-3 font-bold text-right text-indigo-400">Debit (DR)</th>
                      <th className="pb-3 font-bold text-right text-indigo-400">Credit (CR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50 text-slate-300">
                    {/* Debits */}
                    {tbData.debits.map((d: any) => (
                      <tr key={d.account}>
                        <td className="py-3">{d.account}</td>
                        <td className="py-3 text-right">${Number(d.amount).toFixed(2)}</td>
                        <td className="py-3 text-right">-</td>
                      </tr>
                    ))}
                    {/* Credits */}
                    {tbData.credits.map((c: any) => (
                      <tr key={c.account}>
                        <td className="py-3 pl-8 text-slate-400 italic">{c.account}</td>
                        <td className="py-3 text-right">-</td>
                        <td className="py-3 text-right">${Number(c.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                    {/* Totals */}
                    <tr className="border-t-2 border-slate-700 font-bold text-slate-100">
                      <td className="py-4">TOTALS</td>
                      <td className="py-4 text-right border-double border-b-4 border-slate-700">${Number(tbData.totalDebits).toFixed(2)}</td>
                      <td className="py-4 text-right border-double border-b-4 border-slate-700">${Number(tbData.totalCredits).toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

