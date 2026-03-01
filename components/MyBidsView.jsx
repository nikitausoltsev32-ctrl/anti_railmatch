import React, { useState } from 'react';
import { ArrowRight, MessageSquare, TrendingUp, CheckCircle, Clock, Sparkles, Search, Briefcase, Wallet, MapPin, Check, PieChart, Activity, AlertCircle } from 'lucide-react';
import { parsePrompt } from '../src/aiService';

export default function MyBidsView({ bids, requests, userId, userRole, onChat, setView, onAiCreate }) {
    const myBids = bids.filter(b => b.ownerId === userId);
    const [aiPrompt, setAiPrompt] = useState("");
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'

    // Analytics calculations
    const activeBidsCount = myBids.filter(b => b.status === 'pending').length;
    const acceptedBidsCount = myBids.filter(b => b.status === 'accepted').length;
    const projectedRevenue = myBids.filter(b => b.status === 'accepted').reduce((sum, b) => sum + (b.price * b.wagons), 0);
    const potentialRevenue = myBids.filter(b => b.status === 'pending').reduce((sum, b) => sum + (b.price * b.wagons), 0);
    const winRate = myBids.length > 0 ? Math.round((acceptedBidsCount / myBids.length) * 100) : 0;

    // Mock for Park Utilization (just for visualization as per requirements)
    const utilizationRate = 78;

    return (
        <div className="max-w-6xl mx-auto py-10 animate-in fade-in duration-500">
            <h1 className="text-4xl font-black mb-8 dark:text-white">{userRole === 'shipper' ? 'Мои отклики' : 'Мои ставки'}</h1>

            {/* AI Agent Bar */}
            <div className="mb-10 bg-white dark:bg-[#111827] p-2 rounded-[2rem] border border-blue-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 flex items-center gap-3 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300 group overflow-hidden">
                <div className="pl-5 pr-4 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-3xl text-blue-600 dark:text-blue-400 flex items-center gap-2 border border-blue-100/50 dark:border-blue-800/50">
                    <Sparkles className="w-6 h-6 animate-pulse text-indigo-500" /><span className="text-sm font-black uppercase tracking-wider hidden lg:block">RailMatch AI</span>
                </div>
                <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            if (!aiPrompt.trim()) return;
                            const parsed = parsePrompt(aiPrompt);
                            parsed.intent = 'create';
                            setAiPrompt('');
                            onAiCreate(parsed);
                        }
                    }}
                    placeholder="Создать предложение вагонов (например: 'Могу дать 10 полувагонов в Москве')..."
                    className="flex-1 py-4 px-4 outline-none text-slate-700 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent text-lg"
                />
                <button
                    onClick={() => {
                        if (!aiPrompt.trim()) return;
                        const parsed = parsePrompt(aiPrompt);
                        parsed.intent = 'create';
                        setAiPrompt('');
                        onAiCreate(parsed);
                    }}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-5 mr-1 rounded-[24px] font-black uppercase tracking-widest text-sm flex items-center gap-2 shadow-md hover:-translate-y-0.5 transition-all"
                >
                    <span className="hidden sm:block">Создать</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {/* Premium Desktop Analytics Boxes for Owner */}
            {userRole === 'owner' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {/* 1. Загрузка парка (Оранжевый/Внимание) */}
                    <div className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><PieChart className="w-24 h-24 text-orange-600" /></div>
                        <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 mb-6 border border-orange-100 dark:border-orange-800/50 relative z-10"><PieChart className="w-7 h-7" /></div>
                        <div className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2 relative z-10">Загрузка парка</div>
                        <div className="text-4xl font-black text-orange-600 dark:text-orange-500 relative z-10">{utilizationRate}%</div>
                        <div className="text-xs font-bold text-slate-400 mt-3 flex items-center gap-1"><AlertCircle className="w-3 h-3 text-orange-500" /> 22% простаивает</div>
                    </div>

                    {/* 2. Win Rate (Зеленый) */}
                    <div className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><CheckCircle className="w-24 h-24 text-emerald-600" /></div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100 dark:border-emerald-800/50 relative z-10"><CheckCircle className="w-7 h-7" /></div>
                        <div className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2 relative z-10">Win Rate</div>
                        <div className="text-4xl font-black dark:text-white relative z-10">{winRate}%</div>
                        <div className="text-xs font-bold text-emerald-500 mt-3 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +15% к прошлому месяцу</div>
                    </div>

                    {/* 3. Прогноз выручки (Зеленый/Синий) */}
                    <div className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Wallet className="w-24 h-24 text-emerald-600" /></div>
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100 dark:border-emerald-800/50 relative z-10"><Wallet className="w-7 h-7" /></div>
                        <div className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2 relative z-10">Прогноз выручки</div>
                        <div className="text-3xl font-black dark:text-white relative z-10">{projectedRevenue.toLocaleString()} ₽</div>
                        <div className="text-xs font-bold text-emerald-500 mt-3 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Рекордная неделя</div>
                    </div>

                    {/* 4. Активные торги (Highlight) */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-[2.5rem] shadow-xl shadow-blue-600/30 relative overflow-hidden group hover:-translate-y-1 transition-transform text-white">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Activity className="w-24 h-24" /></div>
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 border border-white/30 relative z-10"><Activity className="w-7 h-7" /></div>
                        <div className="text-sm font-black uppercase tracking-widest text-blue-200 mb-2 relative z-10">Активные торги</div>
                        <div className="text-4xl font-black relative z-10">{activeBidsCount} ставок</div>
                        <div className="text-xs font-bold text-blue-100 mt-3 opacity-90">Потенциал: {potentialRevenue.toLocaleString()} ₽</div>
                    </div>
                </div>
            )}

            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Briefcase className="w-6 h-6 text-slate-400" />
                    <h2 className="text-2xl font-black dark:text-white">История предложений</h2>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-2">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white dark:bg-[#111827] text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                        Активные ({activeBidsCount})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'completed' ? 'bg-white dark:bg-[#111827] text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                        Архив ({acceptedBidsCount})
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {myBids.filter(b => activeTab === 'active' ? b.status === 'pending' : b.status === 'accepted').length === 0 ? <div className="text-center py-20 bg-white dark:bg-[#111827] rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-bold">{activeTab === 'active' ? (userRole === 'shipper' ? 'У вас пока нет активных откликов' : 'У вас пока нет активных ставок') : 'Архив пуст'}</div> : myBids.filter(b => activeTab === 'active' ? b.status === 'pending' : b.status === 'accepted').map(bid => {
                    const req = requests.find(r => r.id === bid.requestId) || {};
                    return (
                        <div key={bid.id} className="bg-white dark:bg-[#111827] p-8 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-6 hover:shadow-xl transition-all group relative overflow-hidden">
                            {bid.status === 'accepted' && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-10 blur-xl"></div>}

                            <div className="flex-1 w-full">
                                <div className="flex items-center gap-4 mb-4">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${bid.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                        {bid.status === 'pending' ? <Clock className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                        {bid.status === 'pending' ? 'Ожидает решения' : 'Сделка заключена'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg">{new Date(bid.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="text-2xl font-black dark:text-white flex items-center gap-3 mb-2">
                                    <MapPin className="w-5 h-5 text-slate-400" /> {req.stationFrom || 'Неизвестно'} <ArrowRight className="w-5 h-5 text-blue-400" /> <MapPin className="w-5 h-5 text-slate-400" /> {req.stationTo || 'Неизвестно'}
                                </div>
                                <div className="text-sm text-slate-500 font-bold pl-8">
                                    Груз: <span className="text-slate-800 dark:text-slate-200">{req.cargoType || '---'}</span> • Тип: <span className="text-slate-800 dark:text-slate-200">{req.wagonType || '---'}</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-[#0B1120] p-6 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-6 w-full md:w-auto">
                                <div>
                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Предложение</div>
                                    <div className="text-xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">{bid.price.toLocaleString()} <span className="text-xs text-slate-400">₽/шт</span></div>
                                    <div className="text-sm font-bold text-blue-600 mt-1">{bid.wagons} ваг. / {bid.tons || 0} т.</div>
                                </div>
                                <div className="w-px h-12 bg-slate-200 dark:bg-slate-700"></div>
                                <div>
                                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-1">Итого</div>
                                    <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{(bid.price * bid.wagons).toLocaleString()} ₽</div>
                                </div>
                            </div>

                            {bid.status === 'accepted' && (
                                <button onClick={() => onChat(bid)} className="w-full md:w-auto p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 font-bold group">
                                    <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" /> <span className="md:hidden">Открыть чат</span>
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
