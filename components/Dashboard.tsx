import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, CreditCard, AlertCircle, Repeat, Coffee } from 'lucide-react';
import { Account, SaleRecord, PurchaseRequest, AccountType, RevenueStream, SubscriptionStatus, TransactionStatus, Subscription, PayrollPayment } from '../types';

import { toPersianDate, getDurationInMonths } from '../utils';

interface DashboardProps {
  accounts: Account[];
  sales: SaleRecord[];
  purchases: PurchaseRequest[];
  subscriptions: Subscription[];
  payrollPayments: PayrollPayment[];
  onViewSubscriptions: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ accounts, sales, purchases, subscriptions, payrollPayments, onViewSubscriptions }) => {
  const [daysRange, setDaysRange] = useState<number>(7);


  // 1. Calculate General Accounting KPIs
  // Revenue = All Sales (Cafe + Subscriptions)
  const totalRevenue = (sales || []).reduce((acc, sale) => acc + sale.amount, 0);

  // Expenses = Purchases + Payroll
  const totalPurchases = (purchases || [])
    .filter(p => p.status === TransactionStatus.APPROVED)
    .reduce((acc, purchase) => acc + purchase.amount, 0);
  const totalPayroll = (payrollPayments || []).reduce((acc, payment) => acc + payment.totalAmount, 0);
  const totalExpenses = totalPurchases + totalPayroll;

  const netProfit = totalRevenue - totalExpenses;
  const cashOnHand = accounts.filter(a => a.type === AccountType.ASSET).reduce((acc, curr) => acc + curr.balance, 0); // Total Cash + Bank
  const pendingApprovals = (purchases || []).filter(p => p.status === 'PENDING').length;

  // 2. Calculate Specific Business KPIs (Brief Requirements)

  // MRR (Monthly Recurring Revenue)
  // Calculated from active subscriptions
  const activeSubs = subscriptions.filter(s => s.status === 'ACTIVE');

  const mrr = activeSubs.reduce((total, sub) => {
    // Calculate monthly value
    // If plan is "1 Month" or similar, it's the price.
    // If it's "2 Weeks", we multiply by 2 (approx).
    // Better: (Price / Total Days) * 30
    if (sub.totalDeliveryDays > 0) {
      return total + ((sub.price / sub.totalDeliveryDays) * 30); // Normalized to 30 days
    }
    return total + sub.price; // Fallback
  }, 0);

  // Daily Cafe Revenue
  const todayDate = toPersianDate(new Date());
  const dailyCafeRevenue = sales
    .filter(s => s.stream === RevenueStream.CAFE && s.date === todayDate)
    .reduce((total, s) => total + s.amount, 0);

  // Prepare Chart Data
  const revenueData = [
    { name: 'کافه', value: accounts.find(a => a.code === '4010')?.balance || 0 },
    { name: 'اشتراک', value: accounts.find(a => a.code === '4020')?.balance || 0 }, // Recognized Revenue
    { name: 'مشاوره', value: accounts.find(a => a.code === '4030')?.balance || 0 },
  ];

  // Calculate Real-time Trend Data (Dynamic Range)
  const calculateTrendData = () => {
    const data = [];
    for (let i = daysRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toPersianDate(d);
      const dayName = new Intl.DateTimeFormat('fa-IR', { weekday: 'long' }).format(d);

      // Sum Sales for this date
      const dailySales = sales
        .filter(s => s.date === dateStr)
        .reduce((acc, curr) => acc + curr.amount, 0);

      // Sum APPROVED Expenses for this date
      const dailyExpenses = purchases
        .filter(p => p.date === dateStr && p.status === TransactionStatus.APPROVED)
        .reduce((acc, curr) => acc + curr.amount, 0);

      data.push({
        day: dayName,
        fullDate: dateStr,
        sales: dailySales,
        expense: dailyExpenses
      });
    }
    return data;
  };

  const trendData = calculateTrendData();



  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800">داشبورد مدیریتی</h2>
          <p className="text-slate-500 mt-1 text-sm md:text-base">شاخص‌های کلیدی عملکرد (KPIs) و تحلیل هوشمند</p>
        </div>
        <div className="text-sm font-medium bg-white px-4 py-2 rounded-lg border border-slate-200 text-slate-600 shadow-sm w-full md:w-auto text-center">
          امروز: {todayDate}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6">

        {/* MRR Card */}
        <div
          onClick={onViewSubscriptions}
          className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500"></div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">MRR اشتراک‌ها</p>
            <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              <Repeat className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dir-ltr mb-1">{mrr.toLocaleString('fa-IR')}</h3>
          <p className="text-xs text-slate-400">درآمد ماهانه تکرارشونده</p>
        </div>

        {/* Daily Cafe Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">فروش امروز کافه</p>
            <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
              <Coffee className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dir-ltr mb-1">{dailyCafeRevenue.toLocaleString('fa-IR')}</h3>
          <p className="text-xs text-slate-400">تراکنش‌های ثبت شده امروز</p>
        </div>

        {/* Net Profit */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">سود خالص کل</p>
            <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <h3 className={`text-2xl font-bold dir-ltr mb-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netProfit.toLocaleString('fa-IR')}
          </h3>
          <p className="text-xs text-slate-400">درآمد منهای هزینه‌ها</p>
        </div>

        {/* Cash */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-blue-500"></div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">جمع نقدینگی</p>
            <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 dir-ltr mb-1">{cashOnHand.toLocaleString('fa-IR')}</h3>
          <p className="text-xs text-slate-400">موجودی بانک + صندوق</p>
        </div>

        {/* Pending Actions */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 h-full bg-orange-500"></div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-slate-500 uppercase">نیاز به تایید</p>
            <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-100 transition-colors">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-orange-600 mb-1">{pendingApprovals.toLocaleString('fa-IR')} <span className="text-sm font-normal text-slate-400">مورد</span></h3>
          <p className="text-xs text-slate-400">فاکتورهای خرید</p>
        </div>
      </div>



      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 pb-8">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold mb-6 text-slate-800 border-b border-slate-100 pb-2">ترکیب درآمدی (مانده حساب‌ها)</h3>
          <div className="h-60 md:h-72 ltr" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} name="مبلغ" barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-2">
            <h3 className="text-lg font-bold text-slate-800">روند {daysRange} روز گذشته</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">تعداد روز:</span>
              <input
                type="number"
                min="1"
                max="365"
                value={daysRange}
                onChange={(e) => setDaysRange(Math.max(1, Number(e.target.value)))}
                className="w-20 bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 outline-none text-center dir-ltr"
              />
            </div>
          </div>
          <div className="h-60 md:h-72 ltr" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) return `${label} (${payload[0].payload.fullDate})`;
                    return label;
                  }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} name="فروش" />
                <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} name="هزینه" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;