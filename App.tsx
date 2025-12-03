
import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import Transfers from './components/Transfers';

import { toPersianDate } from './utils';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Sales from './components/Sales';
import Ledger from './components/Ledger';
import Settings from './components/Settings';
import Payroll from './components/Payroll';
import SubscriptionManager from './components/SubscriptionManager';
import InventoryManager from './components/InventoryManager';
import TransactionManager from './components/TransactionManager';
import { LayoutDashboard, ShoppingCart, PieChart, Book, Settings as SettingsIcon, Shield, Menu, X, Wallet, Users, Lock, LogIn, Truck, Package, History, ArrowRightLeft, LineChart, CreditCard, Home, FileText, Landmark } from 'lucide-react';
import Analytics from './components/Analytics';
import ChecksManager from './components/ChecksManager';
import LoansManager from './components/LoansManager';
import { Account, PurchaseRequest, SaleRecord, JournalEntry, RevenueStream, TransactionStatus, UserRole, JournalLine, SubscriptionStatus, AccountType, Employee, Customer, Subscription, PayrollPayment, Supplier, InventoryItem, TransferRecord, PayableCheck, Loan, LoanRepayment, CheckStatus } from './types';

import { collection, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
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
  deleteSaleFull as firestoreDeleteSale,
  addJournal as firestoreAddJournal,
  addEmployee as firestoreAddEmployee,
  updateEmployee as firestoreUpdateEmployee,
  deleteEmployee as firestoreDeleteEmployee,
  addCustomer as firestoreAddCustomer,
  updateCustomer as firestoreUpdateCustomer,
  addSubscription as firestoreAddSubscription,
  updateSubscription as firestoreUpdateSubscription,
  addPayrollPayment as firestoreAddPayrollPayment,
  deleteCustomer as firestoreDeleteCustomer,
  deleteSubscription as firestoreDeleteSubscription,
  addSupplier as firestoreAddSupplier,
  updateSupplier as firestoreUpdateSupplier,
  deleteSupplier as firestoreDeleteSupplier,
  checkFirebaseConnection,
  addJournalEntry,
  updateSupplier,
  saveInventoryPurchase,
  registerInventoryUsage,
  addInventoryItem,
  updateInventoryItem,
  addTransfer,
  deleteTransferFull,
  addCheck,
  updateCheckStatus,
  addLoan,
  addLoanRepayment
} from './services/firestore';
import SupplierManager from './components/SupplierManager';

type View = 'dashboard' | 'expenses' | 'sales' | 'ledger' | 'settings' | 'payroll' | 'subscriptions' | 'suppliers' | 'inventory' | 'transactions' | 'transfers' | 'analytics' | 'checks' | 'loans';

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payrollPayments, setPayrollPayments] = useState<PayrollPayment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [checks, setChecks] = useState<PayableCheck[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanRepayments, setLoanRepayments] = useState<LoanRepayment[]>([]);
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [useFirebase, setUseFirebase] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionError, setConnectionError] = useState<string>('');

  // Debug: Log payroll payments when they change
  useEffect(() => {
    console.log('Payroll Payments Updated:', {
      count: payrollPayments.length,
      data: payrollPayments
    });
  }, [payrollPayments]);

  // Inventory Management Logic
  const handleAddInventoryItem = async (item: Omit<InventoryItem, 'id' | 'updatedAt'>) => {
    try {
      if (useFirebase) {
        await addInventoryItem({ ...item, updatedAt: new Date() });
        toast.success('کالا با موفقیت تعریف شد');
      } else {
        const newItem = { ...item, id: `INV-${Date.now()}`, updatedAt: new Date() };
        setInventoryItems([...inventoryItems, newItem as InventoryItem]);
        toast.success('کالا تعریف شد (محلی)');
      }
    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast.error('خطا در تعریف کالا');
    }
  };

  const handleUpdateInventoryItem = async (id: string, data: Partial<InventoryItem>) => {
    try {
      if (useFirebase) {
        await updateInventoryItem(id, { ...data, updatedAt: new Date() });
        toast.success('کالا ویرایش شد');
      } else {
        setInventoryItems(prev => prev.map(item => item.id === id ? { ...item, ...data } : item));
        toast.success('کالا ویرایش شد (محلی)');
      }
    } catch (error) {
      console.error('Error updating inventory item:', error);
      toast.error('خطا در ویرایش کالا');
    }
  };

  const handleRegisterUsage = async (itemId: string, quantity: number, description: string, date: string) => {
    try {
      if (useFirebase) {
        await registerInventoryUsage(itemId, quantity, description, date);
        toast.success('مصرف کالا ثبت شد');
      } else {
        // Local Fallback
        setInventoryItems(prev => prev.map(item =>
          item.id === itemId ? { ...item, currentStock: item.currentStock - quantity } : item
        ));
        toast.success('مصرف ثبت شد (محلی)');
      }
    } catch (error) {
      console.error('Error registering usage:', error);
      toast.error('خطا در ثبت مصرف');
    }
  };



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

      // REMOVED: subscribeToCollection calls to prevent duplicates.
      // Subscriptions are now handled exclusively by the useEffect hook below.

      console.log('Firebase initialized successfully');
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

  // This useEffect handles real-time subscriptions using onSnapshot when useFirebase is true
  useEffect(() => {
    if (!useFirebase) return;

    // Define Unsubscribe functions array
    const unsubs: (() => void)[] = [];

    // Helper to add to unsubs list
    const addSub = (unsub: () => void) => unsubs.push(unsub);

    addSub(onSnapshot(collection(db, 'accounts'), (snapshot) => {
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account)));
    }));

    addSub(onSnapshot(collection(db, 'purchases'), (snapshot) => {
      setPurchases(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseRequest)));
    }));

    addSub(onSnapshot(collection(db, 'sales'), (snapshot) => {
      setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleRecord)));
    }));

    addSub(onSnapshot(collection(db, 'journals'), (snapshot) => {
      setJournals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry)));
    }));

    addSub(onSnapshot(collection(db, 'employees'), (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
    }));

    addSub(onSnapshot(collection(db, 'customers'), (snapshot) => {
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Customer)));
    }));

    addSub(onSnapshot(collection(db, 'subscriptions'), (snapshot) => {
      setSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription)));
    }));

    addSub(onSnapshot(collection(db, 'payroll_payments'), (snapshot) => {
      setPayrollPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayrollPayment)));
    }));

    addSub(onSnapshot(collection(db, 'suppliers'), (snapshot) => {
      setSuppliers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    }));

    addSub(onSnapshot(collection(db, 'inventory_items'), (snapshot) => {
      setInventoryItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)));
    }));

    addSub(onSnapshot(collection(db, 'transfers'), (snapshot) => {
      setTransfers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransferRecord)));
    }));

    addSub(onSnapshot(collection(db, 'checks'), (snapshot) => {
      setChecks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PayableCheck)));
    }));

    addSub(onSnapshot(collection(db, 'loans'), (snapshot) => {
      setLoans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan)));
    }));

    addSub(onSnapshot(collection(db, 'loan_repayments'), (snapshot) => {
      setLoanRepayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoanRepayment)));
    }));

    // Cleanup function
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [useFirebase]);


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
        console.error('Firebase error:', error);
        toast.error('خطا در ایجاد حساب. لطفاً اتصال اینترنت را بررسی کنید.');
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
        console.error('Firebase error:', error);
        toast.error('خطا در ویرایش حساب. لطفاً اتصال اینترنت را بررسی کنید.');
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
        console.error('Firebase error:', error);
        toast.error('خطا در حذف حساب. لطفاً اتصال اینترنت را بررسی کنید.');
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
        console.error('Firebase error:', error);
        toast.error('خطا در حذف تأمین‌کننده. لطفاً اتصال اینترنت را بررسی کنید.');
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
        console.error('Firebase error:', error);
        toast.error('خطا در افزودن تأمین‌کننده. لطفاً اتصال اینترنت را بررسی کنید.');
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
        console.error('Firebase error:', error);
        toast.error('خطا در حذف مشتری. لطفاً اتصال اینترنت را بررسی کنید.');
      }
    } else {
      setEmployees(prev => prev.filter(e => e.id !== id));
      toast.success('پرسنل با موفقیت حذف شد (محلی)');
    }
  };

  // Customer & Subscription Logic
  const handleAddCustomer = async (customer: Customer) => {
    if (useFirebase) {
      try {
        await firestoreAddCustomer(customer);
        toast.success('مشتری جدید با موفقیت اضافه شد');
      } catch (error) {
        console.error('Firebase error:', error);
        toast.error('خطا در افزودن مشتری. لطفاً اتصال اینترنت را بررسی کنید.');
      }
    } else {
      setCustomers(prev => [...prev, customer]);
      toast.success('مشتری جدید با موفقیت اضافه شد (محلی)');
    }
  };

  const handleUpdateCustomer = async (customer: Customer) => {
    if (useFirebase) {
      try {
        await firestoreUpdateCustomer(customer.id, customer);
        toast.success('اطلاعات مشتری به‌روزرسانی شد');
      } catch (error) {
        console.error('Firebase error:', error);
        toast.error('خطا در ویرایش مشتری. لطفاً اتصال اینترنت را بررسی کنید.');
      }
    } else {
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
      toast.success('اطلاعات مشتری به‌روزرسانی شد (محلی)');
    }
  };

  const handleAddSubscription = async (subscription: Subscription, sale: SaleRecord) => {
    if (useFirebase) {
      try {
        // Add subscription to Firestore and get the generated ID
        const subscriptionDocRef = await firestoreAddSubscription(subscription);
        const firestoreSubscriptionId = subscriptionDocRef.id;

        // Add sale to Firestore
        await firestoreAddSale(sale);

        // Update customer's active subscription with Firestore ID
        const customer = customers.find(c => c.id === subscription.customerId);
        if (customer) {
          await firestoreUpdateCustomer(customer.id, { activeSubscriptionId: firestoreSubscriptionId });
          // REMOVED: setCustomers(...) - Handled by snapshot listener
        }

        // Accounting Logic (similar to handleAddSale)
        if (subscription.paymentStatus === 'PAID' && sale.paymentAccountId) {
          // Update Account Balance (Debit Asset Account)
          const paymentAccount = accounts.find(a => a.id === sale.paymentAccountId);
          if (paymentAccount) {
            await firestoreUpdateAccount(sale.paymentAccountId, {
              balance: paymentAccount.balance + sale.amount
            });
            // REMOVED: setAccounts(...) - Handled by snapshot listener
          }

          // Credit Revenue (find or use subscription revenue account)
          const subscriptionRevenueAccount = accounts.find(a => a.code === '4020'); // Subscription Revenue
          if (subscriptionRevenueAccount) {
            await firestoreUpdateAccount(subscriptionRevenueAccount.id, {
              balance: subscriptionRevenueAccount.balance + sale.amount
            });
            // REMOVED: setAccounts(...) - Handled by snapshot listener
          }

          // Create Journal Entry
          const journal: JournalEntry = {
            id: `JRN-${Math.floor(Math.random() * 100000)}`,
            date: sale.date,
            description: `دریافت اشتراک از ${customer?.name || 'مشتری'} - ${subscription.planName}`,
            lines: [
              {
                accountId: sale.paymentAccountId,
                accountName: paymentAccount?.name || 'حساب پرداخت',
                debit: sale.amount,
                credit: 0,
              },
              {
                accountId: subscriptionRevenueAccount?.id || '',
                accountName: subscriptionRevenueAccount?.name || 'درآمد اشتراک',
                debit: 0,
                credit: sale.amount,
              },
            ],
          };

          await firestoreAddJournal(journal);
          // REMOVED: setJournals(...) - Handled by snapshot listener
        }

        toast.success('اشتراک با موفقیت ثبت شد');
      } catch (error) {
        console.error('Firebase error:', error);
        toast.error('خطا در ثبت اشتراک. لطفاً اتصال اینترنت را بررسی کنید.');
      }
    } else {
      setSubscriptions(prev => [...prev, subscription]);
      setSales(prev => [sale, ...prev]);
      setCustomers(prev => prev.map(c =>
        c.id === subscription.customerId ? { ...c, activeSubscriptionId: subscription.id } : c
      ));
      toast.success('اشتراک با موفقیت ثبت شد (محلی)');
    }
  };


  const handlePaySalary = async (payment: PayrollPayment) => {
    if (useFirebase) {
      try {
        // 1. Add Payroll Payment Record
        await firestoreAddPayrollPayment(payment);
        // setPayrollPayments handled by subscription

        // 2. Update Account Balance (Credit Asset Account)
        const paymentAccount = accounts.find(a => a.id === payment.paymentAccountId);
        if (paymentAccount) {
          await firestoreUpdateAccount(payment.paymentAccountId, {
            balance: paymentAccount.balance - payment.totalAmount
          });
          // REMOVED: setAccounts(...) - Handled by snapshot listener
        }

        // 3. Create Journal Entry
        const employee = employees.find(e => e.id === payment.employeeId);
        const isCourier = employee?.department === 'COURIER' || employee?.role === 'پیک' || employee?.role === 'پیک موتوری';
        const expenseCode = isCourier ? '5051' : '5050';
        const salaryExpenseAccount = accounts.find(a => a.code === expenseCode); // 5050: Staff, 5051: Courier

        if (salaryExpenseAccount) {
          // Update Salary Expense Account Balance (Debit = Increase Expense)
          await firestoreUpdateAccount(salaryExpenseAccount.id, {
            balance: salaryExpenseAccount.balance + payment.totalAmount
          });
        }

        const newJournal: JournalEntry = {
          id: `JRN-${Math.floor(Math.random() * 100000)}`,
          date: payment.date,
          description: `پرداخت حقوق: ${payment.employeeName} - ${payment.notes || ''}`,
          lines: [
            {
              accountId: salaryExpenseAccount?.id || '',
              accountName: salaryExpenseAccount?.name || 'هزینه حقوق',
              debit: payment.totalAmount,
              credit: 0
            },
            {
              accountId: payment.paymentAccountId,
              accountName: payment.paymentAccountName,
              debit: 0,
              credit: payment.totalAmount
            }
          ]
        };

        await firestoreAddJournal(newJournal);
        // REMOVED: setJournals(...) - Handled by snapshot listener

        toast.success('حقوق با موفقیت پرداخت شد');

      } catch (error) {
        console.error("Error paying salary:", error);
        toast.error('خطا در پرداخت حقوق');
      }
    } else {
      // Local fallback (simplified)
      setPayrollPayments(prev => [payment, ...prev]);

      // Update Accounts Locally
      setAccounts(prev => prev.map(acc => {
        // Credit Payment Account (Asset)
        if (acc.id === payment.paymentAccountId) {
          return { ...acc, balance: acc.balance - payment.totalAmount };
        }
        // Debit Salary Expense Account (Expense)
        if (acc.code === '5050' || acc.code === '5051') {
          // We need to know WHICH one to update.
          // Simplified local update: just update if it matches the target code
          const employee = employees.find(e => e.id === payment.employeeId);
          const isCourier = employee?.department === 'COURIER' || employee?.role === 'پیک' || employee?.role === 'پیک موتوری';
          const targetCode = isCourier ? '5051' : '5050';

          if (acc.code === targetCode) {
            return { ...acc, balance: acc.balance + payment.totalAmount };
          }
        }
        return acc;
      }));

      // Add Journal Entry Locally
      const employee = employees.find(e => e.id === payment.employeeId);
      const isCourier = employee?.department === 'COURIER' || employee?.role === 'پیک' || employee?.role === 'پیک موتوری';
      const expenseCode = isCourier ? '5051' : '5050';
      const salaryExpenseAccount = accounts.find(a => a.code === expenseCode);
      const newJournal: JournalEntry = {
        id: `JRN-${Math.floor(Math.random() * 100000)}`,
        date: payment.date,
        description: `پرداخت حقوق: ${payment.employeeName} - ${payment.notes || ''}`,
        lines: [
          {
            accountId: salaryExpenseAccount?.id || '',
            accountName: salaryExpenseAccount?.name || 'هزینه حقوق',
            debit: payment.totalAmount,
            credit: 0
          },
          {
            accountId: payment.paymentAccountId,
            accountName: payment.paymentAccountName,
            debit: 0,
            credit: payment.totalAmount
          }
        ]
      };
      setJournals(prev => [...prev, newJournal]);

      toast.success('پرداخت حقوق ثبت شد (محلی)');
    }
  };

  const handleSupplierPayment = async (supplierId: string, amount: number, accountId: string, date: string, description: string) => {
    try {
      const supplier = suppliers.find(s => s.id === supplierId);
      const assetAccount = accounts.find(a => a.id === accountId);

      if (!supplier || !assetAccount) {
        toast.error('تامین‌کننده یا حساب یافت نشد');
        return;
      }

      // 1. Create Journal Entry
      const journalEntry: JournalEntry = {
        id: `JRN-${Math.floor(Math.random() * 100000)}`,
        date: date,
        description: description,
        referenceId: supplierId,
        lines: [
          { accountId: supplierId, accountName: `حساب پرداختنی: ${supplier.name}`, debit: amount, credit: 0 }, // Decrease Liability (Debit)
          { accountId: assetAccount.id, accountName: assetAccount.name, debit: 0, credit: amount }, // Decrease Asset (Credit)
        ]
      };

      if (useFirebase) {
        // Firebase Updates
        // 1. Update Supplier Balance (Decrease Debt)
        await updateSupplier(supplierId, { balance: supplier.balance - amount });

        // 2. Update Asset Account Balance (Decrease Asset)
        await firestoreUpdateAccount(assetAccount.id, { balance: assetAccount.balance - amount });

        // 3. Add Journal Entry
        await addJournalEntry(journalEntry);

        toast.success('پرداخت با موفقیت ثبت شد');
      } else {
        // Local Fallback
        setSuppliers(prev => prev.map(s => s.id === supplierId ? { ...s, balance: s.balance - amount } : s));
        setAccounts(prev => prev.map(a => a.id === accountId ? { ...a, balance: a.balance - amount } : a));
        setJournals(prev => [journalEntry, ...prev]);
        toast.success('پرداخت ثبت شد (محلی)');
      }
    } catch (error) {
      console.error('Error registering payment:', error);
      toast.error('خطا در ثبت پرداخت');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (confirm('آیا از حذف این مشتری و تمام اشتراک‌های او اطمینان دارید؟ این عملیات غیرقابل بازگشت است.')) {
      if (useFirebase) {
        try {
          // 1. Delete Customer
          await firestoreDeleteCustomer(customerId);

          // 2. Delete Associated Subscriptions
          const customerSubs = subscriptions.filter(s => s.customerId === customerId);
          for (const sub of customerSubs) {
            await firestoreDeleteSubscription(sub.id);
          }

          // 3. Update Local State - Handled by subscription
          // setCustomers(prev => prev.filter(c => c.id !== customerId));
          // setSubscriptions(prev => prev.filter(s => s.customerId !== customerId));

          toast.success('مشتری و اشتراک‌های او با موفقیت حذف شدند');
        } catch (error) {
          console.error("Error deleting customer:", error);
          toast.error('خطا در حذف مشتری');
        }
      } else {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        setSubscriptions(prev => prev.filter(s => s.customerId !== customerId));
        toast.success('مشتری حذف شد (محلی)');
      }
    }
  };
  const handleAddSupplier = async (supplier: Supplier) => {
    if (useFirebase) {
      try {
        await firestoreAddSupplier(supplier);
        toast.success('تامین‌کننده با موفقیت اضافه شد');
      } catch (error) {
        console.error("Error adding supplier:", error);
        toast.error('خطا در افزودن تامین‌کننده');
      }
    } else {
      setSuppliers(prev => [...prev, supplier]);
      toast.success('تامین‌کننده اضافه شد (محلی)');
    }
  };

  const handleUpdateSupplier = async (id: string, data: Partial<Supplier>) => {
    if (useFirebase) {
      try {
        await firestoreUpdateSupplier(id, data);
        toast.success('تامین‌کننده بروزرسانی شد');
      } catch (error) {
        console.error("Error updating supplier:", error);
        toast.error('خطا در بروزرسانی تامین‌کننده');
      }
    } else {
      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
      toast.success('تامین‌کننده بروزرسانی شد (محلی)');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm('آیا از حذف این تامین‌کننده اطمینان دارید؟')) {
      if (useFirebase) {
        try {
          await firestoreDeleteSupplier(id);
          toast.success('تامین‌کننده حذف شد');
        } catch (error) {
          console.error("Error deleting supplier:", error);
          toast.error('خطا در حذف تامین‌کننده');
        }
      } else {
        setSuppliers(prev => prev.filter(s => s.id !== id));
        toast.success('تامین‌کننده حذف شد (محلی)');
      }
    }
  };
  // Accounting Engine Logic: Create Journal from Purchase Approval
  const handleInventoryPurchase = async (
    purchase: PurchaseRequest,
    inventoryDetails: { itemId: string; quantity: number; unitPrice: number },
    financialDetails: { accountId?: string; supplierId?: string; expenseAccountId?: string; amount: number; isCredit: boolean }
  ) => {
    try {
      if (useFirebase) {
        await saveInventoryPurchase(purchase, inventoryDetails, financialDetails);
        toast.success('خرید انبار با موفقیت ثبت شد');
      } else {
        // Local Fallback
        // 1. Add Purchase
        setPurchases(prev => [purchase, ...prev]);

        // 2. Update Inventory Stock
        setInventoryItems(prev => prev.map(item =>
          item.id === inventoryDetails.itemId
            ? { ...item, currentStock: item.currentStock + inventoryDetails.quantity, lastCost: inventoryDetails.unitPrice }
            : item
        ));

        // 3. Financial Updates (Local)
        if (financialDetails.expenseAccountId) {
          setAccounts(prev => prev.map(a =>
            a.id === financialDetails.expenseAccountId
              ? { ...a, balance: a.balance + financialDetails.amount }
              : a
          ));
        }

        if (financialDetails.isCredit && financialDetails.supplierId) {
          setSuppliers(prev => prev.map(s =>
            s.id === financialDetails.supplierId
              ? { ...s, balance: s.balance + financialDetails.amount }
              : s
          ));
        } else if (financialDetails.accountId) {
          setAccounts(prev => prev.map(a =>
            a.id === financialDetails.accountId
              ? { ...a, balance: a.balance - financialDetails.amount }
              : a
          ));
        }

        toast.success('خرید انبار ثبت شد (محلی)');
      }
    } catch (error) {
      console.error('Error saving inventory purchase:', error);
      toast.error('خطا در ثبت خرید انبار');
    }
  };

  const handleApprovePurchase = async (id: string) => {
    const purchase = purchases.find(p => p.id === id);
    if (!purchase) return;

    try {
      // 2. Create Journal Entry (Debit Expense, Credit Asset)
      const expenseAccount = accounts.find(a => a.name === purchase.category) || accounts.find(a => a.type === AccountType.EXPENSE);

      if (!expenseAccount) {
        toast.error('حساب هزینه یافت نشد');
        return;
      }

      // 2. Determine Credit Account (Source of funds or Liability)
      let creditAccount: Account | undefined;

      if (purchase.isCredit) {
        // If Credit Purchase -> Accounts Payable (2010)
        creditAccount = accounts.find(a => a.code === '2010') || accounts.find(a => a.type === AccountType.LIABILITY);
      } else {
        // If Cash Purchase -> Asset Account (Bank/Cash)
        if (purchase.paymentAccountId) {
          const selected = accounts.find(a => a.id === purchase.paymentAccountId);
          creditAccount = selected || accounts.find(a => a.type === AccountType.ASSET);
        } else {
          creditAccount = accounts.find(a => a.type === AccountType.ASSET && (a.code === '1020' || a.name.includes('بانک'))) || accounts.find(a => a.type === AccountType.ASSET);
        }
      }

      if (!creditAccount) {
        toast.error('حساب بستانکار (بانک یا پرداختنی) یافت نشد');
        return;
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

      // 3. Update Supplier Balance if Credit Purchase
      if (purchase.isCredit && purchase.supplierId) {
        const supplier = suppliers.find(s => s.id === purchase.supplierId);
        if (supplier) {
          if (useFirebase) {
            await firestoreUpdateSupplier(supplier.id, {
              balance: supplier.balance + purchase.amount
            });
          } else {
            setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, balance: s.balance + purchase.amount } : s));
          }
        }
      }

      if (useFirebase) {
        try {
          // 1. Update Purchase Status
          await firestoreUpdatePurchase(id, { status: TransactionStatus.APPROVED });

          // 2. Add Journal Entry
          await firestoreAddJournal(journalEntry);

          // 3. Update Account Balances
          // Debit Expense
          await firestoreUpdateAccount(expenseAccount.id, {
            balance: expenseAccount.balance + purchase.amount
          });

          // Credit Asset/Liability
          await firestoreUpdateAccount(creditAccount.id, {
            balance: creditAccount.type === AccountType.ASSET
              ? creditAccount.balance - purchase.amount
              : creditAccount.balance + purchase.amount
          });

          toast.success('خرید تایید و سند حسابداری صادر شد');
        } catch (error) {
          console.error('Firebase error:', error);
          toast.error('خطا در تأیید خرید. لطفاً اتصال اینترنت را بررسی کنید.');
        }
      } else {
        // Local Fallback
        setPurchases(prev => prev.map(p => p.id === id ? { ...p, status: TransactionStatus.APPROVED } : p));
        setJournals(prev => [journalEntry, ...prev]);
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
        console.error('Firebase error:', error);
        toast.error('خطا در رد خرید. لطفاً اتصال اینترنت را بررسی کنید.');
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
        console.error('Firebase error:', error);
        toast.error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت و VPN را بررسی کنید و دوباره تلاش کنید.');
        // Do NOT fallback to local state - data would be lost on iOS reload
      }
    } else {
      setPurchases(prev => [p, ...prev]);
      toast.success('درخواست خرید ثبت شد (محلی)');
    }
  };

  const handleAddSale = async (sale: SaleRecord) => {
    try {
      const cashAccount = accounts.find(a => a.code === '1010') || accounts.find(a => a.type === AccountType.ASSET);

      if (!cashAccount) {
        toast.error('حساب صندوق یافت نشد');
        return;
      }

      const newLines: JournalLine[] = [];

      // Logic for Cafe Split Sales (Compound Entry)
      if (sale.stream === RevenueStream.CAFE && sale.grossAmount) {
        const revenueAccount = accounts.find(a => a.code === '4010'); // Cafe Revenue
        const discountAccount = accounts.find(a => a.code === '5110'); // Discounts
        const refundAccount = accounts.find(a => a.code === '5120'); // Returns
        const snappFoodAccount = accounts.find(a => a.code === '1030');
        const tapsiFoodAccount = accounts.find(a => a.code === '1040');
        const foodexAccount = accounts.find(a => a.code === '1050');
        const employeeReceivableAccount = accounts.find(a => a.code === '1060');
        const cashOnHandAccount = accounts.find(a => a.code === '1010'); // Cash on Hand

        if (!revenueAccount || !discountAccount || !refundAccount || !snappFoodAccount || !tapsiFoodAccount || !foodexAccount || !employeeReceivableAccount || !cashOnHandAccount) {
          toast.error('حساب‌های پیش‌فرض یافت نشدند. لطفاً صفحه را رفرش کنید تا حساب‌ها ایجاد شوند.');
          return;
        }

        // Determine Receiving Bank Account (POS/C2C)
        let bankAccount = accounts.find(a => a.code === '1020');
        if (sale.paymentAccountId) {
          const selected = accounts.find(a => a.id === sale.paymentAccountId);
          if (selected) bankAccount = selected;
        }

        if (!bankAccount) {
          bankAccount = accounts.find(a => a.type === AccountType.ASSET);
        }

        if (!bankAccount) {
          toast.error('حساب بانکی یافت نشد');
          return;
        }

        // Calculate Split Amounts
        const cashReceived = sale.cashAmount || 0;
        const c2cTransactions = sale.cardToCardTransactions || [];
        const posReceived = sale.posAmount || 0;

        const snappAmount = sale.snappFoodAmount || 0;
        const tapsiAmount = sale.tapsiFoodAmount || 0;
        const foodexAmount = sale.foodexAmount || 0;
        const empCreditAmount = sale.employeeCreditAmount || 0;

        // 1. Debit Cash on Hand
        if (cashReceived > 0) {
          newLines.push({ accountId: cashOnHandAccount.id, accountName: cashOnHandAccount.name, debit: cashReceived, credit: 0 });
        }

        // 2. Debit Bank Accounts (POS + C2C)
        const bankDebits: Record<string, number> = {};

        // POS
        if (posReceived > 0) {
          bankDebits[bankAccount.id] = (bankDebits[bankAccount.id] || 0) + posReceived;
        }

        // C2C
        c2cTransactions.forEach(t => {
          const targetId = t.receiverAccountId || bankAccount.id;
          bankDebits[targetId] = (bankDebits[targetId] || 0) + t.amount;
        });

        // Create Journal Lines for Banks
        for (const [accId, amount] of Object.entries(bankDebits)) {
          const acc = accounts.find(a => a.id === accId);
          if (acc) {
            newLines.push({ accountId: acc.id, accountName: acc.name, debit: amount, credit: 0 });
          }
        }

        // 3. Debit Delivery Apps & Employee Credit
        if (snappAmount > 0) newLines.push({ accountId: snappFoodAccount.id, accountName: snappFoodAccount.name, debit: snappAmount, credit: 0 });
        if (tapsiAmount > 0) newLines.push({ accountId: tapsiFoodAccount.id, accountName: tapsiFoodAccount.name, debit: tapsiAmount, credit: 0 });
        if (foodexAmount > 0) newLines.push({ accountId: foodexAccount.id, accountName: foodexAccount.name, debit: foodexAmount, credit: 0 });
        if (empCreditAmount > 0) newLines.push({ accountId: employeeReceivableAccount.id, accountName: employeeReceivableAccount.name, debit: empCreditAmount, credit: 0 });

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

        const c2cDetails = c2cTransactions.length > 0
          ? ` (واریزها: ${c2cTransactions.map(t => `${t.sender} ${t.amount.toLocaleString()}`).join('، ')})`
          : '';

        const deliveryDetails = [
          snappAmount > 0 ? `اسنپ: ${snappAmount.toLocaleString()}` : '',
          tapsiAmount > 0 ? `تپسی: ${tapsiAmount.toLocaleString()}` : '',
          foodexAmount > 0 ? `فودکس: ${foodexAmount.toLocaleString()}` : '',
          empCreditAmount > 0 ? `نسیه پرسنل: ${empCreditAmount.toLocaleString()}` : ''
        ].filter(Boolean).join(' - ');

        const description = `فروش: ${sale.details}${c2cDetails}${deliveryDetails ? ` | ${deliveryDetails}` : ''}`;

        const journalEntry: JournalEntry = {
          id: `JRN-${Math.floor(Math.random() * 100000)}`,
          date: sale.date,
          description: description,
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

            // Update Bank Balances (POS + C2C)
            for (const [accId, amount] of Object.entries(bankDebits)) {
              const acc = accounts.find(a => a.id === accId);
              if (acc) {
                await firestoreUpdateAccount(acc.id, { balance: acc.balance + amount });
              }
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

            // Update Delivery & Employee Accounts
            if (snappAmount > 0) await firestoreUpdateAccount(snappFoodAccount.id, { balance: snappFoodAccount.balance + snappAmount });
            if (tapsiAmount > 0) await firestoreUpdateAccount(tapsiFoodAccount.id, { balance: tapsiFoodAccount.balance + tapsiAmount });
            if (foodexAmount > 0) await firestoreUpdateAccount(foodexAccount.id, { balance: foodexAccount.balance + foodexAmount });
            if (empCreditAmount > 0) await firestoreUpdateAccount(employeeReceivableAccount.id, { balance: employeeReceivableAccount.balance + empCreditAmount });
            toast.success('فروش با موفقیت ثبت شد');
          } catch (error) {
            console.error('Firebase error:', error);
            toast.error('خطا در ثبت فروش. لطفاً اتصال اینترنت و VPN را بررسی کنید.');
          }
        } else {
          setSales(prev => [sale, ...prev]);
          setJournals(prev => [...prev, journalEntry]);
          setAccounts(prev => prev.map(acc => {
            if (acc.id === cashOnHandAccount.id) return { ...acc, balance: acc.balance + cashReceived };
            if (bankDebits[acc.id]) return { ...acc, balance: acc.balance + bankDebits[acc.id] };
            if (acc.id === revenueAccount.id) return { ...acc, balance: acc.balance + (sale.grossAmount || 0) };
            if (sale.discount && sale.discount > 0 && acc.id === discountAccount.id) return { ...acc, balance: acc.balance + sale.discount };
            if (sale.refund && sale.refund > 0 && acc.id === refundAccount.id) return { ...acc, balance: acc.balance + sale.refund };

            if (snappAmount > 0 && acc.id === snappFoodAccount.id) return { ...acc, balance: acc.balance + snappAmount };
            if (tapsiAmount > 0 && acc.id === tapsiFoodAccount.id) return { ...acc, balance: acc.balance + tapsiAmount };
            if (foodexAmount > 0 && acc.id === foodexAccount.id) return { ...acc, balance: acc.balance + foodexAmount };
            if (empCreditAmount > 0 && acc.id === employeeReceivableAccount.id) return { ...acc, balance: acc.balance + empCreditAmount };

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

        const creditAccount = accounts.find(a => a.code === creditAccountCode);

        if (!creditAccount) {
          toast.error(`حساب درآمد مربوطه (${creditAccountCode}) یافت نشد`);
          return;
        }

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
            console.error('Firebase error:', error);
            toast.error('خطا در ارتباط با سرور. لطفاً اتصال اینترنت و VPN را بررسی کنید و دوباره تلاش کنید.');
            // Do NOT fallback to local state - data would be lost on iOS reload
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
        console.error('Firebase error:', error);
        toast.error('خطا در حذف تراکنش. لطفاً اتصال اینترنت را بررسی کنید.');
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

  const handleAddTransfer = async (transfer: TransferRecord) => {
    try {
      if (useFirebase) {
        // 1. Add Transfer Doc
        await addTransfer(transfer);

        // 2. Determine Source & Dest for Journal
        // Logic:
        // Debit (Receiver/Dest):
        // - Account (Asset): Increase Balance (Debit)
        // - Account (Liability): Decrease Balance (Debit)
        // - Customer (Asset-like): Increase Debt to us (Debit) -> Wait, if we pay them? No.
        //   - If we transfer TO Customer (e.g. Refund): We Credit Asset (Cash), Debit Customer (Decrease their debt? Or Increase their claim?)
        //   - Let's stick to standard:
        //   - Customer Balance (Positive = They owe us).
        //   - If we pay Customer (Bank -> Customer): Bank Credit. Customer Debit?
        //     - Customer Debit = Increase Balance (They owe us MORE?? No).
        //     - If we pay them, we are giving them money.
        //     - If they owed us 100, and we pay them 50, they now have 150? No.
        //     - "Bank to Person" (Payment):
        //       - We pay Supplier: Supplier Debit (Liability decreases). Bank Credit.
        //       - We pay Employee: Employee Debit (Payable decreases). Bank Credit.
        //       - We pay Customer: Customer Debit (Receivable increases? No).
        //         - If we pay Customer, it's usually a Refund.
        //         - Refund: Debit Sales Returns (Expense), Credit Bank.
        //         - But here it's a "Transfer".
        //         - If we treat Customer as a person we hold funds for?
        //         - Let's assume "Person" entities act like Accounts.
        //         - Customer: Asset (Receivable). Debit = Increase. Credit = Decrease.
        //         - Supplier: Liability (Payable). Debit = Decrease. Credit = Increase.
        //         - Employee: Liability (Payable). Debit = Decrease. Credit = Increase. (Usually we owe them salary).

        // Let's implement based on Entity Type:

        const getEntityName = (id?: string) => {
          if (!id) return 'ناشناس';
          const acc = accounts.find(a => a.id === id);
          if (acc) return acc.name;
          const cust = customers.find(c => c.id === id);
          if (cust) return cust.name;
          const sup = suppliers.find(s => s.id === id);
          if (sup) return sup.name;
          const emp = employees.find(e => e.id === id);
          if (emp) return emp.fullName;
          return 'ناشناس';
        };

        const sourceName = getEntityName(transfer.fromAccountId || transfer.fromPersonId);
        const destName = getEntityName(transfer.toAccountId || transfer.toPersonId);

        const journalEntry: JournalEntry = {
          id: `JRN-${Date.now()}`,
          date: transfer.date,
          description: transfer.description,
          referenceId: transfer.id,
          lines: [
            // Debit Dest
            { accountId: transfer.toAccountId || transfer.toPersonId || 'unknown', accountName: destName, debit: transfer.amount, credit: 0 },
            // Credit Source
            { accountId: transfer.fromAccountId || transfer.fromPersonId || 'unknown', accountName: sourceName, debit: 0, credit: transfer.amount }
          ],
        };
        await addJournalEntry(journalEntry);

        // 3. Update Balances
        // Helper to update balance based on entity type
        const updateBalance = async (id: string, amountChange: number, isDebit: boolean) => {
          // amountChange is the raw change.
          // But we need to know if it's Debit or Credit to apply sign correctly based on account type.
          // Debit (+): Asset Increase, Liability Decrease.
          // Credit (-): Asset Decrease, Liability Increase.

          // Actually, let's just pass the signed amount to add.
          // Debit: +Amount for Asset, -Amount for Liability.
          // Credit: -Amount for Asset, +Amount for Liability.

          // We need to identify the entity type.
          if (accounts.some(a => a.id === id)) {
            const acc = accounts.find(a => a.id === id)!;
            let change = 0;
            if (acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE) {
              change = isDebit ? amountChange : -amountChange;
            } else {
              change = isDebit ? -amountChange : amountChange;
            }
            await firestoreUpdateAccount(id, { balance: acc.balance + change });
          } else if (customers.some(c => c.id === id)) {
            // Customer = Asset-like (Receivable).
            // Debit = Increase (They owe us more). Credit = Decrease (They paid us).
            const cust = customers.find(c => c.id === id)!;
            const change = isDebit ? amountChange : -amountChange;
            await firestoreUpdateCustomer(id, { balance: (cust.balance || 0) + change });
          } else if (suppliers.some(s => s.id === id)) {
            // Supplier = Liability-like (Payable).
            // Debit = Decrease (We paid them). Credit = Increase (We bought on credit).
            const sup = suppliers.find(s => s.id === id)!;
            const change = isDebit ? -amountChange : amountChange;
            await updateSupplier(id, { balance: (sup.balance || 0) + change });
          } else if (employees.some(e => e.id === id)) {
            // Employee = Liability-like (Payable) usually (Salary).
            // But types.ts says: Positive = Receivable (Advance), Negative = Payable.
            // So it behaves like an Asset?
            // If Balance is Positive (Asset): Debit increases it.
            // If Balance is Negative (Liability): Debit increases it (makes it less negative / more positive).
            // So yes, mathematically it behaves like an Asset variable.
            // Debit = +Amount. Credit = -Amount.
            const emp = employees.find(e => e.id === id)!;
            const change = isDebit ? amountChange : -amountChange;
            await firestoreUpdateEmployee(id, { balance: (emp.balance || 0) + change }); // Need to import updateEmployee as firestoreUpdateEmployee
          }
        };

        // Apply Updates
        const sourceId = transfer.fromAccountId || transfer.fromPersonId;
        const destId = transfer.toAccountId || transfer.toPersonId;

        if (sourceId) await updateBalance(sourceId, transfer.amount, false); // Credit Source
        if (destId) await updateBalance(destId, transfer.amount, true);   // Debit Dest

        toast.success('انتقال با موفقیت ثبت شد');
      } else {
        // Local Fallback (Simplified - only updates Account balances for now)
        // Implementing full local logic is complex without unified state.
        setTransfers(prev => [transfer, ...prev]);
        toast.success('انتقال ثبت شد (محلی - فقط نمایش)');
      }
    } catch (error) {
      console.error('Error adding transfer:', error);
      toast.error('خطا در ثبت انتقال');
    }
  };

  const handleDeleteTransfer = async (id: string) => {
    try {
      if (useFirebase) {
        await deleteTransferFull(id);
        toast.success('انتقال حذف شد و موجودی‌ها بازگشت');
      } else {
        // Local fallback not fully implemented for reversal
        toast.error('حذف انتقال در حالت محلی پشتیبانی نمی‌شود');
      }
    } catch (error) {
      console.error('Error deleting transfer:', error);
      toast.error('خطا در حذف انتقال');
    }
  };

  // Placeholder for TransactionManager update/delete functions
  const handleUpdateSale = async (id: string, data: Partial<SaleRecord>) => { /* ... */ };
  const handleDeletePayroll = async (id: string) => { /* ... */ };
  const handleDeleteInventoryPurchase = async (id: string) => { /* ... */ };
  const handleUpdatePurchase = async (id: string, data: Partial<PurchaseRequest>) => { /* ... */ };
  const handleUpdatePayroll = async (id: string, data: Partial<PayrollPayment>) => { /* ... */ };
  const handleUpdateInventoryPurchase = async (id: string, data: Partial<PurchaseRequest>) => { /* ... */ };


  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard, view: 'dashboard' },
    { id: 'expenses', label: 'خرید و هزینه', icon: ShoppingCart, view: 'expenses' },
    { id: 'sales', label: 'فروش و درآمد', icon: PieChart, view: 'sales' },
    { id: 'subscriptions', label: 'مدیریت اشتراک‌ها', icon: Users, view: 'subscriptions' },
    { id: 'suppliers', label: 'تامین‌کنندگان', icon: Truck, view: 'suppliers' },
    { id: 'payroll', label: 'حقوق و دستمزد', icon: Wallet, view: 'payroll' },
    { id: 'ledger', label: 'دفتر کل', icon: Book, view: 'ledger' },
    { id: 'inventory', label: 'مدیریت انبار', icon: Package, view: 'inventory' },
    { id: 'transfers', label: 'انتقال وجه', icon: ArrowRightLeft, view: 'transfers' },
    { id: 'checks', label: 'چک‌های پرداختنی', icon: FileText, view: 'checks' },
    { id: 'loans', label: 'تسهیلات و وام‌ها', icon: Landmark, view: 'loans' },
    { id: 'analytics', label: 'گزارش و تحلیل', icon: LineChart, view: 'analytics' },
    { id: 'transactions', label: 'مدیریت تراکنش‌ها', icon: History, view: 'transactions' },
    { id: 'settings', label: 'تنظیمات', icon: SettingsIcon, view: 'settings' },
  ];

  const handleNavClick = (view: View) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
  };

  // Checks & Loans Logic
  const handleAddCheck = async (check: PayableCheck) => {
    try {
      if (useFirebase) {
        await addCheck(check);
        toast.success('چک با موفقیت ثبت شد');
      } else {
        setChecks(prev => [...prev, check]);
        toast.success('چک ثبت شد (محلی)');
      }
    } catch (error) {
      console.error('Error adding check:', error);
      toast.error('خطا در ثبت چک');
    }
  };

  const handleUpdateCheckStatus = async (checkId: string, status: CheckStatus, accountId?: string) => {
    try {
      if (useFirebase) {
        await updateCheckStatus(checkId, status, accountId);
        toast.success('وضعیت چک تغییر کرد');
      } else {
        setChecks(prev => prev.map(c => c.id === checkId ? { ...c, status, passedDate: status === CheckStatus.PASSED ? toPersianDate(new Date()) : undefined, accountId } : c));
        toast.success('وضعیت چک تغییر کرد (محلی)');
      }
    } catch (error) {
      console.error('Error updating check status:', error);
      toast.error('خطا در تغییر وضعیت چک');
    }
  };

  const handleAddLoan = async (loan: Loan, depositAccountId: string) => {
    try {
      if (useFirebase) {
        await addLoan(loan, depositAccountId);
        toast.success('وام با موفقیت ثبت شد');
      } else {
        setLoans(prev => [...prev, loan]);
        toast.success('وام ثبت شد (محلی)');
      }
    } catch (error) {
      console.error('Error adding loan:', error);
      toast.error('خطا در ثبت وام');
    }
  };

  const handleAddLoanRepayment = async (repayment: LoanRepayment) => {
    try {
      if (useFirebase) {
        await addLoanRepayment(repayment);
        toast.success('قسط با موفقیت پرداخت شد');
      } else {
        setLoanRepayments(prev => [...prev, repayment]);
        toast.success('قسط پرداخت شد (محلی)');
      }
    } catch (error) {
      console.error('Error adding repayment:', error);
      toast.error('خطا در پرداخت قسط');
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            accounts={accounts}
            sales={sales}
            purchases={purchases}
            subscriptions={subscriptions}
            payrollPayments={payrollPayments}
            onViewSubscriptions={() => setCurrentView('subscriptions')}
          />
        );
      case 'expenses':
        return (
          <Expenses
            accounts={accounts}
            purchases={purchases}
            suppliers={suppliers}
            inventoryItems={inventoryItems}
            onAddPurchase={handleAddPurchase}
            onApprovePurchase={handleApprovePurchase}
            onRejectPurchase={handleRejectPurchase}
            onDeletePurchase={handleDeletePurchase}
            onInventoryPurchase={handleInventoryPurchase}
          />
        );
      case 'sales':
        return (
          <Sales
            sales={sales}
            accounts={accounts}
            employees={employees}
            onAddSale={handleAddSale}
            onCancelSubscription={handleCancelSubscription}
            onDeleteSale={handleDeleteSale}
            userRole={UserRole.ADMIN}
          />
        ); case 'ledger':
        return (
          <Ledger journals={journals} accounts={accounts} />
        );
      case 'settings':
        return (
          <Settings
            accounts={accounts}
            sales={sales}
            purchases={purchases}
            payrollPayments={payrollPayments}
            journals={journals}
            onAddAccount={handleAddAccount}
            onUpdateAccount={handleUpdateAccount}
            onDeleteAccount={handleDeleteAccount}
          />
        );
      case 'payroll':
        return (
          <Payroll
            employees={employees}
            accounts={accounts}
            payrollPayments={payrollPayments}
            onAddEmployee={handleAddEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onPaySalary={handlePaySalary}
          />
        );
      case 'subscriptions':
        return (
          <SubscriptionManager
            customers={customers}
            subscriptions={subscriptions}
            sales={sales}
            accounts={accounts}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onAddSubscription={handleAddSubscription}
          />
        );
      case 'suppliers':
        return (
          <SupplierManager
            suppliers={suppliers}
            purchases={purchases}
            accounts={accounts}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            onPayment={handleSupplierPayment}
          />
        );
      case 'inventory':
        return (
          <InventoryManager
            inventoryItems={inventoryItems}
            purchases={purchases}
            onAddItem={handleAddInventoryItem}
            onUpdateItem={handleUpdateInventoryItem}
            onRegisterUsage={handleRegisterUsage}
          />
        );
      case 'transfers':
        return (
          <Transfers
            accounts={accounts}
            transfers={transfers}
            customers={customers}
            suppliers={suppliers}
            employees={employees}
            onAddTransfer={handleAddTransfer}
            onDeleteTransfer={handleDeleteTransfer}
          />
        );
      case 'transactions': // Added new case
        return (
          <TransactionManager
            sales={sales}
            purchases={purchases}
            payrollPayments={payrollPayments}
            journals={journals}
            accounts={accounts}
          />
        );
      case 'analytics':
        return (
          <Analytics
            sales={sales}
            purchases={purchases}
            customers={customers}
            suppliers={suppliers}
            subscriptions={subscriptions}
          />
        );
      case 'checks':
        return (
          <ChecksManager
            checks={checks}
            accounts={accounts}
            onAddCheck={handleAddCheck}
            onUpdateCheckStatus={handleUpdateCheckStatus}
          />
        );
      case 'loans':
        return (
          <LoansManager
            loans={loans}
            repayments={loanRepayments}
            accounts={accounts}
            onAddLoan={handleAddLoan}
            onAddRepayment={handleAddLoanRepayment}
          />
        );
      default:
        return <Dashboard accounts={accounts} sales={sales} purchases={purchases} subscriptions={subscriptions} payrollPayments={payrollPayments} onViewSubscriptions={() => setCurrentView('subscriptions')} />;
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