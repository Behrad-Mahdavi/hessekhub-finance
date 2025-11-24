import { Account, AccountType, JournalEntry, PurchaseRequest, SaleRecord, RevenueStream, TransactionStatus, SubscriptionStatus, Employee } from './types';
import { toPersianDate } from './utils';

// Helper to get past dates
const daysAgo = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return toPersianDate(d);
};

export const INITIAL_ACCOUNTS: Account[] = [
  { id: '101', code: '1010', name: 'موجودی نقد (صندوق)', type: AccountType.ASSET, balance: 50000000 },
  { id: '102', code: '1020', name: 'حساب بانکی', type: AccountType.ASSET, balance: 120000000 },
  { id: '201', code: '2010', name: 'حساب‌های پرداختنی', type: AccountType.LIABILITY, balance: 0 },
  { id: '202', code: '2020', name: 'پیش‌دریافت درآمد اشتراک', type: AccountType.LIABILITY, balance: 0 },
  { id: '301', code: '3010', name: 'سرمایه اولیه', type: AccountType.EQUITY, balance: 170000000 },
  { id: '401', code: '4010', name: 'درآمد کافه', type: AccountType.REVENUE, balance: 0 },
  { id: '402', code: '4020', name: 'درآمد تحقق‌یافته اشتراک', type: AccountType.REVENUE, balance: 0 },
  { id: '403', code: '4030', name: 'درآمد مشاوره تغذیه', type: AccountType.REVENUE, balance: 0 },
  { id: '501', code: '5010', name: 'هزینه مواد اولیه', type: AccountType.EXPENSE, balance: 0 },
  { id: '502', code: '5020', name: 'هزینه آب و برق', type: AccountType.EXPENSE, balance: 0 },
  { id: '503', code: '5030', name: 'ملزومات اداری', type: AccountType.EXPENSE, balance: 0 },
  { id: '504', code: '5040', name: 'هزینه اجاره', type: AccountType.EXPENSE, balance: 0 },
  { id: '505', code: '5050', name: 'هزینه حقوق و دستمزد', type: AccountType.EXPENSE, balance: 0 },
  { id: '506', code: '5060', name: 'بیمه', type: AccountType.EXPENSE, balance: 0 },
  { id: '510', code: '5110', name: 'تخفیفات فروش', type: AccountType.EXPENSE, balance: 0 }, // Treated as Expense/Contra-Revenue
  { id: '511', code: '5120', name: 'برگشت از فروش', type: AccountType.EXPENSE, balance: 0 }, // Treated as Expense/Contra-Revenue
];

export const MOCK_PURCHASES: PurchaseRequest[] = [
  {
    id: 'PUR-001',
    requester: 'علی باریستا',
    amount: 1500000,
    category: 'هزینه مواد اولیه',
    supplier: 'قهوه بیرون‌بر تهران',
    description: 'خرید هفتگی دان قهوه',
    status: TransactionStatus.PENDING,
    date: daysAgo(0), // Today
    imageUrl: 'mock-image',
    quantity: 2000,
    unit: 'گرم'
  },
  {
    id: 'PUR-002',
    requester: 'سارا ادمین',
    amount: 200000,
    category: 'ملزومات اداری',
    supplier: 'لوازم التحریر ایران',
    description: 'کاغذ پرینتر و خودکار',
    status: TransactionStatus.APPROVED,
    date: daysAgo(2), // 2 days ago
  },
];

export const MOCK_SALES: SaleRecord[] = [
  { id: 'SAL-001', stream: RevenueStream.CAFE, amount: 4500000, date: daysAgo(1), details: 'فروش روزانه کافه', grossAmount: 4800000, discount: 300000, refund: 0 },
  { id: 'SAL-002', stream: RevenueStream.SUBSCRIPTION, amount: 12000000, date: daysAgo(1), details: 'پکیج سلامتی ماهانه', duration: '1 ماهه', subscriptionStatus: SubscriptionStatus.ACTIVE },
  { id: 'SAL-003', stream: RevenueStream.ASSESSMENT, amount: 500000, date: daysAgo(0), details: 'مشاوره تغذیه حضوری' },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'EMP-1', fullName: 'علی محمدی', role: 'باریستا', baseSalary: 12000000, joinDate: '1402/01/15' },
  { id: 'EMP-2', fullName: 'سارا احمدی', role: 'ادمین', baseSalary: 15000000, joinDate: '1402/05/01' },
  { id: 'EMP-3', fullName: 'دکتر حسینی', role: 'متخصص تغذیه', baseSalary: 25000000, joinDate: '1401/11/10' },
];

// Helper to initialize journals based on mock approved/sales data
export const INITIAL_JOURNALS: JournalEntry[] = [
  {
    id: 'JRN-001',
    date: daysAgo(1),
    description: 'فروش روزانه کافه',
    lines: [
      { accountId: '101', accountName: 'موجودی نقد (صندوق)', debit: 4500000, credit: 0 },
      { accountId: '510', accountName: 'تخفیفات فروش', debit: 300000, credit: 0 },
      { accountId: '401', accountName: 'درآمد کافه', debit: 0, credit: 4800000 },
    ],
    referenceId: 'SAL-001',
  },
  {
    id: 'JRN-002',
    date: daysAgo(2),
    description: 'خرید ملزومات اداری',
    lines: [
      { accountId: '503', accountName: 'ملزومات اداری', debit: 200000, credit: 0 },
      { accountId: '102', accountName: 'حساب بانکی', debit: 0, credit: 200000 },
    ],
    referenceId: 'PUR-002',
  },
];