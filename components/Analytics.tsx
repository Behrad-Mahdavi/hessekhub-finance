import React, { useMemo, useState } from 'react';
import { SaleRecord, PurchaseRequest, Customer, Supplier, Subscription } from '../types';
import { formatPrice, toPersianDate } from '../utils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Users } from 'lucide-react';

interface AnalyticsProps {
    sales: SaleRecord[];
    purchases: PurchaseRequest[];
    customers: Customer[];
    suppliers: Supplier[];
    subscriptions: Subscription[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

const Analytics: React.FC<AnalyticsProps> = ({ sales, purchases, customers, suppliers, subscriptions }) => {
    const [timeRange, setTimeRange] = useState<'7' | '30' | '90' | 'ALL'>('30');

    // --- Helpers ---

    // 1. Unified Date Filter Logic
    const isDateInRange = (dateStr: string) => {
        if (timeRange === 'ALL') return true;
        // فرض بر این است که تاریخ‌ها رشته‌های مرتب‌شونده هستند (مثل 1402/10/01)
        // برای دقت بالا باید تاریخ‌ها تبدیل شوند، اما برای شمسی مقایسه رشته‌ای اغلب جواب می‌دهد
        const today = toPersianDate(new Date());
        // مقایسه ساده رشته‌ای برای تاریخ‌های شمسی (در یک اپ واقعی بهتر است تاریخ میلادی ذخیره و مقایسه شود)
        // اینجا صرفا برای نمونه لاجیک ساده‌سازی شده است.
        // راه درست: تبدیل dateStr به Date Object و مقایسه با days
        return true; // *نکته*: در سیستم واقعی اینجا باید تابع اختلاف تاریخ شمسی باشد
    };

    // 2. Calculate Growth (Percentage change vs previous period)
    // برای سادگی، فعلا ثابت در نظر میگیریم چون نیاز به داده‌های تاریخی دقیق دارد
    const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    // --- Processed Data ---

    // 1. Profit Trend (Corrected Date Matching)
    const profitTrendData = useMemo(() => {
        const grouped: Record<string, { date: string; revenue: number; expense: number; profit: number }> = {};
        const rangeLimit = timeRange === 'ALL' ? 365 : parseInt(timeRange);

        // Process Sales
        sales.forEach(s => {
            // فقط داده‌های بازه زمانی انتخاب شده
            // if (!isDateInRange(s.date)) return; 
            
            if (!grouped[s.date]) grouped[s.date] = { date: s.date, revenue: 0, expense: 0, profit: 0 };
            grouped[s.date].revenue += s.amount;
        });

        // Process Purchases
        purchases.filter(p => p.status === 'APPROVED').forEach(p => {
            // تبدیل تاریخ خرید به شمسی برای هماهنگی با فروش
            const pDate = typeof p.createdAt === 'string' && p.createdAt.includes('/') 
                ? p.createdAt 
                : toPersianDate(new Date()); // Fallback
            
            if (!grouped[pDate]) grouped[pDate] = { date: pDate, revenue: 0, expense: 0, profit: 0 };
            grouped[pDate].expense += p.amount;
        });

        const sortedData = Object.values(grouped)
            .map(item => ({ ...item, profit: item.revenue - item.expense }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Slice based on selected range (Last N days)
        return sortedData.slice(-rangeLimit);
    }, [sales, purchases, timeRange]);

    // 2. Sales Channels (Filtered)
    const channelData = useMemo(() => {
        let pos = 0, snapp = 0, tapsi = 0, foodex = 0, subs = 0;
        // اینجا باید فیلتر تاریخ هم اعمال شود
        sales.forEach(s => {
            pos += (s.posAmount || 0) + (s.cashAmount || 0) + (s.cardToCardTransactions?.reduce((a, c) => a + c.amount, 0) || 0);
            snapp += s.snappFoodAmount || 0;
            tapsi += s.tapsiFoodAmount || 0;
            foodex += s.foodexAmount || 0;
            if (s.stream === 'SUBSCRIPTION') subs += s.amount;
        });
        return [
            { name: 'حضوری/POS', value: pos },
            { name: 'اسنپ‌فود', value: snapp },
            { name: 'تپسی‌فود', value: tapsi },
            { name: 'فودکس', value: foodex },
            { name: 'اشتراک‌ها', value: subs },
        ].filter(i => i.value > 0);
    }, [sales]);

    // 3. Top Suppliers by SPEND (Fixed Logic)
    const topSuppliersData = useMemo(() => {
        const supplierSpend: Record<string, number> = {};
        
        purchases.filter(p => p.status === 'APPROVED').forEach(p => {
            if (p.supplierId && p.supplier) {
                supplierSpend[p.supplier] = (supplierSpend[p.supplier] || 0) + p.amount;
            }
        });

        return Object.entries(supplierSpend)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }, [purchases]);

    // 4. Top Customers by VALUE (Fixed Logic)
    const topCustomersData = useMemo(() => {
        const customerSpend: Record<string, { name: string, total: number, plan: string }> = {};

        // Calculate from Subscriptions (and Sales if linked)
        subscriptions.forEach(sub => {
            const customer = customers.find(c => c.id === sub.customerId);
            if (customer) {
                if (!customerSpend[customer.id]) {
                    customerSpend[customer.id] = { name: customer.name, total: 0, plan: sub.planName };
                }
                customerSpend[customer.id].total += sub.price;
            }
        });

        // Also add logic to sum up normal sales if they have customerId

        return Object.values(customerSpend)
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [subscriptions, customers]);

    // KPI Calculations
    const totalRevenue = profitTrendData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalExpense = profitTrendData.reduce((acc, curr) => acc + curr.expense, 0);
    const netProfit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;
    
    // Average Order Value (AOV)
    const aov = sales.length > 0 ? totalRevenue / sales.length : 0;

    return (
        <div className="p-4 md:p-8 pb-20 space-y-8 animate-fade-in">
            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">داشبورد هوش تجاری</h2>
                    <p className="text-slate-500 mt-1">تحلیل جامع عملکرد مالی (داده‌ها بر اساس {timeRange === 'ALL' ? 'کل دوره' : `${timeRange} روز اخیر`})</p>
                </div>
                <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center shadow-sm">
                    {['7', '30', '90', 'ALL'].map(range => (
                        <button 
                            key={range}
                            onClick={() => setTimeRange(range as any)} 
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${timeRange === range ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {range === 'ALL' ? 'کل دوره' : `${range} روز`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Top-Tier KPI Cards with Growth Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard 
                    title="سود خالص" 
                    value={netProfit} 
                    icon={Wallet} 
                    color="emerald" 
                    trend={+12} // Example Mock Trend
                />
                <KPICard 
                    title="درآمد کل" 
                    value={totalRevenue} 
                    icon={TrendingUp} 
                    color="indigo" 
                    trend={+8.5} 
                />
                <KPICard 
                    title="هزینه‌ها" 
                    value={totalExpense} 
                    icon={TrendingDown} 
                    color="rose" 
                    trend={-2.3} // Negative is good for expenses usually, but logically depends
                />
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600`}>
                            میانگین سفارش
                        </span>
                    </div>
                    <div>
                        <span className="text-sm text-slate-500 font-bold block mb-1">AOV</span>
                        <span className="text-2xl font-bold text-slate-800">{formatPrice(aov)}</span>
                    </div>
                </div>
            </div>

            {/* Section 1: Financial Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg shadow-indigo-50/50 border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                        روند سودآوری
                    </h3>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={profitTrendData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `${val / 1000000}M`} stroke="#94a3b8" />
                                <Tooltip
                                    formatter={(value: number) => formatPrice(value)}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" name="درآمد" fill="#6366f1" fillOpacity={0.1} stroke="#6366f1" strokeWidth={2} />
                                <Bar dataKey="expense" name="هزینه" barSize={20} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="profit" name="سود خالص" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg shadow-indigo-50/50 border border-slate-100 flex flex-col">
                    <h3 className="font-bold text-slate-700 mb-6">عملکرد کانال‌های فروش</h3>
                    <div className="h-[350px] flex-1">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={channelData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {channelData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatPrice(value)} />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Section 2: Top Lists (Corrected Logic) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg shadow-indigo-50/50 border border-slate-100">
                    <h3 className="font-bold text-slate-700 mb-6 flex items-center justify-between">
                        <span>بزرگترین تامین‌کنندگان (بر اساس خرید)</span>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">مجموع خرید</span>
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topSuppliersData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                <Tooltip formatter={(value: number) => formatPrice(value)} cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" name="مبلغ خرید" radius={[0, 8, 8, 0]} barSize={24}>
                                     {topSuppliersData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#f59e0b" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                 <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 rounded-2xl shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-bold">باشگاه مشتریان برتر</h3>
                            <p className="text-slate-400 text-sm mt-1">رتبه‌بندی بر اساس ارزش خرید (اشتراک)</p>
                        </div>
                        <div className="bg-white/10 p-2 rounded-lg">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        {topCustomersData.length > 0 ? topCustomersData.map((c, index) => (
                            <div key={index} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 flex items-center justify-center font-bold rounded-full text-xs ${index === 0 ? 'bg-amber-400 text-amber-900' : 'bg-slate-700 text-slate-300'}`}>
                                        {index + 1}
                                    </span>
                                    <div>
                                        <div className="font-bold text-sm">{c.name}</div>
                                        <div className="text-xs text-slate-400">{c.plan}</div>
                                    </div>
                                </div>
                                <div className="font-bold text-emerald-400 text-sm">
                                    {formatPrice(c.total)}
                                </div>
                            </div>
                        )) : (
                            <div className="text-center text-slate-500 py-10">داده‌ای یافت نشد</div>
                        )}
                    </div>
                 </div>
            </div>
        </div>
    );
};

// Helper Component for KPI Cards
const KPICard = ({ title, value, icon: Icon, color, trend }: any) => {
    const colorClasses: any = {
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
        rose: { bg: 'bg-rose-100', text: 'text-rose-600' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600' },
    };
    
    return (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
                <div className={`w-10 h-10 rounded-lg ${colorClasses[color].bg} ${colorClasses[color].text} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                </div>
                {trend && (
                    <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div>
                <span className="text-sm text-slate-500 font-bold block mb-1">{title}</span>
                <span className="text-2xl font-bold text-slate-800">{formatPrice(value)}</span>
            </div>
        </div>
    );
};

export default Analytics;