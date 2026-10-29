'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import jsPDF from 'jspdf';
import domtoimage from 'dom-to-image-more';
import { useAuth } from '@/lib/auth-provider';
import { Plus, Receipt, Search, Filter, Trash2, ArrowUpRight, ArrowDownRight, DollarSign, Wallet, Sparkles } from 'lucide-react';
import { db } from '@/lib/db';
import { syncOfflineMutations, downloadLatestData } from '@/lib/sync';
import ReportExportToolbar from '@/components/ReportExportToolbar';
import { downloadCSV } from '@/utils/export';
import { useCurrency } from '@/lib/currency';

const EXPENSE_GROUPS: Record<string, { label: string; badgeClass: string; categories: string[] }> = {
  PURCHASES: {
    label: 'Purchases',
    badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    categories: [
      'Local purchases food',
      'Local purchases drinks',
      'Local purchases boutique',
      'Local purchases Other',
    ],
  },
  EXPENSE: {
    label: 'Operating Expenses',
    badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    categories: [
      'Marketing',
      'Selling expenses',
      'Commission',
      'Employee benefits programs/nasscor',
      'Freight',
      'Insurance',
      'Laundry and cleaning service',
      'Legal and professional services',
      'Postage',
      'Repairs',
      'Supplies kitchen',
      'Supplies fuel generator',
      'Supply office',
      'Supplies gas',
      'Supplies staff food',
      'Supplies restaurants',
      'Supplies room',
      'Supplies other',
      'Taxes withholding Tax',
      'Taxes duty',
      'Taxes other',
      'Taxes withholding on rent',
      'taxes paid 2% tax',
      'Taxes withheld 2% tax',
      'Taxes GST',
      'Telephone / Internet',
      'Travel & Entertainment',
      'Utilities',
      'Wages - Daily hire',
      'Wages - bonus',
      'Local transportation',
      'Expenses general misc. Expens',
      'Expense selling expenses',
    ],
  },
  ASSETS: {
    label: 'Assets',
    badgeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    categories: [
      'Construction',
      'Renovation',
      'Equipment & Machinery',
      'Furniture & Fixtures',
      'Capital Improvements',
      'Other Assets',
    ],
  },
  LIABILITY: {
    label: 'Liability',
    badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    categories: [
      'Accounts payable',
      'Sales Tax Payable',
      'Loan / Debt Payable',
      'Other Liabilities',
    ],
  },
  OTHER_REVENUE: {
    label: 'Other income revenue',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    categories: [
      'Other revenue',
      'Other revenue reception',
      'Other revenue food',
      'Other revenue drink',
      'Other revenue room',
      'Other revenue boutique',
      'Other revenue package/event',
    ],
  },
};

const getCategoryGroup = (cat: string) => {
  if (!cat) return { key: 'EXPENSE', ...EXPENSE_GROUPS.EXPENSE };
  const lowerCat = cat.toLowerCase();

  for (const [key, group] of Object.entries(EXPENSE_GROUPS)) {
    if (group.categories.some(c => c.toLowerCase() === lowerCat)) {
      return { key, ...group };
    }
  }

  // Fallbacks by keywords
  if (lowerCat.includes('revenue') || lowerCat.includes('income')) {
    return { key: 'OTHER_REVENUE', ...EXPENSE_GROUPS.OTHER_REVENUE };
  }
  if (lowerCat.includes('purchase')) {
    return { key: 'PURCHASES', ...EXPENSE_GROUPS.PURCHASES };
  }
  if (lowerCat.includes('asset') || lowerCat.includes('construction') || lowerCat.includes('renovation')) {
    return { key: 'ASSETS', ...EXPENSE_GROUPS.ASSETS };
  }
  if (lowerCat.includes('payable') || lowerCat.includes('liability')) {
    return { key: 'LIABILITY', ...EXPENSE_GROUPS.LIABILITY };
  }

  return { key: 'EXPENSE', ...EXPENSE_GROUPS.EXPENSE };
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const { format, currencySymbol } = useCurrency();
  const canDelete = user?.roles?.some((r: any) => 
    ['SUPER_ADMIN', 'ADMIN', 'CEO', 'MANAGER', 'ACCOUNTANT'].includes(r?.toUpperCase?.() || r?.name?.toUpperCase?.())
  );

  const [expenses, setExpenses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PURCHASES' | 'EXPENSE' | 'ASSETS_LIABILITY' | 'OTHER_REVENUE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentDateRange, setCurrentDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Local purchases food',
    date: new Date().toISOString().split('T')[0],
    description: '',
    referenceCode: '',
  });

  const fetchExpenses = useCallback(async (start?: string, end?: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        let query = '';
        if (start && end) query = `?start=${start}&end=${end}`;
        try {
          const res = await fetch(`/api/v1/expenses${query}`, {
            credentials: 'include'
          });
          if (res.ok) {
            const data = await res.json();
            const serverExps = data.data || [];
            setExpenses(serverExps);
            if (serverExps.length > 0) {
              await db.expenses.bulkPut(serverExps);
            }
            return;
          }
        } catch (fetchErr) {
          console.warn('Online expenses fetch failed, falling back to local database:', fetchErr);
        }
      }

      let offlineExps = await db.expenses.toArray();
      if (start && end) {
        const dStart = new Date(start).getTime();
        const dEnd = new Date(end).getTime() + 86400000;
        offlineExps = offlineExps.filter(ex => {
          const t = new Date(ex.date).getTime();
          return t >= dStart && t < dEnd;
        });
      }
      setExpenses(offlineExps as any[]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleDateChange = (start: string, end: string) => {
    setCurrentDateRange({ start: start || '', end: end || '' });
    fetchExpenses(start, end);
  };

  const handleExport = async (formatType: 'pdf' | 'csv' | 'print') => {
    if (formatType === 'print') {
      window.print();
    } else if (formatType === 'pdf') {
      const element = document.querySelector('.page-container') as HTMLElement;
      if (!element) return;
      
      const filter = (node: any) => { return !node.classList?.contains('no-print'); };
      const scale = 2;
      const imgData = await domtoimage.toPng(element, {
        filter: filter,
        bgcolor: '#0a0d14',
        width: element.clientWidth * scale,
        height: element.clientHeight * scale,
        style: {
          transform: 'scale('+scale+')',
          transformOrigin: 'top left'
        }
      });
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.clientHeight * pdfWidth) / element.clientWidth;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } else if (formatType === 'csv') {
      downloadCSV(expenses, 'financial-transactions-report');
    }
  };

  const handleOpenModal = () => {
    // Pick suitable default category based on active tab
    let defaultCat = 'Local purchases food';
    if (activeTab === 'OTHER_REVENUE') {
      defaultCat = 'Other revenue';
    } else if (activeTab === 'EXPENSE') {
      defaultCat = 'Marketing';
    } else if (activeTab === 'ASSETS_LIABILITY') {
      defaultCat = 'Construction';
    }
    setFormData({
      amount: '',
      category: defaultCat,
      date: new Date().toISOString().split('T')[0],
      description: '',
      referenceCode: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      };

      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const res = await fetch('/api/v1/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const resData = await res.json();
          const createdExp = resData.data || resData;
          if (createdExp && createdExp.id) {
            await db.expenses.put(createdExp);
          }
        } else {
          throw new Error('Failed to save record to server');
        }
      } else {
        const newExp = { id: 'temp_' + Date.now(), ...payload };
        await db.expenses.put(newExp as any);
        
        await db.syncQueue.add({
          url: '/api/v1/expenses',
          method: 'POST',
          payload,
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0
        });
      }

      setIsModalOpen(false);
      await fetchExpenses(currentDateRange.start, currentDateRange.end);
    } catch (err) {
      console.error(err);
      alert('Error recording transaction. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await db.expenses.delete(id);
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await fetch(`/api/v1/expenses/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      } else {
        await db.syncQueue.add({
          url: `/api/v1/expenses/${id}`,
          method: 'DELETE',
          payload: null,
          createdAt: Date.now(),
          status: 'PENDING',
          retryCount: 0
        });
      }
      await fetchExpenses(currentDateRange.start, currentDateRange.end);
    } catch (err) {
      console.error(err);
    }
  };

  // Group metrics calculation
  const metrics = useMemo(() => {
    let purchases = 0;
    let expense = 0;
    let assets = 0;
    let liability = 0;
    let otherRevenue = 0;

    expenses.forEach(ex => {
      const grp = getCategoryGroup(ex.category).key;
      const amt = parseFloat(ex.amount) || 0;
      if (grp === 'PURCHASES') purchases += amt;
      else if (grp === 'EXPENSE') expense += amt;
      else if (grp === 'ASSETS') assets += amt;
      else if (grp === 'LIABILITY') liability += amt;
      else if (grp === 'OTHER_REVENUE') otherRevenue += amt;
    });

    return { purchases, expense, assets, liability, otherRevenue };
  }, [expenses]);

  // Filtered list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(ex => {
      // Tab filter
      const grpKey = getCategoryGroup(ex.category).key;
      if (activeTab === 'PURCHASES' && grpKey !== 'PURCHASES') return false;
      if (activeTab === 'EXPENSE' && grpKey !== 'EXPENSE') return false;
      if (activeTab === 'ASSETS_LIABILITY' && grpKey !== 'ASSETS' && grpKey !== 'LIABILITY') return false;
      if (activeTab === 'OTHER_REVENUE' && grpKey !== 'OTHER_REVENUE') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = ex.description?.toLowerCase().includes(q);
        const matchCat = ex.category?.toLowerCase().includes(q);
        const matchRef = ex.referenceCode?.toLowerCase().includes(q);
        return matchDesc || matchCat || matchRef;
      }
      return true;
    });
  }, [expenses, activeTab, searchQuery]);

  return (
    <div className="p-4 md:p-6 page-container space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Receipt className="text-amber-500" />
            Financial & Expense Management
          </h1>
          <p className="text-slate-400 text-sm">Track purchases, operating expenses, assets, liabilities, and other income</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus size={18} />
          {activeTab === 'OTHER_REVENUE' ? 'Record Other Revenue' : 'Record Transaction'}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">
            <span>Operating Expenses</span>
            <ArrowDownRight className="text-rose-400" size={16} />
          </div>
          <p className="text-2xl font-bold text-slate-100">{format(metrics.expense)}</p>
          <span className="text-xs text-rose-400/80 font-medium">Operating outflows</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">
            <span>Purchases</span>
            <ArrowDownRight className="text-blue-400" size={16} />
          </div>
          <p className="text-2xl font-bold text-slate-100">{format(metrics.purchases)}</p>
          <span className="text-xs text-blue-400/80 font-medium">Food, drinks & boutique</span>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-slate-400 text-xs uppercase tracking-wider mb-2 font-medium">
            <span>Assets & CapEx</span>
            <Wallet className="text-purple-400" size={16} />
          </div>
          <p className="text-2xl font-bold text-slate-100">{format(metrics.assets)}</p>
          <span className="text-xs text-purple-400/80 font-medium">Construction & renovation</span>
        </div>

        <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center text-emerald-400 text-xs uppercase tracking-wider mb-2 font-medium">
            <span>Other Income Revenue</span>
            <ArrowUpRight className="text-emerald-400" size={16} />
          </div>
          <p className="text-2xl font-bold text-emerald-400">+{format(metrics.otherRevenue)}</p>
          <span className="text-xs text-emerald-300/80 font-medium">Direct additional resort revenue</span>
        </div>
      </div>

      {(!currentDateRange.start && !currentDateRange.end) ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-950/30 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs text-emerald-300 gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="font-semibold text-emerald-300">Auto Mode Active:</span>
            <span>All expenses across days (yesterday, today, and prior) are automatically preserved and live-aggregated.</span>
          </div>
          <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold self-start sm:self-auto shrink-0">Continuous Tracking</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-cyan-950/30 border border-cyan-500/30 px-4 py-2.5 rounded-xl text-xs text-cyan-300 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0"></span>
            <span className="font-semibold text-cyan-300">Filtered Date Range:</span>
            <span>Showing expenses from <strong className="text-white">{currentDateRange.start}</strong> to <strong className="text-white">{currentDateRange.end}</strong></span>
          </div>
          <button 
            onClick={() => handleDateChange('', '')}
            className="text-[11px] bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 px-2.5 py-1 rounded-lg border border-cyan-500/40 font-semibold transition-colors self-start sm:self-auto shrink-0"
          >
            Reset to Auto (All Days)
          </button>
        </div>
      )}

      <ReportExportToolbar onDateChange={handleDateChange} onExport={handleExport} initialPreset="auto" />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-700/80 pb-3">
        <button 
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'ALL' 
              ? 'bg-amber-500 text-slate-900 shadow-md font-bold' 
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700/50'
          }`}
        >
          All Transactions
        </button>
        <button 
          onClick={() => setActiveTab('PURCHASES')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'PURCHASES' 
              ? 'bg-blue-600 text-white shadow-md font-bold' 
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700/50'
          }`}
        >
          Purchases
        </button>
        <button 
          onClick={() => setActiveTab('EXPENSE')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'EXPENSE' 
              ? 'bg-rose-600 text-white shadow-md font-bold' 
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700/50'
          }`}
        >
          Operating Expenses
        </button>
        <button 
          onClick={() => setActiveTab('ASSETS_LIABILITY')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'ASSETS_LIABILITY' 
              ? 'bg-purple-600 text-white shadow-md font-bold' 
              : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 border border-slate-700/50'
          }`}
        >
          Assets & Liabilities
        </button>
        <button 
          onClick={() => setActiveTab('OTHER_REVENUE')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            activeTab === 'OTHER_REVENUE' 
              ? 'bg-emerald-600 text-white shadow-md font-bold' 
              : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-800/50'
          }`}
        >
          <DollarSign size={14} />
          Other income revenue
        </button>
      </div>

      {/* Main Table Panel */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by category, description or reference..." 
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing {filteredExpenses.length} record{filteredExpenses.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Date</th>
                <th className="p-4 font-semibold">Group</th>
                <th className="p-4 font-semibold">Category</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">Reference</th>
                <th className="p-4 font-semibold text-right">Amount</th>
                <th className="p-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">Loading records...</td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <Receipt className="mx-auto mb-3 opacity-30" size={36} />
                    <p className="text-base font-medium text-slate-300">No records found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {activeTab === 'OTHER_REVENUE' 
                        ? 'No other income revenue entries recorded yet. Click "Record Other Revenue" to add one.'
                        : 'No transactions match the selected filters.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => {
                  const grp = getCategoryGroup(expense.category);
                  const isRev = grp.key === 'OTHER_REVENUE';

                  return (
                    <tr key={expense.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 text-slate-300 whitespace-nowrap">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${grp.badgeClass}`}>
                          {grp.label}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-slate-200 whitespace-nowrap">
                        {expense.category.replace(/_/g, ' ')}
                      </td>
                      <td className="p-4 text-slate-300 max-w-xs truncate">{expense.description}</td>
                      <td className="p-4 text-slate-400 text-xs font-mono whitespace-nowrap">{expense.referenceCode || '-'}</td>
                      <td className={`p-4 text-right font-bold whitespace-nowrap ${isRev ? 'text-emerald-400' : 'text-slate-100'}`}>
                        {isRev ? `+${format(expense.amount)}` : format(expense.amount)}
                      </td>
                      <td className="p-4 text-center">
                        {canDelete && (
                          <button 
                            onClick={() => handleDelete(expense.id)}
                            className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                            title="Delete entry"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-6 border-b border-slate-700/80 bg-slate-850 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-slate-100">
                  {activeTab === 'OTHER_REVENUE' ? 'Record Other Income Revenue' : 'Record Transaction'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Select the account category and enter payment details</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Date</label>
                <input 
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                >
                  <optgroup label="Purchases">
                    {EXPENSE_GROUPS.PURCHASES.categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>

                  <optgroup label="Operating Expenses">
                    {EXPENSE_GROUPS.EXPENSE.categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>

                  <optgroup label="Assets">
                    {EXPENSE_GROUPS.ASSETS.categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>

                  <optgroup label="Liability">
                    {EXPENSE_GROUPS.LIABILITY.categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>

                  <optgroup label="Other Income Revenue">
                    {EXPENSE_GROUPS.OTHER_REVENUE.categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
                  Amount ({currencySymbol})
                </label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Description</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="What was this entry for?"
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 text-sm focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">Reference / Receipt Code (Optional)</label>
                <input 
                  type="text"
                  value={formData.referenceCode}
                  onChange={(e) => setFormData({...formData, referenceCode: e.target.value})}
                  placeholder="e.g. REC-1024 or INV-509"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-700/60">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-300 hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-6 py-2.5 rounded-lg font-bold transition-colors text-sm shadow-md"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
