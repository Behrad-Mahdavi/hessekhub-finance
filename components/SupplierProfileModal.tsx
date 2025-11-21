import React from 'react';
import { Supplier, PurchaseRequest, TransactionStatus } from '../types';
import { formatPrice } from '../utils';
import { X, Phone, MapPin, User, ShoppingBag, AlertTriangle, CheckCircle } from 'lucide-react';

interface SupplierProfileModalProps {
    supplier: Supplier;
    purchases: PurchaseRequest[];
    onClose: () => void;
}

const SupplierProfileModal: React.FC<SupplierProfileModalProps> = ({ supplier, purchases, onClose }) => {
    // Filter purchases for this supplier
    // We match by ID if available, or by name as fallback
    const supplierPurchases = purchases.filter(p =>
        p.supplierId === supplier.id || p.supplier === supplier.name
    ).sort((a, b) => b.date.localeCompare(a.date));

    const totalPurchases = supplierPurchases.length;
    const totalSpent = supplierPurchases.reduce((sum, p) => sum + p.amount, 0);

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
                            <div className={`text-2xl font-bold ${supplier.balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                                {formatPrice(Math.abs(supplier.balance))}
                                <span className="text-sm font-normal mr-2 text-slate-500">
                                    {supplier.balance > 0 ? 'بدهکاریم' : 'تسویه / بستانکار'}
                                </span>
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
