import React, { useState, useEffect } from 'react';
import { Account, AccountType, TransferRecord, TransferType, Customer, Supplier, Employee } from '../types';
import { toPersianDate, formatPrice } from '../utils';
import { ArrowRightLeft, Wallet, Building2, Calendar, FileText, CheckCircle, AlertCircle, ArrowRight, History, Trash2, User, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import PersianDatePicker from './PersianDatePicker';

interface TransfersProps {
    accounts: Account[];
    transfers: TransferRecord[];
    customers: Customer[];
    suppliers: Supplier[];
    employees: Employee[];
    onAddTransfer: (transfer: TransferRecord) => void;
    onDeleteTransfer: (id: string) => void;
}

const Transfers: React.FC<TransfersProps> = ({ accounts, transfers, customers, suppliers, employees, onAddTransfer, onDeleteTransfer }) => {
    const [transferType, setTransferType] = useState<TransferType>(TransferType.ACCOUNT_TO_ACCOUNT);
    const [fromAccountId, setFromAccountId] = useState('');
    const [toAccountId, setToAccountId] = useState('');
    const [fromPersonId, setFromPersonId] = useState('');
    const [toPersonId, setToPersonId] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(toPersianDate(new Date()));

    // Filter accounts: Only Assets (Cash, Bank, etc.) usually participate in transfers
    const assetAccounts = accounts.filter(a => a.type === AccountType.ASSET);

    // Platform Sources
    const PLATFORMS = [
        { id: 'PLATFORM-SNAPP', name: 'اسنپ فود', type: 'پلتفرم' },
        { id: 'PLATFORM-TAPSI', name: 'تپسی فود', type: 'پلتفرم' },
        { id: 'PLATFORM-FOODEX', name: 'فودکس', type: 'پلتفرم' }
    ];

    // Combine all people for selection
    const allPeople = [
        ...PLATFORMS,
        ...customers.map(c => ({ id: c.id, name: c.name, type: 'مشتری' })),
        ...suppliers.map(s => ({ id: s.id, name: s.name, type: 'تامین‌کننده' })),
        ...employees.map(e => ({ id: e.id, name: e.fullName, type: 'پرسنل' }))
    ];

    const getPersonName = (id: string) => allPeople.find(p => p.id === id)?.name || 'ناشناس';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation based on type
        if (transferType === TransferType.ACCOUNT_TO_ACCOUNT) {
            if (!fromAccountId || !toAccountId) { toast.error('لطفاً حساب مبدأ و مقصد را انتخاب کنید'); return; }
            if (fromAccountId === toAccountId) { toast.error('حساب مبدأ و مقصد نمی‌توانند یکسان باشند'); return; }
        } else if (transferType === TransferType.PERSON_TO_PERSON) {
            if (!fromPersonId || !toPersonId) { toast.error('لطفاً شخص مبدأ و مقصد را انتخاب کنید'); return; }
            if (fromPersonId === toPersonId) { toast.error('شخص مبدأ و مقصد نمی‌توانند یکسان باشند'); return; }
        } else if (transferType === TransferType.PERSON_TO_BANK) {
            if (!fromPersonId || !toAccountId) { toast.error('لطفاً شخص و حساب مقصد را انتخاب کنید'); return; }
        } else if (transferType === TransferType.BANK_TO_PERSON) {
            if (!fromAccountId || !toPersonId) { toast.error('لطفاً حساب مبدأ و شخص را انتخاب کنید'); return; }
        }

        const numAmount = parseFloat(amount);
        if (!numAmount || numAmount <= 0) {
            toast.error('لطفاً مبلغ معتبر وارد کنید');
            return;
        }

        let desc = description;
        if (!desc) {
            if (transferType === TransferType.ACCOUNT_TO_ACCOUNT) {
                const source = accounts.find(a => a.id === fromAccountId)?.name;
                const dest = accounts.find(a => a.id === toAccountId)?.name;
                desc = `انتقال از ${source} به ${dest}`;
            } else if (transferType === TransferType.PERSON_TO_PERSON) {
                const source = getPersonName(fromPersonId);
                const dest = getPersonName(toPersonId);
                desc = `انتقال از ${source} به ${dest}`;
            } else if (transferType === TransferType.PERSON_TO_BANK) {
                const source = getPersonName(fromPersonId);
                const dest = accounts.find(a => a.id === toAccountId)?.name;
                desc = `واریز توسط ${source} به ${dest}`;
            } else if (transferType === TransferType.BANK_TO_PERSON) {
                const source = accounts.find(a => a.id === fromAccountId)?.name;
                const dest = getPersonName(toPersonId);
                desc = `پرداخت از ${source} به ${dest}`;
            }
        }

        const newTransfer: TransferRecord = {
            id: `TRF-${Date.now()}`,
            type: transferType,
            fromAccountId: (transferType === TransferType.ACCOUNT_TO_ACCOUNT || transferType === TransferType.BANK_TO_PERSON) ? fromAccountId : undefined,
            toAccountId: (transferType === TransferType.ACCOUNT_TO_ACCOUNT || transferType === TransferType.PERSON_TO_BANK) ? toAccountId : undefined,
            fromPersonId: (transferType === TransferType.PERSON_TO_PERSON || transferType === TransferType.PERSON_TO_BANK) ? fromPersonId : undefined,
            toPersonId: (transferType === TransferType.PERSON_TO_PERSON || transferType === TransferType.BANK_TO_PERSON) ? toPersonId : undefined,
            amount: numAmount,
            date,
            description: desc,
            createdAt: new Date()
        };

        onAddTransfer(newTransfer);

        // Reset form
        setAmount('');
        setDescription('');
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
                        {/* Type Selector */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <button
                                type="button"
                                onClick={() => setTransferType(TransferType.ACCOUNT_TO_ACCOUNT)}
                                className={`p-2 text-xs font-bold rounded-lg border ${transferType === TransferType.ACCOUNT_TO_ACCOUNT ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                                حساب به حساب
                            </button>
                            <button
                                type="button"
                                onClick={() => setTransferType(TransferType.PERSON_TO_PERSON)}
                                className={`p-2 text-xs font-bold rounded-lg border ${transferType === TransferType.PERSON_TO_PERSON ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                                شخص به شخص
                            </button>
                            <button
                                type="button"
                                onClick={() => setTransferType(TransferType.PERSON_TO_BANK)}
                                className={`p-2 text-xs font-bold rounded-lg border ${transferType === TransferType.PERSON_TO_BANK ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                                شخص به بانک
                            </button>
                            <button
                                type="button"
                                onClick={() => setTransferType(TransferType.BANK_TO_PERSON)}
                                className={`p-2 text-xs font-bold rounded-lg border ${transferType === TransferType.BANK_TO_PERSON ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-slate-500 border-slate-200'}`}
                            >
                                بانک به شخص
                            </button>
                        </div>

                        {/* Source & Dest */}
                        <div className="space-y-4 relative">
                            {/* Source Field */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    {(transferType === TransferType.ACCOUNT_TO_ACCOUNT || transferType === TransferType.BANK_TO_PERSON) ? 'حساب مبدأ (برداشت)' : 'شخص مبدأ (پرداخت کننده)'}
                                </label>
                                <div className="relative">
                                    {(transferType === TransferType.ACCOUNT_TO_ACCOUNT || transferType === TransferType.BANK_TO_PERSON) ? (
                                        <select
                                            value={fromAccountId}
                                            onChange={(e) => setFromAccountId(e.target.value)}
                                            className="w-full p-3 pl-10 bg-rose-50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none appearance-none text-slate-700 font-medium transition-all"
                                        >
                                            <option value="">انتخاب حساب...</option>
                                            {assetAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({formatPrice(acc.balance)})</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <select
                                            value={fromPersonId}
                                            onChange={(e) => setFromPersonId(e.target.value)}
                                            className="w-full p-3 pl-10 bg-rose-50 border border-rose-100 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none appearance-none text-slate-700 font-medium transition-all"
                                        >
                                            <option value="">انتخاب شخص...</option>
                                            {allPeople.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                            ))}
                                        </select>
                                    )}
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        {(transferType === TransferType.ACCOUNT_TO_ACCOUNT || transferType === TransferType.BANK_TO_PERSON) ? <Wallet className="w-4 h-4 text-rose-400" /> : <User className="w-4 h-4 text-rose-400" />}
                                    </div>
                                </div>
                            </div>

                            {/* Arrow Indicator */}
                            <div className="flex justify-center -my-2 z-10 relative">
                                <div className="bg-white p-1.5 rounded-full shadow-md border border-slate-100 text-slate-400">
                                    <ArrowRight className="w-4 h-4 rotate-90" />
                                </div>
                            </div>

                            {/* Dest Field */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                    {(transferType === TransferType.ACCOUNT_TO_ACCOUNT || transferType === TransferType.PERSON_TO_BANK) ? 'حساب مقصد (واریز)' : 'شخص مقصد (دریافت کننده)'}
                                </label>
                                <div className="relative">
                                    {(transferType === TransferType.ACCOUNT_TO_ACCOUNT || transferType === TransferType.PERSON_TO_BANK) ? (
                                        <select
                                            value={toAccountId}
                                            onChange={(e) => setToAccountId(e.target.value)}
                                            className="w-full p-3 pl-10 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none text-slate-700 font-medium transition-all"
                                        >
                                            <option value="">انتخاب حساب...</option>
                                            {assetAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name} ({formatPrice(acc.balance)})</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <select
                                            value={toPersonId}
                                            onChange={(e) => setToPersonId(e.target.value)}
                                            className="w-full p-3 pl-10 bg-emerald-50 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none text-slate-700 font-medium transition-all"
                                        >
                                            <option value="">انتخاب شخص...</option>
                                            {allPeople.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                                            ))}
                                        </select>
                                    )}
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        {(transferType === TransferType.ACCOUNT_TO_ACCOUNT || transferType === TransferType.PERSON_TO_BANK) ? <Building2 className="w-4 h-4 text-emerald-400" /> : <User className="w-4 h-4 text-emerald-400" />}
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
                                        let fromName = 'ناشناس';
                                        let toName = 'ناشناس';

                                        if (t.type === TransferType.ACCOUNT_TO_ACCOUNT) {
                                            fromName = accounts.find(a => a.id === t.fromAccountId)?.name || 'ناشناس';
                                            toName = accounts.find(a => a.id === t.toAccountId)?.name || 'ناشناس';
                                        } else if (t.type === TransferType.PERSON_TO_PERSON) {
                                            fromName = getPersonName(t.fromPersonId || '');
                                            toName = getPersonName(t.toPersonId || '');
                                        } else if (t.type === TransferType.PERSON_TO_BANK) {
                                            fromName = getPersonName(t.fromPersonId || '');
                                            toName = accounts.find(a => a.id === t.toAccountId)?.name || 'ناشناس';
                                        } else if (t.type === TransferType.BANK_TO_PERSON) {
                                            fromName = accounts.find(a => a.id === t.fromAccountId)?.name || 'ناشناس';
                                            toName = getPersonName(t.toPersonId || '');
                                        } else {
                                            // Fallback for legacy records
                                            fromName = accounts.find(a => a.id === t.fromAccountId)?.name || 'ناشناس';
                                            toName = accounts.find(a => a.id === t.toAccountId)?.name || 'ناشناس';
                                        }

                                        return (
                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="p-4 text-sm text-slate-600 font-medium">{t.date}</td>
                                                <td className="p-4 text-sm text-rose-600 font-medium">{fromName}</td>
                                                <td className="p-4 text-sm text-emerald-600 font-medium">{toName}</td>
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
