import { utils, write } from 'xlsx';
import { Account, JournalEntry, SaleRecord, PurchaseRequest, PayableCheck, Loan, AccountType, PayrollPayment, InventoryTransaction, TransferRecord, LoanRepayment, InventoryItem } from '../types';
import { toPersianDate, formatPrice, toEnglishDigits, toPersianDigits } from '../utils';

// We need to use 'xlsx-js-style' for styling, but it acts as a drop-in replacement or extension.
// Since we installed 'xlsx' AND 'xlsx-js-style', let's import from 'xlsx-js-style' if possible for styling support.
// Otherwise we might need to use 'xlsx-js-style' as the main 'XLSX' object.
import * as XLSX from 'xlsx-js-style';

interface ExportData {
    accounts: Account[];
    journals: JournalEntry[];
    sales: SaleRecord[];
    expenses: PurchaseRequest[];
    checks: PayableCheck[];
    loans: Loan[];
    payroll: PayrollPayment[];
    inventory: InventoryTransaction[];
    inventoryItems: InventoryItem[]; // Needed for Item names in Inventory sheet
    transfers: TransferRecord[];
}

export const generateAccountingExcel = (data: ExportData) => {
    const wb = XLSX.utils.book_new();

    // --- Styles ---
    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, name: "Arial" },
        fill: { fgColor: { rgb: "1E3A8A" } }, // Dark Blue
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } }
        }
    };

    const cellStyle = {
        font: { name: "Arial" },
        alignment: { horizontal: "right", vertical: "center" }, // RTL friendly alignment
        border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
        }
    };

    const currencyStyle = {
        ...cellStyle,
        numFmt: "#,##0"
    };

    const createSheet = (headers: string[], rows: any[], sheetName: string) => {
        // 1. Create Worksheet from Data
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

        // 2. Apply Widths
        ws['!cols'] = headers.map(() => ({ wch: 20 }));

        // 3. Apply Styles
        // Range of cells e.g. "A1:E10"
        const range = XLSX.utils.decode_range(ws['!ref'] || "A1:A1");

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
                if (!ws[cell_address]) continue;

                // Header Row
                if (R === 0) {
                    ws[cell_address].s = headerStyle;
                } else {
                    // Data Rows
                    // Check if column should be currency?
                    // Simple heuristic: If value is number and not ID/Year etc.
                    // Or pass column types. For now, general style.
                    ws[cell_address].s = typeof ws[cell_address].v === 'number' ? currencyStyle : cellStyle;
                }
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    // --- 1. Dashboard / Overview ---
    // Calculate Totals
    const totalAssets = data.accounts.filter(a => a.type === AccountType.ASSET).reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalLiabilities = data.accounts.filter(a => a.type === AccountType.LIABILITY).reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalEquity = data.accounts.filter(a => a.type === AccountType.EQUITY).reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalRevenue = data.accounts.filter(a => a.type === AccountType.REVENUE).reduce((sum, a) => sum + (a.balance || 0), 0);
    const totalExpenses = data.accounts.filter(a => a.type === AccountType.EXPENSE).reduce((sum, a) => sum + (a.balance || 0), 0);

    const overviewHeaders = ['شرح', 'مبلغ (تومان)'];
    const overviewRows = [
        ['جمع دارایی‌ها', totalAssets],
        ['جمع بدهی‌ها', totalLiabilities],
        ['جمع حقوق صاحبان سهام', totalEquity],
        ['جمع درآمد', totalRevenue],
        ['جمع هزینه', totalExpenses],
        ['سود/زیان خالص', totalRevenue - totalExpenses],
        ['تاریخ گزارش', toPersianDate(new Date())]
    ];
    createSheet(overviewHeaders, overviewRows, 'مرور کلی');


    // --- 2. Journal Entries (دفتر روزنامه) ---
    // Flatten Journals
    const journalHeaders = ['شماره سند', 'تاریخ', 'شرح سند', 'کد حساب', 'نام حساب', 'بدهکار', 'بستانکار'];
    const journalRows = [];
    // Sort journals by date
    const sortedJournals = [...data.journals].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    sortedJournals.forEach(j => {
        j.lines.forEach(line => {
            journalRows.push([
                j.id,
                toPersianDigits(j.date),
                j.description,
                // Find account code
                data.accounts.find(a => a.id === line.accountId)?.code || '-',
                line.accountName,
                line.debit,
                line.credit
            ]);
        });
    });
    createSheet(journalHeaders, journalRows, 'دفتر روزنامه');


    // --- 3. Trial Balance (تراز آزمایشی) ---
    const trialHeaders = ['کد حساب', 'نام حساب', 'نوع', 'مانده بدهکار', 'مانده بستانکار'];
    const trialRows = data.accounts
        .sort((a, b) => a.code.localeCompare(b.code))
        .map(acc => {
            const isDebitNormal = acc.type === AccountType.ASSET || acc.type === AccountType.EXPENSE;

            let dr = 0;
            let cr = 0;

            if (acc.balance >= 0) {
                if (isDebitNormal) dr = acc.balance;
                else cr = acc.balance;
            } else {
                if (isDebitNormal) cr = Math.abs(acc.balance);
                else dr = Math.abs(acc.balance);
            }

            return [
                acc.code,
                acc.name,
                getAccountTypeLabel(acc.type),
                dr,
                cr
            ];
        });

    // Add Total Row
    const totalTrialDr = trialRows.reduce((sum, row) => sum + (row[3] as number), 0);
    const totalTrialCr = trialRows.reduce((sum, row) => sum + (row[4] as number), 0);
    trialRows.push(['', 'جمع کل', '', totalTrialDr, totalTrialCr]);

    createSheet(trialHeaders, trialRows, 'تراز آزمایشی');


    // --- 4. Detailed Sales ---
    const salesHeaders = ['شماره', 'تاریخ', 'مشتری', 'شرح', 'مبلغ کل', 'پوز', 'نقد', 'اسنپ فود', 'تپسی فود', 'فودکس', 'نسیه پرسنل', 'کارت به کارت'];
    const salesRows = data.sales.map(s => [
        s.id,
        toPersianDigits(s.date),
        s.customerName || 'ناشناس',
        s.details,
        s.amount,
        s.posAmount || 0,
        s.cashAmount || 0,
        s.snappFoodAmount || 0,
        s.tapsiFoodAmount || 0,
        s.foodexAmount || 0,
        s.employeeCreditAmount || 0,
        (s.cardToCardTransactions || []).reduce((acc, curr) => acc + curr.amount, 0)
    ]);
    createSheet(salesHeaders, salesRows, 'ریز فروش');

    // --- 5. Detailed Expenses (ریز هزینه) ---
    const expenseHeaders = ['شماره', 'تاریخ', 'درخواست کننده', 'دسته بندی', 'تامین کننده', 'شرح', 'مبلغ', 'وضعیت'];
    const expenseRows = data.expenses.map(e => [
        e.id,
        toPersianDigits(e.date),
        e.requester,
        e.category,
        e.supplier || '-',
        e.description,
        e.amount,
        e.status
    ]);
    createSheet(expenseHeaders, expenseRows, 'ریز هزینه‌ها');


    // --- 6. Payroll (حقوق و دستمزد) ---
    const payrollHeaders = ['شماره', 'تاریخ', 'پرسنل', 'ساعات کار', 'مبلغ پرداختی', 'توضیحات'];
    const payrollRows = data.payroll.map(p => [
        p.id,
        toPersianDigits(p.date),
        p.employeeName,
        p.hoursWorked,
        p.totalAmount,
        p.notes || '-'
    ]);
    createSheet(payrollHeaders, payrollRows, 'لیست حقوق');


    // --- 7. Inventory Transactions (کاردکس کالا) ---
    const invHeaders = ['شماره', 'تاریخ', 'کالا', 'نوع تراکنش', 'تعداد', 'واحد', 'توضیحات'];
    const invRows = data.inventory.map(i => {
        const item = data.inventoryItems.find(it => it.id === i.itemId);
        return [
            i.id,
            i.id,
            safeToPersianDate(i.date), // Fallback
            item ? item.name : 'نامشخص',
            item ? item.name : 'نامشخص',
            getInventoryTypeLabel(i.type),
            i.quantity,
            item ? item.unit : '-',
            i.description || '-'
        ];
    });
    createSheet(invHeaders, invRows, 'کاردکس کالا');

    // --- 8. Checks (چک‌های پرداختنی) ---
    const checkHeaders = ['شماره', 'شماره چک', 'در وجه', 'سررسید', 'مبلغ', 'بانک', 'وضعیت'];
    const checkRows = data.checks.map(c => [
        c.id,
        c.checkNumber,
        c.payee,
        toPersianDigits(c.dueDate),
        c.amount,
        c.bankName || '-',
        getCheckStatusLabel(c.status)
    ]);
    createSheet(checkHeaders, checkRows, 'چک‌ها');

    // --- 9. Loans (وام‌ها) ---
    const loanHeaders = ['شماره', 'وام دهنده', 'مبلغ اصل', 'مانده', 'تعداد اقساط', 'تاریخ شروع', 'وضعیت'];
    const loanRows = data.loans.map(l => [
        l.id,
        l.lender,
        l.amount,
        l.remainingBalance,
        l.installmentsCount || '-',
        toPersianDigits(l.startDate),
        l.status
    ]);
    createSheet(loanHeaders, loanRows, 'وام‌ها');

    // --- 10. Transfers (انتقالات) ---
    const transferHeaders = ['شماره', 'تاریخ', 'مبلغ', 'شرح'];
    const transferRows = data.transfers.map(t => [
        t.id,
        toPersianDigits(t.date),
        t.amount,
        t.description
    ]);
    createSheet(transferHeaders, transferRows, 'انتقالات');


    // --- Output ---
    XLSX.writeFile(wb, `Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Helpers
function getAccountTypeLabel(type: AccountType) {
    switch (type) {
        case AccountType.ASSET: return 'دارایی';
        case AccountType.LIABILITY: return 'بدهی';
        case AccountType.EQUITY: return 'حقوق صاحبان سهام';
        case AccountType.REVENUE: return 'درآمد';
        case AccountType.EXPENSE: return 'هزینه';
        default: return type;
    }
}

function getInventoryTypeLabel(type: string) {
    switch (type) {
        case 'PURCHASE': return 'خرید';
        case 'USAGE': return 'مصرف';
        case 'ADJUSTMENT': return 'اصلاح موجودی';
        case 'RETURN': return 'مرجوعی';
        default: return type;
    }
}

function getCheckStatusLabel(status: string) {
    switch (status) {
        case 'PENDING': return 'نزد حسابدار';
        case 'PASSED': return 'پاس شده';
        case 'BOUNCED': return 'برگشت خورده';
        case 'CANCELLED': return 'باطل شده';
        default: return status;
    }
}

function detectSaleType(s: SaleRecord) {
    const types = [];
    if (s.posAmount > 0) types.push(`پوز`);
    if (s.cashAmount > 0) types.push(`نقد`);
    if (s.snappFoodAmount > 0) types.push('اسنپ فود');
    if (s.tapsiFoodAmount > 0) types.push('تپسی فود');
    return types.join(' + ') || 'نامشخص';
}

function safeToPersianDate(dateVal: any): string {
    if (!dateVal) return '';

    // If it's a Firestore Timestamp (has toDate method)
    if (dateVal.toDate && typeof dateVal.toDate === 'function') {
        return toPersianDate(dateVal.toDate());
    }

    // If it's already a string?
    if (typeof dateVal === 'string') {
        // If it looks like a Persian date (1403/...), return it
        if (dateVal.includes('/')) return dateVal;

        // If ISO string, try to parse
        const parsed = new Date(dateVal);
        if (!isNaN(parsed.getTime())) {
            return toPersianDate(parsed);
        }
        return dateVal; // Fallback to raw string if valid
    }

    // If it's a Date object
    if (dateVal instanceof Date) {
        return toPersianDate(dateVal);
    }

    // Try creating date from value (e.g. number)
    try {
        const d = new Date(dateVal);
        if (!isNaN(d.getTime())) return toPersianDate(d);
    } catch (e) {
        return String(dateVal);
    }

    return '';
}

