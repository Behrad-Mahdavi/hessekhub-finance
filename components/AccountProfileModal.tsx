import React, { useMemo } from 'react';
import { Account, SaleRecord, PurchaseRequest, PayrollPayment, JournalEntry, AccountType, TransactionStatus } from '../types';
import { formatPrice, toPersianDate } from '../utils';
import { X, ArrowDownLeft, ArrowUpRight, FileText, ShoppingCart, Users, CreditCard, Calendar, ShoppingBag } from 'lucide-react';

interface AccountProfileModalProps {
    account: Account;
    sales: SaleRecord[];
    purchases: PurchaseRequest[];
    payrollPayments: PayrollPayment[];
    journals: JournalEntry[];
    onClose: () => void;
}

interface TransactionItem {
    id: string;
    date: string;
    type: 'DEPOSIT' | 'WITHDRAWAL';
    amount: number;
    category: 'SALE' | 'PURCHASE' | 'PAYROLL' | 'JOURNAL';
    description: string;
    referenceId?: string;
}

const AccountProfileModal: React.FC<AccountProfileModalProps> = ({
    account,
    sales,
    purchases,
    payrollPayments,
    journals,
    onClose,
}) => {

    const transactions = useMemo(() => {
        const allTransactions: TransactionItem[] = [];

        // 1. Sales (Deposits)
        sales.forEach(sale => {
            if (sale.paymentAccountId === account.id) {
                allTransactions.push({
                    id: sale.id,
                    date: sale.date,
                    type: 'DEPOSIT',
                    amount: sale.amount,
                    category: 'SALE',
                    description: sale.details || 'فروش',
                    referenceId: sale.id
                });
            }
        });

        // 2. Purchases (Withdrawals)
        purchases.forEach(purchase => {
            if (purchase.paymentAccountId === account.id && purchase.status === TransactionStatus.APPROVED) {
                allTransactions.push({
                    id: purchase.id,
                    date: purchase.date,
                    type: 'WITHDRAWAL',
                    amount: purchase.amount,
                    category: 'PURCHASE',
                    description: `${purchase.description} - ${purchase.category}`,
                    referenceId: purchase.id
                });
            }
        });

        // 3. Payroll (Withdrawals)
        payrollPayments.forEach(payment => {
            if (payment.paymentAccountId === account.id) {
                allTransactions.push({
                    id: payment.id,
                    date: payment.date,
                    type: 'WITHDRAWAL',
                    amount: payment.totalAmount,
                    category: 'PAYROLL',
                    description: `حقوق ${payment.employeeName}`,
                    referenceId: payment.id
                });
            }
        });

        // 4. Journal Entries (Mixed)
        journals.forEach(journal => {
            journal.lines.forEach(line => {
                if (line.accountId === account.id) {
                    // For Asset Accounts: Debit is Increase (Deposit), Credit is Decrease (Withdrawal)
                    // For Liability/Equity/Revenue: Credit is Increase, Debit is Decrease
                    // But usually "Bank" is an Asset account.

                    // Assuming 'account' passed here is likely an Asset account (Bank/Cash)
                    // If it's a Liability account (e.g. Credit Card Payable), logic might differ visually,
                    // but strictly speaking:
                    // Debit on Asset = Increase (+)
                    // Credit on Asset = Decrease (-)

                    if (line.debit > 0) {
                        allTransactions.push({
                            id: `${journal.id}-dr`,
                            date: journal.date,
                            type: account.type === AccountType.ASSET ? 'DEPOSIT' : 'WITHDRAWAL', // Simplified for Asset
                            amount: line.debit,
                            category: 'JOURNAL',
                            description: journal.description,
                            referenceId: journal.id
                        });
                    }

                    if (line.credit > 0) {
                        allTransactions.push({
                            id: `${journal.id}-cr`,
                            date: journal.date,
                            type: account.type === AccountType.ASSET ? 'WITHDRAWAL' : 'DEPOSIT', // Simplified for Asset
                            amount: line.credit,
                            category: 'JOURNAL',
                            description: journal.description,
                            referenceId: journal.id
                        });
                    }
                }
            });
        });

        // Sort by Date Descending
        return allTransactions.sort((a, b) => (a.date < b.date ? 1 : -1));
    }, [account, sales, purchases, payrollPayments, journals]);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'SALE': return <ShoppingCart className="w-4 h-4 text-emerald-500" />;
            case 'PURCHASE': return <ShoppingBag className="w-4 h-4 text-rose-500" />; // Need to import ShoppingBag or similar
            case 'PAYROLL': return <Users className="w-4 h-4 text-blue-500" />;
            case 'JOURNAL': return <FileText className="w-4 h-4 text-slate-500" />;
            default: return <CreditCard className="w-4 h-4 text-slate-400" />;
        }
    };

    // Helper for Purchase Icon since ShoppingBag wasn't imported initially
    const PurchaseIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-[95%] md:max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-fade-in-up">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50 rounded-t-2xl">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <CreditCard className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{account.name}</h2>
                                <div className="flex items-center gap-2 text-slate-500 text-sm font-mono">
                                    <span>{account.code}</span>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span>{account.type}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Balance Card */}
                <div className="p-6 bg-white">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                        <span className="block text-indigo-100 text-sm font-bold mb-1">موجودی فعلی</span>
                        <div className="text-3xl font-bold dir-ltr text-right font-mono tracking-tight">
                            {formatPrice(account.balance)}
                        </div>
                    </div>
                </div>

                {/* Transactions List */}
                <div className="flex-1 overflow-y-auto p-6 pt-0">
                    <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 sticky top-0 bg-white py-4 border-b border-slate-100 z-10">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        تاریخچه تراکنش‌ها
                    </h3>

                    {transactions.length === 0 ? (
                        <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>هیچ تراکنشی برای این حساب یافت نشد.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((t) => (
                                <div key={t.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all group gap-4">

                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                            }`}>
                                            {t.type === 'DEPOSIT' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                        </div>

                                        <div>
                                            <div className="font-bold text-slate-800 mb-1">{t.description}</div>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full">
                                                    {t.category === 'PURCHASE' ? <PurchaseIcon /> : getCategoryIcon(t.category)}
                                                    {t.category === 'SALE' ? 'فروش' : t.category === 'PURCHASE' ? 'خرید' : t.category === 'PAYROLL' ? 'حقوق' : 'سند'}
                                                </span>
                                                <span>
                                                    {/* If date is already a string (Persian), show it. If it needs formatting, handle carefully */}
                                                    {t.date.includes('/') ? t.date : toPersianDate(new Date(t.date))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`font-bold text-lg dir-ltr text-left md:text-right ${t.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                        {t.type === 'DEPOSIT' ? '+' : '-'}{formatPrice(t.amount).replace('تومان', '')}
                                        <span className="text-xs text-slate-400 font-normal mr-1">تومان</span>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AccountProfileModal;
