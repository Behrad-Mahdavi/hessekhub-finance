import React, { useState } from 'react';
import { Employee, PayrollPayment, Account } from '../types';
import { formatPrice, toPersianDate } from '../utils';
import { X, DollarSign, Clock, CreditCard, Calendar, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmployeeProfileModalProps {
    employee: Employee;
    accounts: Account[];
    payrollPayments: PayrollPayment[];
    onClose: () => void;
    onPaySalary: (payment: PayrollPayment) => void;
}

const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
    employee,
    accounts,
    payrollPayments,
    onClose,
    onPaySalary
}) => {
    const [hoursWorked, setHoursWorked] = useState('');
    const [salaryAmount, setSalaryAmount] = useState('');
    const [paymentAccountId, setPaymentAccountId] = useState('');
    const [notes, setNotes] = useState('');

    // Filter payment history for this employee
    const employeePayments = payrollPayments.filter(p => p.employeeId === employee.id);

    // Filter only asset accounts (cash, bank) for payment
    const paymentAccounts = accounts.filter(a => a.type === 'ASSET');

    const handlePayment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!salaryAmount || parseFloat(salaryAmount) <= 0) {
            toast.error('لطفاً مبلغ معتبر وارد کنید');
            return;
        }

        if (!paymentAccountId) {
            toast.error('لطفاً حساب پرداخت را انتخاب کنید');
            return;
        }

        const payment: PayrollPayment = {
            id: `PAY-${Date.now()}`,
            employeeId: employee.id,
            employeeName: employee.fullName,
            date: toPersianDate(new Date()),
            hoursWorked: parseFloat(hoursWorked) || 0,
            totalAmount: parseFloat(salaryAmount),
            paymentAccountId: paymentAccountId,
            paymentAccountName: accounts.find(a => a.id === paymentAccountId)?.name || '',
            notes: notes
        };

        onPaySalary(payment);

        // Reset form
        setHoursWorked('');
        setSalaryAmount('');
        setNotes('');
        toast.success('پرداخت حقوق با موفقیت ثبت شد');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-2xl">
                                {employee.fullName.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">{employee.fullName}</h2>
                                <p className="text-slate-600">{employee.role}</p>
                                <p className="text-sm text-slate-500 mt-1">تاریخ استخدام: {employee.joinDate}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Salary Info */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h3 className="text-sm font-bold text-slate-600 mb-2">حقوق پایه</h3>
                        <p className="text-2xl font-bold text-indigo-600 dir-ltr">{employee.baseSalary.toLocaleString()} تومان</p>
                    </div>

                    {/* Payment Form */}
                    <form onSubmit={handlePayment} className="bg-white p-6 rounded-2xl border-2 border-indigo-100 space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-indigo-600" />
                            پرداخت حقوق ماه جاری
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    <Clock className="w-4 h-4 inline ml-1" />
                                    ساعت کاری این ماه
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    value={hoursWorked}
                                    onChange={(e) => setHoursWorked(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr"
                                    placeholder="مثلاً: 176"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    <DollarSign className="w-4 h-4 inline ml-1" />
                                    مبلغ حقوق (تومان)
                                </label>
                                <input
                                    required
                                    type="number"
                                    value={salaryAmount}
                                    onChange={(e) => setSalaryAmount(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr"
                                    placeholder="مثلاً: 15000000"
                                />
                                {salaryAmount && <p className="text-xs text-indigo-600 mt-1 font-bold">{formatPrice(salaryAmount)}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    <CreditCard className="w-4 h-4 inline ml-1" />
                                    حساب پرداخت
                                </label>
                                <select
                                    required
                                    value={paymentAccountId}
                                    onChange={(e) => setPaymentAccountId(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="">انتخاب حساب...</option>
                                    {paymentAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.name} - {acc.balance.toLocaleString()} تومان
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                                    <FileText className="w-4 h-4 inline ml-1" />
                                    یادداشت (اختیاری)
                                </label>
                                <input
                                    type="text"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="مثلاً: حقوق آذر ماه"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <DollarSign className="w-5 h-5" />
                            ثبت پرداخت حقوق
                        </button>
                    </form>

                    {/* Payment History */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                            تاریخچه پرداخت‌ها
                        </h3>

                        {employeePayments.length === 0 ? (
                            <div className="bg-slate-50 p-8 rounded-xl text-center text-slate-400">
                                هنوز پرداختی ثبت نشده است
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr>
                                            <th className="p-3 text-right text-xs font-bold text-slate-600">تاریخ</th>
                                            <th className="p-3 text-right text-xs font-bold text-slate-600">ساعت کار</th>
                                            <th className="p-3 text-right text-xs font-bold text-slate-600">مبلغ</th>
                                            <th className="p-3 text-right text-xs font-bold text-slate-600">حساب پرداخت</th>
                                            <th className="p-3 text-right text-xs font-bold text-slate-600">یادداشت</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {employeePayments
                                            .sort((a, b) => b.date.localeCompare(a.date))
                                            .map(payment => (
                                                <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-3 text-sm text-slate-700">{payment.date}</td>
                                                    <td className="p-3 text-sm text-slate-700 dir-ltr">{payment.hoursWorked}</td>
                                                    <td className="p-3 text-sm font-bold text-emerald-600 dir-ltr">
                                                        {payment.totalAmount.toLocaleString()} تومان
                                                    </td>
                                                    <td className="p-3 text-sm text-slate-600">{payment.paymentAccountName}</td>
                                                    <td className="p-3 text-sm text-slate-500">{payment.notes || '-'}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfileModal;
