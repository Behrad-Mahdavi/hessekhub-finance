import React from 'react';
import { JournalEntry } from '../types';
import { BookOpen } from 'lucide-react';

interface LedgerProps {
  journals: JournalEntry[];
}

const Ledger: React.FC<LedgerProps> = ({ journals }) => {
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-slate-200 rounded-lg">
            <BookOpen className="w-6 h-6 text-slate-700"/>
        </div>
        <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-800">دفتر کل (General Ledger)</h2>
            <p className="text-slate-500 text-xs md:text-sm">سوابق حسابداری دوطرفه (غیرقابل تغییر)</p>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        {journals.slice().reverse().map((entry) => (
          <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center flex-wrap gap-2">
              <div className="flex gap-2 md:gap-4 items-center">
                <span className="font-mono text-xs bg-slate-200 px-2 py-1 rounded text-slate-600">{entry.id}</span>
                <span className="text-sm font-semibold text-slate-800">{entry.date}</span>
                <span className="text-sm text-slate-500 italic truncate max-w-[150px] md:max-w-none">{entry.description}</span>
              </div>
              {entry.referenceId && (
                  <span className="text-xs text-slate-400">مرجع: {entry.referenceId}</span>
              )}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                <thead>
                    <tr className="text-slate-500 border-b border-slate-100">
                    <th className="text-right p-3 w-1/2 font-medium">حساب</th>
                    <th className="text-left p-3 w-1/4 font-medium">بدهکار</th>
                    <th className="text-left p-3 w-1/4 font-medium">بستانکار</th>
                    </tr>
                </thead>
                <tbody>
                    {entry.lines.map((line, idx) => (
                    <tr key={idx} className="border-b border-slate-50 last:border-0">
                        <td className="p-3 text-slate-700">
                        <div className="font-medium">{line.accountName}</div>
                        <div className="text-xs text-slate-400">کد حساب: {line.accountId}</div>
                        </td>
                        <td className="p-3 text-left font-mono text-slate-600">
                        {line.debit > 0 ? `${line.debit.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 text-left font-mono text-slate-600">
                        {line.credit > 0 ? `${line.credit.toLocaleString()}` : '-'}
                        </td>
                    </tr>
                    ))}
                    <tr className="bg-slate-50/50">
                        <td className="p-2 text-left text-xs font-bold text-slate-400 uppercase">جمع کل</td>
                        <td className="p-2 text-left text-xs font-bold text-slate-500">
                            {entry.lines.reduce((s, l) => s + l.debit, 0).toLocaleString()}
                        </td>
                        <td className="p-2 text-left text-xs font-bold text-slate-500">
                            {entry.lines.reduce((s, l) => s + l.credit, 0).toLocaleString()}
                        </td>
                    </tr>
                </tbody>
                </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Ledger;