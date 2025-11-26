import React, { useState } from 'react';
import { Employee, Account, PayrollPayment } from '../types';
import { formatPrice } from '../utils';
import { Users, Plus, DollarSign, Trash2, UserPlus, Eye } from 'lucide-react';
import EmployeeProfileModal from './EmployeeProfileModal';

interface PayrollProps {
   employees: Employee[];
   accounts: Account[];
   payrollPayments: PayrollPayment[];
   onAddEmployee: (emp: Employee) => void;
   onDeleteEmployee: (id: string) => void;
   onPaySalary: (payment: PayrollPayment) => void;
}

const Payroll: React.FC<PayrollProps> = ({ employees, accounts, payrollPayments, onAddEmployee, onDeleteEmployee, onPaySalary }) => {
   const [isAdding, setIsAdding] = useState(false);
   const [newEmp, setNewEmp] = useState({ fullName: '', role: '', baseSalary: '', department: 'STAFF' as 'STAFF' | 'COURIER' });
   const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
   const [activeTab, setActiveTab] = useState<'STAFF' | 'COURIER'>('STAFF');

   const handleAdd = (e: React.FormEvent) => {
      e.preventDefault();
      onAddEmployee({
         id: `EMP-${Date.now()}`,
         fullName: newEmp.fullName,
         role: newEmp.role,
         baseSalary: parseFloat(newEmp.baseSalary) || 0,
         joinDate: new Date().toLocaleDateString('fa-IR'),
         department: newEmp.department
      });
      setIsAdding(false);
      setNewEmp({ fullName: '', role: '', baseSalary: '', department: 'STAFF' });
   };

   return (
      <div className="p-4 md:p-8">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
               <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">حقوق و دستمزد</h2>
               <p className="text-slate-500">مدیریت کارمندان و پرداخت حقوق ماهانه</p>
            </div>
            <button
               onClick={() => setIsAdding(true)}
               className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200"
            >
               <UserPlus className="w-5 h-5" />
               افزودن کارمند
            </button>
         </div>

         {/* Tabs */}
         <div className="flex gap-2 mb-6 border-b border-slate-200 pb-1">
            <button
               onClick={() => setActiveTab('STAFF')}
               className={`px-4 py-2 font-bold text-sm transition-colors relative ${activeTab === 'STAFF' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
               کارمندان
               {activeTab === 'STAFF' && <div className="absolute bottom-[-5px] left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></div>}
            </button>
            <button
               onClick={() => setActiveTab('COURIER')}
               className={`px-4 py-2 font-bold text-sm transition-colors relative ${activeTab === 'COURIER' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
            >
               پیک‌ها
               {activeTab === 'COURIER' && <div className="absolute bottom-[-5px] left-0 right-0 h-1 bg-indigo-600 rounded-t-full"></div>}
            </button>
         </div>

         {isAdding && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 mb-8 animate-fade-in-down max-w-3xl">
               <h3 className="text-lg font-bold mb-4">مشخصات {activeTab === 'STAFF' ? 'کارمند' : 'پیک'} جدید</h3>
               <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-4 mb-2">
                     <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                           <input
                              type="radio"
                              name="department"
                              checked={newEmp.department === 'STAFF'}
                              onChange={() => setNewEmp({ ...newEmp, department: 'STAFF' })}
                              className="w-4 h-4 text-indigo-600"
                           />
                           <span className="text-sm font-medium text-slate-700">کارمند اداری/کافه</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                           <input
                              type="radio"
                              name="department"
                              checked={newEmp.department === 'COURIER'}
                              onChange={() => setNewEmp({ ...newEmp, department: 'COURIER' })}
                              className="w-4 h-4 text-indigo-600"
                           />
                           <span className="text-sm font-medium text-slate-700">پیک موتوری</span>
                        </label>
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">نام و نام خانوادگی</label>
                     <input
                        required
                        type="text"
                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                        value={newEmp.fullName}
                        onChange={e => setNewEmp({ ...newEmp, fullName: e.target.value })}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">سمت / نقش</label>
                     <input
                        required
                        type="text"
                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500"
                        value={newEmp.role}
                        onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">حقوق پایه (تومان)</label>
                     <input
                        required
                        type="number"
                        className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:border-indigo-500 dir-ltr"
                        value={newEmp.baseSalary}
                        onChange={e => setNewEmp({ ...newEmp, baseSalary: e.target.value })}
                     />
                     {newEmp.baseSalary && <p className="text-xs text-indigo-600 mt-1 font-bold">{formatPrice(newEmp.baseSalary)}</p>}
                  </div>
                  <div className="md:col-span-4 flex justify-end gap-2 mt-2">
                     <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-500">انصراف</button>
                     <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">ذخیره</button>

                  </div>
               </form>
            </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.filter(e => (e.department || 'STAFF') === activeTab).map(emp => (
               <div key={emp.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex gap-3 items-center">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-xl">
                           {emp.fullName.charAt(0)}
                        </div>
                        <div>
                           <h3 className="font-bold text-slate-800">{emp.fullName}</h3>
                           <p className="text-xs text-slate-500">{emp.role}</p>
                        </div>
                     </div>
                     <button onClick={() => onDeleteEmployee(emp.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                     <div className="flex justify-between mb-1">
                        <span className="text-xs text-slate-500">حقوق پایه:</span>
                        <span className="font-bold text-slate-700 dir-ltr">{emp.baseSalary.toLocaleString()}</span>
                     </div>
                     <div className="flex justify-between">
                        <span className="text-xs text-slate-500">تاریخ استخدام:</span>
                        <span className="text-xs text-slate-700">{emp.joinDate}</span>
                     </div>
                  </div>

                  <button
                     onClick={() => setSelectedEmployee(emp)}
                     className="w-full py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                     <Eye className="w-4 h-4" /> مشاهده پروفایل و پرداخت حقوق
                  </button>
               </div>
            ))}
         </div>

         {/* Employee Profile Modal */}
         {selectedEmployee && (
            <EmployeeProfileModal
               employee={selectedEmployee}
               accounts={accounts}
               payrollPayments={payrollPayments}
               onClose={() => setSelectedEmployee(null)}
               onPaySalary={onPaySalary}
            />
         )}
      </div>
   );
};

export default Payroll;