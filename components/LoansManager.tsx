import React, { useState } from 'react';
import { Loan, LoanRepayment, Account, AccountType } from '../types';
import { toPersianDate, formatPrice } from '../utils';
import { Landmark, Calendar, Percent, DollarSign, ChevronDown, ChevronUp, PlusCircle, History, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

interface LoansManagerProps {
    loans: Loan[];
    repayments: LoanRepayment[];
    accounts: Account[];
    onAddLoan: (loan: Loan, depositAccountId: string) => void;
    onAddRepayment: (repayment: LoanRepayment) => void;
}

const LoansManager: React.FC<LoansManagerProps> = ({ loans, repayments, accounts, onAddLoan, onAddRepayment }) => {
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
    const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);

    // New Loan State
    const [lender, setLender] = useState('');
    const [amount, setAmount] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [startDate, setStartDate] = useState('');
    const [installmentsCount, setInstallmentsCount] = useState('');
    const [depositAccountId, setDepositAccountId] = useState('');

    // Repayment State
    const [repayAmount, setRepayAmount] = useState('');
    const [repayInterest, setRepayInterest] = useState('');
    const [repayAccountId, setRepayAccountId] = useState('');

    const handleAddLoan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!lender || !amount || !startDate || !depositAccountId) {
            toast.error('لطفاً فیلدهای ضروری را پر کنید');
            return;
        }

        const principal = parseFloat(amount);
        const rate = parseFloat(interestRate) || 0;

        const newLoan: Loan = {
            id: `LN-${Date.now()}`,
            lender,
            amount: principal,
            interestRate: rate,
            startDate,
            installmentsCount: parseInt(installmentsCount) || undefined,
            remainingBalance: principal, // Initial remaining balance is the principal
            status: 'ACTIVE',
            createdAt: new Date()
        };

        onAddLoan(newLoan, depositAccountId);
        toast.success('وام جدید ثبت شد');

        // Reset
        setLender('');
        setAmount('');
        setInterestRate('');
        setStartDate('');
        setInstallmentsCount('');
        setDepositAccountId('');
    };

    const handleRepayment = (loanId: string) => {
        if (!repayAmount || !repayAccountId) {
            toast.error('لطفاً مبلغ و حساب پرداخت را وارد کنید');
            return;
        }

        const totalPayment = parseFloat(repayAmount);
        const interestPart = parseFloat(repayInterest) || 0;
        const principalPart = totalPayment - interestPart;

        if (principalPart < 0) {
            toast.error('مبلغ بهره نمی‌تواند بیشتر از کل قسط باشد');
            return;
        }

        const newRepayment: LoanRepayment = {
            id: `LRP-${Date.now()}`,
            loanId,
            amount: totalPayment,
            principalAmount: principalPart,
            interestAmount: interestPart,
            date: toPersianDate(new Date()),
            paymentAccountId: repayAccountId
        };

        onAddRepayment(newRepayment);
        toast.success('قسط با موفقیت پرداخت شد');

        setRepayAmount('');
        setRepayInterest('');
        setRepayAccountId('');
    };

    const activeLoans = loans.filter(l => l.status === 'ACTIVE');
    const paidOffLoans = loans.filter(l => l.status === 'PAID_OFF');

    return (
        <div className="p-4 md:p-8 pb-20 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">مدیریت تسهیلات و وام‌ها</h2>
                    <p className="text-slate-500 text-sm mt-1">ثبت وام‌های دریافتی و مدیریت بازپرداخت اقساط</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add Loan Form */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 h-fit">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <PlusCircle className="w-5 h-5 text-indigo-500" />
                        ثبت وام جدید
                    </h3>
                    <form onSubmit={handleAddLoan} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">نام وام‌دهنده (بانک/شخص)</label>
                            <input
                                type="text"
                                value={lender}
                                onChange={e => setLender(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="مثلاً: بانک ملت"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">مبلغ اصل وام</label>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-left dir-ltr"
                                placeholder="0"
                            />
                            {amount && <p className="text-xs text-indigo-600 mt-1 dir-rtl">{formatPrice(parseFloat(amount))}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">نرخ سود (%)</label>
                                <input
                                    type="number"
                                    value={interestRate}
                                    onChange={e => setInterestRate(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                                    placeholder="18"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">تعداد اقساط</label>
                                <input
                                    type="number"
                                    value={installmentsCount}
                                    onChange={e => setInstallmentsCount(e.target.value)}
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center"
                                    placeholder="12"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">حساب واریز وام</label>
                            <select
                                value={depositAccountId}
                                onChange={e => setDepositAccountId(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                            >
                                <option value="">انتخاب حساب...</option>
                                {accounts.filter(a => a.type === AccountType.ASSET).map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">تاریخ دریافت</label>
                            <input
                                type="text"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-left dir-ltr"
                                placeholder="1403/01/01"
                            />
                        </div>
                        <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                            ثبت وام
                        </button>
                    </form>
                </div>

                {/* Loans List */}
                <div className="lg:col-span-2 space-y-6">
                    {activeLoans.map(loan => (
                        <div key={loan.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                        <Landmark className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{loan.lender}</h3>
                                        <div className="flex gap-3 text-xs text-slate-500 mt-1">
                                            <span>تاریخ: {loan.startDate}</span>
                                            <span>•</span>
                                            <span>سود: {loan.interestRate}%</span>
                                            {loan.installmentsCount && (
                                                <>
                                                    <span>•</span>
                                                    <span>{loan.installmentsCount} قسط</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <div className="text-sm text-slate-500">مانده اصل وام</div>
                                    <div className="text-2xl font-bold text-slate-800">{formatPrice(loan.remainingBalance)}</div>
                                    <div className="text-xs text-slate-400 mt-1">از کل: {formatPrice(loan.amount)}</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-slate-100 h-2">
                                <div
                                    className="bg-indigo-500 h-2 transition-all duration-1000"
                                    style={{ width: `${((loan.amount - loan.remainingBalance) / loan.amount) * 100}%` }}
                                ></div>
                            </div>

                            {/* Repayment Section */}
                            <div className="p-4">
                                <button
                                    onClick={() => setExpandedLoanId(expandedLoanId === loan.id ? null : loan.id)}
                                    className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                                >
                                    {expandedLoanId === loan.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    پرداخت قسط / مشاهده جزئیات
                                </button>

                                {expandedLoanId === loan.id && (
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                            <h4 className="font-bold text-indigo-800 mb-3 text-sm flex items-center gap-2">
                                                <Wallet className="w-4 h-4" />
                                                پرداخت قسط جدید
                                            </h4>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-indigo-700 mb-1">مبلغ کل پرداختی (اصل + سود)</label>
                                                    <input
                                                        type="number"
                                                        value={repayAmount}
                                                        onChange={e => setRepayAmount(e.target.value)}
                                                        className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-indigo-700 mb-1">سهم سود از این پرداخت (اختیاری)</label>
                                                    <input
                                                        type="number"
                                                        value={repayInterest}
                                                        onChange={e => setRepayInterest(e.target.value)}
                                                        className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                        placeholder="0"
                                                    />
                                                    <p className="text-[10px] text-indigo-500 mt-1">اگر خالی باشد، کل مبلغ از اصل وام کسر می‌شود.</p>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-indigo-700 mb-1">حساب پرداخت کننده</label>
                                                    <select
                                                        value={repayAccountId}
                                                        onChange={e => setRepayAccountId(e.target.value)}
                                                        className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm"
                                                    >
                                                        <option value="">انتخاب حساب...</option>
                                                        {accounts.filter(a => a.type === AccountType.ASSET).map(acc => (
                                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => handleRepayment(loan.id)}
                                                    className="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
                                                >
                                                    ثبت پرداخت
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="font-bold text-slate-700 text-sm mb-2">تاریخچه پرداخت‌ها</h4>
                                            <div className="max-h-[250px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
                                                {repayments.filter(r => r.loanId === loan.id).map(r => (
                                                    <div key={r.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                                                        <div className="flex justify-between font-bold text-slate-700 mb-1">
                                                            <span>{r.date}</span>
                                                            <span>{formatPrice(r.amount)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-slate-400">
                                                            <span>اصل: {formatPrice(r.principalAmount)}</span>
                                                            <span>سود: {formatPrice(r.interestAmount)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {repayments.filter(r => r.loanId === loan.id).length === 0 && (
                                                    <p className="text-slate-400 text-xs italic">هنوز پرداختی ثبت نشده است.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {activeLoans.length === 0 && (
                        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-400">
                            هیچ وام فعالی وجود ندارد
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoansManager;
