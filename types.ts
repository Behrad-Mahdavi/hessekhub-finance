export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum RevenueStream {
  CAFE = 'CAFE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  ASSESSMENT = 'ASSESSMENT',
}

export enum UserRole {
  OPERATOR = 'OPERATOR', // Can request purchase, record sales
  FINANCE = 'FINANCE',   // Can approve purchase, view ledger
  MANAGER = 'MANAGER',   // Can view dashboard, view all
  ADMIN = 'ADMIN'        // All permissions
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  balance: number;
  isDefault?: boolean; // For selecting default payment account
}

export interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  description: string;
  lines: JournalLine[];
  referenceId?: string; // Link to Purchase ID or Sale ID
}

export interface PurchaseRequest {
  id: string;
  requester: string;
  amount: number;
  category: string;
  supplier: string;
  supplierId?: string; // Link to Supplier
  description: string;
  status: TransactionStatus;
  date: string;
  imageUrl?: string;
  quantity?: number; // New: Amount in units (e.g., 5000)
  unit?: string;    // New: Unit name (e.g., Grams)
  paymentAccountId?: string; // New: ID of the asset account used for payment
  isCredit?: boolean; // New: If true, this is a credit purchase (Accounts Payable)
  isInventoryPurchase?: boolean; // New: Flag for inventory purchase
  inventoryDetails?: {
    itemId: string;
    quantity: number;
    unitPrice: number;
  };
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phoneNumber?: string;
  balance: number; // Positive = We owe them (Debt), Negative = They owe us (Credit/Advance)
  address?: string;
}

export interface SaleRecord {
  id: string;
  stream: RevenueStream;
  amount: number; // Net Cash Received
  date: string;
  details: string; // E.g., "Daily Sales" or "Package: Gold"
  duration?: string; // Specific for subscriptions
  grossAmount?: number; // For Cafe Split
  discount?: number; // For Cafe Split
  refund?: number; // For Cafe Split
  subscriptionStatus?: SubscriptionStatus; // Only for SUBSCRIPTION stream
  customerName?: string; // New field for Subscription customer name
  paymentAccountId?: string; // New: ID of the bank account receiving POS/C2C payments
  posAmount?: number; // New: Amount received via POS
  cashAmount?: number; // New: Amount received in cash
  cardToCardTransactions?: { amount: number; sender: string }[]; // New: List of C2C transactions
  customerId?: string; // New: Link to Customer
  subscriptionId?: string; // New: Link to Subscription
}

export interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  balance: number; // Positive = Credit (Good), Negative = Debt (Bad)
  joinDate: string;
  activeSubscriptionId?: string;
}

export interface Subscription {
  id: string;
  customerId: string;
  planName: string; // e.g., "2 Weeks", "1 Month"
  startDate: string;
  endDate: string;
  totalDeliveryDays: number;
  remainingDays: number;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELED';
  price: number;
  paymentStatus: 'PAID' | 'CREDIT'; // Credit means unpaid/debt
}

export interface Employee {
  id: string;
  fullName: string;
  role: string;
  baseSalary: number;
  joinDate: string;
}

export interface PayrollPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  hoursWorked: number;
  totalAmount: number;
  paymentAccountId: string;
  paymentAccountName: string;
  notes?: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  revenueByStream: Record<string, number>;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string; // 'kg', 'gr', 'l', 'num'
  currentStock: number;
  reorderPoint: number;
  lastCost: number;
  updatedAt: any; // Timestamp
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: 'PURCHASE' | 'USAGE' | 'ADJUSTMENT' | 'RETURN';
  quantity: number; // Positive for entry, Negative for exit
  date: any; // Timestamp
  relatedExpenseId?: string;
  description?: string;
}