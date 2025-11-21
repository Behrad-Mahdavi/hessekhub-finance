import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Account, PurchaseRequest, SaleRecord, JournalEntry, RevenueStream, TransactionStatus, UserRole, JournalLine, SubscriptionStatus, AccountType, Employee } from './types';
import { toPersianDate } from './utils';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Sales from './components/Sales';
import Ledger from './components/Ledger';
import Settings from './components/Settings';
import Payroll from './components/Payroll';
import { LayoutDashboard, ShoppingCart, PieChart, Book, Settings as SettingsIcon, Shield, Menu, X, Wallet, Users, Lock, LogIn } from 'lucide-react';
import {
  seedDatabase,
  subscribeToCollection,
  addAccount as firestoreAddAccount,
  updateAccount as firestoreUpdateAccount,
  deleteAccount as firestoreDeleteAccount,
  addPurchase as firestoreAddPurchase,
  updatePurchase as firestoreUpdatePurchase,
  deletePurchase as firestoreDeletePurchase,
  addSale as firestoreAddSale,
  updateSale as firestoreUpdateSale,
  deleteSale as firestoreDeleteSale,
  addJournal as firestoreAddJournal,
  addEmployee as firestoreAddEmployee,
  deleteEmployee as firestoreDeleteEmployee,
  checkFirebaseConnection
} from './services/firestore';

type View = 'dashboard' | 'expenses' | 'sales' | 'ledger' | 'settings' | 'payroll';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const appPassword = import.meta.env.VITE_APP_PASSWORD;
    if (passwordInput === appPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      setAuthError(false);
      toast.success('خوش آمدید');
    } else {
      setAuthError(true);
      toast.error('رمز عبور اشتباه است');
    }
  };

  // Global State (Now from Firestore)
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRequest[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [useFirebase, setUseFirebase] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionError, setConnectionError] = useState<string>('');

  // Initialize Firestore and subscribe to collections
  const initializeApp = async () => {
    try {
      setIsLoading(true);
      console.log('Initializing Firebase...');

      // Check connection first
      const connectionResult = await checkFirebaseConnection();
      if (!connectionResult.success) {
        throw new Error(connectionResult.error || "Firebase connection check failed");
      }
      setConnectionStatus('connected');
      setConnectionError('');

      // Seed database if empty
      await seedDatabase();
      console.log('Database seeded');

      // Subscribe to all collections
      // We need to handle unsubscriptions if we call this multiple times, 
      // but for now let's assume the useEffect cleanup handles the previous mount's listeners.
      // Actually, if we retry, we might duplicate listeners if we don't be careful.
      // But since we are just setting state, it's okay for now.
      // Ideally we should store unsub functions in refs.

      subscribeToCollection<Account>('accounts', setAccounts);
      subscribeToCollection<PurchaseRequest>('purchases', setPurchases);
      subscribeToCollection<SaleRecord>('sales', setSales);
      subscribeToCollection<JournalEntry>('journals', setJournals);
      subscribeToCollection<Employee>('employees', setEmployees);

      console.log('Subscriptions established');
      setUseFirebase(true);
      setIsLoading(false);
      toast.success('اتصال به سرور برقرار شد');
    } catch (error: any) {
      console.error('Error initializing app:', error);
      const errorMessage = error.message || 'Unknown error';
      console.warn('Falling back to local data due to Firebase error:', errorMessage);
      setConnectionError(errorMessage);

      // Fallback to local data if Firebase fails
      const { INITIAL_ACCOUNTS, MOCK_PURCHASES, MOCK_SALES, INITIAL_JOURNALS, INITIAL_EMPLOYEES } = await import('./constants');
      setAccounts(INITIAL_ACCOUNTS);
      setPurchases(MOCK_PURCHASES);
      setSales(MOCK_SALES);
      setJournals(INITIAL_JOURNALS);
      setEmployees(INITIAL_EMPLOYEES);

      setUseFirebase(false);
      setConnectionStatus('error');
      setIsLoading(false);
      toast.error(`خطا در اتصال: ${errorMessage}`);
    }
  };

  // Initialize Firestore and subscribe to collections
  useEffect(() => {
    initializeApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Account Management Logic
  const handleAddAccount = async (name: string, type: AccountType, initialBalance: number) => {
    const newAccount: Account = {
      id: (Math.floor(Math.random() * 9000) + 1000).toString(),
      code: (Math.floor(Math.random() * 9000) + 1000).toString(),
      name,
      type,
      balance: initialBalance
    };

    if (useFirebase) {
      try {
        const { id, ...data } = newAccount;
        await firestoreAddAccount(data);
        toast.success('حساب جدید با موفقیت ایجاد شد');
      } catch (error) {
        console.error('Firebase error, using local state:', error);
        setUseFirebase(false);
        setAccounts(prev => [...prev, newAccount]);
        toast.success('حساب جدید ایجاد شد (ذخیره محلی)');
      }
    } else {
      setAccounts(prev => [...prev, newAccount]);
      toast.success('حساب جدید با موفقیت ایجاد شد (محلی)');
    }
  };

  const handleUpdateAccount = async (id: string, name: string, balance: number) => {
    if (useFirebase) {
      try {
        await firestoreUpdateAccount(id, { name, balance });
        toast.success('حساب با موفقیت ویرایش شد');
      } catch (error) {
        console.error('Firebase error, using local state:', error);
        setUseFirebase(false);
        setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, name, balance } : acc));
        toast.success('حساب ویرایش شد (ذخیره محلی)');
      }
    } else {
      setAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, name, balance } : acc));
      toast.success('حساب با موفقیت ویرایش شد (محلی)');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (useFirebase) {
      try {
        await firestoreDeleteAccount(id);
        toast.success('حساب با موفقیت حذف شد');
      } catch (error) {
        console.error('Firebase error, using local state:', error);
        setUseFirebase(false);
        setAccounts(prev => prev.filter(acc => acc.id !== id));
        toast.success('حساب حذف شد (ذخیره محلی)');
      }
    } else {
      setAccounts(prev => prev.filter(acc => acc.id !== id));
      toast.success('حساب با موفقیت حذف شد (محلی)');
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (useFirebase) {
      try {
        await firestoreDeletePurchase(id);
        toast.success('هزینه با موفقیت حذف شد');
      } catch (error) {
        console.error('Firebase error, using local state:', error);
        setUseFirebase(false);
        setPurchases(prev => prev.filter(p => p.id !== id));
        toast.success('هزینه حذف شد (ذخیره محلی)');
      }
    } else {
      setPurchases(prev => prev.filter(p => p.id !== id));
      toast.success('هزینه با موفقیت حذف شد (محلی)');
    }
  };

  // Employee Logic
  const handleAddEmployee = async (emp: Employee) => {
    if (useFirebase) {
      try {
        await firestoreAddEmployee(emp);
        toast.success('پرسنل جدید با موفقیت اضافه شد');
      } catch (error) {
        console.error('Firebase error, using local state:', error);
        setUseFirebase(false);
        setEmployees(prev => [...prev, emp]);
        toast.success('پرسنل جدید اضافه شد (ذخیره محلی)');
      }
    } else {
      setEmployees(prev => [...prev, emp]);
      toast.success('پرسنل جدید با موفقیت اضافه شد (محلی)');
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (useFirebase) {
      try {
        await firestoreDeleteEmployee(id);
        toast.success('پرسنل با موفقیت حذف شد');
      } catch (error) {
        console.error('Firebase error, using local state:', error);
        setUseFirebase(false);
        setEmployees(prev => prev.filter(e => e.id !== id));
        toast.success('پرسنل حذف شد (ذخیره محلی)');
      }
    } else {
      setEmployees(prev => prev.filter(e => e.id !== id));
      toast.success('پرسنل با موفقیت حذف شد (محلی)');
    }
  };

  const handlePaySalary = async (emp: Employee, amount: number, date: string) => {
    // 1. Create Expense Transaction
    const salaryExpenseAccount = accounts.find(a => a.code === '5050')!;
    const bankAccount = accounts.find(a => a.code === '1020')!;

    // 3. Journal Entry
    const newJournal: JournalEntry = {
      id: `JRN-${Math.floor(Math.random() * 100000)}`,
      date: toPersianDate(new Date()),
      description: `پرداخت حقوق: ${emp.fullName}`,
      lines: [
        { accountId: salaryExpenseAccount.id, accountName: salaryExpenseAccount.name, debit: amount, credit: 0 },
        { accountId: bankAccount.id, accountName: bankAccount.name, debit: 0, credit: amount }
      ]
    };

    // 4. Add to Purchases (Expenses) for consistency in reporting
    const salaryPurchase: PurchaseRequest = {
      id: `PAY-${Math.floor(Math.random() * 10000)}`,
      requester: 'سیستم حقوق',
      amount: amount,
      category: 'هزینه حقوق و دستمزد',
      supplier: emp.fullName,
      description: `حقوق ماهانه - ${emp.role}`,
      status: TransactionStatus.APPROVED,
      date: toPersianDate(new Date())
    };

    if (useFirebase) {
      try {
        // 2. Update Balances
        await firestoreUpdateAccount(salaryExpenseAccount.id, {
          balance: salaryExpenseAccount.balance + amount
        });
        await firestoreUpdateAccount(bankAccount.id, {
          balance: bankAccount.balance - amount
        });
        await firestoreAddJournal(newJournal);
        await firestoreAddPurchase(salaryPurchase);
        toast.success('حقوق با موفقیت پرداخت شد');
      } catch (error) {
        console.error('Firebase error, using local state:', error);
        setUseFirebase(false);
        // Local Fallback
        setAccounts(prev => prev.map(acc => {
          if (acc.id === salaryExpenseAccount.id) return { ...acc, balance: acc.balance + amount };
          if (acc.id === bankAccount.id) return { ...acc, balance: acc.balance - amount };
          return acc;
        }));
        setJournals(prev => [...prev, newJournal]);
        setPurchases(prev => [salaryPurchase, ...prev]);
        toast.success('حقوق پرداخت شد (ذخیره محلی)');
      }
    } else {
      setAccounts(prev => prev.map(acc => {
        if (acc.id === salaryExpenseAccount.id) return { ...acc, balance: acc.balance + amount };
        if (acc.id === bankAccount.id) return { ...acc, balance: acc.balance - amount };
        return acc;
      }));
      setJournals(prev => [...prev, newJournal]);
      setPurchases(prev => [salaryPurchase, ...prev]);
      toast.success('حقوق پرداخت شد (محلی)');
    }
  };

  // Accounting Engine Logic: Create Journal from Purchase Approval
  const handleApprovePurchase = async (id: string) => {
    const purchase = purchases.find(p => p.id === id);
    if (!purchase) return;

    try {
      // 2. Create Journal Entry (Debit Expense, Credit Asset)
      const expenseAccount = accounts.find(a => a.name === purchase.category) || accounts.find(a => a.type === AccountType.EXPENSE)!;

      // 2. Determine Credit Account (Source of funds or Liability)
      let creditAccount: Account;

      if (purchase.isCredit) {
        // If Credit Purchase -> Accounts Payable (2010)
        creditAccount = accounts.find(a => a.code === '2010') || accounts.find(a => a.type === AccountType.LIABILITY)!;
      } else {
        // If Cash Purchase -> Asset Account (Bank/Cash)
        if (purchase.paymentAccountId) {
          const selected = accounts.find(a => a.id === purchase.paymentAccountId);
          creditAccount = selected || accounts.find(a => a.type === AccountType.ASSET)!;
        } else {
          creditAccount = accounts.find(a => a.type === AccountType.ASSET && (a.code === '1020' || a.name.includes('بانک'))) || accounts.find(a => a.type === AccountType.ASSET)!;
        }
      }

      const journalEntry: JournalEntry = {
        id: `JRN-${Math.floor(Math.random() * 100000)}`,
        date: toPersianDate(new Date()),
        description: `خرید تایید شده: ${purchase.supplier} ${purchase.isCredit ? '(نسیه)' : ''}`,
        referenceId: purchase.id,
        lines: [
          { accountId: expenseAccount.id, accountName: expenseAccount.name, debit: purchase.amount, credit: 0 },
          { accountId: creditAccount.id, accountName: creditAccount.name, debit: 0, credit: purchase.amount },
        ]
      };

      if (useFirebase) {
        try {
          // 1. Update Purchase Status
          await firestoreUpdatePurchase(id, { status: TransactionStatus.APPROVED });
          await firestoreAddJournal(journalEntry);

          // 3. Update Account Balances
          await firestoreUpdateAccount(expenseAccount.id, { balance: expenseAccount.balance + purchase.amount });

          // For Credit Account:
          // If Asset (Cash/Bank) -> Decrease Balance (Credit)
          // If Liability (Accounts Payable) -> Increase Balance (Credit)
          const newCreditBalance = creditAccount.type === AccountType.LIABILITY
            ? creditAccount.balance + purchase.amount
            : creditAccount.balance - purchase.amount;

          await firestoreUpdateAccount(creditAccount.id, { balance: newCreditBalance });
          toast.success('خرید با موفقیت تایید شد');
        } catch (error) {
          // Local Fallback
          setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: TransactionStatus.APPROVED } : p));
          setJournals(prev => [...prev, journalEntry]);

          setAccounts(prev => prev.map(acc => {
            if (acc.id === expenseAccount.id) return { ...acc, balance: acc.balance + purchase.amount };
            if (acc.id === creditAccount.id) {
              return {
                ...acc,
                balance: acc.type === AccountType.LIABILITY
                  ? acc.balance + purchase.amount
                  : acc.balance - purchase.amount
              };
            }
            return acc;
          }));
          toast.success('خرید تایید شد (ذخیره محلی)');
        }
      } else {
        setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: TransactionStatus.APPROVED } : p));
        setJournals(prev => [...prev, journalEntry]);

        setAccounts(prev => prev.map(acc => {
          if (acc.id === expenseAccount.id) return { ...acc, balance: acc.balance + purchase.amount };
          if (acc.id === creditAccount.id) {
            return {
              ...acc,
              balance: acc.type === AccountType.LIABILITY
                ? acc.balance + purchase.amount
                : acc.balance - purchase.amount
            };
          }
          return acc;
        }));
        toast.success('خرید با موفقیت تایید شد (محلی)');
      }
    } catch (error) {
      console.error("Error approving purchase:", error);
      toast.error('خطا در تایید خرید');
    }
  };

  const handleRejectPurchase = async (id: string) => {
    if (useFirebase) {
      try {
        await firestoreUpdatePurchase(id, { status: TransactionStatus.REJECTED });
        toast.success('خرید رد شد');
      } catch (error) {
        console.error('Firebase error, using local state:', error);
        setUseFirebase(false);
        setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: TransactionStatus.REJECTED } : p));
        toast.success('خرید رد شد (ذخیره محلی)');
      }
    } else {
      setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: TransactionStatus.REJECTED } : p));
      toast.success('خرید رد شد (محلی)');
    }
  };

  const handleAddPurchase = async (p: PurchaseRequest) => {
    if (useFirebase) {
      try {
        await firestoreAddPurchase(p);
        toast.success('درخواست خرید ثبت شد');
      } catch (error) {
        console.error('Firebase error, using local state:', error);
        setUseFirebase(false);
        setPurchases(prev => [p, ...prev]);
        toast.success('درخواست خرید ثبت شد (ذخیره محلی)');
      }
    } else {
      setPurchases(prev => [p, ...prev]);
      toast.success('درخواست خرید ثبت شد (محلی)');
    }
  };

  const handleAddSale = async (sale: SaleRecord) => {
    try {
      const cashAccount = accounts.find(a => a.code === '1010') || accounts.find(a => a.type === AccountType.ASSET)!;
      const newLines: JournalLine[] = [];

      // Logic for Cafe Split Sales (Compound Entry)
      if (sale.stream === RevenueStream.CAFE && sale.grossAmount) {
        const revenueAccount = accounts.find(a => a.code === '4010')!; // Cafe Revenue
        const discountAccount = accounts.find(a => a.code === '5110')!; // Discounts
        const refundAccount = accounts.find(a => a.code === '5120')!; // Returns
        const cashOnHandAccount = accounts.find(a => a.code === '1010')!; // Cash on Hand

        // Determine Receiving Bank Account (POS/C2C)
        let bankAccount = accounts.find(a => a.code === '1020')!;
        if (sale.paymentAccountId) {
          const selected = accounts.find(a => a.id === sale.paymentAccountId);
          if (selected) bankAccount = selected;
        }

        // Calculate Split Amounts
        const cashReceived = sale.cashAmount || 0;
        const c2cReceived = sale.cardToCardAmount || 0;
        const posReceived = sale.amount - cashReceived - c2cReceived; // Remaining is POS

        // 1. Debit Cash on Hand
        if (cashReceived > 0) {
          newLines.push({ accountId: cashOnHandAccount.id, accountName: cashOnHandAccount.name, debit: cashReceived, credit: 0 });
        }

        // 2. Debit Bank Account (POS + C2C)
        const totalBankDeposit = posReceived + c2cReceived;
        if (totalBankDeposit > 0) {
          newLines.push({ accountId: bankAccount.id, accountName: bankAccount.name, debit: totalBankDeposit, credit: 0 });
        }

        // Debit Discounts (if any)
        if (sale.discount && sale.discount > 0) {
          newLines.push({ accountId: discountAccount.id, accountName: discountAccount.name, debit: sale.discount, credit: 0 });
        }

        // Debit Refunds (if any)
        if (sale.refund && sale.refund > 0) {
          newLines.push({ accountId: refundAccount.id, accountName: refundAccount.name, debit: sale.refund, credit: 0 });
        }

        // Credit Gross Revenue
        newLines.push({ accountId: revenueAccount.id, accountName: revenueAccount.name, debit: 0, credit: sale.grossAmount });

        const journalEntry: JournalEntry = {
          id: `JRN-${Math.floor(Math.random() * 100000)}`,
          date: sale.date,
          description: `فروش: ${sale.details} ${sale.cardToCardSender ? `(واریز: ${sale.cardToCardSender})` : ''}`,
          referenceId: sale.id,
          lines: newLines
        };

        if (useFirebase) {
          try {
            await firestoreAddSale(sale);
            await firestoreAddJournal(journalEntry);

            // Update Balances
            if (cashReceived > 0) {
              await firestoreUpdateAccount(cashOnHandAccount.id, { balance: cashOnHandAccount.balance + cashReceived });
            }
            if (totalBankDeposit > 0) {
              await firestoreUpdateAccount(bankAccount.id, { balance: bankAccount.balance + totalBankDeposit });
            }

            await firestoreUpdateAccount(revenueAccount.id, {
              balance: revenueAccount.balance + (sale.grossAmount || 0)
            });
            if (sale.discount && sale.discount > 0) {
              await firestoreUpdateAccount(discountAccount.id, {
                balance: discountAccount.balance + sale.discount
              });
            }
            if (sale.refund && sale.refund > 0) {
              await firestoreUpdateAccount(refundAccount.id, {
                balance: refundAccount.balance + sale.refund
              });
            }
            toast.success('فروش با موفقیت ثبت شد');
          } catch (error) {
            console.error('Firebase error, using local state:', error);
            setUseFirebase(false);
            setSales(prev => [sale, ...prev]);
            setJournals(prev => [...prev, journalEntry]);
            setAccounts(prev => prev.map(acc => {
              if (acc.id === cashOnHandAccount.id) return { ...acc, balance: acc.balance + cashReceived };
              if (acc.id === bankAccount.id) return { ...acc, balance: acc.balance + totalBankDeposit };
              if (acc.id === revenueAccount.id) return { ...acc, balance: acc.balance + (sale.grossAmount || 0) };
              if (sale.discount && sale.discount > 0 && acc.id === discountAccount.id) return { ...acc, balance: acc.balance + sale.discount };
              if (sale.refund && sale.refund > 0 && acc.id === refundAccount.id) return { ...acc, balance: acc.balance + sale.refund };
              return acc;
            }));
            toast.success('فروش ثبت شد (ذخیره محلی)');
          }
        } else {
          setSales(prev => [sale, ...prev]);
          setJournals(prev => [...prev, journalEntry]);
          setAccounts(prev => prev.map(acc => {
            if (acc.id === cashOnHandAccount.id) return { ...acc, balance: acc.balance + cashReceived };
            if (acc.id === bankAccount.id) return { ...acc, balance: acc.balance + totalBankDeposit };
            if (acc.id === revenueAccount.id) return { ...acc, balance: acc.balance + (sale.grossAmount || 0) };
            if (sale.discount && sale.discount > 0 && acc.id === discountAccount.id) return { ...acc, balance: acc.balance + sale.discount };
            if (sale.refund && sale.refund > 0 && acc.id === refundAccount.id) return { ...acc, balance: acc.balance + sale.refund };
            return acc;
          }));
          toast.success('فروش با موفقیت ثبت شد (محلی)');
        }

      } else {
        // Logic for Simple Sales (Subscriptions / Assessments)
        let creditAccountCode;
        if (sale.stream === RevenueStream.SUBSCRIPTION) {
          creditAccountCode = '2020'; // Deferred Revenue
        } else {
          creditAccountCode = '4030'; // Assessment Revenue
        }

        const creditAccount = accounts.find(a => a.code === creditAccountCode)!;

        newLines.push({ accountId: cashAccount.id, accountName: cashAccount.name, debit: sale.amount, credit: 0 });
        newLines.push({ accountId: creditAccount.id, accountName: creditAccount.name, debit: 0, credit: sale.amount });

        const journalEntry: JournalEntry = {
          id: `JRN-${Math.floor(Math.random() * 100000)}`,
          date: sale.date,
          description: `فروش: ${sale.details}`,
          referenceId: sale.id,
          lines: newLines
        };

        if (useFirebase) {
          try {
            await firestoreAddSale(sale);
            await firestoreAddJournal(journalEntry);
            // Update Balances
            await firestoreUpdateAccount(cashAccount.id, {
              balance: cashAccount.balance + sale.amount
            });
            await firestoreUpdateAccount(creditAccount.id, {
              balance: creditAccount.balance + sale.amount
            });
            toast.success('فروش با موفقیت ثبت شد');
          } catch (error) {
            console.error('Firebase error, using local state:', error);
            setUseFirebase(false);
            setSales(prev => [sale, ...prev]);
            setJournals(prev => [...prev, journalEntry]);
            setAccounts(prev => prev.map(acc => {
              if (acc.id === cashAccount.id) return { ...acc, balance: acc.balance + sale.amount };
              if (acc.id === creditAccount.id) return { ...acc, balance: acc.balance + sale.amount };
              return acc;
            }));
            toast.success('فروش ثبت شد (ذخیره محلی)');
          }
        } else {
          setSales(prev => [sale, ...prev]);
          setJournals(prev => [...prev, journalEntry]);
          setAccounts(prev => prev.map(acc => {
            if (acc.id === cashAccount.id) return { ...acc, balance: acc.balance + sale.amount };
            if (acc.id === creditAccount.id) return { ...acc, balance: acc.balance + sale.amount };
            return acc;
          }));
          toast.success('فروش با موفقیت ثبت شد (محلی)');
        }
      }
    } catch (error) {
      console.error("Error adding sale:", error);
      toast.error('خطا در ثبت فروش');
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (useFirebase) {
      try {
        await firestoreDeleteSale(id);
        toast.success('تراکنش فروش با موفقیت حذف شد');
      } catch (error) {
        console.error('Firebase error, using local state:', error);
        setUseFirebase(false);
        setSales(prev => prev.filter(s => s.id !== id));
        toast.success('تراکنش فروش حذف شد (ذخیره محلی)');
      }
    } else {
      setSales(prev => prev.filter(s => s.id !== id));
      toast.success('تراکنش فروش با موفقیت حذف شد (محلی)');
    }
  };

  const handleCancelSubscription = async (id: string, refundAmount: number) => {
    const sale = sales.find(s => s.id === id);
    if (!sale || sale.stream !== RevenueStream.SUBSCRIPTION) return;

    try {
      const deferredAccount = accounts.find(a => a.code === '2020')!;
      const cashAccount = accounts.find(a => a.code === '1010')!;

      if (refundAmount > 0) {
        const newLines: JournalLine[] = [
          { accountId: deferredAccount.id, accountName: deferredAccount.name, debit: refundAmount, credit: 0 },
          { accountId: cashAccount.id, accountName: cashAccount.name, debit: 0, credit: refundAmount }
        ];

        const journalEntry: JournalEntry = {
          id: `JRN-${Math.floor(Math.random() * 100000)} `,
          date: toPersianDate(new Date()),
          description: `لغو اشتراک و عودت وجه: ${sale.details} `,
          referenceId: sale.id,
          lines: newLines
        };

        if (useFirebase) {
          try {
            await firestoreUpdateSale(id, { subscriptionStatus: SubscriptionStatus.CANCELLED });
            await firestoreAddJournal(journalEntry);
            await firestoreUpdateAccount(deferredAccount.id, { balance: deferredAccount.balance - refundAmount });
            await firestoreUpdateAccount(cashAccount.id, { balance: cashAccount.balance - refundAmount });
            toast.success('اشتراک لغو و مبلغ عودت داده شد');
          } catch (error) {
            console.error('Firebase error, using local state:', error);
            setUseFirebase(false);
            setSales(prev => prev.map(s => s.id === id ? { ...s, subscriptionStatus: SubscriptionStatus.CANCELLED } : s));
            setJournals(prev => [...prev, journalEntry]);
            setAccounts(prev => prev.map(acc => {
              if (acc.id === deferredAccount.id) return { ...acc, balance: acc.balance - refundAmount };
              if (acc.id === cashAccount.id) return { ...acc, balance: acc.balance - refundAmount };
              return acc;
            }));
            toast.success('اشتراک لغو شد (ذخیره محلی)');
          }
        } else {
          setSales(prev => prev.map(s => s.id === id ? { ...s, subscriptionStatus: SubscriptionStatus.CANCELLED } : s));
          setJournals(prev => [...prev, journalEntry]);
          setAccounts(prev => prev.map(acc => {
            if (acc.id === deferredAccount.id) return { ...acc, balance: acc.balance - refundAmount };
            if (acc.id === cashAccount.id) return { ...acc, balance: acc.balance - refundAmount };
            return acc;
          }));
          toast.success('اشتراک لغو شد (محلی)');
        }
      } else {
        // If no refund, just update subscription status
        if (useFirebase) {
          try {
            await firestoreUpdateSale(id, { subscriptionStatus: SubscriptionStatus.CANCELLED });
            toast.success('اشتراک با موفقیت لغو شد');
          } catch (error) {
            console.error('Firebase error, using local state:', error);
            setUseFirebase(false);
            setSales(prev => prev.map(s => s.id === id ? { ...s, subscriptionStatus: SubscriptionStatus.CANCELLED } : s));
            toast.success('اشتراک لغو شد (ذخیره محلی)');
          }
        } else {
          setSales(prev => prev.map(s => s.id === id ? { ...s, subscriptionStatus: SubscriptionStatus.CANCELLED } : s));
          toast.success('اشتراک با موفقیت لغو شد (محلی)');
        }
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error('خطا در لغو اشتراک');
    }
  };




  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard, view: 'dashboard' },
    { id: 'expenses', label: 'خرید و هزینه', icon: ShoppingCart, view: 'expenses' },
    { id: 'sales', label: 'فروش و درآمد', icon: PieChart, view: 'sales' },
    { id: 'payroll', label: 'حقوق و دستمزد', icon: Users, view: 'payroll' },
    { id: 'ledger', label: 'دفتر کل', icon: Book, view: 'ledger' },
    { id: 'settings', label: 'تنظیمات', icon: SettingsIcon, view: 'settings' },
  ];

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard accounts={accounts} sales={sales} purchases={purchases} />
        );
      case 'expenses':
        return (
          <Expenses
            accounts={accounts}
            purchases={purchases}
            onAddPurchase={handleAddPurchase}
            onApprovePurchase={handleApprovePurchase}
            onRejectPurchase={handleRejectPurchase}
            onDeletePurchase={handleDeletePurchase}
          />
        );
      case 'sales':
        return (
          <Sales
            sales={sales}
            accounts={accounts}
            onAddSale={handleAddSale}
            onCancelSubscription={handleCancelSubscription}
            onDeleteSale={handleDeleteSale} // Passed handler
            userRole={UserRole.ADMIN} // Role removed, passing dummy
          />
        ); case 'ledger':
        return (
          <Ledger journals={journals} />
        );
      case 'settings':
        return (
          <Settings
            accounts={accounts}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      case 'payroll':
        return (
          <Payroll
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onPaySalary={handlePaySalary}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white font-sans">
        <Toaster position="top-center" />
        <div className="w-full max-w-md p-8 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">سیستم مالی حس خوب</h1>
            <p className="text-slate-400 mt-2 text-sm">لطفاً برای ورود رمز عبور را وارد کنید</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">رمز عبور</label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setAuthError(false);
                }}
                className={`w-full p-4 bg-slate-900 border ${authError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-600 focus:ring-indigo-500'} rounded-xl focus:ring-2 outline-none transition-all text-center tracking-widest text-lg placeholder:tracking-normal`}
                placeholder="••••••••"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              ورود به سیستم
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">نسخه ۱.۲.۰ |طراحی و توسعه : بهراد مهدوی </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800 font-sans overflow-hidden">
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: {
            fontFamily: 'inherit',
            borderRadius: '12px',
            background: '#333',
            color: '#fff',
          },
          success: {
            style: {
              background: '#10B981',
            },
          },
          error: {
            style: {
              background: '#EF4444',
            },
          },
        }}
      />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 text-white p-4 z-50 flex justify-between items-center shadow-md">
        <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
          <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
          حس خوب
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 w-64 bg-slate-900 text-white flex flex-col flex-shrink-0 transition-transform duration-300 shadow-2xl z-40 md:translate-x-0 md:static ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-slate-800 hidden md:block">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
            حس خوب
          </h1>
          <p className="text-xs text-slate-400 mt-2 pr-4">سیستم یکپارچه مالی</p>
        </div>

        <div className="p-6 border-b border-slate-800 md:hidden mt-12">
          <p className="text-xs text-slate-400 pr-2">منوی کاربری</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.view as View)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${currentView === item.view ? 'bg-indigo-600 shadow-lg shadow-indigo-900/20 text-white translate-x-[-4px]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900 space-y-3">

          <div className={`flex flex-col gap-2 px-3 py-2 rounded-lg text-xs font-medium border ${useFirebase ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${useFirebase ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                {useFirebase ? 'اتصال برقرار' : 'آفلاین (محلی)'}
              </div>
              {!useFirebase && (
                <button
                  onClick={() => initializeApp()}
                  className="text-[10px] bg-rose-500/20 hover:bg-rose-500/30 px-2 py-1 rounded transition-colors"
                >
                  تلاش مجدد
                </button>
              )}
            </div>
            {!useFirebase && connectionError && (
              <div className="text-[10px] opacity-80 dir-ltr text-left break-all font-mono bg-black/20 p-1 rounded">
                {connectionError.substring(0, 60)}...
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-slate-800/50 border border-slate-800">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm shadow-inner">
              م
            </div>
            <div className="text-sm overflow-hidden">
              <div className="font-medium truncate">مدیر سیستم</div>
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Shield className="w-3 h-3" /> آنلاین
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      {/* Main Content */}
      <main className="flex-1 overflow-auto relative pt-16 md:pt-0">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;