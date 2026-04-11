import React from 'react';
import { TrainFront, Sun, Moon, Sparkles, Package, Zap, Check, ArrowRight, ShieldCheck, Activity, MessageSquare, BarChart3, Search, FileText, Users, Lock, UserCheck } from 'lucide-react';
import { haptic } from '../src/haptic.js';

export default function LandingScreen({ onStart, onStartShipper, onStartOwner, onLogin, onDemo, isDark, setIsDark, onShowTerms }) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white overflow-hidden bg-grid-pattern">

            {/* ═══════════════════════════════ DEV BANNER ═══════════════════════════════ */}
            <div className="w-full bg-amber-400 dark:bg-amber-500 text-amber-900 dark:text-amber-950 text-center py-2 px-4 text-xs sm:text-sm font-black tracking-wide z-50 flex items-center justify-center gap-2 flex-wrap">
                <span>Сайт находится в разработке. По вопросам пишите в Telegram:</span>
                <a href="https://t.me/onemonba" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:opacity-70 transition-opacity">@onemonba</a>
            </div>

            {/* ═══════════════════════════════ HEADER ═══════════════════════════════ */}
            <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 h-20 sm:h-28 flex items-center justify-between z-50">
                <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <TrainFront className="text-white w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                    <span className="text-xl sm:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 font-display">RailMatch</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-6">
                    <button onClick={() => setIsDark(!isDark)} className="p-2 sm:p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:rotate-180 hover:shadow-lg transition-all duration-500 text-slate-400">
                        {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                    </button>
                    <button onClick={() => { haptic.impact('light'); onLogin(); }} className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Войти</button>
                    <button onClick={() => { haptic.impact('medium'); onStart(); }} className="px-3 py-2 sm:px-8 sm:py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] sm:text-sm font-black uppercase tracking-widest rounded-xl sm:rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 whitespace-nowrap">Регистрация</button>
                </div>
            </header>

            {/* ═══════════════════════════════ HERO ═══════════════════════════════ */}
            <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center relative mt-6 sm:mt-10 lg:mt-0 pb-10 sm:pb-16">
                {/* Background glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/10 dark:bg-blue-600/20 blur-[120px] rounded-full -z-10 animate-pulse"></div>
                <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -z-10 animate-float-delayed"></div>
                <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full -z-10 animate-float"></div>

                {/* Floating card: deal closed */}
                <div className="hidden lg:flex absolute left-10 top-1/3 glass-card p-4 rounded-3xl animate-float items-center gap-4 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Check className="w-6 h-6" /></div>
                    <div className="text-left">
                        <p className="text-xs font-black uppercase text-slate-400">Сделка закрыта</p>
                        <p className="font-bold dark:text-white">₽ 4 200 000 · 24 вагона</p>
                    </div>
                </div>

                {/* Floating card: AI match */}
                <div className="hidden lg:flex absolute right-10 bottom-1/3 glass-card p-5 rounded-3xl animate-float-delayed items-center gap-4 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center"><Activity className="w-6 h-6" /></div>
                    <div className="text-left">
                        <p className="text-xs font-black uppercase text-slate-400 mb-1">AI Agent</p>
                        <p className="font-extrabold text-lg dark:text-white">15 вагонов — Мск → Екб</p>
                    </div>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white dark:bg-slate-800 shadow-lg text-blue-600 dark:text-blue-400 font-bold text-xs mb-10 border border-slate-100 dark:border-slate-700 hover:scale-105 transition-transform cursor-pointer animate-glow">
                    <Sparkles className="w-4 h-4" /> Первая умная биржа вагонов в России
                </div>

                {/* H1 */}
                <h1 className="text-3xl sm:text-5xl md:text-8xl font-black mb-6 sm:mb-8 leading-[1.05] tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700 font-display">
                    Грузы и вагоны.<br />
                    <span className="relative inline-block mt-2">
                        <span className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 blur-2xl opacity-20"></span>
                        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Без брокеров.</span>
                    </span>
                </h1>

                {/* Subheadline */}
                <p className="text-lg md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mb-14 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    RailMatch соединяет грузоотправителей и владельцев вагонов напрямую.<br className="hidden md:block" />
                    {' '}Комиссия <strong className="text-slate-700 dark:text-slate-200">2.5%</strong> вместо 15–20% у посредников. Сделка — от 60 секунд.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md sm:max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-300">
                    <button onClick={() => { haptic.impact('medium'); onStart(); }} className="w-full sm:flex-[2] h-12 sm:h-16 px-5 sm:px-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-base sm:text-sm sm:uppercase tracking-wide sm:tracking-widest rounded-2xl sm:rounded-3xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 transition-all group flex items-center justify-center gap-3 whitespace-nowrap">
                        Начать бесплатно <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => { haptic.impact('light'); onDemo(); }} className="w-full sm:flex-1 h-12 sm:h-16 px-5 sm:px-6 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 font-bold text-base sm:text-sm sm:uppercase tracking-wide sm:tracking-widest rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-md hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 group whitespace-nowrap">
                        Демо <Zap className="w-4 h-4 text-amber-500 group-hover:scale-125 transition-transform" />
                    </button>
                    <a
                        href="https://t.me/rail_match_bot"
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:flex-1 h-12 sm:h-16 px-5 sm:px-6 bg-[#229ED9]/10 hover:bg-[#229ED9]/20 text-[#229ED9] font-bold text-base sm:text-sm sm:uppercase tracking-wide sm:tracking-widest rounded-2xl sm:rounded-3xl border border-[#229ED9]/30 hover:border-[#229ED9]/60 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
                        Telegram
                    </a>
                </div>
            </section>

            {/* ═══════════════════════════════ STATS BAR ═══════════════════════════════ */}
            <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16">
                <div className="glass-card rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 md:p-12 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
                    {[
                        { value: '2.5%', label: 'Комиссия платформы', sub: 'vs. 15–20% у брокеров', color: 'text-blue-600 dark:text-blue-400' },
                        { value: '60 сек', label: 'Создание заявки', sub: 'с помощью AI-агента', color: 'text-indigo-600 dark:text-indigo-400' },
                        { value: '100%', label: 'Прямые контакты', sub: 'партнёра после оплаты', color: 'text-emerald-600 dark:text-emerald-400' },
                        { value: '0 ₽', label: 'Абонентская плата', sub: 'платите только за результат', color: 'text-amber-600 dark:text-amber-400' },
                    ].map((stat, idx) => (
                        <div key={idx} className="group cursor-default">
                            <div className={`text-2xl sm:text-4xl md:text-5xl font-black mb-1 sm:mb-2 ${stat.color} group-hover:scale-110 transition-transform inline-block font-display`}>{stat.value}</div>
                            <div className="text-sm font-extrabold text-slate-700 dark:text-slate-200 mb-1">{stat.label}</div>
                            <div className="text-xs text-slate-400 font-medium">{stat.sub}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════ FOR WHOM ═══════════════════════════════ */}
            <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                {/* Shippers */}
                <div className="glass-card p-6 sm:p-10 md:p-12 rounded-3xl sm:rounded-[3rem] hover:-translate-y-2 transition-transform duration-500 group">
                    <div className="w-20 h-20 rounded-[2rem] bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                        <Package className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-extrabold mb-3 sm:mb-4 dark:text-white">Грузоотправителям</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg font-medium mb-6 sm:mb-10 leading-relaxed">
                        Публикуйте заявку — и получайте прямые ставки от владельцев вагонов. Никаких посредников, скрытых наценок и бесконечных звонков диспетчерам.
                    </p>
                    <ul className="space-y-5 text-base font-bold text-slate-700 dark:text-slate-300">
                        <li className="flex items-center gap-4"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"><Check className="text-emerald-600 w-5 h-5" /></div> AI заполнит заявку за вас — достаточно одной фразы</li>
                        <li className="flex items-center gap-4"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"><Check className="text-emerald-600 w-5 h-5" /></div> Несколько ставок сразу — выбирайте лучшее предложение</li>
                        <li className="flex items-center gap-4"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"><ShieldCheck className="text-emerald-600 w-5 h-5" /></div> Комиссия 2.5% — и контакты партнёра открыты для расчётов</li>
                    </ul>
                    <button onClick={() => { haptic.impact('medium'); (onStartShipper || onStart)(); }} className="mt-8 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-lg shadow-blue-500/30 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2">
                        Зарегистрироваться как грузоотправитель <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Owners */}
                <div className="bg-slate-900 dark:bg-[#080D1A] p-6 sm:p-10 md:p-12 rounded-3xl sm:rounded-[3rem] border border-slate-800 shadow-2xl text-white hover:-translate-y-2 transition-transform duration-500 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700">
                        <Zap className="w-64 h-64 text-blue-500" />
                    </div>
                    <div className="relative z-10 w-20 h-20 rounded-[2rem] bg-slate-800 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 border border-slate-700">
                        <TrainFront className="w-10 h-10 text-blue-400" />
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-extrabold mb-3 sm:mb-4 relative z-10">Владельцам вагонов</h3>
                    <p className="text-slate-400 text-base sm:text-lg font-medium mb-6 sm:mb-10 leading-relaxed relative z-10">
                        Найдите груз под ваш парк быстрее, чем через диспетчера. Умный подбор по маршруту и типу вагона. Комиссия — только с закрытой сделки.
                    </p>
                    <ul className="space-y-5 text-base font-bold relative z-10">
                        <li className="flex items-center gap-4"><div className="p-2 bg-slate-800 border border-slate-700 rounded-xl"><Check className="text-blue-400 w-5 h-5" /></div> Прямой доступ к тысячам заявок на перевозку</li>
                        <li className="flex items-center gap-4"><div className="p-2 bg-slate-800 border border-slate-700 rounded-xl"><Check className="text-blue-400 w-5 h-5" /></div> AI-агент: один запрос — лучшие совпадения сразу</li>
                        <li className="flex items-center gap-4"><div className="p-2 bg-slate-800 border border-slate-700 rounded-xl"><Sparkles className="text-blue-400 w-5 h-5" /></div> Нет подписки — платите 2.5% только за результат</li>
                    </ul>
                    <button onClick={() => { haptic.impact('medium'); (onStartOwner || onStart)(); }} className="mt-8 w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur text-white font-black uppercase tracking-widest text-xs rounded-2xl border border-white/20 hover:-translate-y-0.5 active:scale-95 transition-all flex items-center justify-center gap-2 relative z-10">
                        Зарегистрироваться как владелец вагонов <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </section>

            {/* ═══════════════════════════════ HOW IT WORKS ═══════════════════════════════ */}
            <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-14 sm:py-24">
                <div className="text-center mb-10 sm:mb-20">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs mb-6 border border-blue-100 dark:border-blue-800">
                        <Sparkles className="w-3.5 h-3.5" /> Три шага до сделки
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4 sm:mb-6 dark:text-white font-display">Как это работает?</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">От регистрации до закрытой сделки — за считанные минуты</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                    {[
                        {
                            step: '01',
                            title: 'Разместите заявку за 60 секунд',
                            desc: 'Напишите запрос в свободной форме — AI-агент сам заполнит маршрут, тип груза и вагон. Никаких сложных форм и справочников.',
                            icon: <FileText className="w-7 h-7" />,
                            color: 'blue'
                        },
                        {
                            step: '02',
                            title: 'Получайте ставки напрямую',
                            desc: 'Владельцы вагонов видят вашу заявку и делают предложения. Сравнивайте условия и выбирайте лучшее — без переговоров с диспетчерами.',
                            icon: <Search className="w-7 h-7" />,
                            color: 'indigo'
                        },
                        {
                            step: '03',
                            title: 'Оплатите комиссию — получите прямые контакты',
                            desc: 'Согласуйте условия в защищённом чате. Оплатите комиссию 2.5% — и платформа раскроет телефон, ИНН и реквизиты партнёра. Расчёт — напрямую.',
                            icon: <ShieldCheck className="w-7 h-7" />,
                            color: 'emerald'
                        }
                    ].map((item, idx) => (
                        <div key={idx} className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-4 right-6 sm:top-6 sm:right-8 text-6xl sm:text-8xl font-black text-slate-100 dark:text-slate-800/50 select-none">{item.step}</div>
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ${
                                item.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600' :
                                item.color === 'indigo' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' :
                                'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600'
                            }`}>{item.icon}</div>
                            <h3 className="text-2xl font-extrabold mb-4 relative z-10 dark:text-white">{item.title}</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed relative z-10">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════ PLATFORM FEATURES ═══════════════════════════════ */}
            <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-14 sm:py-24">
                <div className="text-center mb-10 sm:mb-20">
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-4 sm:mb-6 dark:text-white font-display">Всё для эффективной работы</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">Инструменты, которые делают ж/д логистику быстрой, прозрачной и безопасной</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        {
                            icon: <Sparkles className="w-6 h-6" />,
                            title: 'AI-агент',
                            desc: 'Создайте заявку одной фразой: «10 крытых из Москвы в Челябинск» — агент поймёт и заполнит форму автоматически.',
                            bg: 'bg-blue-50 dark:bg-blue-900/30',
                            text: 'text-blue-600 dark:text-blue-400'
                        },
                        {
                            icon: <Search className="w-6 h-6" />,
                            title: 'Умный подбор',
                            desc: 'Алгоритм сортирует предложения по выгоде для вас. Лучший груз или нужный вагон — всегда наверху списка.',
                            bg: 'bg-indigo-50 dark:bg-indigo-900/30',
                            text: 'text-indigo-600 dark:text-indigo-400'
                        },
                        {
                            icon: <Lock className="w-6 h-6" />,
                            title: 'Безопасный платёж',
                            desc: 'Комиссия 2.5% подтверждает серьёзность обеих сторон и открывает прямые контакты партнёра. Никаких анонимных сделок.',
                            bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                            text: 'text-emerald-600 dark:text-emerald-400'
                        },
                        {
                            icon: <MessageSquare className="w-6 h-6" />,
                            title: 'Защищённый чат',
                            desc: 'Встроенный мессенджер для согласования условий. Контакты сторон открываются только после оплаты.',
                            bg: 'bg-amber-50 dark:bg-amber-900/30',
                            text: 'text-amber-600 dark:text-amber-400'
                        },
                        {
                            icon: <BarChart3 className="w-6 h-6" />,
                            title: 'Аналитика сделок',
                            desc: 'Дашборд с историей ставок, выручкой и статусами. Полная прозрачность по каждой операции в режиме реального времени.',
                            bg: 'bg-rose-50 dark:bg-rose-900/30',
                            text: 'text-rose-600 dark:text-rose-400'
                        },
                        {
                            icon: <UserCheck className="w-6 h-6" />,
                            title: 'Верификация компаний',
                            desc: 'Все участники проходят проверку по ИНН и ЕГРЮЛ. Работайте только с надёжными контрагентами.',
                            bg: 'bg-violet-50 dark:bg-violet-900/30',
                            text: 'text-violet-600 dark:text-violet-400'
                        },
                    ].map((feat, idx) => (
                        <div key={idx} className="glass-card p-8 rounded-3xl hover:-translate-y-1 transition-all duration-300 group">
                            <div className={`w-14 h-14 rounded-2xl ${feat.bg} ${feat.text} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>{feat.icon}</div>
                            <h4 className="text-xl font-extrabold mb-3 dark:text-white">{feat.title}</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════ TRUST SECTION ═══════════════════════════════ */}
            <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-14 sm:py-24">
                <div className="text-center mb-10 sm:mb-16">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 dark:text-white">Безопасность —<br className="hidden md:block" /> в основе каждой сделки</h2>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">RailMatch создан так, чтобы обе стороны были защищены на каждом этапе</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                    {[
                        {
                            icon: <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
                            bg: 'bg-blue-50 dark:bg-blue-900/30',
                            title: 'Только реальные сделки',
                            desc: 'Комиссия 2.5% отсеивает нецелевые запросы. Контакты раскрываются только тем, кто готов к сделке — платформа гарантирует серьёзность обеих сторон.',
                        },
                        {
                            icon: <UserCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
                            bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                            title: 'Проверенные контрагенты',
                            desc: 'Каждая компания проходит верификацию по ИНН, ОГРН и ЕГРЮЛ. Никаких анонимов — вы всегда знаете, с кем заключаете сделку.',
                        },
                        {
                            icon: <Lock className="w-8 h-8 text-violet-600 dark:text-violet-400" />,
                            bg: 'bg-violet-50 dark:bg-violet-900/30',
                            title: 'Защита контактов',
                            desc: 'Телефоны и реквизиты раскрываются только после заключения сделки. Платформа автоматически блокирует попытки обхода.',
                        },
                    ].map((item, idx) => (
                        <div key={idx} className="glass-card p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] hover:-translate-y-2 transition-all duration-500 group text-center">
                            <div className={`w-20 h-20 rounded-[1.5rem] ${item.bg} flex items-center justify-center mx-auto mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                                {item.icon}
                            </div>
                            <h4 className="text-2xl font-extrabold mb-4 dark:text-white">{item.title}</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════ CTA BANNER ═══════════════════════════════ */}
            <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-16 sm:pb-32">
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl sm:rounded-[3rem] p-8 sm:p-16 text-center text-white shadow-2xl shadow-blue-500/20 overflow-hidden">
                    {/* Decorative rings */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10">
                        <div className="absolute top-10 left-20 w-40 h-40 border-2 border-white rounded-full"></div>
                        <div className="absolute bottom-10 right-20 w-60 h-60 border-2 border-white rounded-full"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white rounded-full"></div>
                    </div>
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/15 border border-white/25 text-white font-bold text-xs mb-8">
                            <Sparkles className="w-3.5 h-3.5" /> Регистрация занимает 2 минуты
                        </div>
                        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black mb-4 sm:mb-6">Сократите расходы<br className="sm:hidden" /> на логистику<br className="hidden md:block" /> прямо сейчас</h2>
                        <p className="text-sm sm:text-lg text-blue-100 max-w-xl mx-auto mb-8 sm:mb-10 font-medium">Тысячи заявок на перевозку. Прямые контакты. Комиссия 2.5%. Первые ставки — бесплатно.</p>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                            <button onClick={() => { haptic.impact('medium'); onStart(); }} className="px-8 sm:px-12 py-4 sm:py-5 bg-white text-blue-600 font-black uppercase tracking-widest text-xs sm:text-sm rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all flex items-center justify-center gap-3 group">
                                Зарегистрироваться <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button onClick={() => { haptic.impact('light'); onDemo(); }} className="px-8 sm:px-12 py-4 sm:py-5 bg-white/10 backdrop-blur text-white font-black uppercase tracking-widest text-xs sm:text-sm rounded-2xl border border-white/20 hover:bg-white/20 transition-all flex items-center justify-center gap-3">
                                Демо-режим <Zap className="w-5 h-5 text-amber-300" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════ FOOTER ═══════════════════════════════ */}
            <footer className="border-t border-slate-200 dark:border-slate-800 py-6 sm:py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-xs sm:text-sm text-slate-400">
                    <span>© 2026 RailMatch Platform ООО. Все права защищены.</span>
                    <div className="flex items-center gap-6">
                        <button onClick={onShowTerms} className="hover:text-blue-600 transition-colors font-medium">
                            Пользовательское соглашение
                        </button>
                        <button onClick={onShowTerms} className="hover:text-blue-600 transition-colors font-medium">
                            Конфиденциальность
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
