import React, { useState } from 'react';
import { Supplier, PurchaseRequest } from '../types';
import { formatPrice } from '../utils';
import { Plus, Search, Trash2, Edit2, Store, Phone, User } from 'lucide-react';
import SupplierProfileModal from './SupplierProfileModal';

interface SupplierManagerProps {
    suppliers: Supplier[];
    purchases: PurchaseRequest[];
    onAddSupplier: (supplier: Supplier) => void;
    onUpdateSupplier: (id: string, data: Partial<Supplier>) => void;
    onDeleteSupplier: (id: string) => void;
}

const SupplierManager: React.FC<SupplierManagerProps> = ({
    suppliers,
    purchases,
    onAddSupplier,
    onUpdateSupplier,
    onDeleteSupplier
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        contactPerson: '',
        phoneNumber: '',
        address: '',
        initialBalance: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newSupplier: Supplier = {
            id: `SUP-${Date.now()}`,
            name: formData.name,
            contactPerson: formData.contactPerson,
            phoneNumber: formData.phoneNumber,
            address: formData.address,
            balance: formData.initialBalance ? parseFloat(formData.initialBalance) : 0
        };
        onAddSupplier(newSupplier);
        setShowForm(false);
        setFormData({ name: '', contactPerson: '', phoneNumber: '', address: '', initialBalance: '' });
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.name.includes(searchTerm) ||
        s.contactPerson?.includes(searchTerm) ||
        s.phoneNumber?.includes(searchTerm)
    );

    return (
        <div className="p-4 md:p-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">مدیریت تامین‌کنندگان</h2>
                    <p className="text-slate-500 text-sm md:text-base">لیست فروشگاه‌ها و طرف‌حساب‌های خرید</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 w-full md:w-auto justify-center"
                >
                    <Plus className="w-5 h-5" />
                    افزودن تامین‌کننده
                </button>
            </div>

            {/* Add Supplier Form */}
            {showForm && (
                <div className="mb-8 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 animate-fade-in-down">
                    <h3 className="text-lg font-bold text-slate-700 mb-4">اطلاعات تامین‌کننده جدید</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">نام فروشگاه / تامین‌کننده</label>
                            <input
                                required
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="مثلاً: فروشگاه قهوه تهرانی"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">نام شخص رابط</label>
                            <input
                                type="text"
                                value={formData.contactPerson}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="مثلاً: آقای محمدی"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">شماره تماس</label>
                            <input
                                type="text"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-right"
                                placeholder="0912..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">مانده حساب اولیه (تومان)</label>
                            <input
                                type="number"
                                value={formData.initialBalance}
                                onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-right"
                                placeholder="مثبت = بدهکاریم | منفی = بستانکاریم"
                            />
                            <p className="text-xs text-slate-400 mt-1">اگر به این شخص بدهکارید مبلغ مثبت وارد کنید.</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">آدرس</label>
                            <input
                                type="text"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="آدرس فروشگاه..."
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                            >
                                انصراف
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-md"
                            >
                                ثبت تامین‌کننده
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Search */}
            <div className="relative mb-6">
                <input
                    type="text"
                    placeholder="جستجو در تامین‌کنندگان..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                />
                <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            </div>

            {/* Suppliers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSuppliers.map(supplier => (
                    <div key={supplier.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                                    <Store className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">{supplier.name}</h3>
                                    {supplier.contactPerson && (
                                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                            <User className="w-3 h-3" /> {supplier.contactPerson}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => onDeleteSupplier(supplier.id)}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            {supplier.phoneNumber && (
                                <div className="flex items-center gap-2 text-sm text-slate-600">
                                    <Phone className="w-4 h-4 text-slate-400" />
                                    <span>{supplier.phoneNumber}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                                <span className="text-xs font-bold text-slate-500">مانده حساب</span>
                                <span className={`font-bold dir-ltr ${supplier.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {formatPrice(supplier.balance)}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedSupplier(supplier)}
                            className="w-full py-2 text-indigo-600 font-bold text-sm hover:bg-indigo-50 rounded-xl transition-colors border border-transparent hover:border-indigo-100"
                        >
                            مشاهده پروفایل و تاریخچه
                        </button>
                    </div>
                ))}
            </div>

            {filteredSuppliers.length === 0 && (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Store className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>هیچ تامین‌کننده‌ای یافت نشد</p>
                </div>
            )}

            {/* Profile Modal */}
            {selectedSupplier && (
                <SupplierProfileModal
                    supplier={selectedSupplier}
                    purchases={purchases}
                    onClose={() => setSelectedSupplier(null)}
                />
            )}
        </div>
    );
};

export default SupplierManager;
