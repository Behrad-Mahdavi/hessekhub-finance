import React, { useState } from 'react';
import { Account, AccountType } from '../types';
import { formatPrice } from '../utils';
import { CreditCard, Plus, Trash2, Save, Edit2, Wallet } from 'lucide-react';

interface SettingsProps {
  accounts: Account[];
  onAddAccount: (name: string, type: AccountType, initialBalance: number) => void;
  onUpdateAccount: (id: string, name: string, balance: number) => void;
  onDeleteAccount: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ accounts, onAddAccount, onUpdateAccount, onDeleteAccount }) => {
  // Filter for Asset accounts (Cash/Bank)
  const assetAccounts = accounts.filter(a => a.type === AccountType.ASSET);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName) {
      onAddAccount(newName, AccountType.ASSET, parseFloat(newBalance) || 0);
      setIsAdding(false);
      setNewName('');
      setNewBalance('');
    }
  };

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setEditName(account.name);
    setEditBalance(account.balance.toString());
  };

  const handleUpdate = () => {
    if (editingId && editName) {
      onUpdateAccount(editingId, editName, parseFloat(editBalance) || 0);
      setEditingId(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">تنظیمات سیستم</h2>
        <p className="text-slate-500">مدیریت حساب‌های بانکی، صندوق‌ها و کارت‌ها</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Wallet className="w-5 h-5 text-indigo-600" />
            لیست حساب‌ها و کارت‌های بانکی
          </h3>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> افزودن حساب جدید
          </button>
        </div>

        {isAdding && (
          <div className="p-6 bg-indigo-50 border-b border-indigo-100 animate-fade-in-down">
            <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-indigo-800 mb-1">نام حساب / کارت</label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full p-2 rounded border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="مثلاً: بانک ملت - کارت خوان"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-indigo-800 mb-1">موجودی اولیه (تومان)</label>
                <input
                  type="number"
                  value={newBalance}
                  onChange={e => setNewBalance(e.target.value)}
                  className="w-full p-2 rounded border border-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none dir-ltr text-left"
                  placeholder="0"
                />
                {newBalance && <p className="text-xs text-indigo-600 mt-1 font-bold">{formatPrice(newBalance)}</p>}
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-indigo-600 hover:bg-indigo-100 rounded-lg text-sm font-bold">انصراف</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700">ذخیره</button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[600px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="p-4">کد حساب</th>
                <th className="p-4">نام حساب</th>
                <th className="p-4">موجودی فعلی</th>
                <th className="p-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assetAccounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50/80">
                  <td className="p-4 text-sm font-mono text-slate-400">{acc.code}</td>

                  <td className="p-4">
                    {editingId === acc.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full p-1 border border-slate-300 rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-2 font-bold text-slate-700">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        {acc.name}
                      </div>
                    )}
                  </td>

                  <td className="p-4 font-mono dir-ltr text-right font-bold text-slate-600">
                    {editingId === acc.id ? (
                      <>
                        <input
                          type="number"
                          value={editBalance}
                          onChange={e => setEditBalance(e.target.value)}
                          className="w-full p-1 border border-slate-300 rounded dir-ltr"
                        />
                        {editBalance && <p className="text-[10px] text-indigo-600 mt-1 font-bold absolute -bottom-4 right-0 bg-white px-1 rounded shadow-sm z-10">{formatPrice(editBalance)}</p>}
                      </>
                    ) : (
                      acc.balance.toLocaleString('fa-IR')
                    )}
                  </td>

                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === acc.id ? (
                        <>
                          <button onClick={() => setEditingId(null)} className="p-2 text-slate-400 hover:text-slate-600"><span className="text-xs">لغو</span></button>
                          <button onClick={handleUpdate} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Save className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(acc)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          {/* Prevent deleting core accounts if needed, but for now allowing it */}
                          <button onClick={() => onDeleteAccount(acc.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Settings;