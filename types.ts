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
  description: string;
  status: TransactionStatus;
  date: string;
  imageUrl?: string;
  quantity?: number; // New: Amount in units (e.g., 5000)
  unit?: string;    // New: Unit name (e.g., Grams)
  paymentAccountId?: string; // New: ID of the asset account used for payment
  isCredit?: boolean; // New: If true, this is a credit purchase (Accounts Payable)
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
}

export interface Employee {
  id: string;
  fullName: string;
  role: string;
  baseSalary: number;
  joinDate: string;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  revenueByStream: Record<string, number>;
}