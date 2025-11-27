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
    increment,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Account, PurchaseRequest, SaleRecord, JournalEntry, Employee, Customer, Subscription, TransferRecord } from '../types';
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
    // Check if data exists (simple check on accounts)
    const accountsSnapshot = await getDocs(accountsRef);
    const existingAccounts = accountsSnapshot.docs.map(doc => doc.data() as Account);
    const existingCodes = new Set(existingAccounts.map(a => a.code));

    let addedAccounts = false;
    INITIAL_ACCOUNTS.forEach(acc => {
        if (!existingCodes.has(acc.code)) {
            const docRef = doc(accountsRef, acc.id);
            batch.set(docRef, acc);
            console.log(`Adding missing account: ${acc.name} (${acc.code})`);
            addedAccounts = true;
        }
    });

    if (!accountsSnapshot.empty) {
        if (addedAccounts) {
            await batch.commit();
            console.log("Added missing accounts to existing database.");
        } else {
            console.log("Database already has data and all accounts. Skipping seed.");
        }
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

// --- Reversal Logic Helpers ---

const findRelatedJournalEntry = async (referenceId: string) => {
    // Fetch all journals and find the one with referenceId.
    // This is not scalable but works for MVP.
    const snapshot = await getDocs(journalsRef);
    return snapshot.docs.find(doc => doc.data().referenceId === referenceId);
};

// --- Advanced Delete Operations (Full Reversal) ---

export const deleteSaleFull = async (saleId: string) => {
    const batch = writeBatch(db);

    // 1. Fetch Sale
    const saleRef = doc(db, 'sales', saleId);
    const saleSnap = await getDoc(saleRef);
    if (!saleSnap.exists()) throw new Error('Sale not found');
    const saleData = saleSnap.data() as SaleRecord;

    // 2. Delete Sale Document
    batch.delete(saleRef);

    // 3. Revert Financials (Journal)
    const journalDoc = await findRelatedJournalEntry(saleId);
    if (journalDoc) {
        const journalData = journalDoc.data() as JournalEntry;
        // Reverse Journal Effects
        for (const line of journalData.lines) {
            const accountRef = doc(db, 'accounts', line.accountId);
            // Reverse: Debit -> Decrease Balance, Credit -> Decrease Balance (since we added them)
            // Wait, logic check:
            // Asset (Debit +): We added to balance. Reversal: Subtract.
            // Revenue (Credit +): We added to balance. Reversal: Subtract.
            // So yes, subtract both.
            if (line.debit > 0) batch.update(accountRef, { balance: increment(-line.debit) });
            if (line.credit > 0) batch.update(accountRef, { balance: increment(-line.credit) });
        }
        batch.delete(journalDoc.ref);
    }

    // 4. Revert Customer Balance & Subscription
    if (saleData.customerId) {
        // If Subscription
        if (saleData.subscriptionId) {
            const subRef = doc(db, 'subscriptions', saleData.subscriptionId);
            const subSnap = await getDoc(subRef);

            if (subSnap.exists()) {
                const subData = subSnap.data() as Subscription;
                // If it was a CREDIT subscription, we increased Customer Debt (Balance -Price).
                // Reversal: Increase Customer Balance (+Price).
                if (subData.paymentStatus === 'CREDIT') {
                    const customerRef = doc(db, 'customers', saleData.customerId);
                    batch.update(customerRef, { balance: increment(subData.price) });
                }
                // Delete Subscription
                batch.delete(subRef);
            }
        }
        // If NOT Subscription but Credit Sale (not implemented in UI yet but good to handle)
        // If saleData.amount === 0 and it wasn't a subscription, it might be credit?
        // Current app logic only has Credit for Subscriptions.
    }

    await batch.commit();
};

export const deleteExpenseFull = async (expenseId: string) => {
    const batch = writeBatch(db);

    // 1. Fetch Expense
    const expenseRef = doc(db, 'purchases', expenseId);
    const expenseSnap = await getDoc(expenseRef);
    if (!expenseSnap.exists()) throw new Error('Expense not found');
    const expenseData = expenseSnap.data() as PurchaseRequest;

    // 2. Delete Expense Document
    batch.delete(expenseRef);

    // 3. Revert Financials (Journal)
    const journalDoc = await findRelatedJournalEntry(expenseId);
    if (journalDoc) {
        const journalData = journalDoc.data() as JournalEntry;
        for (const line of journalData.lines) {
            const accountRef = doc(db, 'accounts', line.accountId);
            if (line.debit > 0) batch.update(accountRef, { balance: increment(-line.debit) });
            if (line.credit > 0) batch.update(accountRef, { balance: increment(-line.credit) });
        }
        batch.delete(journalDoc.ref);
    }

    // 4. Revert Supplier Balance (if Credit Purchase)
    if (expenseData.isCredit && expenseData.supplierId) {
        const supplierRef = doc(db, 'suppliers', expenseData.supplierId);
        // We increased balance (Debt). Reversal: Decrease.
        batch.update(supplierRef, { balance: increment(-expenseData.amount) });
    }

    // 5. Revert Inventory (if Inventory Purchase)
    if (expenseData.isInventoryPurchase && expenseData.inventoryDetails) {
        // We need to find the Inventory Transaction too?
        // The transaction has relatedExpenseId = expenseId.
        const q = query(collection(db, 'inventory_transactions')); // Filter client side for now
        const snapshot = await getDocs(q);
        const transDoc = snapshot.docs.find(d => d.data().relatedExpenseId === expenseId);

        if (transDoc) {
            // Revert Stock
            const itemRef = doc(db, 'inventory_items', expenseData.inventoryDetails.itemId);
            // Purchase added quantity. Reversal: Subtract.
            batch.update(itemRef, { currentStock: increment(-expenseData.inventoryDetails.quantity) });

            // Delete Transaction
            batch.delete(transDoc.ref);
        }
    }

    await batch.commit();
};

export const deletePayrollFull = async (paymentId: string) => {
    const batch = writeBatch(db);

    // 1. Fetch Payment
    const paymentRef = doc(db, 'payroll_payments', paymentId);
    const paymentSnap = await getDoc(paymentRef);
    if (!paymentSnap.exists()) throw new Error('Payment not found');
    // const paymentData = paymentSnap.data();

    // 2. Delete Payment Document
    batch.delete(paymentRef);

    // 3. Revert Financials (Journal)
    const journalDoc = await findRelatedJournalEntry(paymentId);
    if (journalDoc) {
        const journalData = journalDoc.data() as JournalEntry;
        for (const line of journalData.lines) {
            const accountRef = doc(db, 'accounts', line.accountId);
            if (line.debit > 0) batch.update(accountRef, { balance: increment(-line.debit) });
            if (line.credit > 0) batch.update(accountRef, { balance: increment(-line.credit) });
        }
        batch.delete(journalDoc.ref);
    }

    await batch.commit();
};

export const deleteInventoryUsageFull = async (transactionId: string) => {
    const batch = writeBatch(db);

    // 1. Fetch Transaction
    const transRef = doc(db, 'inventory_transactions', transactionId);
    const transSnap = await getDoc(transRef);
    if (!transSnap.exists()) throw new Error('Transaction not found');
    const transData = transSnap.data();

    // 2. Delete Transaction
    batch.delete(transRef);

    // 3. Revert Stock
    // Usage subtracted quantity (stored as negative).
    // Reversal: Subtract the negative amount (Add it back).
    // Or just: increment(-quantity). If quantity was -5, -(-5) = +5.
    const itemRef = doc(db, 'inventory_items', transData.itemId);
    batch.update(itemRef, { currentStock: increment(-transData.quantity) });

    await batch.commit();
};

// --- Advanced Edit Operations (Reverse & Re-create) ---

export const editSaleFull = async (saleId: string, newSaleData: SaleRecord) => {
    // 1. Delete Old (Reverse all effects)
    await deleteSaleFull(saleId);
    // 2. Create New
    return await addSale(newSaleData);
};

export const editExpenseFull = async (expenseId: string, newExpenseData: PurchaseRequest) => {
    // 1. Delete Old
    await deleteExpenseFull(expenseId);
    // 2. Create New
    return await addPurchase(newExpenseData);
};

export const editInventoryPurchaseFull = async (
    purchaseId: string,
    newPurchaseData: PurchaseRequest,
    inventoryDetails: { itemId: string; quantity: number; unitPrice: number },
    financialDetails: { accountId?: string; supplierId?: string; expenseAccountId?: string; amount: number; isCredit: boolean }
) => {
    // 1. Delete Old
    await deleteExpenseFull(purchaseId); // This handles inventory reversal too if isInventoryPurchase is true
    // 2. Create New
    return await saveInventoryPurchase(newPurchaseData, inventoryDetails, financialDetails);
};

export const editPayrollFull = async (paymentId: string, newPaymentData: any) => {
    // 1. Delete Old
    await deletePayrollFull(paymentId);
    // 2. Create New
    return await addPayrollPayment(newPaymentData);
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

export const updateEmployee = async (id: string, data: Partial<Employee>) => {
    const docRef = doc(db, 'employees', id);
    await updateDoc(docRef, cleanData(data));
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

// --- Transfers ---
const transfersRef = collection(db, 'transfers');

export const addTransfer = async (transfer: any) => {
    const { id, ...data } = transfer;
    return await addDoc(transfersRef, cleanData(data));
};

export const deleteTransferFull = async (transferId: string) => {
    const batch = writeBatch(db);

    // 1. Fetch Transfer
    const transferRef = doc(db, 'transfers', transferId);
    const transferSnap = await getDoc(transferRef);
    if (!transferSnap.exists()) throw new Error('Transfer not found');
    const transferData = transferSnap.data() as TransferRecord;

    // 2. Delete Transfer Document
    batch.delete(transferRef);

    // 3. Revert Financials (Journal)
    const journalDoc = await findRelatedJournalEntry(transferId);
    if (journalDoc) {
        const journalData = journalDoc.data() as JournalEntry;
        for (const line of journalData.lines) {
            const accountRef = doc(db, 'accounts', line.accountId);
            if (line.debit > 0) batch.update(accountRef, { balance: increment(-line.debit) });
            if (line.credit > 0) batch.update(accountRef, { balance: increment(-line.credit) });
        }
        batch.delete(journalDoc.ref);
    }

    // 4. Revert Person Balances
    // Source (Credit was applied, so Debit to reverse -> Increase Asset-like / Decrease Liability-like)
    // Actually, simpler: Just do the opposite of what addTransfer did.
    // If Source was Person: We Credited them (Decreased Asset-like / Increased Liability-like).
    // To Reverse: Debit them (Increase Asset-like / Decrease Liability-like).

    // Logic:
    // Customer (Asset-like): Credit = Decrease. Reverse = Increase (+).
    // Supplier (Liability-like): Credit = Increase. Reverse = Decrease (-).
    // Employee (Net Asset): Credit = Decrease. Reverse = Increase (+).

    if (transferData.fromPersonId) {
        // We need to know the type of person. But ID usually tells us? 
        // Or we check all collections? Or we rely on the fact that we don't know the type easily without querying.
        // Optimization: Try to update all? No.
        // Better: We should store personType in TransferRecord? 
        // For now, let's try to find them. Or assume ID format?
        // CUST-, SUP-, EMP- prefixes are used in App.tsx generation but maybe not enforced?
        // Let's assume prefixes or check collections.
        // Actually, we can just try to getDoc from all 3? Expensive.
        // Let's rely on ID prefixes if possible, or just try-catch updates?
        // "CUST-", "SUP-", "EMP-" are standard here.

        const pid = transferData.fromPersonId;
        const amount = transferData.amount;

        if (pid.startsWith('CUST')) {
            const ref = doc(db, 'customers', pid);
            batch.update(ref, { balance: increment(amount) }); // Reverse Credit (Decrease) -> Increase
        } else if (pid.startsWith('SUP')) {
            const ref = doc(db, 'suppliers', pid);
            batch.update(ref, { balance: increment(-amount) }); // Reverse Credit (Increase) -> Decrease
        } else if (pid.startsWith('EMP')) {
            const ref = doc(db, 'employees', pid);
            batch.update(ref, { balance: increment(amount) }); // Reverse Credit (Decrease) -> Increase
        }
    }

    if (transferData.toPersonId) {
        // Dest was Debited.
        // Customer (Asset-like): Debit = Increase. Reverse = Decrease (-).
        // Supplier (Liability-like): Debit = Decrease. Reverse = Increase (+).
        // Employee (Net Asset): Debit = Increase. Reverse = Decrease (-).

        const pid = transferData.toPersonId;
        const amount = transferData.amount;

        if (pid.startsWith('CUST')) {
            const ref = doc(db, 'customers', pid);
            batch.update(ref, { balance: increment(-amount) });
        } else if (pid.startsWith('SUP')) {
            const ref = doc(db, 'suppliers', pid);
            batch.update(ref, { balance: increment(amount) });
        } else if (pid.startsWith('EMP')) {
            const ref = doc(db, 'employees', pid);
            batch.update(ref, { balance: increment(-amount) });
        }
    }

    await batch.commit();
};

