import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function AuthScreen({ mode, setMode, role, setRole, onSubmit, onBack, isDark }) {
    const [formData, setFormData] = useState({
        email: '', password: '', company: '', inn: '', phone: ''
    });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <div className="min-h-screen animate-in fade-in duration-500 bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-[2.5rem] p-10 shadow-2xl border border-white dark:border-slate-800">
                <button onClick={onBack} className="text-slate-400 font-bold text-sm mb-8 flex items-center gap-2 hover:text-blue-600 transition-colors"><ArrowRight className="w-4 h-4 rotate-180" /> Назад</button>
                <h2 className="text-3xl font-black mb-2 dark:text-white">{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
                <p className="text-slate-400 mb-8 font-medium text-sm">Введите данные вашей компании</p>

                {mode === 'register' && (
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                        <button onClick={() => setRole('owner')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'owner' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}>Владелец</button>
                        <button onClick={() => setRole('shipper')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${role === 'shipper' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}>Отправитель</button>
                    </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required />
                    <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Пароль" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required minLength="6" />

                    {mode === 'register' && (
                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                            <input name="company" type="text" value={formData.company} onChange={handleChange} placeholder="Название компании (ООО / ИП)" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required />
                            <input name="inn" type="text" value={formData.inn} onChange={handleChange} placeholder="ИНН (любой)" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required />
                            <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Телефон" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required />
                        </div>
                    )}

                    <button type="submit" className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg mt-4 uppercase tracking-widest text-xs hover:shadow-blue-500/40 active:scale-95 transition-all">
                        {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
                    </button>
                </form>
                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full text-center mt-8 text-slate-400 font-bold text-sm hover:text-blue-600 transition-colors">{mode === 'login' ? 'Нет аккаунта? Регистрация' : 'Есть аккаунт? Войти'}</button>
            </div>
        </div>
    );
}
