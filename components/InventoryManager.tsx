import React, { useState } from 'react';
import { InventoryItem, InventoryTransaction } from '../types';
import { Plus, Search, Package, Edit2, History, ArrowDown, AlertTriangle, Save, X } from 'lucide-react';
import { toPersianDate, formatPrice } from '../utils';
import { getInventoryTransactions } from '../services/firestore';
import InventoryAnalytics from './InventoryAnalytics';

interface InventoryManagerProps {
    inventoryItems: InventoryItem[];
    onAddItem: (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => void;
    onUpdateItem: (id: string, data: Partial<InventoryItem>) => void;
    onRegisterUsage: (itemId: string, quantity: number, description: string, date: string) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({
    inventoryItems,
    onAddItem,
    onUpdateItem,
    onRegisterUsage
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showUsageModal, setShowUsageModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [activeTab, setActiveTab] = useState<'list' | 'analysis'>('list');
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

    // Form States
    const [itemForm, setItemForm] = useState({
        name: '',
        unit: 'kg',
        reorderPoint: 5,
        currentStock: 0,
        lastCost: 0
    });

    // Fetch transactions when entering analysis tab
    React.useEffect(() => {
        if (activeTab === 'analysis') {
            fetchTransactions();
        }
    }, [activeTab]);

    const fetchTransactions = async () => {
        setIsLoadingTransactions(true);
        try {
            const data = await getInventoryTransactions();
            setTransactions(data as InventoryTransaction[]);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setIsLoadingTransactions(false);
        }
    };

    const [usageForm, setUsageForm] = useState({
        quantity: '',
        description: '',
        date: toPersianDate(new Date())
    });

    const filteredItems = inventoryItems.filter(item =>
        item.name.includes(searchTerm)
    );

    const handleAddItemSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddItem({
            name: itemForm.name,
            unit: itemForm.unit,
            reorderPoint: Number(itemForm.reorderPoint),
            currentStock: Number(itemForm.currentStock),
            lastCost: Number(itemForm.lastCost)
        });
        setShowAddModal(false);
        resetItemForm();
    };

    const handleUpdateItemSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;
        onUpdateItem(selectedItem.id, {
            name: itemForm.name,
            reorderPoint: Number(itemForm.reorderPoint)
            // Unit and Stock are usually not editable directly here to prevent data corruption, 
            // Stock is updated via Transactions.
        });
        setShowAddModal(false);
        setSelectedItem(null);
        resetItemForm();
    };

    const handleUsageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        const qty = Number(usageForm.quantity);
        if (qty <= 0) {
            alert('مقدار مصرف باید بزرگتر از صفر باشد');
            return;
        }
        if (qty > selectedItem.currentStock) {
            alert('موجودی کافی نیست!');
            return;
        }

        onRegisterUsage(selectedItem.id, qty, usageForm.description, usageForm.date);
        setShowUsageModal(false);
        setSelectedItem(null);
        setUsageForm({ quantity: '', description: '', date: toPersianDate(new Date()) });
    };

    const openEditModal = (item: InventoryItem) => {
        setSelectedItem(item);
        setItemForm({
            name: item.name,
            unit: item.unit,
            reorderPoint: item.reorderPoint,
            currentStock: item.currentStock,
            lastCost: item.lastCost
        });
        setShowAddModal(true);
    };

    const openUsageModal = (item: InventoryItem) => {
        setSelectedItem(item);
        setShowUsageModal(true);
    };

    const resetItemForm = () => {
        setItemForm({ name: '', unit: 'kg', reorderPoint: 5, currentStock: 0, lastCost: 0 });
    };

    return (
        <div className="p-4 md:p-8 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">مدیریت انبار</h2>
                    <p className="text-slate-500 text-sm md:text-base">مشاهده موجودی، تعریف کالا و ثبت مصرف</p>
                </div>
                <button
                    onClick={() => { setSelectedItem(null); resetItemForm(); setShowAddModal(true); }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 w-full md:w-auto justify-center"
                >
                    <Plus className="w-5 h-5" />
                    تعریف کالای جدید
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'list' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    لیست کالاها
                    {activeTab === 'list' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('analysis')}
                    className={`pb-2 px-4 font-medium transition-colors relative ${activeTab === 'analysis' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    گزارش مصرف
                    {activeTab === 'analysis' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full"></div>}
                </button>
            </div>

            {activeTab === 'list' ? (
                <>
                    {/* Search Bar */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="جستجو در انبار..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                        </div>
                    </div>

                    {/* Inventory Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map(item => (
                            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all relative overflow-hidden group">
                                {item.currentStock <= item.reorderPoint && (
                                    <div className="absolute top-0 right-0 bg-rose-500 text-white text-xs px-3 py-1 rounded-bl-xl font-bold flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        موجودی کم
                                    </div>
                                )}

                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg">{item.name}</h3>
                                            <p className="text-xs text-slate-500">واحد: {item.unit}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => openEditModal(item)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 mb-1">موجودی فعلی</p>
                                        <p className={`text-xl font-bold ${item.currentStock <= item.reorderPoint ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {item.currentStock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 p-3 rounded-xl">
                                        <p className="text-xs text-slate-500 mb-1">آخرین قیمت خرید</p>
                                        <p className="text-lg font-bold text-slate-800">
                                            {formatPrice(item.lastCost)}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => openUsageModal(item)}
                                    className="w-full flex items-center justify-center gap-2 bg-amber-50 text-amber-700 py-2.5 rounded-xl hover:bg-amber-100 transition-colors font-medium border border-amber-200"
                                >
                                    <ArrowDown className="w-4 h-4" />
                                    ثبت مصرف (خروج از انبار)
                                </button>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <InventoryAnalytics
                    inventoryItems={inventoryItems}
                    transactions={transactions}
                />
            )}

            {/* Add/Edit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">
                                {selectedItem ? 'ویرایش کالا' : 'تعریف کالای جدید'}
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-rose-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={selectedItem ? handleUpdateItemSubmit : handleAddItemSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">نام کالا</label>
                                <input
                                    type="text"
                                    required
                                    value={itemForm.name}
                                    onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">واحد شمارش</label>
                                    <select
                                        disabled={!!selectedItem} // Unit cannot be changed after creation
                                        value={itemForm.unit}
                                        onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50"
                                    >
                                        <option value="kg">کیلوگرم (kg)</option>
                                        <option value="gr">گرم (gr)</option>
                                        <option value="l">لیتر (l)</option>
                                        <option value="num">عدد (num)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">نقطه سفارش (هشدار)</label>
                                    <input
                                        type="number"
                                        required
                                        value={itemForm.reorderPoint}
                                        onChange={(e) => setItemForm({ ...itemForm, reorderPoint: Number(e.target.value) })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                    />
                                </div>
                            </div>

                            {!selectedItem && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">موجودی اولیه</label>
                                        <input
                                            type="number"
                                            value={itemForm.currentStock}
                                            onChange={(e) => setItemForm({ ...itemForm, currentStock: Number(e.target.value) })}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">آخرین قیمت خرید</label>
                                        <input
                                            type="number"
                                            value={itemForm.lastCost}
                                            onChange={(e) => setItemForm({ ...itemForm, lastCost: Number(e.target.value) })}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-4"
                            >
                                {selectedItem ? 'ذخیره تغییرات' : 'افزودن کالا'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Usage Modal */}
            {showUsageModal && selectedItem && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800">
                                ثبت مصرف: {selectedItem.name}
                            </h3>
                            <button onClick={() => setShowUsageModal(false)} className="text-slate-400 hover:text-rose-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleUsageSubmit} className="space-y-4">
                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-4">
                                <p className="text-sm text-amber-800">
                                    موجودی فعلی: <span className="font-bold">{selectedItem.currentStock} {selectedItem.unit}</span>
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">مقدار مصرف ({selectedItem.unit})</label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={usageForm.quantity}
                                    onChange={(e) => setUsageForm({ ...usageForm, quantity: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">توضیحات (اختیاری)</label>
                                <input
                                    type="text"
                                    placeholder="مثلاً: مصرف روزانه آشپزخانه"
                                    value={usageForm.description}
                                    onChange={(e) => setUsageForm({ ...usageForm, description: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">تاریخ</label>
                                <input
                                    type="text"
                                    value={usageForm.date}
                                    onChange={(e) => setUsageForm({ ...usageForm, date: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-right"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 mt-4"
                            >
                                ثبت خروج کالا
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryManager;
