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
    limit
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
