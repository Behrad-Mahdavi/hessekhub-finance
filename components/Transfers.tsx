import React, { useState, useEffect } from 'react';
import { Account, AccountType, TransferRecord } from '../types';
import { toPersianDate, formatPrice } from '../utils';
import { ArrowRightLeft, Wallet, Building2, Calendar, FileText, CheckCircle, AlertCircle, ArrowRight, History, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PersianDatePicker from './PersianDatePicker';

interface TransfersProps {
    accounts: Account[];
    transfers: TransferRecord[];
    onAddTransfer: (transfer: TransferRecord) => void;
    onDeleteTransfer: (id: string) => void;
}

const Transfers: React.FC<TransfersProps> = ({ accounts, transfers, onAddTransfer, onDeleteTransfer }) => {
    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(toPersianDate(new Date()));

    // Filter accounts: Only Assets (Cash, Bank, etc.) usually participate in transfers
    const assetAccounts = accounts.filter(a => a.type === AccountType.ASSET);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!fromAccountId || !toAccountId) {
            toast.error('لطفاً حساب مبدأ و مقصد را انتخاب کنید');
            return;
        }

        if (fromAccountId === toAccountId) {
            toast.error('حساب مبدأ و مقصد نمی‌توانند یکسان باشند');
            return;
        }

        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            toast.error('لطفاً مبلغ معتبر وارد کنید');
            return;
        }

        const sourceAccount = accounts.find(a => a.id === fromAccountId);
        const destAccount = accounts.find(a => a.id === toAccountId);

        if (!sourceAccount || !destAccount) return;

        // Check balance (optional, but good practice)
        if (sourceAccount.balance < numAmount) {
            toast('موجودی حساب مبدأ کمتر از مبلغ انتقال است، اما انتقال انجام می‌شود.', { icon: '⚠️' });
        }

        const newTransfer: TransferRecord = {
            id: `TRF-${Date.now()}`,
            fromAccountId,
            toAccountId,
            amount: numAmount,
            date,
            description: description || `انتقال از ${sourceAccount.name} به ${destAccount.name}`,
            createdAt: new Date()
        };

        onAddTransfer(newTransfer);

        // Reset form
        setAmount('');
        setDescription('');
        // Keep accounts selected for easier sequential transfers? Or reset? Let's reset for safety.
        // setFromAccountId('');
        // setToAccountId('');
        toast.success('انتقال با موفقیت انجام شد');
    };

    // Sort transfers by date desc
    const sortedTransfers = [...transfers].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return (
        <div className="p-4 md:p-8 h-full flex flex-col overflow-y-auto">
            <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">انتقال وجه (حواله)</h2>
                <p className="text-slate-500 text-sm md:text-base">جابجایی وجوه بین حساب‌های داخلی مجموعه</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                {/* Transfer Form */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-xl shadow-indigo-100 border border-indigo-50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                        <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> ثبت انتقال جدید
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Source & Dest */}
                        <div className="space-y-4 relative">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">حساب مبدأ (برداشت)</label>
                                <div className="relative">
                                    <select
                                        value={fromAccountId}
                                        onChange={(e) => setFromAccountId(e.target.value)}
                                        className="w-full p-3 pl-10 bg-rose-50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none appearance-none text-slate-700 font-medium transition-all"
                                    >
                                        <option value="">انتخاب کنید...</option>
                                        {assetAccounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({formatPrice(acc.balance)})</option>
                                        ))}
                                    </select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Wallet className="w-4 h-4 text-rose-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Arrow Indicator */}
                            <div className="flex justify-center -my-2 z-10 relative">
                                <div className="bg-white p-1.5 rounded-full shadow-md border border-slate-100 text-slate-400">
                                    <ArrowRight className="w-4 h-4 rotate-90" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">حساب مقصد (واریز)</label>
                                <div className="relative">
                                    <select
                                        value={toAccountId}
                                        onChange={(e) => setToAccountId(e.target.value)}
                                        className="w-full p-3 pl-10 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none text-slate-700 font-medium transition-all"
                                    >
                                        <option value="">انتخاب کنید...</option>
                                        {assetAccounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({formatPrice(acc.balance)})</option>
                                        ))}
                                    </select>
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <Building2 className="w-4 h-4 text-emerald-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">مبلغ انتقال (تومان)</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all dir-ltr text-left font-bold text-lg text-slate-800"
                                placeholder="0"
                            />
                            {amount && <p className="text-xs text-indigo-600 mt-1 font-bold text-left dir-ltr">{formatPrice(amount)} تومان</p>}
                        </div>

                        {/* Date */}
                        <div>
                            <PersianDatePicker
                                label="تاریخ انتقال"
                                value={date}
                                onChange={setDate}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">توضیحات (اختیاری)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                                placeholder="بابت..."
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" /> ثبت انتقال
                        </button>
                    </form>
                </div>

                {/* Recent Transfers List */}
                <div className="lg:col-span-2 flex flex-col h-full">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[600px]">
                        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <History className="w-4 h-4" /> تاریخچه انتقالات
                            </h3>
                            <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500">تعداد: {sortedTransfers.length}</span>
                        </div>

                        <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
                            <table className="w-full text-right min-w-[600px]">
                                <thead className="bg-white sticky top-0 z-10 border-b border-slate-100 shadow-sm">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">تاریخ</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">از حساب</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">به حساب</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">مبلغ</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">شرح</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {sortedTransfers.map((t) => {
                                        const fromAcc = accounts.find(a => a.id === t.fromAccountId);
                                        const toAcc = accounts.find(a => a.id === t.toAccountId);
                                        return (
                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-4 text-sm text-slate-600 font-medium">{t.date}</td>
                                                <td className="p-4 text-sm text-rose-600 font-medium">{fromAcc?.name || 'ناشناس'}</td>
                                                <td className="p-4 text-sm text-emerald-600 font-medium">{toAcc?.name || 'ناشناس'}</td>
                                                <td className="p-4 text-sm font-bold text-slate-800 dir-ltr text-left">{formatPrice(t.amount)}</td>
                                                <td className="p-4 text-sm text-slate-500">{t.description}</td>
                                                <td className="p-4">
                                                    <button
                                                        onClick={() => {
                                                            if (window.confirm('آیا از حذف این انتقال اطمینان دارید؟')) {
                                                                onDeleteTransfer(t.id);
                                                            }
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {sortedTransfers.length === 0 && (
                                        <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">هیچ انتقالی ثبت نشده است.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transfers;
