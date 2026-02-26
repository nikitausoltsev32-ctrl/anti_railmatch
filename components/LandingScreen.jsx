import React from 'react';
import { TrainFront, Sun, Moon, Sparkles, Package, Zap, Check, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export default function LandingScreen({ onStart, onLogin, onDemo, isDark, setIsDark }) {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white overflow-hidden bg-grid-pattern">
            <header className="max-w-7xl mx-auto w-full px-6 h-28 flex items-center justify-between z-50">
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <TrainFront className="text-white w-7 h-7" />
                    </div>
                    <span className="text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">RailMatch</span>
                </div>
                <div className="flex items-center gap-6">
                    <button onClick={() => setIsDark(!isDark)} className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:rotate-180 hover:shadow-lg transition-all duration-500 text-slate-400">
                        {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
                    </button>
                    <button onClick={onLogin} className="hidden sm:block text-sm font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors">Войти</button>
                    <button onClick={onStart} className="px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">Регистрация</button>
                </div>
            </header>

            <section className="flex-1 flex flex-col items-center justify-center px-6 text-center relative mt-10 lg:mt-0">
                {/* Background Glows */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/10 dark:bg-blue-600/20 blur-[120px] rounded-full -z-10 animate-pulse"></div>
                <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full -z-10 animate-float-delayed"></div>
                <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-emerald-500/10 blur-[100px] rounded-full -z-10 animate-float"></div>

                {/* Floating Interactive Elements */}
                <div className="hidden lg:flex absolute left-10 top-1/3 glass-card p-4 rounded-3xl animate-float items-center gap-4 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Check className="w-6 h-6" /></div>
                    <div className="text-left"><p className="text-xs font-black uppercase text-slate-400">Статус</p><p className="font-bold dark:text-white">Ставка принята</p></div>
                </div>
                <div className="hidden lg:flex absolute right-10 bottom-1/3 glass-card p-5 rounded-3xl animate-float-delayed items-center gap-4 cursor-pointer hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center"><Activity className="w-6 h-6" /></div>
                    <div className="text-left"><p className="text-xs font-black uppercase text-slate-400 mb-1">AI Agent</p><p className="font-extrabold text-lg dark:text-white">Найдено 15 вагонов</p></div>
                </div>

                <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white dark:bg-slate-800 shadow-lg text-blue-600 dark:text-blue-400 font-bold text-xs mb-10 border border-slate-100 dark:border-slate-700 hover:scale-105 transition-transform cursor-pointer animate-glow">
                    <Sparkles className="w-4 h-4" /> Первая умная биржа вагонов в РФ
                </div>

                <h1 className="text-5xl md:text-8xl font-black mb-10 leading-[1.05] tracking-tight animate-in fade-in slide-in-from-bottom-8 duration-700">
                    Прямая связь между <br />
                    <span className="relative inline-block mt-2">
                        <span className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 blur-2xl opacity-20"></span>
                        <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">грузом и вагоном</span>
                    </span>
                </h1>

                <p className="text-lg md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mb-14 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    Находите выгодные ставки, управляйте сделками и экономьте время с помощью современного интерфейса и встроенного AI-агента.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl mx-auto animate-in fade-in zoom-in-95 duration-1000 delay-300">
                    <button onClick={onStart} className="flex-1 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black uppercase tracking-widest text-sm rounded-3xl shadow-xl shadow-blue-500/30 hover:shadow-blue-500/50 hover:shadow-2xl hover:-translate-y-1.5 active:scale-95 transition-all group flex items-center justify-center gap-3">
                        Начать работу <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={onDemo} className="flex-1 py-6 bg-white dark:bg-[#111827] text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest text-sm rounded-3xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 shadow-xl hover:-translate-y-1.5 active:scale-95 transition-all flex items-center justify-center gap-3 group">
                        Смотреть демо <Zap className="w-5 h-5 text-amber-500 group-hover:scale-125 transition-transform" />
                    </button>
                </div>
            </section>

            <section className="max-w-7xl mx-auto w-full px-6 py-32 grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="glass-card p-12 rounded-[3rem] hover:-translate-y-2 transition-transform duration-500 group">
                    <div className="w-20 h-20 rounded-[2rem] bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"><Package className="w-10 h-10 text-blue-600" /></div>
                    <h3 className="text-4xl font-extrabold mb-6 dark:text-white">Грузоотправителям</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-lg font-medium mb-10 leading-relaxed">Размещайте грузы бесплатно. Получайте лучшие предложения напрямую от собственников парка за считанные минуты.</p>
                    <ul className="space-y-6 text-base font-bold text-slate-700 dark:text-slate-300">
                        <li className="flex items-center gap-4"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"><Check className="text-emerald-600 w-5 h-5" /></div> Создание заявки за 60 секунд</li>
                        <li className="flex items-center gap-4"><div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl"><ShieldCheck className="text-emerald-600 w-5 h-5" /></div> Прямые контакты без посредников</li>
                    </ul>
                </div>
                <div className="bg-slate-900 dark:bg-[#080D1A] p-12 rounded-[3rem] border border-slate-800 shadow-2xl text-white hover:-translate-y-2 transition-transform duration-500 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-700"><Zap className="w-64 h-64 text-blue-500" /></div>
                    <div className="relative z-10 w-20 h-20 rounded-[2rem] bg-slate-800 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300 border border-slate-700"><TrainFront className="w-10 h-10 text-blue-400" /></div>
                    <h3 className="text-4xl font-extrabold mb-6 relative z-10">Владельцам парка</h3>
                    <p className="text-slate-400 text-lg font-medium mb-10 leading-relaxed relative z-10">Обеспечьте 100% загрузку вашего парка вагонов. Работа по подписке без скрытых комиссий с каждой сделки.</p>
                    <ul className="space-y-6 text-base font-bold relative z-10">
                        <li className="flex items-center gap-4"><div className="p-2 bg-slate-800 border border-slate-700 rounded-xl"><Check className="text-blue-400 w-5 h-5" /></div> Доступ к рынку грузов</li>
                        <li className="flex items-center gap-4"><div className="p-2 bg-slate-800 border border-slate-700 rounded-xl"><Sparkles className="text-blue-400 w-5 h-5" /></div> AI-агент для умного поиска</li>
                    </ul>
                </div>
            </section>
        </div>
    );
}
