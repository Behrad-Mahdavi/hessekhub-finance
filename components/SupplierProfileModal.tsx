import React, { useState } from 'react';
import { Supplier, PurchaseRequest, TransactionStatus, Account, AccountType } from '../types';
import { formatPrice, toPersianDate } from '../utils';
import { X, Phone, MapPin, User, ShoppingBag, AlertTriangle, CheckCircle, CreditCard, Calendar } from 'lucide-react';

interface SupplierProfileModalProps {
    supplier: Supplier;
    purchases: PurchaseRequest[];
    accounts: Account[];
    onClose: () => void;
    onPayment: (supplierId: string, amount: number, accountId: string, date: string, description: string) => void;
}

const SupplierProfileModal: React.FC<SupplierProfileModalProps> = ({ supplier, purchases, accounts, onClose, onPayment }) => {
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        accountId: '',
        date: toPersianDate(new Date()),
        description: ''
    });

    // Filter purchases for this supplier
    const supplierPurchases = purchases.filter(p =>
        p.supplierId === supplier.id || p.supplier === supplier.name
    ).sort((a, b) => b.date.localeCompare(a.date));

    const totalPurchases = supplierPurchases.length;
    const totalSpent = supplierPurchases.reduce((sum, p) => sum + p.amount, 0);

    const handlePaymentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentData.amount || !paymentData.accountId) return;

        onPayment(
            supplier.id,
            parseFloat(paymentData.amount),
            paymentData.accountId,
            paymentData.date,
            paymentData.description || `پرداخت به ${supplier.name}`
        );
        setShowPaymentForm(false);
        setPaymentData({ amount: '', accountId: '', date: toPersianDate(new Date()), description: '' });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-200">
                                {supplier.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{supplier.name}</h2>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                    {supplier.contactPerson && (
                                        <span className="flex items-center gap-1">
                                            <User className="w-4 h-4" />
                                            {supplier.contactPerson}
                                        </span>
                                    )}
                                    {supplier.phoneNumber && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-4 h-4" />
                                            {supplier.phoneNumber}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-xl border ${supplier.balance > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                            <span className={`block text-xs font-bold uppercase mb-2 ${supplier.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                وضعیت حساب
                            </span>
                            <div className="flex justify-between items-end">
                                <div className={`text-2xl font-bold ${supplier.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                    {formatPrice(Math.abs(supplier.balance))}
                                    <span className="text-sm font-normal mr-2 text-slate-500">
                                        {supplier.balance > 0 ? 'بدهکاریم' : 'تسویه / بستانکار'}
                                    </span>
                                </div>
                                {supplier.balance > 0 && (
                                    <button
                                        onClick={() => setShowPaymentForm(!showPaymentForm)}
                                        className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                                    >
                                        ثبت پرداخت
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <span className="block text-xs font-bold text-slate-500 uppercase mb-2">تعداد خریدها</span>
                            <div className="text-2xl font-bold text-slate-700">{totalPurchases}</div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <span className="block text-xs font-bold text-slate-500 uppercase mb-2">مجموع خرید</span>
                            <div className="text-2xl font-bold text-slate-700 dir-ltr">{formatPrice(totalSpent)}</div>
                        </div>
                    </div>

                    {/* Payment Form */}
                    {showPaymentForm && (
                        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 animate-fade-in-down">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-indigo-600" />
                                ثبت پرداخت به تامین‌کننده
                            </h3>
                            <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">مبلغ پرداختی (تومان)</label>
                                    <input
                                        required
                                        type="number"
                                        value={paymentData.amount}
                                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-right"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">از حساب</label>
                                    <select
                                        required
                                        value={paymentData.accountId}
                                        onChange={(e) => setPaymentData({ ...paymentData, accountId: e.target.value })}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    >
                                        <option value="">انتخاب کنید...</option>
                                        {accounts.filter(a => a.type === AccountType.ASSET).map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({formatPrice(acc.balance)})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">تاریخ</label>
                                    <input
                                        type="text"
                                        value={paymentData.date}
                                        onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-right"
                                        placeholder="1403/01/01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">توضیحات</label>
                                    <input
                                        type="text"
                                        value={paymentData.description}
                                        onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="بابت..."
                                    />
                                </div>
                                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentForm(false)}
                                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-md"
                                    >
                                        ثبت پرداخت
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Purchase History */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-indigo-600" />
                            تاریخچه خریدها
                        </h3>

                        {supplierPurchases.length === 0 ? (
                            <div className="bg-slate-50 p-8 rounded-xl text-center text-slate-400 border border-slate-100">
                                هنوز خریدی از این تامین‌کننده ثبت نشده است
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-3 text-right text-xs font-bold text-slate-600">تاریخ</th>
                                            <th className="p-3 text-right text-xs font-bold text-slate-600">شرح</th>
                                            <th className="p-3 text-right text-xs font-bold text-slate-600">مبلغ</th>
                                            <th className="p-3 text-right text-xs font-bold text-slate-600">وضعیت پرداخت</th>
                                            <th className="p-3 text-right text-xs font-bold text-slate-600">وضعیت سفارش</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {supplierPurchases.map(purchase => (
                                            <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-3 text-sm text-slate-700">{purchase.date}</td>
                                                <td className="p-3 text-sm text-slate-700">
                                                    <div className="font-medium">{purchase.category}</div>
                                                    <div className="text-xs text-slate-500">{purchase.description}</div>
                                                </td>
                                                <td className="p-3 text-sm font-bold text-slate-800 dir-ltr">
                                                    {formatPrice(purchase.amount)}
                                                </td>
                                                <td className="p-3">
                                                    {purchase.isCredit ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                                                            <AlertTriangle className="w-3 h-3" /> نسیه
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                                                            <CheckCircle className="w-3 h-3" /> پرداخت شده
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded ${purchase.status === TransactionStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                                                        purchase.status === TransactionStatus.REJECTED ? 'bg-rose-100 text-rose-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {purchase.status === TransactionStatus.APPROVED ? 'تایید شده' :
                                                            purchase.status === TransactionStatus.REJECTED ? 'رد شده' : 'در انتظار'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupplierProfileModal;
