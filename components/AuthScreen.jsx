import React, { useState, useEffect } from 'react';
import { ArrowRight, TrainFront, Package } from 'lucide-react';
import { supabase } from '../src/supabaseClient';

const validatePhone = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 12;
};

const COMPANY_NAME_PATTERN = /\b(ООО|ИП|АО|ЗАО|ОАО|ПАО|НКО|LLC|Ltd|Inc|GmbH|компани[ая]|логистик|транспорт[а-я]*|экспедиц|сервис|груз[а-я]*|карго|cargo|express|экспресс)\b/i;

const validatePersonName = (name) => {
    if (COMPANY_NAME_PATTERN.test(name)) return false;
    return true;
};

function ForgotPasswordView({ onBack, isDark }) {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + window.location.pathname,
        });
        setLoading(false);
        if (err) {
            setError(err.message);
        } else {
            setSent(true);
        }
    };

    return (
        <div className="space-y-4">
            <button onClick={onBack} className="text-slate-400 font-bold text-sm mb-2 flex items-center gap-2 hover:text-blue-600 transition-colors">
                <ArrowRight className="w-4 h-4 rotate-180" /> Назад
            </button>
            <h2 className="text-2xl font-black dark:text-white font-display">Сброс пароля</h2>
            {sent ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 text-center">
                    <p className="text-green-700 dark:text-green-400 font-semibold text-sm">
                        Ссылка для сброса пароля отправлена на вашу почту
                    </p>
                    <p className="text-slate-400 text-xs mt-2">Проверьте папку «Спам», если письмо не появилось</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-slate-400 text-sm font-medium">Укажите email — мы пришлём ссылку для сброса пароля</p>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-colors"
                        required
                    />
                    {error && <p className="text-red-500 text-xs font-bold ml-2">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/25 uppercase tracking-widest text-xs hover:shadow-blue-500/40 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Отправка...' : 'Отправить ссылку'}
                    </button>
                </form>
            )}
        </div>
    );
}

export function TelegramOnboarding({ onSubmit, isDark }) {
    const [role, setRole] = useState('owner');
    const [formData, setFormData] = useState({ name: '', company: '', phone: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
    };

    const validate = () => {
        const errs = {};
        if (!formData.name.trim()) errs.name = 'Укажите ваше имя';
        else if (!validatePersonName(formData.name.trim())) errs.name = 'Укажите имя человека, а не название компании';
        if (!formData.company.trim()) errs.company = 'Укажите название компании';
        if (!validatePhone(formData.phone)) errs.phone = 'Укажите корректный номер телефона';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            await onSubmit({ role, ...formData });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen animate-in fade-in duration-500 bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-white dark:border-slate-800">
                <h2 className="text-3xl font-black mb-2 dark:text-white font-display">Расскажите о себе</h2>
                <p className="text-slate-400 mb-8 font-medium text-sm">Заполните профиль для начала работы</p>

                <div className="mb-6">
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Кто вы на платформе?</p>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner border border-slate-200/70 dark:border-slate-700/70 gap-1">
                        <button type="button" onClick={() => setRole('owner')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${role === 'owner' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600' : 'text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'}`}>
                            <TrainFront className="w-4 h-4 shrink-0" /> Владелец вагонов
                        </button>
                        <button type="button" onClick={() => setRole('shipper')} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${role === 'shipper' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600' : 'text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'}`}>
                            <Package className="w-4 h-4 shrink-0" /> Грузоотправитель
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Ваше имя" className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl outline-none focus:ring-2 dark:text-white transition-colors ${errors.name ? 'border-red-400 ring-2 ring-red-300 dark:ring-red-800' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent'}`} />
                        {errors.name && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.name}</p>}
                    </div>
                    <div>
                        <input name="company" type="text" value={formData.company} onChange={handleChange} placeholder="Название компании (ООО / ИП)" className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl outline-none focus:ring-2 dark:text-white transition-colors ${errors.company ? 'border-red-400 ring-2 ring-red-300 dark:ring-red-800' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent'}`} />
                        {errors.company && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.company}</p>}
                    </div>
                    <div>
                        <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl outline-none focus:ring-2 dark:text-white transition-colors ${errors.phone ? 'border-red-400 ring-2 ring-red-300 dark:ring-red-800' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent'}`} />
                        {errors.phone && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.phone}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/25 mt-4 uppercase tracking-widest text-xs hover:shadow-blue-500/40 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale-[0.5]"
                    >
                        {loading ? 'Сохранение...' : 'Продолжить'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default function AuthScreen({ mode, setMode, role, setRole, onSubmit, onBack, isDark, loading, onTelegramAuth }) {
    const [formData, setFormData] = useState({
        email: '', password: '', name: '', company: '', phone: ''
    });
    const [errors, setErrors] = useState({});
    const [showForgot, setShowForgot] = useState(false);

    const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
    const isDev = import.meta.env.DEV;
    const [tgWidgetError, setTgWidgetError] = useState(false);

    useEffect(() => {
        if (isDev || !botUsername || !onTelegramAuth) return;
        const container = document.getElementById('tg-widget-container');
        if (!container || container.querySelector('script')) return;

        window.onTelegramAuthCallback = (user) => {
            if (onTelegramAuth) onTelegramAuth(user);
        };

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', botUsername);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '12');
        script.setAttribute('data-onauth', 'onTelegramAuthCallback(user)');
        script.setAttribute('data-request-access', 'write');
        script.async = true;
        script.onerror = () => setTgWidgetError(true);
        container.appendChild(script);

        // Detect "Bot domain invalid" iframe error after short delay
        const timer = setTimeout(() => {
            const iframe = container.querySelector('iframe');
            if (!iframe) setTgWidgetError(true);
        }, 4000);

        return () => {
            clearTimeout(timer);
            delete window.onTelegramAuthCallback;
        };
    }, [onTelegramAuth, botUsername, isDev]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
    };

    const validate = () => {
        if (mode !== 'register') return true;
        const errs = {};
        if (!role) errs.role = 'Выберите вашу роль';
        if (!formData.name.trim()) errs.name = 'Укажите ваше имя';
        else if (!validatePersonName(formData.name.trim())) errs.name = 'Укажите имя человека, а не название компании';
        if (!formData.company.trim()) errs.company = 'Укажите название компании';
        if (!validatePhone(formData.phone)) errs.phone = 'Укажите корректный номер телефона';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    return (
        <div className="min-h-screen animate-in fade-in duration-500 bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl border border-white dark:border-slate-800">
                {showForgot ? (
                    <ForgotPasswordView onBack={() => setShowForgot(false)} isDark={isDark} />
                ) : (
                    <>
                        <button onClick={onBack} className="text-slate-400 font-bold text-sm mb-8 flex items-center gap-2 hover:text-blue-600 transition-colors"><ArrowRight className="w-4 h-4 rotate-180" /> Назад</button>
                        <h2 className="text-3xl font-black mb-2 dark:text-white font-display">{mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
                        <p className="text-slate-400 mb-6 font-medium text-sm">Введите данные вашей компании</p>

                        {onTelegramAuth && (
                            <>
                                {isDev ? (
                                    <div className="flex justify-center my-4">
                                        <div className="px-5 py-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs text-slate-400 font-semibold text-center">
                                            Telegram Login Widget доступен только в production
                                        </div>
                                    </div>
                                ) : tgWidgetError ? null : (
                                    <div id="tg-widget-container" className="flex justify-center my-4 min-h-[52px]"></div>
                                )}
                                <div className="flex items-center gap-3 my-4">
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">или</span>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                </div>
                            </>
                        )}

                        {mode === 'register' && (
                            <div className="mb-6">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Кто вы на платформе?</p>
                                <div className={`flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shadow-inner border transition-all gap-1 ${errors.role ? 'border-red-400 ring-2 ring-red-300 dark:ring-red-800' : 'border-slate-200/70 dark:border-slate-700/70'}`}>
                                    <button type="button" onClick={() => { setRole('owner'); setErrors(prev => ({ ...prev, role: null })); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${role === 'owner' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600' : 'text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'}`}>
                                        <TrainFront className="w-4 h-4 shrink-0" /> Владелец вагонов
                                    </button>
                                    <button type="button" onClick={() => { setRole('shipper'); setErrors(prev => ({ ...prev, role: null })); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${role === 'shipper' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600' : 'text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'}`}>
                                        <Package className="w-4 h-4 shrink-0" /> Грузоотправитель
                                    </button>
                                </div>
                                {errors.role && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.role}</p>}
                            </div>
                        )}

                        <form onSubmit={(e) => { e.preventDefault(); if (validate()) onSubmit({ ...formData, role }); }} className="space-y-4">
                            <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-colors" required />
                            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Пароль (минимум 6 символов)" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white transition-colors" required minLength="6" />

                            {mode === 'register' && (
                                <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                                    <div>
                                        <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Ваше имя" className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl outline-none focus:ring-2 dark:text-white transition-colors ${errors.name ? 'border-red-400 ring-2 ring-red-300 dark:ring-red-800' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent'}`} required />
                                        {errors.name && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <input name="company" type="text" value={formData.company} onChange={handleChange} placeholder="Название компании (ООО / ИП)" className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl outline-none focus:ring-2 dark:text-white transition-colors ${errors.company ? 'border-red-400 ring-2 ring-red-300 dark:ring-red-800' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent'}`} required />
                                        {errors.company && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.company}</p>}
                                    </div>
                                    <div>
                                        <input name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl outline-none focus:ring-2 dark:text-white transition-colors ${errors.phone ? 'border-red-400 ring-2 ring-red-300 dark:ring-red-800' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent'}`} required />
                                        {errors.phone && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.phone}</p>}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-600/25 mt-4 uppercase tracking-widest text-xs hover:shadow-blue-500/40 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale-[0.5]"
                            >
                                {loading ? 'Обработка...' : (mode === 'login' ? 'Войти' : 'Создать аккаунт')}
                            </button>
                        </form>

                        {mode === 'login' && (
                            <button
                                onClick={() => setShowForgot(true)}
                                className="w-full text-center mt-4 text-slate-500 dark:text-slate-400 font-semibold text-sm hover:text-blue-600 transition-colors bg-slate-100/90 dark:bg-slate-800/90 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/70 shadow-sm"
                            >
                                Забыли пароль?
                            </button>
                        )}

                        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full text-center mt-4 text-slate-500 dark:text-slate-400 font-bold text-sm hover:text-blue-600 transition-colors bg-slate-100/90 dark:bg-slate-800/90 py-3 rounded-xl border border-slate-200/80 dark:border-slate-700/70 shadow-sm">{mode === 'login' ? 'Нет аккаунта? Регистрация' : 'Есть аккаунт? Войти'}</button>
                    </>
                )}
            </div>
        </div>
    );
}
