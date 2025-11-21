import React, { useState, useEffect } from 'react';
import { SaleRecord, RevenueStream, UserRole, SubscriptionStatus, Account, AccountType } from '../types';
import { toPersianDate, formatPrice } from '../utils';
import { Coffee, Users, Activity, PlusCircle, Clock, Calculator, RefreshCw, Ban, AlertTriangle, User, Trash2, CreditCard, Banknote, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface SalesProps {
    sales: SaleRecord[];
    accounts: Account[];
    onAddSale: (s: SaleRecord) => void;
    onCancelSubscription?: (id: string, refundAmount: number) => void;
    onDeleteSale: (id: string) => void;
    userRole: UserRole;
}

const Sales: React.FC<SalesProps> = ({ sales, accounts, onAddSale, onCancelSubscription, onDeleteSale, userRole }) => {
    const [activeTab, setActiveTab] = useState<RevenueStream>(RevenueStream.CAFE);

    // Common State
    const [details, setDetails] = useState('');

    // Generic / Simple Amount
    const [simpleAmount, setSimpleAmount] = useState('');

    // Cafe Split State
    const [grossAmount, setGrossAmount] = useState('');
    const [discount, setDiscount] = useState('');
    const [refund, setRefund] = useState('');

    // Subscriptions
    const [duration, setDuration] = useState('1 ماهه');
    const [customerName, setCustomerName] = useState(''); // New Field
    const [showCancelModal, setShowCancelModal] = useState<string | null>(null); // ID of subscription to cancel
    const [refundAmount, setRefundAmount] = useState('0');

    // Payment Details State
    const [paymentAccountId, setPaymentAccountId] = useState('');
    const [showPaymentDetails, setShowPaymentDetails] = useState(false);
    const [cashAmount, setCashAmount] = useState('');
    const [cardToCardAmount, setCardToCardAmount] = useState('');
    const [cardToCardSender, setCardToCardSender] = useState('');

    // Reset form when tab changes
    useEffect(() => {
        setSimpleAmount('');
        setGrossAmount('');
        setDiscount('');
        setRefund('');
        setDetails('');
        setCustomerName('');
        setShowCancelModal(null);
        setPaymentAccountId('');
        setShowPaymentDetails(false);
        setCashAmount('');
        setCardToCardAmount('');
        setCardToCardSender('');
    }, [activeTab]);

    const calculateNet = () => {
        const g = parseFloat(grossAmount) || 0;
        const d = parseFloat(discount) || 0;
        const r = parseFloat(refund) || 0;
        return Math.max(0, g - d - r);
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
            cardToCardAmount: cardToCardAmount ? parseFloat(cardToCardAmount) : undefined,
            cardToCardSender: cardToCardSender || undefined,
        };

        if (activeTab === RevenueStream.CAFE) {
            const g = parseFloat(grossAmount) || 0;
            const d = parseFloat(discount) || 0;
            const r = parseFloat(refund) || 0;
            finalAmount = g - d - r;

            // Validation for Split Payment
            const cash = parseFloat(cashAmount) || 0;
            const c2c = parseFloat(cardToCardAmount) || 0;

            if (cash + c2c > finalAmount) {
                toast.error('مجموع مبالغ نقد و کارت به کارت نمی‌تواند بیشتر از مبلغ خالص باشد');
                return;
            }

            const posAmount = finalAmount - cash - c2c;
            if (posAmount > 0 && !paymentAccountId) {
                toast.error('لطفاً حساب دریافت کننده (کارتخوان) را انتخاب کنید');
                return;
            }

            saleRecord.amount = finalAmount;
            saleRecord.grossAmount = g;
            saleRecord.discount = d;
            saleRecord.refund = r;
        } else {
            finalAmount = parseFloat(simpleAmount) || 0;
            saleRecord.amount = finalAmount;
            if (activeTab === RevenueStream.SUBSCRIPTION) {
                saleRecord.duration = duration;
                saleRecord.subscriptionStatus = SubscriptionStatus.ACTIVE;
                saleRecord.customerName = customerName;
                saleRecord.details = `${saleRecord.details} - ${customerName}`; // Append name to details for Ledger visibility
            }
        }

        onAddSale(saleRecord);

        // Reset inputs
        setSimpleAmount('');
        setGrossAmount('');
        setDiscount('');
        setRefund('');
        setDetails('');
        setCustomerName('');
        setPaymentAccountId('');
        setCashAmount('');
        setCardToCardAmount('');
        setCardToCardSender('');
        setShowPaymentDetails(false);
    };

    const handleRenewClick = (sub: SaleRecord) => {
        setActiveTab(RevenueStream.SUBSCRIPTION);
        setDetails(`${sub.details.split(' - ')[0]} (تمدید)`);
        setSimpleAmount(sub.amount.toString());
        setDuration(sub.duration || '1 ماهه');
        setCustomerName(sub.customerName || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleConfirmCancel = () => {
        if (showCancelModal && onCancelSubscription) {
            onCancelSubscription(showCancelModal, parseFloat(refundAmount) || 0);
            setShowCancelModal(null);
            setRefundAmount('0');
        }
    };

    const getDefaultDetails = (stream: RevenueStream) => {
        switch (stream) {
            case RevenueStream.CAFE: return 'فروش روزانه کافه';
            case RevenueStream.SUBSCRIPTION: return 'پکیج سلامتی طلایی';
            case RevenueStream.ASSESSMENT: return 'ویزیت و آنالیز بدن';
        }
    };

    const getTabLabel = (stream: RevenueStream) => {
        switch (stream) {
            case RevenueStream.CAFE: return 'کافه';
            case RevenueStream.SUBSCRIPTION: return 'اشتراک‌ها';
            case RevenueStream.ASSESSMENT: return 'مشاوره تغذیه';
        }
    }

    const filteredSales = sales.filter(s => s.stream === activeTab);
    const activeSubscriptions = sales.filter(s => s.stream === RevenueStream.SUBSCRIPTION && s.subscriptionStatus === SubscriptionStatus.ACTIVE);

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
                    onClick={() => setActiveTab(RevenueStream.SUBSCRIPTION)}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-3 rounded-lg font-bold text-xs md:text-sm transition-all ${activeTab === RevenueStream.SUBSCRIPTION ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                >
                    <Users className="w-4 h-4" /> <span className="hidden md:inline">پکیج‌های اشتراکی</span><span className="md:hidden">اشتراک</span>
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
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">فروش ناخالص</label>
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
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-indigo-700 mb-1">مبلغ کارت به کارت</label>
                                                    <input
                                                        type="number"
                                                        value={cardToCardAmount}
                                                        onChange={(e) => setCardToCardAmount(e.target.value)}
                                                        className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-left"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-indigo-700 mb-1">نام واریز کننده</label>
                                                    <input
                                                        type="text"
                                                        value={cardToCardSender}
                                                        onChange={(e) => setCardToCardSender(e.target.value)}
                                                        className="w-full p-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        placeholder="مثلاً: علی محمدی"
                                                    />
                                                </div>
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

                        {activeTab === RevenueStream.SUBSCRIPTION && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">نام مشتری</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="مثلاً: علی رضایی"
                                        />
                                        <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">مدت اشتراک</label>
                                    <div className="relative">
                                        <select
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                                        >
                                            <option>1 هفته</option>
                                            <option>1 ماهه</option>
                                            <option>3 ماهه (با تخفیف)</option>
                                            <option>6 ماهه</option>
                                        </select>
                                        <Clock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </>
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

                    {/* Active Subscriptions Management */}
                    {activeTab === RevenueStream.SUBSCRIPTION && activeSubscriptions.length > 0 && (
                        <div className="bg-emerald-50 rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
                            <div className="p-4 md:p-5 border-b border-emerald-100 bg-emerald-100/50 flex justify-between items-center">
                                <h3 className="font-bold text-emerald-800 flex items-center gap-2 text-sm md:text-base">
                                    <Users className="w-5 h-5" /> اشتراک‌های فعال جاری
                                </h3>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-right min-w-[600px]">
                                    <thead className="bg-emerald-50/50 text-xs text-emerald-600 uppercase border-b border-emerald-100">
                                        <tr>
                                            <th className="p-4">شناسه</th>
                                            <th className="p-4">نام مشتری</th>
                                            <th className="p-4">توضیحات</th>
                                            <th className="p-4">تاریخ شروع</th>
                                            <th className="p-4">مدت</th>
                                            <th className="p-4 text-left">عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-emerald-100">
                                        {activeSubscriptions.map(sub => (
                                            <tr key={sub.id} className="hover:bg-emerald-100/30 transition-colors">
                                                <td className="p-4 font-mono text-xs">{sub.id}</td>
                                                <td className="p-4 font-bold text-sm text-emerald-800">{sub.customerName || 'ناشناس'}</td>
                                                <td className="p-4 text-sm text-slate-700 truncate max-w-[150px]">{sub.details}</td>
                                                <td className="p-4 text-sm">{sub.date}</td>
                                                <td className="p-4 text-sm"><span className="bg-white px-2 py-1 rounded text-emerald-700 border border-emerald-200 whitespace-nowrap">{sub.duration}</span></td>
                                                <td className="p-4">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => handleRenewClick(sub)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors"
                                                        >
                                                            <RefreshCw className="w-3 h-3" /> <span className="hidden lg:inline">تمدید</span>
                                                        </button>
                                                        <button
                                                            onClick={() => setShowCancelModal(sub.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-rose-200 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-50 transition-colors"
                                                        >
                                                            <Ban className="w-3 h-3" /> <span className="hidden lg:inline">لغو</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

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
                                        {activeTab === RevenueStream.SUBSCRIPTION && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">مشتری</th>}
                                        {activeTab === RevenueStream.SUBSCRIPTION && <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">وضعیت</th>}
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
                                                {s.discount && s.discount > 0 ? <span className="block text-xs text-rose-500 mt-0.5">تخفیف: {s.discount.toLocaleString()}</span> : null}
                                            </td>
                                            {activeTab === RevenueStream.SUBSCRIPTION && (
                                                <td className="p-4 text-sm text-slate-600">{s.customerName || '-'}</td>
                                            )}
                                            {activeTab === RevenueStream.SUBSCRIPTION && (
                                                <td className="p-4">
                                                    {s.subscriptionStatus === SubscriptionStatus.ACTIVE && <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs">فعال</span>}
                                                    {s.subscriptionStatus === SubscriptionStatus.CANCELLED && <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs">لغو شده</span>}
                                                    {!s.subscriptionStatus && <span className="text-slate-400 text-xs">-</span>}
                                                </td>
                                            )}
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

            {/* Cancel Modal */}
            {
                showCancelModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up">
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-8 h-8 text-rose-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">لغو اشتراک</h3>
                                <p className="text-slate-500 text-sm mb-6">
                                    آیا از لغو این اشتراک اطمینان دارید؟<br />
                                    در صورت نیاز به بازگشت وجه، مبلغ را وارد کنید.
                                </p>

                                <div className="bg-slate-50 p-4 rounded-xl text-right mb-6 border border-slate-200">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">مبلغ عودت وجه (تومان)</label>
                                    <input
                                        type="number"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                        className="w-full p-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 dir-ltr text-left font-bold"
                                    />
                                    <p className="text-xs text-slate-400 mt-2">* این مبلغ از "پیش‌دریافت‌ها" کسر و از "صندوق" پرداخت می‌شود.</p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowCancelModal(null)}
                                        className="flex-1 py-3 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        onClick={handleConfirmCancel}
                                        className="flex-1 py-3 bg-rose-600 text-white hover:bg-rose-700 rounded-xl font-bold shadow-lg shadow-rose-200 transition-colors"
                                    >
                                        تایید لغو اشتراک
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};

export default Sales;