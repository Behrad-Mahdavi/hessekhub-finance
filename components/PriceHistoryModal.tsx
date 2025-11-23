import React, { useMemo } from 'react';
import { InventoryItem, PurchaseRequest, TransactionStatus } from '../types';
import { toPersianDate, formatPrice, toEnglishDigits } from '../utils';
import { X, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceHistoryModalProps {
    item: InventoryItem;
    purchases: PurchaseRequest[];
    onClose: () => void;
}

const PriceHistoryModal: React.FC<PriceHistoryModalProps> = ({ item, purchases, onClose }) => {

    const priceHistory = useMemo(() => {
        // Filter purchases for this item that are approved and have inventory details
        const itemPurchases = purchases.filter(p =>
            p.isInventoryPurchase &&
            p.inventoryDetails?.itemId === item.id &&
            p.status === TransactionStatus.APPROVED
        );

        // Map to chart data format
        const data = itemPurchases.map(p => ({
            date: p.date,
            price: p.inventoryDetails?.unitPrice || 0,
            quantity: p.inventoryDetails?.quantity || 0,
            rawDate: new Date(toEnglishDigits(p.date)) // For sorting
        }));

        // Sort by date ascending
        return data.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    }, [item, purchases]);

    const stats = useMemo(() => {
        if (priceHistory.length < 2) return null;
        const firstPrice = priceHistory[0].price;
        const lastPrice = priceHistory[priceHistory.length - 1].price;
        const change = lastPrice - firstPrice;
        const percentChange = (change / firstPrice) * 100;

        return {
            firstPrice,
            lastPrice,
            change,
            percentChange,
            isIncrease: change > 0
        };
    }, [priceHistory]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-3xl flex flex-col shadow-2xl animate-fade-in-up overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp className="w-6 h-6 text-indigo-600" />
                            تاریخچه قیمت: {item.name}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">روند تغییرات قیمت خرید در طول زمان</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">اولین قیمت خرید</p>
                                <p className="font-bold text-slate-700 dir-ltr text-right">{formatPrice(stats.firstPrice)}</p>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">آخرین قیمت خرید</p>
                                <p className="font-bold text-slate-700 dir-ltr text-right">{formatPrice(stats.lastPrice)}</p>
                            </div>
                            <div className={`p-4 rounded-xl border flex items-center justify-between ${stats.isIncrease
                                    ? 'bg-rose-50 border-rose-100 text-rose-700'
                                    : 'bg-emerald-50 border-emerald-100 text-emerald-700'
                                }`}>
                                <div>
                                    <p className="text-xs opacity-80 mb-1">تغییرات قیمت</p>
                                    <p className="font-bold text-lg dir-ltr text-right">{Math.abs(stats.percentChange).toFixed(1)}%</p>
                                </div>
                                {stats.isIncrease ? <TrendingUp className="w-8 h-8 opacity-20" /> : <TrendingDown className="w-8 h-8 opacity-20" />}
                            </div>
                        </div>
                    )}

                    {/* Chart */}
                    <div className="h-[300px] w-full bg-white rounded-xl border border-slate-100 p-2">
                        {priceHistory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={priceHistory} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#64748b' }}
                                        tickFormatter={(value) => value.toLocaleString()}
                                        tickLine={false}
                                        axisLine={false}
                                        width={80}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value: number) => [formatPrice(value), 'قیمت واحد']}
                                        labelStyle={{ fontFamily: 'inherit', color: '#64748b', marginBottom: '4px' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="price"
                                        stroke="#6366f1"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorPrice)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Calendar className="w-12 h-12 mb-3 opacity-20" />
                                <p>داده‌ای برای نمایش نمودار وجود ندارد</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PriceHistoryModal;
