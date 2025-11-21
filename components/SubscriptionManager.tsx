import React, { useState } from 'react';
import { Customer, Subscription, SaleRecord, Account, AccountType } from '../types';
import { toPersianDate, formatPrice, calculateSubscriptionEndDate, isDeliveryDay } from '../utils';
import { Users, Calendar, Search, Plus, User, FileText, CheckCircle, XCircle, Clock, CreditCard, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface SubscriptionManagerProps {
    customers: Customer[];
    subscriptions: Subscription[];
    sales: SaleRecord[];
    accounts: Account[];
    onAddCustomer: (c: Customer) => void;
    onUpdateCustomer: (c: Customer) => void;
    onAddSubscription: (s: Subscription, sale: SaleRecord) => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
    customers,
    subscriptions,
    sales,
    accounts,
    onAddCustomer,
    onUpdateCustomer,
    onAddSubscription
}) => {
    const [activeTab, setActiveTab] = useState<'DAILY' | 'CUSTOMERS'>('DAILY');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);

    // New Customer State
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');

    // Renewal State
    const [showRenewModal, setShowRenewModal] = useState(false);
    const [renewPlanDays, setRenewPlanDays] = useState(12); // Default 2 weeks (12 days)
    const [renewPrice, setRenewPrice] = useState('');
    const [renewPaymentAccount, setRenewPaymentAccount] = useState('');
    const [renewIsCredit, setRenewIsCredit] = useState(false);

    // Daily List Logic
    const today = new Date();
    const isTodayDelivery = isDeliveryDay(today);
    const todayPersian = toPersianDate(today);

    // Debug logging
    console.log('=== Daily Delivery Debug ===');
    console.log('Today:', todayPersian);
    console.log('Is Delivery Day:', isTodayDelivery);
    console.log('Total Customers:', customers.length);
    console.log('Total Subscriptions:', subscriptions.length);
    console.log('Active Subscriptions:', subscriptions.filter(s => s.status === 'ACTIVE').length);
    console.log('All Subscriptions:', subscriptions.map(s => ({ id: s.id, status: s.status, customerId: s.customerId, planName: s.planName })));
    console.log('All Customers:', customers.map(c => ({ id: c.id, name: c.name, activeSubId: c.activeSubscriptionId })));

    // Get unique customers with their ACTIVE subscription (not all subscriptions)
    const dailyDeliveries = customers
        .map(customer => {
            // Find customer's active subscription
            const activeSub = customer.activeSubscriptionId
                ? subscriptions.find(s => s.id === customer.activeSubscriptionId && s.status === 'ACTIVE')
                : subscriptions.find(s => s.customerId === customer.id && s.status === 'ACTIVE');

            if (!activeSub) {
                console.log(`Customer ${customer.name} has no active subscription (activeSubId: ${customer.activeSubscriptionId})`);
                return null;
            }

            // Check if today is within subscription range
            const inRange = activeSub.startDate <= todayPersian && activeSub.endDate >= todayPersian;
            console.log(`Customer ${customer.name}: Sub ${activeSub.planName} (${activeSub.startDate} to ${activeSub.endDate}) - In Range: ${inRange}`);

            if (inRange) {
                return { sub: activeSub, customer };
            }
            return null;
        })
        .filter(item => item !== null) as { sub: Subscription; customer: Customer }[];

    console.log('Daily Deliveries Count:', dailyDeliveries.length);
    console.log('=========================');

    const handleCreateCustomer = (e: React.FormEvent) => {
        e.preventDefault();
        const newCustomer: Customer = {
            id: `CUST-${Math.floor(Math.random() * 10000)}`,
            name: newCustomerName,
            phoneNumber: newCustomerPhone,
            balance: 0,
            joinDate: toPersianDate(new Date()),
        };
        onAddCustomer(newCustomer);
        setShowAddCustomerModal(false);
        setNewCustomerName('');
        setNewCustomerPhone('');
        toast.success('مشتری جدید اضافه شد');
    };

    const handleRenew = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCustomer) return;

        const startDate = new Date();
        // If today is Friday, start tomorrow? Or just let logic handle it (start date is today, but first delivery is tomorrow)
        // calculateSubscriptionEndDate handles logic from startDate.

        const endDate = calculateSubscriptionEndDate(startDate, renewPlanDays);

        const newSub: Subscription = {
            id: `SUB-${Math.floor(Math.random() * 10000)}`,
            customerId: selectedCustomer.id,
            planName: `${renewPlanDays} روزه`,
            startDate: toPersianDate(startDate),
            endDate: toPersianDate(endDate),
            totalDeliveryDays: renewPlanDays,
            remainingDays: renewPlanDays,
            status: 'ACTIVE',
            price: parseFloat(renewPrice),
            paymentStatus: renewIsCredit ? 'CREDIT' : 'PAID',
        };

        const newSale: SaleRecord = {
            id: `SAL-${Math.floor(Math.random() * 10000)}`,
            stream: 'SUBSCRIPTION' as any, // Cast to avoid import issue if enum not exported
            amount: renewIsCredit ? 0 : parseFloat(renewPrice),
            date: toPersianDate(startDate),
            details: `اشتراک ${selectedCustomer.name} - ${renewPlanDays} روزه`,
            customerId: selectedCustomer.id,
            subscriptionId: newSub.id,
            paymentAccountId: renewIsCredit ? undefined : renewPaymentAccount,
        };

        onAddSubscription(newSub, newSale);

        // Update Customer (balance if credit, and always set activeSubscriptionId)
        const updatedCustomer = {
            ...selectedCustomer,
            balance: renewIsCredit ? selectedCustomer.balance - parseFloat(renewPrice) : selectedCustomer.balance,
            activeSubscriptionId: newSub.id
        };
        onUpdateCustomer(updatedCustomer);

        setShowRenewModal(false);
        setRenewPrice('');
        setRenewPaymentAccount('');
        setRenewIsCredit(false);
        toast.success('اشتراک تمدید شد');
    };

    return (
        <div className="p-4 md:p-8 h-full flex flex-col overflow-y-auto">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-1">مدیریت اشتراک‌ها</h2>
                    <p className="text-slate-500 text-sm">پیگیری ارسال‌ها و مشتریان</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('DAILY')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'DAILY' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        ارسال روزانه
                    </button>
                    <button
                        onClick={() => setActiveTab('CUSTOMERS')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'CUSTOMERS' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                        مشتریان
                    </button>
                </div>
            </div>

            {activeTab === 'DAILY' && (
                <div className="space-y-4">
                    {!isTodayDelivery && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-bold">امروز جمعه است - ارسال‌های شنبه:</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dailyDeliveries.map(({ sub, customer }) => (
                            <div key={sub.id} className={`bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center ${customer?.balance && customer.balance < 0 ? 'border-rose-300 bg-rose-50' : 'border-slate-100'}`}>
                                <div>
                                    <h3 className="font-bold text-slate-800">{customer?.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1">{sub.planName} - {sub.remainingDays} روز مانده</p>
                                </div>
                                <div className="text-left">
                                    <span className="block text-xs font-bold text-slate-400">وضعیت حساب</span>
                                    <span className={`text-sm font-bold ${customer?.balance && customer.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {customer?.balance ? formatPrice(customer.balance) : 'تسویه'}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {dailyDeliveries.length === 0 && isTodayDelivery && (
                            <div className="col-span-full text-center py-10 text-slate-400">
                                هیچ ارسالی برای امروز یافت نشد.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'CUSTOMERS' && (
                <div className="space-y-4">
                    <div className="flex gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="جستجوی نام یا شماره تماس..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pr-10 pl-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={() => setShowAddCustomerModal(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" /> مشتری جدید
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-right">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="p-4">نام مشتری</th>
                                    <th className="p-4">شماره تماس</th>
                                    <th className="p-4">وضعیت حساب</th>
                                    <th className="p-4">اشتراک فعال</th>
                                    <th className="p-4">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {customers.filter(c => c.name.includes(searchTerm) || c.phoneNumber.includes(searchTerm)).map(customer => {
                                    const activeSub = subscriptions.find(s => s.customerId === customer.id && s.status === 'ACTIVE');
                                    return (
                                        <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-bold text-slate-800">{customer.name}</td>
                                            <td className="p-4 text-slate-600">{customer.phoneNumber}</td>
                                            <td className={`p-4 font-bold ${customer.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {formatPrice(customer.balance)}
                                            </td>
                                            <td className="p-4">
                                                {activeSub ? (
                                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                                                        {activeSub.planName} ({activeSub.remainingDays} روز)
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">ندارد</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => setSelectedCustomer(customer)}
                                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-bold"
                                                >
                                                    مشاهده پروفایل
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add Customer Modal */}
            {showAddCustomerModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">افزودن مشتری جدید</h3>
                        <form onSubmit={handleCreateCustomer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">نام و نام خانوادگی</label>
                                <input
                                    required
                                    type="text"
                                    value={newCustomerName}
                                    onChange={(e) => setNewCustomerName(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">شماره تماس</label>
                                <input
                                    required
                                    type="tel"
                                    value={newCustomerPhone}
                                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg dir-ltr text-left"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddCustomerModal(false)}
                                    className="flex-1 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                                >
                                    افزودن
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Customer Profile Modal */}
            {selectedCustomer && !showRenewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">{selectedCustomer.name}</h3>
                                <p className="text-slate-500">{selectedCustomer.phoneNumber}</p>
                            </div>
                            <button onClick={() => setSelectedCustomer(null)} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <span className="block text-xs font-bold text-slate-500 uppercase mb-2">وضعیت حساب</span>
                                <div className={`text-2xl font-bold ${selectedCustomer.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {formatPrice(selectedCustomer.balance)}
                                    <span className="text-sm font-normal text-slate-500 mr-2">
                                        {selectedCustomer.balance < 0 ? 'بدهکار' : 'بستانکار / تسویه'}
                                    </span>
                                </div>
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <span className="block text-xs font-bold text-indigo-500 uppercase mb-2">اشتراک فعال</span>
                                {subscriptions.find(s => s.customerId === selectedCustomer.id && s.status === 'ACTIVE') ? (
                                    <div>
                                        <div className="text-xl font-bold text-indigo-700">
                                            {subscriptions.find(s => s.customerId === selectedCustomer.id && s.status === 'ACTIVE')?.planName}
                                        </div>
                                        <div className="text-sm text-indigo-600 mt-1">
                                            تا تاریخ {subscriptions.find(s => s.customerId === selectedCustomer.id && s.status === 'ACTIVE')?.endDate}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-slate-400 font-bold">اشتراک فعال ندارد</div>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <button
                                onClick={() => setShowRenewModal(true)}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-5 h-5" /> تمدید اشتراک / خرید پکیج
                            </button>
                        </div>

                        <div>
                            <h4 className="font-bold text-slate-700 mb-4 border-b pb-2">تاریخچه اشتراک‌ها</h4>
                            <div className="space-y-3">
                                {subscriptions.filter(s => s.customerId === selectedCustomer.id).map(sub => (
                                    <div key={sub.id} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg text-sm">
                                        <div>
                                            <span className="font-bold block">{sub.planName}</span>
                                            <span className="text-slate-500 text-xs">{sub.startDate} تا {sub.endDate}</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-bold ${sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {sub.status === 'ACTIVE' ? 'فعال' : 'منقضی'}
                                        </div>
                                    </div>
                                ))}
                                {subscriptions.filter(s => s.customerId === selectedCustomer.id).length === 0 && (
                                    <p className="text-center text-slate-400 text-sm">هیچ سابقه‌ای یافت نشد.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Renew Modal */}
            {showRenewModal && selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">تمدید اشتراک برای {selectedCustomer.name}</h3>
                        <form onSubmit={handleRenew} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">مدت پکیج (روزهای ارسال)</label>
                                <select
                                    value={renewPlanDays}
                                    onChange={(e) => setRenewPlanDays(parseInt(e.target.value))}
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                >
                                    <option value={6}>۱ هفته (۶ روز)</option>
                                    <option value={12}>۲ هفته (۱۲ روز)</option>
                                    <option value={24}>۱ ماه (۲۴ روز)</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    تاریخ پایان به صورت خودکار با کسر جمعه‌ها محاسبه می‌شود.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">مبلغ پکیج</label>
                                <input
                                    required
                                    type="number"
                                    value={renewPrice}
                                    onChange={(e) => setRenewPrice(e.target.value)}
                                    className="w-full p-2 border border-slate-300 rounded-lg"
                                    placeholder="0"
                                />
                            </div>

                            <div className="flex items-center gap-2 my-2">
                                <input
                                    type="checkbox"
                                    id="isCredit"
                                    checked={renewIsCredit}
                                    onChange={(e) => setRenewIsCredit(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <label htmlFor="isCredit" className="text-sm font-bold text-slate-700">پرداخت نسیه (بدهکار شدن مشتری)</label>
                            </div>

                            {!renewIsCredit && (
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">حساب دریافت کننده</label>
                                    <select
                                        required
                                        value={renewPaymentAccount}
                                        onChange={(e) => setRenewPaymentAccount(e.target.value)}
                                        className="w-full p-2 border border-slate-300 rounded-lg"
                                    >
                                        <option value="">انتخاب حساب...</option>
                                        {accounts.filter(a => a.type === AccountType.ASSET).map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowRenewModal(false)}
                                    className="flex-1 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-lg"
                                >
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                                >
                                    ثبت و تمدید
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper icon import fix
import { RefreshCw } from 'lucide-react';

export default SubscriptionManager;
