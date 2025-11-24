import React, { useState, useMemo } from 'react';
import { Account, AccountType, PurchaseRequest, TransactionStatus, UserRole, Supplier, InventoryItem } from '../types';
import { toPersianDate, formatPrice } from '../utils';
import { Plus, Check, X, FileText, Upload, Image as ImageIcon, Trash2, Search, Filter, BarChart3, Scale, CreditCard, AlertTriangle, Package, ChevronDown, Calendar } from 'lucide-react';
import PersianDatePicker from './PersianDatePicker';

interface ExpensesProps {
  accounts: Account[];
  purchases: PurchaseRequest[];
  suppliers: Supplier[];
  inventoryItems: InventoryItem[];
  onAddPurchase: (purchase: PurchaseRequest) => void;
  onApprovePurchase: (id: string) => void;
  onRejectPurchase: (id: string) => void;
  onDeletePurchase: (id: string) => void;
  onInventoryPurchase: (
    purchase: PurchaseRequest,
    inventoryDetails: { itemId: string; quantity: number; unitPrice: number },
    financialDetails: { accountId?: string; supplierId?: string; expenseAccountId?: string; amount: number; isCredit: boolean }
  ) => void;
}

const Expenses: React.FC<ExpensesProps> = ({
  accounts,
  purchases,
  suppliers,
  inventoryItems,
  onAddPurchase,
  onApprovePurchase,
  onRejectPurchase,
  onDeletePurchase,
  onInventoryPurchase
}) => {
  const [showForm, setShowForm] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseRequest | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    category: 'هزینه مواد اولیه',
    supplier: '',
    supplierId: '',
    description: '',
    requester: 'کاربر جاری',
    quantity: '',
    unit: 'گرم',
    paymentAccountId: '',
    isCredit: false,
    isInventoryPurchase: false,
    inventoryItemId: ''
  });

  // Analysis State
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'WEEK' | 'MONTH'>('ALL');

  // All users can approve
  const canApprove = true;

  const [isBackdated, setIsBackdated] = useState(false);
  const [customDate, setCustomDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.isInventoryPurchase && !formData.inventoryItemId) {
      alert('لطفاً کالای انبار را انتخاب کنید');
      return;
    }

    if (isBackdated && !customDate) {
      alert('لطفاً تاریخ خرید را وارد کنید');
      return;
    }

    const amount = parseFloat(formData.amount);
    const quantity = formData.quantity ? parseFloat(formData.quantity) : 0;

    // Use custom date if backdated, otherwise use current date
    const purchaseDate = isBackdated ? customDate : toPersianDate(new Date());

    const newPurchase: PurchaseRequest = {
      id: `PUR-${Math.floor(Math.random() * 10000)}`,
      ...formData,
      amount: amount,
      status: TransactionStatus.PENDING,
      date: purchaseDate,
      imageUrl: fileName ? 'uploaded-mock-url' : undefined,
      quantity: quantity,
      unit: formData.quantity ? formData.unit : undefined,
      paymentAccountId: formData.paymentAccountId,
      isCredit: formData.isCredit,
      isInventoryPurchase: formData.isInventoryPurchase,
      inventoryDetails: formData.isInventoryPurchase ? {
        itemId: formData.inventoryItemId,
        quantity: quantity,
        unitPrice: amount / quantity
      } : undefined
    };

    if (formData.isInventoryPurchase) {
      // Find the expense account based on category
      const expenseAccount = accounts.find(a => a.name === formData.category) || accounts.find(a => a.type === AccountType.EXPENSE);

      // Use the atomic batch handler
      onInventoryPurchase(
        newPurchase,
        {
          itemId: formData.inventoryItemId,
          quantity: quantity,
          unitPrice: amount / quantity // Cost per unit
        },
        {
          accountId: formData.paymentAccountId,
          supplierId: formData.supplierId,
          expenseAccountId: expenseAccount?.id,
          amount: amount,
          isCredit: formData.isCredit
        }
      );
    } else {
      // Standard purchase
      onAddPurchase(newPurchase);
    }

    setShowForm(false);
    setFormData({
      amount: '',
      category: 'هزینه مواد اولیه',
      supplier: '',
      supplierId: '',
      description: '',
      requester: 'کاربر جاری',
      quantity: '',
      unit: 'گرم',
      paymentAccountId: '',
      isCredit: false,
      isInventoryPurchase: false,
      inventoryItemId: ''
    });
    setFileName('');
    setIsBackdated(false);
    setCustomDate('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const getStatusLabel = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.PENDING: return 'در انتظار تایید';
      case TransactionStatus.APPROVED: return 'تایید شده';
      case TransactionStatus.REJECTED: return 'رد شده';
      default: return status;
    }
  };

  // --- Analysis Logic ---
  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchesSearch =
        p.description.includes(searchTerm) ||
        p.supplier.includes(searchTerm) ||
        p.category.includes(searchTerm);

      // Note: Ideally we parse Persian dates for accurate time filtering. 
      // For MVP, 'ALL' shows everything. 'WEEK' could just check if date string matches last 7 entries etc.
      // Simplified logic for now:
      return matchesSearch;
    });
  }, [purchases, searchTerm]);

  const totalFilteredAmount = filteredPurchases.reduce((sum, p) => sum + p.amount, 0);
  const totalFilteredQuantity = filteredPurchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
  // Only show unit summary if all filtered items have same unit or if it's mixed
  const dominantUnit = filteredPurchases.length > 0 ? filteredPurchases[0].unit : '';

  return (
    <div className="p-4 md:p-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">هزینه‌ها و خرید</h2>
          <p className="text-slate-500 text-sm md:text-base">مدیریت خرید مواد اولیه، اجاره، قبوض و سایر مخارج</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          ثبت خرید جدید
        </button>
      </div>

      {/* Analysis Panel */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center gap-2 mb-4 text-slate-700 font-bold">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <span>تحلیل و جستجو اقلام</span>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="جستجو نام کالا (مثلاً: مرغ، قهوه)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">بازه زمانی:</span>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none"
            >
              <option value="ALL">همه زمان‌ها</option>
              <option value="WEEK">۷ روز گذشته</option>
              <option value="MONTH">۳۰ روز گذشته</option>
            </select>
          </div>
        </div>

        {searchTerm && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-down">
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100">
              <p className="text-xs text-indigo-600 mb-1">تعداد خرید</p>
              <p className="font-bold text-indigo-800 text-lg">{filteredPurchases.length}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-600 mb-1">مجموع هزینه</p>
              <p className="font-bold text-emerald-800 text-lg dir-ltr text-right">{totalFilteredAmount.toLocaleString()}</p>
            </div>
            {totalFilteredQuantity > 0 && (
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 col-span-2 md:col-span-1">
                <p className="text-xs text-amber-600 mb-1">مجموع مقدار مصرف</p>
                <p className="font-bold text-amber-800 text-lg flex items-center gap-1">
                  {totalFilteredQuantity.toLocaleString()}
                  <span className="text-xs font-normal bg-white px-1.5 py-0.5 rounded border border-amber-200">{dominantUnit}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="mb-8 bg-white p-4 md:p-6 rounded-2xl shadow-xl border border-slate-100 animate-fade-in-down">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-700">فرم درخواست خرید</h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Inventory Toggle */}
            <div className="md:col-span-2 bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.isInventoryPurchase ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">خرید برای انبار</h4>
                  <p className="text-xs text-slate-500">آیا این خرید مربوط به موجودی مواد اولیه است؟</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.isInventoryPurchase}
                  onChange={(e) => setFormData({ ...formData, isInventoryPurchase: e.target.checked })}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {formData.isInventoryPurchase && (
              <div className="md:col-span-2 animate-fade-in-down">
                <label className="block text-sm font-medium text-slate-700 mb-2">انتخاب کالا از انبار</label>
                <div className="relative">
                  <select
                    required
                    value={formData.inventoryItemId}
                    onChange={(e) => {
                      const item = inventoryItems.find(i => i.id === e.target.value);
                      setFormData({
                        ...formData,
                        inventoryItemId: e.target.value,
                        unit: item ? item.unit : formData.unit,
                        description: item ? `خرید ${item.name}` : formData.description
                      });
                    }}
                    className="w-full pl-10 pr-10 p-3 bg-white border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-slate-800"
                  >
                    <option value="" className="text-slate-400">انتخاب کالا...</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id} className="text-slate-800 py-2">
                        {item.name} (موجودی: {item.currentStock} {item.unit})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-indigo-500">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="absolute left-3 top-3.5 pointer-events-none text-slate-400">
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">نام تامین‌کننده / فروشگاه</label>
              <div className="relative">
                <select
                  value={formData.supplierId}
                  onChange={(e) => {
                    const selectedSupplier = suppliers.find(s => s.id === e.target.value);
                    setFormData({
                      ...formData,
                      supplierId: e.target.value,
                      supplier: selectedSupplier ? selectedSupplier.name : e.target.value
                    });
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option value="">انتخاب کنید...</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                  <option value="NEW">+ ثبت تامین‌کننده جدید (در بخش تامین‌کنندگان)</option>
                </select>
                <div className="absolute left-3 top-3.5 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              {/* Fallback for manual entry if needed, or just guide them to use the manager */}
              {formData.supplierId === 'NEW' && (
                <p className="text-xs text-amber-600 mt-1">لطفاً ابتدا تامین‌کننده را در بخش "تامین‌کنندگان" ثبت کنید.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">مبلغ فاکتور (تومان)</label>
              <input
                required
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all dir-ltr text-left"
                placeholder="0"
              />
              {formData.amount && <p className="text-xs text-indigo-600 mt-1 font-bold">{formatPrice(formData.amount)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">دسته‌بندی هزینه</label>
              <div className="relative">
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                >
                  <option>هزینه مواد اولیه</option>
                  <option>هزینه اجاره</option>
                  <option>هزینه آب و برق</option>
                  <option>ملزومات اداری</option>
                  <option>تعمیرات و نگهداری</option>
                  <option>تبلیغات و بازاریابی</option>
                </select>
                <div className="absolute left-3 top-3.5 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">پرداخت از حساب</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isCredit}
                        onChange={(e) => setFormData({ ...formData, isCredit: e.target.checked, paymentAccountId: '' })}
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </div>
                    <span className="text-xs font-bold text-indigo-600">خرید نسیه (جدید)</span>
                  </label>
                </div>

                {!formData.isCredit ? (
                  <div className="relative animate-fade-in">
                    <select
                      required={!formData.isCredit}
                      value={formData.paymentAccountId}
                      onChange={(e) => setFormData({ ...formData, paymentAccountId: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                    >
                      <option value="">انتخاب کنید...</option>
                      {accounts.filter(a => a.type === AccountType.ASSET).map(account => (
                        <option key={account.id} value={account.id}>{account.name} (موجودی: {account.balance.toLocaleString()})</option>
                      ))}
                    </select>
                    <div className="absolute left-3 top-3.5 pointer-events-none text-slate-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-medium flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4" />
                    این مبلغ به حساب "حساب‌های پرداختنی" اضافه می‌شود.
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Input - Only for Raw Materials */}
            {formData.category === 'هزینه مواد اولیه' ? (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">مقدار/وزن</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none dir-ltr text-center"
                    placeholder="مثلاً 500"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-xs font-bold text-slate-500 mb-1">واحد</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none"
                  >
                    <option>گرم</option>
                    <option>کیلوگرم</option>
                    <option>عدد</option>
                    <option>لیتر</option>
                    <option>بسته</option>
                  </select>
                </div>
              </div>
            ) : (
              <div></div> // Empty spacer
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">توضیحات / نام اقلام</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="مثلاً: فیله مرغ، قهوه عربیکا..."
              />
            </div>

            {/* Date Selection */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <span className="font-bold text-slate-700">تاریخ خرید</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isBackdated}
                      onChange={(e) => setIsBackdated(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </div>
                  <span className="text-sm text-slate-600">ثبت برای تاریخ گذشته</span>
                </label>
              </div>

              {isBackdated ? (
                <div className="animate-fade-in-down">
                  <PersianDatePicker
                    label="انتخاب تاریخ خرید"
                    value={customDate}
                    onChange={setCustomDate}
                  />
                </div>
              ) : (
                <div className="text-sm text-slate-500 flex items-center gap-2 bg-white p-3 rounded-lg border border-slate-200">
                  <Check className="w-4 h-4 text-emerald-500" />
                  خرید با تاریخ امروز ({toPersianDate(new Date())}) ثبت می‌شود.
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">تصویر فاکتور</label>
              <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${fileName ? 'border-emerald-300 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}>
                {!fileName ? (
                  <label className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-600 font-medium">برای آپلود تصویر کلیک کنید</span>
                    <span className="text-xs text-slate-400 mt-1">JPG, PNG تا 5MB</span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                  </label>
                ) : (
                  <div className="flex items-center gap-4 w-full">
                    <div className="p-3 bg-white rounded-lg shadow-sm">
                      <ImageIcon className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-slate-700">{fileName}</p>
                      <p className="text-xs text-emerald-600">آپلود شد</p>
                    </div>
                    <button type="button" onClick={() => setFileName('')} className="p-2 hover:bg-rose-100 text-rose-500 rounded-lg">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col-reverse md:flex-row justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="w-full md:w-auto px-6 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium shadow-md shadow-indigo-200 transition-all"
              >
                ثبت نهایی و ارسال
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[900px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">تاریخ ثبت</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">شرح خرید</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">دسته‌بندی</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">مقدار</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">مبلغ (تومان)</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">وضعیت</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 text-sm text-slate-600 font-medium">{p.date}</td>
                  <td className="p-4">
                    <div className="font-bold text-slate-800 text-sm">{p.supplier}</div>
                    <div className="text-xs text-slate-400 mt-1">{p.description}</div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {p.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {p.quantity ? (
                      <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-100 text-xs font-bold">
                        {p.quantity} {p.unit}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-sm font-bold text-slate-800 dir-ltr text-right">{p.amount.toLocaleString('fa-IR')}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${p.status === TransactionStatus.APPROVED
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : p.status === TransactionStatus.REJECTED
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${p.status === TransactionStatus.APPROVED ? 'bg-emerald-600' :
                        p.status === TransactionStatus.REJECTED ? 'bg-rose-600' : 'bg-amber-600'
                        }`}></span>
                      {getStatusLabel(p.status)}
                    </span>
                  </td>
                  <td className="p-4 text-left">
                    <div className="flex items-center justify-end gap-2">
                      {p.status === TransactionStatus.PENDING && canApprove ? (
                        <>
                          <button
                            onClick={() => onApprovePurchase(p.id)}
                            className="p-2 bg-white border border-slate-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 rounded-lg transition-all shadow-sm"
                            title="تایید و ثبت در دفتر کل"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRejectPurchase(p.id)}
                            className="p-2 bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 rounded-lg transition-all shadow-sm"
                            title="رد درخواست"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setSelectedPurchase(p)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                            title="مشاهده جزئیات"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('آیا از حذف این هزینه اطمینان دارید؟')) {
                                onDeletePurchase(p.id);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 bg-slate-50/50">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 text-slate-300" />
                      <span>هیچ درخواست خریدی یافت نشد.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Details Modal */}
      {
        selectedPurchase && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  جزئیات درخواست خرید
                </h3>
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">تامین کننده</p>
                    <p className="font-bold text-slate-800 text-lg">{selectedPurchase.supplier}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${selectedPurchase.status === TransactionStatus.APPROVED
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : selectedPurchase.status === TransactionStatus.REJECTED
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}
                  >
                    {getStatusLabel(selectedPurchase.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">مبلغ کل</p>
                    <p className="font-bold text-slate-800 dir-ltr text-right">{selectedPurchase.amount.toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">تاریخ ثبت</p>
                    <p className="font-bold text-slate-800">{selectedPurchase.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">دسته‌بندی</p>
                    <p className="font-medium text-slate-700">{selectedPurchase.category}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">درخواست کننده</p>
                    <p className="font-medium text-slate-700">{selectedPurchase.requester}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-1">توضیحات</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {selectedPurchase.description || 'بدون توضیحات'}
                  </p>
                </div>

                {selectedPurchase.quantity && (
                  <div className="flex items-center gap-2 bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-800">
                    <Scale className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      مقدار: <span className="font-bold">{selectedPurchase.quantity} {selectedPurchase.unit}</span>
                    </span>
                  </div>
                )}

                {selectedPurchase.imageUrl && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">تصویر فاکتور</p>
                    <div className="h-32 bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 gap-2">
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-sm">تصویر ضمیمه شده</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedPurchase(null)}
                  className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 font-medium transition-colors shadow-sm"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Expenses;