import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, TrainFront, Package } from 'lucide-react';
import { supabase } from '../src/supabaseClient';
import { haptic } from '../src/haptic.js';

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
    const [formData, setFormData] = useState({ name: '', company: '' });
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
                        <button type="button" onClick={() => { haptic.selection(); setRole('owner'); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${role === 'owner' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600' : 'text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'}`}>
                            <TrainFront className="w-4 h-4 shrink-0" /> Владелец вагонов
                        </button>
                        <button type="button" onClick={() => { haptic.selection(); setRole('shipper'); }} className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${role === 'shipper' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600' : 'text-slate-400 hover:bg-white/70 dark:hover:bg-slate-700/60'}`}>
                            <Package className="w-4 h-4 shrink-0" /> Грузоотправитель
                        </button>
                    </div>
                </div>

                <p className="text-xs text-slate-400 mb-4">Телефон можно добавить позже в профиле</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input name="name" type="text" value={formData.name} onChange={handleChange} placeholder="Ваше имя" className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl outline-none focus:ring-2 dark:text-white transition-colors ${errors.name ? 'border-red-400 ring-2 ring-red-300 dark:ring-red-800' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent'}`} />
                        {errors.name && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.name}</p>}
                    </div>
                    <div>
                        <input name="company" type="text" value={formData.company} onChange={handleChange} placeholder="Название компании (ООО / ИП)" className={`w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl outline-none focus:ring-2 dark:text-white transition-colors ${errors.company ? 'border-red-400 ring-2 ring-red-300 dark:ring-red-800' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500 focus:border-transparent'}`} />
                        {errors.company && <p className="text-red-500 text-xs font-bold mt-1.5 ml-2">{errors.company}</p>}
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

    const [tgLogin, setTgLogin] = useState(null); // null | { code, botUrl } | 'waiting' | 'expired'
    const tgPollRef = useRef(null);

    const startTelegramDeepLink = async () => {
        setTgLogin('waiting');
        try {
            const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-login-init`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTgLogin({ code: data.code, botUrl: data.bot_url });
            let elapsed = 0;
            tgPollRef.current = setInterval(async () => {
                elapsed += 2500;
                if (elapsed > 4 * 60 * 1000) {
                    clearInterval(tgPollRef.current);
                    setTgLogin('expired');
                    return;
                }
                const pr = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-login-poll`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: data.code }),
                });
                const pd = await pr.json();
                if (pd.expired) { clearInterval(tgPollRef.current); setTgLogin('expired'); return; }
                if (pd.claimed) {
                    clearInterval(tgPollRef.current);
                    onTelegramAuth({ access_token: pd.access_token, refresh_token: pd.refresh_token, needs_onboarding: pd.needs_onboarding });
                }
            }, 2500);
        } catch (err) {
            setTgLogin(null);
        }
    };

    useEffect(() => () => clearInterval(tgPollRef.current), []);

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
                                {tgLogin === null && (
                                    <button type="button" onClick={startTelegramDeepLink} className="w-full flex items-center justify-center gap-2 py-4 bg-[#229ED9] hover:bg-[#1a8bbf] text-white font-black rounded-2xl transition-all text-sm uppercase tracking-widest">
                                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 13.947l-2.956-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.884.612z"/></svg>
                                        Войти через Telegram
                                    </button>
                                )}
                                {tgLogin === 'waiting' && (
                                    <div className="flex items-center justify-center gap-2 py-4 text-slate-400 text-sm">
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                        Генерация кода...
                                    </div>
                                )}
                                {tgLogin && tgLogin.botUrl && (
                                    <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 space-y-3">
                                        <p className="text-xs text-blue-700 dark:text-blue-300 font-bold">Откройте бота и подтвердите вход — страница войдёт автоматически</p>
                                        <a href={tgLogin.botUrl} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 py-3 bg-[#229ED9] hover:bg-[#1a8bbf] text-white font-black rounded-xl transition-all text-sm">
                                            Открыть @rail_match_bot
                                        </a>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                            Ожидаем подтверждения...
                                        </div>
                                    </div>
                                )}
                                {tgLogin === 'expired' && (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
                                        <p className="text-xs text-amber-700 dark:text-amber-300 font-bold mb-2">Время вышло</p>
                                        <button type="button" onClick={startTelegramDeepLink} className="text-xs text-blue-600 font-bold underline">Попробовать снова</button>
                                    </div>
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

                        <form onSubmit={(e) => { e.preventDefault(); haptic.impact('medium'); if (validate()) onSubmit({ ...formData, role }); }} className="space-y-4">
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
