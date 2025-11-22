import React, { useState, useMemo } from 'react';
import { JournalEntry, Account } from '../types';
import { BookOpen, Search, Filter, Download, Printer, Calendar, ArrowDownUp } from 'lucide-react';
import { formatPrice, toPersianDate } from '../utils';

interface LedgerProps {
  journals: JournalEntry[];
  accounts: Account[];
}

const Ledger: React.FC<LedgerProps> = ({ journals, accounts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and Sort Logic
  const filteredJournals = useMemo(() => {
    return journals.filter(entry => {
      const matchesSearch =
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (entry.referenceId && entry.referenceId.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesAccount = selectedAccount
        ? entry.lines.some(line => line.accountId === selectedAccount)
        : true;

      const matchesDate =
        (!dateRange.from || entry.date >= dateRange.from) &&
        (!dateRange.to || entry.date <= dateRange.to);

      return matchesSearch && matchesAccount && matchesDate;
    }).sort((a, b) => {
      return sortOrder === 'asc'
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    });
  }, [journals, searchTerm, selectedAccount, dateRange, sortOrder]);

  // Calculate Totals for filtered view
  const totalDebit = filteredJournals.reduce((sum, entry) =>
    sum + entry.lines.reduce((lSum, line) => lSum + line.debit, 0), 0
  );
  const totalCredit = filteredJournals.reduce((sum, entry) =>
    sum + entry.lines.reduce((lSum, line) => lSum + line.credit, 0), 0
  );

  return (
    <div className="p-4 md:p-8 space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800">دفتر کل</h2>
            <p className="text-slate-500 text-sm">General Ledger</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">چاپ</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">خروجی اکسل</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="جستجو در شرح، شماره سند..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="relative">
          <Filter className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
          >
            <option value="">همه حساب‌ها</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="از تاریخ (1403/01/01)"
            value={dateRange.from}
            onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-right"
          />
        </div>

        <div className="relative">
          <Calendar className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="تا تاریخ"
            value={dateRange.to}
            onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-right"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                <th className="p-4 text-right font-bold w-16">#</th>
                <th className="p-4 text-right font-bold w-32 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                  <div className="flex items-center gap-1">
                    تاریخ
                    <ArrowDownUp className="w-3 h-3" />
                  </div>
                </th>
                <th className="p-4 text-right font-bold w-24">شماره سند</th>
                <th className="p-4 text-right font-bold">شرح رویداد</th>
                <th className="p-4 text-right font-bold w-48">حساب معین</th>
                <th className="p-4 text-left font-bold w-32">بدهکار</th>
                <th className="p-4 text-left font-bold w-32">بستانکار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJournals.map((entry, index) => (
                <React.Fragment key={entry.id}>
                  {entry.lines.map((line, lineIndex) => (
                    <tr key={`${entry.id}-${lineIndex}`} className={`hover:bg-indigo-50/30 transition-colors ${lineIndex === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      {lineIndex === 0 && (
                        <>
                          <td className="p-4 text-slate-400 text-sm font-mono" rowSpan={entry.lines.length}>
                            {index + 1}
                          </td>
                          <td className="p-4 text-slate-700 text-sm font-medium" rowSpan={entry.lines.length}>
                            {entry.date}
                          </td>
                          <td className="p-4 text-slate-500 text-xs font-mono" rowSpan={entry.lines.length}>
                            {entry.id}
                            {entry.referenceId && (
                              <div className="text-[10px] text-slate-400 mt-1">Ref: {entry.referenceId}</div>
                            )}
                          </td>
                          <td className="p-4 text-slate-800 text-sm" rowSpan={entry.lines.length}>
                            {entry.description}
                          </td>
                        </>
                      )}
                      <td className="p-4 border-r border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{line.accountName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{line.accountId}</span>
                        </div>
                      </td>
                      <td className="p-4 text-left font-mono text-sm text-slate-600 border-r border-slate-100">
                        {line.debit > 0 ? formatPrice(line.debit) : '-'}
                      </td>
                      <td className="p-4 text-left font-mono text-sm text-slate-600 border-r border-slate-100">
                        {line.credit > 0 ? formatPrice(line.credit) : '-'}
                      </td>
                    </tr>
                  ))}
                  {/* Separator Line */}
                  <tr className="bg-slate-100 h-[1px]">
                    <td colSpan={7} className="p-0"></td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr>
                <td colSpan={5} className="p-4 text-left font-bold text-slate-600">جمع کل گردش (فیلتر شده):</td>
                <td className="p-4 text-left font-bold text-indigo-600 font-mono text-lg border-r border-slate-200">
                  {formatPrice(totalDebit)}
                </td>
                <td className="p-4 text-left font-bold text-indigo-600 font-mono text-lg border-r border-slate-200">
                  {formatPrice(totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {filteredJournals.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>هیچ سند حسابداری یافت نشد</p>
        </div>
      )}
    </div>
  );
};

export default Ledger;