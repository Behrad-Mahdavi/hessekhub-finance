import React, { useState, useEffect } from 'react';
import { SaleRecord, RevenueStream, UserRole, SubscriptionStatus, Account, AccountType, Employee } from '../types';
import { toPersianDate, formatPrice } from '../utils';
import { Coffee, Users, Activity, PlusCircle, Clock, Calculator, RefreshCw, Ban, AlertTriangle, User, Trash2, CreditCard, Banknote, ChevronDown, ChevronUp, Truck, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';

interface SalesProps {
    sales: SaleRecord[];
    accounts: Account[];
    employees: Employee[]; // New prop
    onAddSale: (s: SaleRecord) => void;
    onCancelSubscription?: (id: string, refundAmount: number) => void;
    onDeleteSale: (id: string) => void;
    userRole: UserRole;
}

const Sales: React.FC<SalesProps> = ({ sales, accounts, employees, onAddSale, onCancelSubscription, onDeleteSale, userRole }) => {
    const [activeTab, setActiveTab] = useState<RevenueStream>(RevenueStream.CAFE);

    // Common State
    const [details, setDetails] = useState('');

    // Generic / Simple Amount
    const [simpleAmount, setSimpleAmount] = useState('');

    // Cafe Split State
    const [grossAmount, setGrossAmount] = useState('');
    const [discount, setDiscount] = useState('');
    const [refund, setRefund] = useState('');

    // Delivery Apps State
    const [snappFoodAmount, setSnappFoodAmount] = useState('');
    const [tapsiFoodAmount, setTapsiFoodAmount] = useState('');
    const [foodexAmount, setFoodexAmount] = useState('');

    // Employee Credit State
    const [employeeCreditAmount, setEmployeeCreditAmount] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

    // Payment Details State
    const [paymentAccountId, setPaymentAccountId] = useState('');
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);
    const [cashAmount, setCashAmount] = useState('');

    const [c2cTransactions, setC2cTransactions] = useState<{ amount: number; sender: string }[]>([]);
    const [tempC2cAmount, setTempC2cAmount] = useState('');
    const [tempC2cSender, setTempC2cSender] = useState('');

    // Reset form when tab changes
    useEffect(() => {
        setSimpleAmount('');
        setGrossAmount('');
        setDiscount('');
        setRefund('');
        setDetails('');
        setPaymentAccountId('');
        setShowPaymentDetails(false);
        setCashAmount('');

        setC2cTransactions([]);
        setTempC2cAmount('');
        setTempC2cSender('');

        setSnappFoodAmount('');
        setTapsiFoodAmount('');
        setFoodexAmount('');
        setEmployeeCreditAmount('');
        setSelectedEmployeeId('');
    }, [activeTab]);

    const calculateNet = () => {
        const pos = parseFloat(grossAmount) || 0;
        const cash = parseFloat(cashAmount) || 0;
        const c2cTotal = c2cTransactions.reduce((sum, t) => sum + t.amount, 0);

        const snapp = parseFloat(snappFoodAmount) || 0;
        const tapsi = parseFloat(tapsiFoodAmount) || 0;
        const foodex = parseFloat(foodexAmount) || 0;
        const empCredit = parseFloat(employeeCreditAmount) || 0;

        const totalGross = pos + cash + c2cTotal + snapp + tapsi + foodex + empCredit;

        const d = parseFloat(discount) || 0;
        const r = parseFloat(refund) || 0;
        return Math.max(0, totalGross - d - r);
    };

    const handleAddC2cTransaction = () => {
        if (!tempC2cAmount || !tempC2cSender) {
            toast.error('لطفاً مبلغ و نام واریز کننده را وارد کنید');
            return;
        }
        setC2cTransactions([...c2cTransactions, { amount: parseFloat(tempC2cAmount), sender: tempC2cSender }]);
        setTempC2cAmount('');
        setTempC2cSender('');
    };

    const handleRemoveC2cTransaction = (index: number) => {
        const newTransactions = [...c2cTransactions];
        newTransactions.splice(index, 1);
        setC2cTransactions(newTransactions);
    };

    const handleAddSale = (e: React.FormEvent) => {
        e.preventDefault();

        let finalAmount = 0;
        let saleRecord: SaleRecord = {
            id: `SAL-${Math.floor(Math.random() * 10000)}`,
            stream: activeTab,
            date: toPersianDate(new Date()),
            details: details || getDefaultDetails(activeTab),
            amount: 0,
            paymentAccountId: paymentAccountId || undefined,
            cashAmount: cashAmount ? parseFloat(cashAmount) : undefined,
        };

        if (activeTab === RevenueStream.CAFE) {
            const pos = parseFloat(grossAmount) || 0;
            const cash = parseFloat(cashAmount) || 0;
            const c2cTotal = c2cTransactions.reduce((sum, t) => sum + t.amount, 0);

            const snapp = parseFloat(snappFoodAmount) || 0;
            const tapsi = parseFloat(tapsiFoodAmount) || 0;
            const foodex = parseFloat(foodexAmount) || 0;
            const empCredit = parseFloat(employeeCreditAmount) || 0;

            const totalGross = pos + cash + c2cTotal + snapp + tapsi + foodex + empCredit;
            const d = parseFloat(discount) || 0;
            const r = parseFloat(refund) || 0;
            finalAmount = totalGross - d - r;

            if (pos > 0 && !paymentAccountId) {
                toast.error('لطفاً حساب دریافت کننده (کارتخوان) را انتخاب کنید');
                return;
            }

            if (empCredit > 0 && !selectedEmployeeId) {
                toast.error('لطفاً پرسنل مورد نظر برای نسیه را انتخاب کنید');
                return;
            }

            saleRecord.amount = finalAmount;
            saleRecord.grossAmount = totalGross;
            saleRecord.posAmount = pos;
            saleRecord.discount = d;
            saleRecord.refund = r;
            saleRecord.cardToCardTransactions = c2cTransactions;

            saleRecord.snappFoodAmount = snapp;
            saleRecord.tapsiFoodAmount = tapsi;
            saleRecord.foodexAmount = foodex;
            saleRecord.employeeCreditAmount = empCredit;
            saleRecord.employeeId = selectedEmployeeId;
            if (selectedEmployeeId) {
                const emp = employees.find(e => e.id === selectedEmployeeId);
                if (emp) saleRecord.employeeName = emp.fullName;
            }
        } else {
            // ASSESSMENT - Simple amount
            finalAmount = parseFloat(simpleAmount) || 0;
            saleRecord.amount = finalAmount;
        }

        onAddSale(saleRecord);

        // Reset inputs
        setSimpleAmount('');
        setGrossAmount('');
        setDiscount('');
        setRefund('');
        setDetails('');
        setPaymentAccountId('');
        setCashAmount('');
        setCashAmount('');
        setC2cTransactions([]);
        setTempC2cAmount('');
        setTempC2cSender('');

        setSnappFoodAmount('');
        setTapsiFoodAmount('');
        setFoodexAmount('');
        setEmployeeCreditAmount('');
        setSelectedEmployeeId('');

        setShowPaymentDetails(false);
    };

    const getDefaultDetails = (stream: RevenueStream) => {
        switch (stream) {
            case RevenueStream.CAFE: return 'فروش روزانه کافه';
            case RevenueStream.ASSESSMENT: return 'ویزیت و آنالیز بدن';
        }
    };

    const getTabLabel = (stream: RevenueStream) => {
        switch (stream) {
            case RevenueStream.CAFE: return 'کافه';
            case RevenueStream.ASSESSMENT: return 'مشاوره تغذیه';
        }
    }

    const filteredSales = sales
        .filter(s => s.stream === activeTab)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return (
        <div className="p-4 md:p-8 h-full flex flex-col overflow-y-auto">
            <div className="mb-6 md:mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">درآمد و فروش</h2>
                <p className="text-slate-500 text-sm md:text-base">ثبت و پایش درآمدهای سه گانه مجموعه</p>
            </div>

            {/* Custom Tabs - Responsive */}
            <div className="flex flex-wrap gap-2 mb-6 md:mb-8 p-1 bg-slate-200/50 rounded-xl w-full md:w-fit">
                <button
                    onClick={() => setActiveTab(RevenueStream.CAFE)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-lg font-bold text-xs md:text-sm transition-all ${activeTab === RevenueStream.CAFE ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                >
                    <Coffee className="w-4 h-4" /> <span className="hidden md:inline">کافه</span>
                </button>
                <button
                    onClick={() => setActiveTab(RevenueStream.ASSESSMENT)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-lg font-bold text-xs md:text-sm transition-all ${activeTab === RevenueStream.ASSESSMENT ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                >
                    <Activity className="w-4 h-4" /> <span className="hidden md:inline">مشاوره تغذیه</span><span className="md:hidden">مشاوره</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
                {/* Input Form */}
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500"></div>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                        <PlusCircle className="w-5 h-5 text-indigo-500" /> ثبت فروش {getTabLabel(activeTab)}
                    </h3>

                    <form onSubmit={handleAddSale} className="space-y-5">
                        {activeTab === RevenueStream.CAFE ? (
                            // Cafe Split Form
                            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">دریافتی کارتخوان (POS)</label>
                                    <input
                                        required
                                        type="number"
                                        value={grossAmount}
                                        onChange={(e) => setGrossAmount(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-left font-bold"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">تخفیفات</label>
                                        <input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none dir-ltr text-left text-rose-600"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">مرجوعی</label>
                                        <input
                                            type="number"
                                            value={refund}
                                            onChange={(e) => setRefund(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none dir-ltr text-left text-rose-600"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Delivery Apps Section */}
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                            <Truck className="w-3 h-3" /> اسنپ فود
                                        </label>
                                        <input
                                            type="number"
                                            value={snappFoodAmount}
                                            onChange={(e) => setSnappFoodAmount(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none dir-ltr text-left"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                            <Truck className="w-3 h-3" /> تپسی فود
                                        </label>
                                        <input
                                            type="number"
                                            value={tapsiFoodAmount}
                                            onChange={(e) => setTapsiFoodAmount(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none dir-ltr text-left"
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1">
                                            <Truck className="w-3 h-3" /> فودکس
                                        </label>
                                        <input
                                            type="number"
                                            value={foodexAmount}
                                            onChange={(e) => setFoodexAmount(e.target.value)}
                                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none dir-ltr text-left"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Employee Credit Section */}
                                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                    <label className="block text-xs font-bold text-amber-700 uppercase mb-2 flex items-center gap-1">
                                        <UserMinus className="w-3 h-3" /> نسیه پرسنل
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <select
                                            value={selectedEmployeeId}
                                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                            className="w-full p-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-sm"
                                        >
                                            <option value="">انتخاب پرسنل...</option>
                                            {employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            value={employeeCreditAmount}
                                            onChange={(e) => setEmployeeCreditAmount(e.target.value)}
                                            className="w-full p-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none dir-ltr text-left"
                                            placeholder="مبلغ نسیه"
                                        />
                                    </div>
                                </div>

                                {/* Payment Details Section */}
                                <div className="border-t border-slate-100 pt-4">
                                    <div className="mb-4">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">حساب دریافت کننده (کارتخوان)</label>
                                        <div className="relative">
                                            <select
                                                value={paymentAccountId}
                                                onChange={(e) => setPaymentAccountId(e.target.value)}
                                                className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none bg-white"
                                            >
                                                <option value="">انتخاب حساب متصل به کارتخوان...</option>
                                                {accounts.filter(a => a.type === AccountType.ASSET && a.code !== '1010').map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                                ))}
                                            </select>
                                            <CreditCard className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                                        className="flex items-center gap-2 text-sm text-indigo-600 font-bold hover:text-indigo-700 transition-colors w-full"
                                    >
                                        {showPaymentDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        جزئیات بیشتر پرداخت (نقد / کارت به کارت)
                                    </button>

                                    {showPaymentDetails && (
                                        <div className="mt-3 space-y-3 bg-indigo-50 p-3 rounded-xl animate-fade-in">
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-700 mb-1 flex items-center gap-1">
                                                    <Banknote className="w-3 h-3" /> مبلغ دریافتی نقد
                                                </label>
                                                <input
                                                    type="number"
                                                    value={cashAmount}
                                                    onChange={(e) => setCashAmount(e.target.value)}
                                                    className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-left"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-bold text-indigo-700 mb-1">مبلغ کارت به کارت</label>
                                                        <input
                                                            type="number"
                                                            value={tempC2cAmount}
                                                            onChange={(e) => setTempC2cAmount(e.target.value)}
                                                            className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-left"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-indigo-700 mb-1">نام واریز کننده</label>
                                                        <input
                                                            type="text"
                                                            value={tempC2cSender}
                                                            onChange={(e) => setTempC2cSender(e.target.value)}
                                                            className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                            placeholder="مثلاً: علی محمدی"
                                                        />
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAddC2cTransaction}
                                                    className="w-full py-2 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200 transition-colors"
                                                >
                                                    افزودن تراکنش
                                                </button>

                                                {/* List of C2C Transactions */}
                                                {c2cTransactions.length > 0 && (
                                                    <div className="space-y-2 mt-2">
                                                        {c2cTransactions.map((t, idx) => (
                                                            <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border border-indigo-100 text-xs">
                                                                <span className="text-slate-600">{t.sender}: {formatPrice(t.amount)}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveC2cTransaction(idx)}
                                                                    className="text-rose-500 hover:text-rose-700"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-700">خالص دریافتی:</span>
                                    <span className="text-lg font-bold text-emerald-600 dir-ltr">{calculateNet().toLocaleString()}</span>
                                </div>
                            </div>
                        ) : (
                            // Simple Form for Others
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">مبلغ (تومان)</label>
                                <input
                                    required
                                    type="number"
                                    value={simpleAmount}
                                    onChange={(e) => setSimpleAmount(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all dir-ltr text-left font-bold text-lg text-slate-800"
                                    placeholder="0"
                                />
                                {simpleAmount && <p className="text-xs text-indigo-600 mt-1 font-bold">{formatPrice(simpleAmount)}</p>}
                            </div>
                        )}



                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">جزئیات / توضیحات</label>
                            <input
                                type="text"
                                value={details}
                                onChange={(e) => setDetails(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                placeholder={getDefaultDetails(activeTab)}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                        >
                            ثبت درآمد
                        </button>
                    </form>

                    <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-800">
                        <p className="font-bold mb-2 flex items-center gap-2"><Activity className="w-3 h-3" /> سند حسابداری:</p>
                        {activeTab === RevenueStream.CAFE ? (
                            <ul className="space-y-1.5 opacity-80">
                                <li className="flex justify-between"><span>بدهکار:</span> <span className="font-mono">موجودی نقد + تخفیفات</span></li>
                                <li className="flex justify-between"><span>بستانکار:</span> <span className="font-mono">درآمد کافه (ناخالص)</span></li>
                            </ul>
                        ) : (
                            <ul className="space-y-1.5 opacity-80">
                                <li className="flex justify-between"><span>بدهکار:</span> <span className="font-mono">موجودی نقد</span></li>
                                <li className="flex justify-between"><span>بستانکار:</span> <span className="font-mono">{activeTab === RevenueStream.SUBSCRIPTION ? 'پیش‌دریافت درآمد' : 'درآمد مشاوره'}</span></li>
                            </ul>
                        )}
                    </div>
                </div>

                {/* Lists */}
                <div className="lg:col-span-2 flex flex-col gap-6 md:gap-8">

                    {/* Recent Transactions List */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-[400px]">
                        <div className="p-4 md:p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 text-sm md:text-base">تراکنش‌های اخیر {getTabLabel(activeTab)}</h3>
                            <span className="text-xs bg-white border border-slate-200 px-2 py-1 rounded-md text-slate-500">تعداد: {filteredSales.length}</span>
                        </div>
                        <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
                            <table className="w-full text-right min-w-[600px]">
                                <thead className="bg-white sticky top-0 z-10 border-b border-slate-100 shadow-sm">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">شناسه</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">تاریخ</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">شرح</th>
                                        {activeTab === RevenueStream.CAFE && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ناخالص</th>}
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">دریافتی نقد</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredSales.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-4 text-xs text-slate-400 font-mono group-hover:text-indigo-500 transition-colors">{s.id}</td>
                                            <td className="p-4 text-sm text-slate-600 font-medium">{s.date}</td>
                                            <td className="p-4 text-sm text-slate-800 font-bold">
                                                {s.details}
                                                {activeTab === RevenueStream.CAFE && (
                                                    <div className="flex flex-wrap gap-x-2 gap-y-1 mt-1 text-xs text-slate-500 font-normal">
                                                        {s.snappFoodAmount && s.snappFoodAmount > 0 && <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">اسنپ: {formatPrice(s.snappFoodAmount)}</span>}
                                                        {s.tapsiFoodAmount && s.tapsiFoodAmount > 0 && <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">تپسی: {formatPrice(s.tapsiFoodAmount)}</span>}
                                                        {s.foodexAmount && s.foodexAmount > 0 && <span className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded">فودکس: {formatPrice(s.foodexAmount)}</span>}
                                                        {s.employeeCreditAmount && s.employeeCreditAmount > 0 && <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">نسیه {s.employeeName ? `(${s.employeeName})` : ''}: {formatPrice(s.employeeCreditAmount)}</span>}
                                                        {s.posAmount && s.posAmount > 0 && <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">کارتخوان: {formatPrice(s.posAmount)}</span>}
                                                        {s.cashAmount && s.cashAmount > 0 && <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">نقد: {formatPrice(s.cashAmount)}</span>}
                                                    </div>
                                                )}
                                                {s.discount && s.discount > 0 ? <span className="block text-xs text-rose-500 mt-0.5">تخفیف: {s.discount.toLocaleString()}</span> : null}
                                            </td>
                                            {activeTab === RevenueStream.CAFE && (
                                                <td className="p-4 text-xs text-slate-500 font-mono">{s.grossAmount?.toLocaleString() || '-'}</td>
                                            )}
                                            <td className="p-4 text-sm font-bold text-emerald-600 text-left dir-ltr">+{s.amount.toLocaleString('fa-IR')}</td>
                                            <td className="p-4 text-left">
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('آیا از حذف این تراکنش اطمینان دارید؟')) {
                                                            onDeleteSale(s.id);
                                                        }
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                                                    title="حذف"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSales.length === 0 && (
                                        <tr><td colSpan={7} className="p-12 text-center text-slate-400 italic">هیچ فروشی برای این بخش ثبت نشده است.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div >



        </div >
    );
};

export default Sales;