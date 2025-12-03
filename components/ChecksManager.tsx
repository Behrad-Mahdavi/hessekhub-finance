import React, { useState } from 'react';
import { PayableCheck, CheckStatus, Account, AccountType } from '../types';
import { toPersianDate, formatPrice } from '../utils';
import { CreditCard, Calendar, User, FileText, CheckCircle, XCircle, AlertTriangle, PlusCircle, History, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChecksManagerProps {
    checks: PayableCheck[];
    accounts: Account[];
    onAddCheck: (check: PayableCheck) => void;
    onUpdateCheckStatus: (checkId: string, status: CheckStatus, accountId?: string) => void;
}

const ChecksManager: React.FC<ChecksManagerProps> = ({ checks, accounts, onAddCheck, onUpdateCheckStatus }) => {
    const [activeTab, setActiveTab] = useState<'ISSUANCE' | 'HISTORY'>('ISSUANCE');

    // New Check State
    const [amount, setAmount] = useState('');
    const [payee, setPayee] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [checkNumber, setCheckNumber] = useState('');
    const [description, setDescription] = useState('');

    // Pass Check State
    const [selectedCheckId, setSelectedCheckId] = useState<string | null>(null);
    const [passAccountId, setPassAccountId] = useState('');

    const handleIssueCheck = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !payee || !dueDate || !checkNumber) {
            toast.error('لطفاً تمام فیلدهای ضروری را پر کنید');
            return;
        }

        const newCheck: PayableCheck = {
            id: `CHK-${Date.now()}`,
            checkNumber,
            amount: parseFloat(amount),
            payee,
            dueDate, // In a real app, ensure this is a valid date string
            issueDate: toPersianDate(new Date()),
            description,
            status: CheckStatus.PENDING,
            createdAt: new Date()
        };

        onAddCheck(newCheck);
        toast.success('چک با موفقیت صادر شد');

        // Reset
        setAmount('');
        setPayee('');
        setDueDate('');
        setCheckNumber('');
        setDescription('');
    };

    const handlePassCheck = () => {
        if (!selectedCheckId || !passAccountId) {
            toast.error('لطفاً حساب بانکی را انتخاب کنید');
            return;
        }
        onUpdateCheckStatus(selectedCheckId, CheckStatus.PASSED, passAccountId);
        setSelectedCheckId(null);
        setPassAccountId('');
        toast.success('چک با موفقیت پاس شد');
    };

    const handleBounceCheck = (id: string) => {
        if (window.confirm('آیا از برگشت زدن این چک اطمینان دارید؟')) {
            onUpdateCheckStatus(id, CheckStatus.BOUNCED);
        }
    };

    const handleCancelCheck = (id: string) => {
        if (window.confirm('آیا از ابطال این چک اطمینان دارید؟')) {
            onUpdateCheckStatus(id, CheckStatus.CANCELLED);
        }
    };

    const pendingChecks = checks.filter(c => c.status === CheckStatus.PENDING).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    const historyChecks = checks.filter(c => c.status !== CheckStatus.PENDING).sort((a, b) => b.issueDate.localeCompare(a.issueDate));

    return (
        <div className="p-4 md:p-8 pb-20 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">مدیریت چک‌های پرداختنی</h2>
                    <p className="text-slate-500 text-sm mt-1">صدور، پیگیری و پاس کردن چک‌ها</p>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('ISSUANCE')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'ISSUANCE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        صدور و لیست انتظار
                    </button>
                    <button
                        onClick={() => setActiveTab('HISTORY')}
                        className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        <History className="w-4 h-4 inline-block ml-1" />
                        تاریخچه
                    </button>
                </div>
            </div>

            {activeTab === 'ISSUANCE' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Issue Form */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-fit">
                        <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                            <PlusCircle className="w-5 h-5 text-indigo-500" />
                            صدور چک جدید
                        </h3>
                        <form onSubmit={handleIssueCheck} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">شماره چک</label>
                                <input
                                    type="text"
                                    value={checkNumber}
                                    onChange={e => setCheckNumber(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-left"
                                    placeholder="12345678"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">مبلغ (تومان)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-left dir-ltr"
                                    placeholder="0"
                                />
                                {amount && <p className="text-xs text-indigo-600 mt-1 dir-rtl">{formatPrice(parseFloat(amount))}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">در وجه (گیرنده)</label>
                                <input
                                    type="text"
                                    value={payee}
                                    onChange={e => setPayee(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="نام شخص یا شرکت"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">تاریخ سررسید</label>
                                <input
                                    type="text"
                                    value={dueDate}
                                    onChange={e => setDueDate(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left dir-ltr"
                                    placeholder="1403/01/01"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">توضیحات</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                                    placeholder="بابت..."
                                />
                            </div>
                            <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                ثبت و صدور چک
                            </button>
                        </form>
                    </div>

                    {/* Pending Checks List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            چک‌های در انتظار پاس ({pendingChecks.length})
                        </h3>

                        <div className="grid gap-4">
                            {pendingChecks.map(check => (
                                <div key={check.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-1 h-full bg-amber-400"></div>
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-800">چک شماره {check.checkNumber}</span>
                                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">سررسید: {check.dueDate}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">در وجه: <span className="font-bold text-slate-700">{check.payee}</span></p>
                                            <p className="text-xs text-slate-400 mt-1">{check.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                                        <span className="text-xl font-bold text-slate-800">{formatPrice(check.amount)}</span>

                                        {selectedCheckId === check.id ? (
                                            <div className="flex flex-col gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 w-full animate-fade-in">
                                                <select
                                                    value={passAccountId}
                                                    onChange={e => setPassAccountId(e.target.value)}
                                                    className="text-sm p-2 border rounded w-full"
                                                >
                                                    <option value="">انتخاب حساب کسر وجه...</option>
                                                    {accounts.filter(a => a.type === AccountType.ASSET).map(acc => (
                                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                    ))}
                                                </select>
                                                <div className="flex gap-2">
                                                    <button onClick={handlePassCheck} className="flex-1 bg-emerald-500 text-white text-xs py-1.5 rounded hover:bg-emerald-600">تایید پرداخت</button>
                                                    <button onClick={() => setSelectedCheckId(null)} className="flex-1 bg-slate-200 text-slate-600 text-xs py-1.5 rounded hover:bg-slate-300">انصراف</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 w-full md:w-auto">
                                                <button
                                                    onClick={() => setSelectedCheckId(check.id)}
                                                    className="flex-1 md:flex-none px-4 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                                                >
                                                    پاس شد
                                                </button>
                                                <button
                                                    onClick={() => handleBounceCheck(check.id)}
                                                    className="flex-1 md:flex-none px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                                                >
                                                    برگشت خورد
                                                </button>
                                                <button
                                                    onClick={() => handleCancelCheck(check.id)}
                                                    className="flex-1 md:flex-none px-3 py-2 text-slate-400 hover:text-slate-600 transition-colors"
                                                    title="ابطال"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {pendingChecks.length === 0 && (
                                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                                    چک در انتظاری وجود ندارد
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'HISTORY' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500">شماره چک</th>
                                <th className="p-4 text-xs font-bold text-slate-500">در وجه</th>
                                <th className="p-4 text-xs font-bold text-slate-500">مبلغ</th>
                                <th className="p-4 text-xs font-bold text-slate-500">تاریخ سررسید</th>
                                <th className="p-4 text-xs font-bold text-slate-500">وضعیت</th>
                                <th className="p-4 text-xs font-bold text-slate-500">تاریخ تغییر وضعیت</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {historyChecks.map(check => (
                                <tr key={check.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-mono text-slate-600">{check.checkNumber}</td>
                                    <td className="p-4 font-bold text-slate-700">{check.payee}</td>
                                    <td className="p-4 font-bold text-slate-800">{formatPrice(check.amount)}</td>
                                    <td className="p-4 text-slate-500">{check.dueDate}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${check.status === CheckStatus.PASSED ? 'bg-emerald-100 text-emerald-700' :
                                                check.status === CheckStatus.BOUNCED ? 'bg-rose-100 text-rose-700' :
                                                    'bg-slate-100 text-slate-700'
                                            }`}>
                                            {check.status === CheckStatus.PASSED ? 'پاس شده' :
                                                check.status === CheckStatus.BOUNCED ? 'برگشت خورده' : 'باطل شده'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-400 text-sm">{check.passedDate || '-'}</td>
                                </tr>
                            ))}
                            {historyChecks.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">تاریخچه‌ای موجود نیست</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ChecksManager;
