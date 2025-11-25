import React, { useState, useEffect } from 'react';
import {
    Trash2, Edit2, Filter, Download, Search,
    ArrowUpCircle, ArrowDownCircle, AlertCircle, CheckCircle, X
} from 'lucide-react';
import {
    subscribeToCollection,
    deleteSaleFull,
    deleteExpenseFull,
    deletePayrollFull,
    deleteInventoryUsageFull,
    editSaleFull,
    editExpenseFull,
    editPayrollFull
} from '../services/firestore';
import { SaleRecord, PurchaseRequest, PayrollPayment, InventoryTransaction, InventoryItem } from '../types';
import { toPersianNumber, formatPrice, toEnglishDigits, toPersianDate, toPersianDigits } from '../utils';
import { toast } from 'react-hot-toast';
import PersianDatePicker from './PersianDatePicker';

// Tabs
type TabType = 'ALL' | 'SALES' | 'EXPENSES' | 'INVENTORY' | 'PAYROLL';

const TransactionManager: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('ALL');
    const [sales, setSales] = useState<SaleRecord[]>([]);
    const [expenses, setExpenses] = useState<PurchaseRequest[]>([]);
    const [payroll, setPayroll] = useState<PayrollPayment[]>([]);
    const [inventory, setInventory] = useState<InventoryTransaction[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit State
    const [editingTransaction, setEditingTransaction] = useState<any>(null);
    const [editForm, setEditForm] = useState({
        amount: '',
        description: '',
        date: ''
    });

    // Subscribe to data
    useEffect(() => {
        const unsubSales = subscribeToCollection<SaleRecord>('sales', setSales);
        const unsubExpenses = subscribeToCollection<PurchaseRequest>('purchases', setExpenses);
        const unsubPayroll = subscribeToCollection<PayrollPayment>('payroll_payments', setPayroll);
        const unsubInventory = subscribeToCollection<InventoryTransaction>('inventory_transactions', setInventory);
        const unsubItems = subscribeToCollection<InventoryItem>('inventory_items', setInventoryItems);

        return () => {
            unsubSales();
            unsubExpenses();
            unsubPayroll();
            unsubInventory();
            unsubItems();
        };
    }, []);

    useEffect(() => {
        if (sales.length || expenses.length || payroll.length || inventory.length) {
            setLoading(false);
        }
    }, [sales, expenses, payroll, inventory]);

    // Normalize Data for Unified List
    const getAllTransactions = () => {
        const normalize = (t: any, type: string) => {
            let dateStr = t.date;
            let amount = t.amount;
            let displayDate = t.date;
            let quantity = 0;
            let unit = '';
            let itemName = '';

            // Handle Inventory Timestamp
            if (type === 'INVENTORY') {
                if (t.date?.toDate) {
                    const dateObj = t.date.toDate();
                    dateStr = toPersianDate(dateObj);
                    displayDate = dateStr;
                }

                // Find Item details
                const item = inventoryItems.find(i => i.id === t.itemId);
                if (item) {
                    unit = item.unit;
                    itemName = item.name;
                }
                quantity = t.quantity;
            }

            // Handle Payroll Amount
            if (type === 'PAYROLL') {
                amount = t.totalAmount;
            }

            // Handle Sales with 0 amount (Credit/Manual)
            // If amount is undefined, it remains undefined. If 0, it is 0.

            return {
                ...t,
                type,
                amount,
                quantity,
                unit,
                itemName,
                displayDate, // Keep Persian string for display
                // For sorting, we need English digits YYYY/MM/DD
                sortKey: toEnglishDigits(dateStr || '')
            };
        };

        const all = [
            ...sales.map(s => normalize(s, 'SALE')),
            ...expenses.map(e => normalize(e, 'EXPENSE')),
            ...payroll.map(p => normalize(p, 'PAYROLL')),
            ...inventory.map(i => normalize(i, 'INVENTORY'))
        ];
        return all.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
    };

    const filteredTransactions = getAllTransactions().filter(t => {
        if (activeTab === 'SALES' && t.type !== 'SALE') return false;
        if (activeTab === 'EXPENSES' && t.type !== 'EXPENSE') return false;
        if (activeTab === 'PAYROLL' && t.type !== 'PAYROLL') return false;
        if (activeTab === 'INVENTORY' && t.type !== 'INVENTORY') return false;

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            // Safe check for properties
            const desc = (t as any).description || (t as any).details || (t as any).employeeName || '';
            return desc.toLowerCase().includes(searchLower);
        }
        return true;
    });

    const handleEditClick = (transaction: any) => {
        setEditingTransaction(transaction);
        setEditForm({
            amount: transaction.amount ? transaction.amount.toString() : '',
            description: transaction.description || transaction.details || transaction.notes || '',
            date: transaction.date
        });
    };

    const handleSaveEdit = async () => {
        if (!editingTransaction) return;

        try {
            const amount = parseFloat(toEnglishDigits(editForm.amount));
            const date = editForm.date;
            const description = editForm.description;

            if (editingTransaction.type === 'SALE') {
                const newSale: SaleRecord = {
                    ...editingTransaction,
                    amount: amount,
                    date: date,
                    details: description
                };
                await editSaleFull(editingTransaction.id, newSale);
            } else if (editingTransaction.type === 'EXPENSE') {
                const newExpense: PurchaseRequest = {
                    ...editingTransaction,
                    amount: amount,
                    date: date,
                    description: description
                };
                await editExpenseFull(editingTransaction.id, newExpense);
            } else if (editingTransaction.type === 'PAYROLL') {
                const newPayment: PayrollPayment = {
                    ...editingTransaction,
                    totalAmount: amount,
                    date: date,
                    notes: description
                };
                await editPayrollFull(editingTransaction.id, newPayment);
            }

            toast.success('تراکنش با موفقیت ویرایش شد');
            setEditingTransaction(null);
        } catch (error) {
            console.error('Error editing transaction:', error);
            toast.error('خطا در ویرایش تراکنش');
        }
    };

    const handleDelete = async (transaction: any) => {
        if (!window.confirm('آیا از حذف این تراکنش و بازگرداندن تمام اثرات آن اطمینان دارید؟')) return;

        try {
            if (transaction.type === 'SALE') {
                await deleteSaleFull(transaction.id);
            } else if (transaction.type === 'EXPENSE') {
                await deleteExpenseFull(transaction.id);
            } else if (transaction.type === 'PAYROLL') {
                await deletePayrollFull(transaction.id);
            } else if (transaction.type === 'INVENTORY') {
                // We need a deleteInventoryTransactionFull but currently we have deleteInventoryUsageFull
                // Check if it's usage or purchase (purchase is EXPENSE type usually?)
                // In firestore.ts saveInventoryPurchase creates a purchase doc AND inventory transaction.
                // The purchase doc is type EXPENSE.
                // The inventory transaction is type INVENTORY.
                // If we delete the EXPENSE, we handle the inventory part in deleteExpenseFull.
                // So here 'INVENTORY' type usually means USAGE or ADJUSTMENT.
                await deleteInventoryUsageFull(transaction.id);
            }
            toast.success('تراکنش با موفقیت حذف شد و اثرات آن بازگردانده شد');
        } catch (error) {
            console.error(error);
            toast.error('خطا در حذف تراکنش');
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'SALE': return { text: 'فروش', color: 'bg-green-100 text-green-800' };
            case 'EXPENSE': return { text: 'هزینه/خرید', color: 'bg-red-100 text-red-800' };
            case 'PAYROLL': return { text: 'حقوق', color: 'bg-orange-100 text-orange-800' };
            case 'INVENTORY': return { text: 'انبار', color: 'bg-blue-100 text-blue-800' };
            default: return { text: type, color: 'bg-gray-100 text-gray-800' };
        }
    };

    return (
        <div className="p-6 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 mb-2">مدیریت تراکنش‌ها</h1>
                    <p className="text-slate-500 text-sm">مشاهده، ویرایش و حذف تراکنش‌ها با قابلیت بازگشت کامل</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="جستجو..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-4 pr-10 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-indigo-500 w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
                {[
                    { id: 'ALL', label: 'همه' },
                    { id: 'SALES', label: 'فروش‌ها' },
                    { id: 'EXPENSES', label: 'هزینه‌ها' },
                    { id: 'PAYROLL', label: 'حقوق و دستمزد' },
                    { id: 'INVENTORY', label: 'تراکنش‌های انبار' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-slate-800 text-white shadow-lg shadow-slate-200'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">تاریخ</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">نوع</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">شرح</th>
                                <th className="p-4 text-right text-xs font-bold text-slate-500 uppercase">مبلغ</th>
                                <th className="p-4 text-center text-xs font-bold text-slate-500 uppercase">عملیات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.map((t: any) => {
                                const typeStyle = getTypeLabel(t.type);
                                return (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4 text-sm font-medium text-slate-600">
                                            {toPersianDigits(t.displayDate || '')}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${typeStyle.color}`}>
                                                {typeStyle.text}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-700">
                                            {(t.description || t.details || t.employeeName || '-')}
                                            {t.type === 'EXPENSE' && t.category && <span className="text-xs text-slate-500 block mt-1">دسته: {t.category}</span>}
                                            {t.type === 'INVENTORY' && t.itemName && <span className="text-xs text-slate-500 block mt-1">کالا: {t.itemName}</span>}
                                            {t.customerName && <span className="text-xs text-slate-400 block mt-1">{t.customerName}</span>}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-slate-800">
                                            {t.type === 'INVENTORY' ? (
                                                <span dir="ltr" className="flex items-center justify-end gap-1">
                                                    {Math.abs(t.quantity)} {t.unit}
                                                    {t.quantity > 0 ? <ArrowUpCircle className="w-4 h-4 text-green-500" /> : <ArrowDownCircle className="w-4 h-4 text-amber-500" />}
                                                </span>
                                            ) : (
                                                t.amount !== undefined && t.amount !== null ? (t.amount === 0 ? '۰ تومان' : formatPrice(t.amount)) : '-'
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditClick(t)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="ویرایش"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(t)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="حذف و بازگشت اثرات"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">
                                        هیچ تراکنشی یافت نشد
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingTransaction && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">ویرایش تراکنش</h3>
                            <button
                                onClick={() => setEditingTransaction(null)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">مبلغ (تومان)</label>
                                <input
                                    type="text"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                                />
                            </div>

                            <div>
                                <PersianDatePicker
                                    label="تاریخ"
                                    value={editForm.date}
                                    onChange={(date) => setEditForm({ ...editForm, date })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">شرح</label>
                                <textarea
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 text-sm min-h-[100px]"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setEditingTransaction(null)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    انصراف
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                                >
                                    ذخیره تغییرات
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionManager;
