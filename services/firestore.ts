import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy,
    onSnapshot,
    writeBatch,
    setDoc,
    limit,
    increment
} from 'firebase/firestore';
import { db } from '../firebase';
import { Account, PurchaseRequest, SaleRecord, JournalEntry, Employee, Customer, Subscription } from '../types';
import { INITIAL_ACCOUNTS, MOCK_PURCHASES, MOCK_SALES, INITIAL_JOURNALS, INITIAL_EMPLOYEES } from '../constants';

// Collection References
const accountsRef = collection(db, 'accounts');
const purchasesRef = collection(db, 'purchases');
const salesRef = collection(db, 'sales');
const journalsRef = collection(db, 'journals');
const employeesRef = collection(db, 'employees');
const suppliersRef = collection(db, 'suppliers');

// --- Generic Helpers ---

export const subscribeToCollection = <T>(collectionName: string, callback: (data: T[]) => void) => {
    const q = query(collection(db, collectionName));
    return onSnapshot(q,
        (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
            callback(data);
        },
        (error) => {
            console.error(`Error subscribing to ${collectionName}:`, error);
        }
    );
};

// --- Suppliers ---
export const addSupplier = async (supplier: any) => {
    const { id, ...data } = supplier;
    return await addDoc(suppliersRef, cleanData(data));
};

export const updateSupplier = async (id: string, data: any) => {
    const docRef = doc(db, 'suppliers', id);
    await updateDoc(docRef, cleanData(data));
};

export const deleteSupplier = async (id: string) => {
    const docRef = doc(db, 'suppliers', id);
    await deleteDoc(docRef);
};

export const addJournalEntry = async (journal: any) => {
    const { id, ...data } = journal;
    return await addDoc(journalsRef, cleanData(data));
};

// --- Inventory ---
const inventoryItemsRef = collection(db, 'inventory_items');
const inventoryTransactionsRef = collection(db, 'inventory_transactions');

export const addInventoryItem = async (item: any) => {
    const { id, ...data } = item;
    return await addDoc(inventoryItemsRef, cleanData(data));
};

export const updateInventoryItem = async (id: string, data: any) => {
    const docRef = doc(db, 'inventory_items', id);
    await updateDoc(docRef, cleanData(data));
};



// Atomic: Save Inventory Purchase (Expense + Inventory Transaction + Stock Update + Financial Update)
export const saveInventoryPurchase = async (
    purchase: any,
    inventoryDetails: { itemId: string; quantity: number; unitPrice: number },
    financialDetails: { accountId?: string; supplierId?: string; expenseAccountId?: string; amount: number; isCredit: boolean }
) => {
    const batch = writeBatch(db);

    // 1. Create Expense Document
    const purchaseRef = doc(purchasesRef); // Auto-ID
    const purchaseData = { ...purchase, id: purchaseRef.id };
    batch.set(purchaseRef, cleanData(purchaseData));

    // 2. Create Inventory Transaction
    const transactionRef = doc(inventoryTransactionsRef);
    const transactionData = {
        id: transactionRef.id,
        itemId: inventoryDetails.itemId,
        type: 'PURCHASE',
        quantity: inventoryDetails.quantity,
        date: new Date(), // Using server timestamp equivalent or JS Date
        relatedExpenseId: purchaseRef.id,
        description: `خرید: ${purchase.description}`,
    };
    batch.set(transactionRef, cleanData(transactionData));

    // 3. Update Inventory Item (Stock & Last Cost)
    const itemRef = doc(db, 'inventory_items', inventoryDetails.itemId);
    batch.update(itemRef, {
        currentStock: increment(inventoryDetails.quantity),
        lastCost: inventoryDetails.unitPrice,
        updatedAt: new Date()
    });

    // 4. Financial Updates

    // A. Debit Expense Account (Increase Expense)
    if (financialDetails.expenseAccountId) {
        const expenseAccountRef = doc(db, 'accounts', financialDetails.expenseAccountId);
        batch.update(expenseAccountRef, {
            balance: increment(financialDetails.amount)
        });
    }

    // B. Credit Asset or Liability
    if (financialDetails.isCredit && financialDetails.supplierId) {
        // Credit Purchase: Increase Supplier Debt (Balance)
        const supplierRef = doc(db, 'suppliers', financialDetails.supplierId);
        batch.update(supplierRef, {
            balance: increment(financialDetails.amount)
        });
    } else if (financialDetails.accountId) {
        // Cash Purchase: Decrease Asset Account
        const accountRef = doc(db, 'accounts', financialDetails.accountId);
        batch.update(accountRef, {
            balance: increment(-financialDetails.amount)
        });
    }

    await batch.commit();
    return purchaseRef.id;
};

// Atomic: Register Usage (Transaction + Stock Update)
export const registerInventoryUsage = async (
    itemId: string,
    quantity: number,
    description: string,
    date: string
) => {
    const batch = writeBatch(db);

    // 1. Create Usage Transaction
    const transactionRef = doc(inventoryTransactionsRef);
    const transactionData = {
        id: transactionRef.id,
        itemId: itemId,
        type: 'USAGE',
        quantity: -quantity, // Negative for usage
        date: new Date(), // Or use the passed date string if preferred, but keeping consistent with Timestamp requirement
        description: description
    };
    batch.set(transactionRef, cleanData(transactionData));

    // 2. Update Inventory Item (Decrease Stock)
    const itemRef = doc(db, 'inventory_items', itemId);
    batch.update(itemRef, {
        currentStock: increment(-quantity),
        updatedAt: new Date()
    });

    await batch.commit();
    return transactionRef.id;
};

// Query: Get Inventory Transactions
export const getInventoryTransactions = async (
    itemId?: string,
    startDate?: Date,
    endDate?: Date,
    type?: 'PURCHASE' | 'USAGE'
) => {
    let q = query(inventoryTransactionsRef, orderBy('date', 'desc'));

    // Note: Firestore requires composite indexes for multiple where clauses with orderBy.
    // For simplicity in this MVP without managing indexes, we'll filter in memory if needed,
    // or just fetch all and filter client-side for small datasets.
    // However, let's try to use basic filtering where possible.

    // If we had indexes, we would do:
    // if (itemId) q = query(q, where('itemId', '==', itemId));
    // if (type) q = query(q, where('type', '==', type));

    // For now, let's fetch the most recent 100 transactions and filter client-side 
    // to avoid "index required" errors during the demo.
    q = query(q, limit(100));

    const snapshot = await getDocs(q);
    let transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Timestamp to Date if needed, but we store as Date/Timestamp
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
    }));

    // Client-side filtering
    if (itemId) {
        transactions = transactions.filter((t: any) => t.itemId === itemId);
    }
    if (type) {
        transactions = transactions.filter((t: any) => t.type === type);
    }
    if (startDate) {
        transactions = transactions.filter((t: any) => t.date >= startDate);
    }
    if (endDate) {
        transactions = transactions.filter((t: any) => t.date <= endDate);
    }

    return transactions;
};

// --- Seeding ---

export const seedDatabase = async () => {
    const batch = writeBatch(db);

    // Check if data exists (simple check on accounts)
    const accountsSnapshot = await getDocs(accountsRef);
    if (!accountsSnapshot.empty) {
        console.log("Database already has data. Skipping seed.");
        return;
    }

    console.log("Seeding database...");

    INITIAL_ACCOUNTS.forEach(acc => {
        const docRef = doc(accountsRef, acc.id); // Use existing IDs
        batch.set(docRef, acc);
    });

    MOCK_PURCHASES.forEach(pur => {
        const docRef = doc(purchasesRef, pur.id);
        batch.set(docRef, pur);
    });

    MOCK_SALES.forEach(sale => {
        const docRef = doc(salesRef, sale.id);
        batch.set(docRef, sale);
    });

    INITIAL_JOURNALS.forEach(jrn => {
        const docRef = doc(journalsRef, jrn.id);
        batch.set(docRef, jrn);
    });

    INITIAL_EMPLOYEES.forEach(emp => {
        const docRef = doc(employeesRef, emp.id);
        batch.set(docRef, emp);
    });

    await batch.commit();
    console.log("Database seeded successfully.");
};

// --- Helper to remove undefined values (Firestore doesn't like them) ---
const cleanData = (data: any) => {
    return JSON.parse(JSON.stringify(data));
};

// --- CRUD Operations ---

// Accounts
export const addAccount = async (account: Omit<Account, 'id'>) => {
    return await addDoc(accountsRef, cleanData(account));
};

export const updateAccount = async (id: string, data: Partial<Account>) => {
    const docRef = doc(db, 'accounts', id);
    await updateDoc(docRef, cleanData(data));
};

export const deleteAccount = async (id: string) => {
    const docRef = doc(db, 'accounts', id);
    await deleteDoc(docRef);
};

// Purchases
export const addPurchase = async (purchase: PurchaseRequest) => {
    const { id, ...data } = purchase;
    return await addDoc(purchasesRef, cleanData(data));
};

export const updatePurchase = async (id: string, data: Partial<PurchaseRequest>) => {
    const docRef = doc(db, 'purchases', id);
    await updateDoc(docRef, cleanData(data));
};

export const deletePurchase = async (id: string) => {
    const docRef = doc(db, 'purchases', id);
    await deleteDoc(docRef);
};

// Sales
export const addSale = async (sale: SaleRecord) => {
    const { id, ...data } = sale;
    return await addDoc(salesRef, cleanData(data));
};

export const updateSale = async (id: string, data: Partial<SaleRecord>) => {
    const docRef = doc(db, 'sales', id);
    await updateDoc(docRef, cleanData(data));
};

export const deleteSale = async (id: string) => {
    const docRef = doc(db, 'sales', id);
    await deleteDoc(docRef);
};

// Journals
export const addJournal = async (journal: JournalEntry) => {
    const { id, ...data } = journal;
    return await addDoc(journalsRef, cleanData(data));
};

// Employees
export const addEmployee = async (employee: Employee) => {
    const { id, ...data } = employee;
    return await addDoc(employeesRef, cleanData(data));
};

export const deleteEmployee = async (id: string) => {
    const docRef = doc(db, 'employees', id);
    await deleteDoc(docRef);
};

// Customers
export const addCustomer = async (customer: Customer) => {
    const { id, ...data } = customer;
    // Use custom ID if provided, or let Firestore generate?
    // App generates ID like CUST-1234. We can use that as doc ID or just store it.
    // Existing code uses addDoc which generates new ID, but we pass id in object.
    // Let's stick to addDoc pattern but maybe we should use setDoc if we want to preserve our ID?
    // Existing code: const { id, ...data } = purchase; return await addDoc(...)
    // This means Firestore ID != App ID. That's fine for now.
    return await addDoc(collection(db, 'customers'), cleanData(data));
};

export const updateCustomer = async (id: string, data: Partial<Customer>) => {
    // We need to find the doc by our custom ID or use Firestore ID?
    // The subscribeToCollection maps doc.id to the object.id.
    // So 'id' passed here IS the Firestore ID.
    const docRef = doc(db, 'customers', id);
    await updateDoc(docRef, cleanData(data));
};

// Subscriptions
export const addSubscription = async (subscription: Subscription) => {
    const { id, ...data } = subscription;
    return await addDoc(collection(db, 'subscriptions'), cleanData(data));
};


export const updateSubscription = async (id: string, data: Partial<Subscription>) => {
    const docRef = doc(db, 'subscriptions', id);
    await updateDoc(docRef, cleanData(data));
};

export const deleteSubscription = async (id: string) => {
    const docRef = doc(db, 'subscriptions', id);
    await deleteDoc(docRef);
};

// Customers
export const deleteCustomer = async (id: string) => {
    const docRef = doc(db, 'customers', id);
    await deleteDoc(docRef);
};

// Payroll Payments
const payrollPaymentsRef = collection(db, 'payroll_payments');

export const addPayrollPayment = async (payment: any) => {
    const { id, ...data } = payment;
    return await addDoc(payrollPaymentsRef, cleanData(data));
};

export const checkFirebaseConnection = async () => {
    try {
        await getDocs(query(collection(db, 'accounts'), limit(1)));
        const healthRef = doc(db, '_health', 'ping');
        await setDoc(healthRef, { timestamp: new Date() });
        return { success: true };
    } catch (error: any) {
        console.error("Firebase connection check failed:", error);
        return { success: false, error: error.message || error };
    }
};

