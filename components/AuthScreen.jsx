import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

const validateInn = (inn) => {
    const digits = inn.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 12;
};

const validatePhone = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 12;
};

export default function AuthScreen({ mode, setMode, role, setRole, onSubmit, onBack, isDark, loading }) {
    const [formData, setFormData] = useState({
        email: '', password: '', name: '', company: '', inn: '', phone: ''
    });
    const [errors, setErrors] = useState({});
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
    };

    const validate = () => {
        if (mode !== 'register') return true;
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Укажите ваше имя';
        if (!formData.company.trim()) errs.company = 'Укажите название компании';
        if (!validateInn(formData.inn)) errs.inn = 'ИНН должен содержать 10 или 12 цифр';
        if (!validatePhone(formData.phone)) errs.phone = 'Укажите корректный номер телефона';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    return (
        <div className="min-h-screen animate-in fade-in duration-500 bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-white dark:border-slate-800">
                <button onClick={onBack} className="text-slate-400 font-bold text-sm mb-8 flex items-center gap-2 hover:text-blue-600 transition-colors"><ArrowRight className="w-4 h-4 rotate-180" /> Назад</button>
                <h2 className="text-3xl font-black mb-2 dark:text-white">{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
                <p className="text-slate-400 mb-8 font-medium text-sm">Введите данные вашей компании</p>

                {mode === 'register' && (
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
                        <button onClick={() => setRole('owner')} className={`flex-1 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${role === 'owner' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}>Владелец вагонов</button>
                        <button onClick={() => setRole('shipper')} className={`flex-1 py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${role === 'shipper' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-400'}`}>Грузоотправитель</button>
                    </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); if (validate()) onSubmit(formData); }} className="space-y-4">
                    <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required />
                    <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Пароль (минимум 6 символов)" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" required minLength="6" />

                    {mode === 'register' && (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                            <div>
                                <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Ваше имя" className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 dark:text-white ${errors.name ? 'ring-2 ring-red-400' : 'focus:ring-blue-500'}`} required />
                                {errors.name && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.name}</p>}
                            </div>
                            <div>
                                <input name="company" type="text" value={formData.company} onChange={handleChange} placeholder="Название компании (ООО / ИП)" className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 dark:text-white ${errors.company ? 'ring-2 ring-red-400' : 'focus:ring-blue-500'}`} required />
                                {errors.company && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.company}</p>}
                            </div>
                            <div>
                                <input name="inn" type="text" value={formData.inn} onChange={handleChange} placeholder="ИНН (10 или 12 цифр)" maxLength={12} className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 dark:text-white ${errors.inn ? 'ring-2 ring-red-400' : 'focus:ring-blue-500'}`} required />
                                {errors.inn && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.inn}</p>}
                            </div>
                            <div>
                                <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 dark:text-white ${errors.phone ? 'ring-2 ring-red-400' : 'focus:ring-blue-500'}`} required />
                                {errors.phone && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.phone}</p>}
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg mt-4 uppercase tracking-widest text-xs hover:shadow-blue-500/40 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale-[0.5]"
                    >
                        {loading ? 'Обработка...' : (mode === 'login' ? 'Войти' : 'Создать аккаунт')}
                    </button>
                </form>
                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full text-center mt-8 text-slate-400 font-bold text-sm hover:text-blue-600 transition-colors">{mode === 'login' ? 'Нет аккаунта? Регистрация' : 'Есть аккаунт? Войти'}</button>
            </div>
        </div>
    );
}
