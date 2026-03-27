import React, { useState } from 'react';
import { ArrowRight, Plus, Check, CheckCircle, Sparkles, TrendingUp, Package, Clock, ShieldCheck, MapPin, Truck, AlertCircle, Activity, Award, MessageSquare, Briefcase, BarChart2, XCircle } from 'lucide-react';
import { parsePrompt } from '../src/aiService';

export default function MyRequestsView({ requests, bids, userInn, userRole, userId, profiles, setView, onAccept, onChat, onAiCreate, onCancelRequest, onAcceptBid }) {
    const myReqs = requests.filter(r => r.shipperInn === userInn);
    const myBids = bids.filter(b => b.ownerId === userId);
    const [aiPrompt, setAiPrompt] = useState("");
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed' | 'my-responses'

    // Analytics calculations for own requests
    const activeRequests = myReqs.filter(r => r.status === 'open').length;
    const completedRequests = myReqs.filter(r => r.status === 'completed').length;
    const totalWagonsRequested = myReqs.reduce((sum, r) => sum + r.totalWagons, 0);
    const totalWagonsFulfilled = myReqs.reduce((sum, r) => sum + (r.fulfilledWagons || 0), 0);
    const totalTonsRequested = myReqs.reduce((sum, r) => sum + (r.totalTons || 0), 0);
    const totalTonsFulfilled = myReqs.reduce((sum, r) => sum + (r.fulfilledTons || 0), 0);

    const deficitWagons = totalWagonsRequested - totalWagonsFulfilled;
    const deficitTons = totalTonsRequested - totalTonsFulfilled;
    const fulfillmentRate = totalWagonsRequested > 0 ? Math.round((totalWagonsFulfilled / totalWagonsRequested) * 100) : 0;

    // Bids analytics
    const myReqIds = myReqs.map(r => r.id);
    const incomingBids = bids.filter(b => myReqIds.includes(b.requestId));
    const avgBidPrice = incomingBids.length > 0
        ? Math.round(incomingBids.reduce((sum, b) => sum + b.price, 0) / incomingBids.length)
        : 0;

    const activeBidsCount = myBids.filter(b => b.status === 'pending').length;
    const acceptedBidsCount = myBids.filter(b => b.status === 'accepted').length;
    const ownerRevenue = myBids.filter(b => b.status === 'accepted').reduce((sum, b) => sum + (b.price * b.wagons), 0);

    // Win rate for owner
    const winRate = myBids.length > 0 ? Math.round((acceptedBidsCount / myBids.length) * 100) : 0;

    return (
        <div className="max-w-6xl mx-auto py-6 sm:py-10 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-4xl font-black dark:text-white">Мои заявки</h1>
                <button onClick={() => setView('create')} className="px-5 sm:px-6 py-3 sm:py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95 text-sm"><Plus className="w-5 h-5" /> Новая заявка</button>
            </div>

            {/* AI Agent Bar */}
            <div className="mb-6 sm:mb-10 bg-white dark:bg-[#111827] p-2 rounded-2xl sm:rounded-[2rem] border border-blue-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 flex items-center gap-2 sm:gap-3 focus-within:shadow-[0_0_30px_rgba(37,99,235,0.15)] focus-within:border-blue-300 dark:focus-within:border-blue-700 transition-all duration-500 group overflow-hidden bg-gradient-to-r from-transparent via-blue-50/10 to-transparent bg-[length:200%_100%] focus-within:animate-[shimmer_2s_infinite]">
                <div className="pl-3 sm:pl-5 pr-2 sm:pr-4 py-3 sm:py-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl sm:rounded-3xl text-blue-600 dark:text-blue-400 flex items-center gap-2 border border-blue-100/50 dark:border-blue-800/50 group-focus-within:bg-blue-600 group-focus-within:text-white transition-all shadow-inner">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 group-focus-within:animate-spin" /><span className="text-sm font-black uppercase tracking-wider hidden lg:block">RailMatch AI</span>
                </div>
                <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            if (!aiPrompt.trim()) return;
                            const parsed = parsePrompt(aiPrompt);
                            parsed.intent = 'create'; // force create from this view
                            setAiPrompt('');
                            onAiCreate(parsed);
                        }
                    }}
                    placeholder="ИИ создаст заявку..."
                    className="flex-1 py-3 sm:py-4 px-2 sm:px-4 outline-none text-slate-700 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent text-sm sm:text-lg min-w-0"
                />
                <button onClick={() => {
                    if (!aiPrompt.trim()) return;
                    const parsed = parsePrompt(aiPrompt);
                    parsed.intent = 'create';
                    setAiPrompt('');
                    onAiCreate(parsed);
                }} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 sm:px-8 py-3 sm:py-5 mr-1 rounded-xl sm:rounded-[24px] font-black uppercase tracking-widest text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all shrink-0"><span className="hidden sm:block">Создать</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button>
            </div>

            {/* ── Analytics section header ── */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
                    <BarChart2 className="w-4 h-4" />
                </div>
                <div>
                    <h2 className="text-sm font-black uppercase tracking-widest dark:text-white">Аналитика заявок</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        {userRole === 'shipper'
                            ? 'Данные по вашим грузовым заявкам на бирже'
                            : 'Данные по вашим откликам и сделкам'}
                    </p>
                </div>
            </div>

            {/* Role-specific Analytics Dashboard */}
            {userRole === 'shipper' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
                    {/* 1. Дефицит — сколько вагонов ещё не закрыто */}
                    <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><AlertCircle className="w-24 h-24 text-orange-600" /></div>
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 mb-4 sm:mb-6 border border-orange-100 dark:border-orange-800/50 relative z-10"><AlertCircle className="w-7 h-7" /></div>
                        <div className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">Незакрытый дефицит</div>
                        <div className="text-[10px] text-slate-400 mb-2 relative z-10">Вагонов без отклика</div>
                        <div className="text-2xl sm:text-4xl font-black text-orange-600 dark:text-orange-500 relative z-10">{deficitWagons} в.</div>
                        <div className="text-sm font-bold text-orange-400 mt-1 relative z-10">{deficitTons} т. не покрыто</div>
                    </div>

                    {/* 2. Покрытие парком — % заявок с откликами */}
                    <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><CheckCircle className="w-24 h-24 text-emerald-600" /></div>
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mb-4 sm:mb-6 border border-emerald-100 dark:border-emerald-800/50 relative z-10"><CheckCircle className="w-7 h-7" /></div>
                        <div className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">Покрытие парком</div>
                        <div className="text-[10px] text-slate-400 mb-2 relative z-10">Сколько вагонов уже нашли</div>
                        <div className="text-2xl sm:text-4xl font-black dark:text-white relative z-10">{fulfillmentRate}%</div>
                        <div className="text-sm font-bold text-slate-400 mt-1 relative z-10">{totalWagonsFulfilled} из {totalWagonsRequested} ваг.</div>
                    </div>

                    {/* 3. Средняя ставка входящих откликов */}
                    <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Activity className="w-24 h-24 text-blue-600" /></div>
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-4 sm:mb-6 border border-blue-100 dark:border-blue-800/50 relative z-10"><Activity className="w-7 h-7" /></div>
                        <div className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">Средняя ставка</div>
                        <div className="text-[10px] text-slate-400 mb-2 relative z-10">По входящим откликам</div>
                        <div className="text-3xl font-black dark:text-white relative z-10">{avgBidPrice > 0 ? `${avgBidPrice.toLocaleString()} ₽` : '---'}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1 relative z-10">{incomingBids.length} откликов всего</div>
                    </div>

                    {/* 4. Успешно закрытые заявки */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-xl shadow-blue-600/30 relative overflow-hidden group hover:-translate-y-1 transition-transform text-white">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck className="w-24 h-24" /></div>
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 sm:mb-6 border border-white/30 relative z-10"><ShieldCheck className="w-7 h-7" /></div>
                        <div className="text-sm font-black uppercase tracking-widest text-blue-200 mb-1 relative z-10">Завершены</div>
                        <div className="text-[10px] text-blue-200/70 mb-2 relative z-10">Успешно закрытые заявки</div>
                        <div className="text-2xl sm:text-4xl font-black relative z-10">{completedRequests}</div>
                        <div className="text-sm font-bold text-blue-100 mt-1 opacity-90 relative z-10">{activeRequests} активных сейчас</div>
                    </div>
                </div>
            )}

            {/* Owner analytics */}
            {userRole === 'owner' && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 sm:mb-12">
                    {/* 1. Мои публикации (заявки владельца на вагоны) */}
                    <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Package className="w-24 h-24 text-blue-600" /></div>
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-4 sm:mb-6 border border-blue-100 dark:border-blue-800/50 relative z-10"><Package className="w-7 h-7" /></div>
                        <div className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">Мои публикации</div>
                        <div className="text-[10px] text-slate-400 mb-2 relative z-10">Активных предложений на бирже</div>
                        <div className="text-2xl sm:text-4xl font-black dark:text-white relative z-10">{activeRequests}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1 relative z-10">Доступно грузоотправителям</div>
                    </div>

                    {/* 2. Отклики в ожидании */}
                    <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Briefcase className="w-24 h-24 text-orange-600" /></div>
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 mb-4 sm:mb-6 border border-orange-100 dark:border-orange-800/50 relative z-10"><Briefcase className="w-7 h-7" /></div>
                        <div className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">Отклики в ожидании</div>
                        <div className="text-[10px] text-slate-400 mb-2 relative z-10">Ждут решения грузоотправителя</div>
                        <div className="text-2xl sm:text-4xl font-black text-orange-600 dark:text-orange-500 relative z-10">{activeBidsCount}</div>
                        <div className="text-sm font-bold text-slate-400 mt-1 relative z-10">{myBids.length} откликов всего</div>
                    </div>

                    {/* 3. Конверсия */}
                    <div className="bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><TrendingUp className="w-24 h-24 text-emerald-600" /></div>
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mb-4 sm:mb-6 border border-emerald-100 dark:border-emerald-800/50 relative z-10"><TrendingUp className="w-7 h-7" /></div>
                        <div className="text-[10px] sm:text-sm font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">Конверсия</div>
                        <div className="text-[10px] text-slate-400 mb-2 relative z-10">Доля принятых откликов</div>
                        <div className="text-2xl sm:text-4xl font-black dark:text-white relative z-10">{winRate}%</div>
                        <div className="text-sm font-bold text-emerald-500 mt-1 relative z-10">{acceptedBidsCount} из {myBids.length} принято</div>
                    </div>

                    {/* 4. Выручка по принятым сделкам */}
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-xl shadow-blue-600/30 relative overflow-hidden group hover:-translate-y-1 transition-transform text-white">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck className="w-24 h-24" /></div>
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-4 sm:mb-6 border border-white/30 relative z-10"><ShieldCheck className="w-7 h-7" /></div>
                        <div className="text-sm font-black uppercase tracking-widest text-blue-200 mb-1 relative z-10">Выручка</div>
                        <div className="text-[10px] text-blue-200/70 mb-2 relative z-10">Сумма по принятым сделкам</div>
                        <div className="text-3xl font-black relative z-10">{ownerRevenue.toLocaleString()} ₽</div>
                        <div className="text-sm font-bold text-blue-100 mt-1 opacity-90 relative z-10">{acceptedBidsCount} сделок закрыто</div>
                    </div>
                </div>
            )}

            {/* Tab header */}
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                    <h2 className="text-xl sm:text-2xl font-black dark:text-white">Заявки и отклики</h2>
                </div>

                {/* iOS-style segmented toggle */}
                <div className="relative flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl gap-0 shadow-inner w-full sm:w-auto overflow-x-auto">
                    {[
                        { key: 'active', label: `Активные`, count: activeRequests },
                        { key: 'my-responses', label: `Отклики`, count: myBids.length, accent: true },
                        { key: 'completed', label: `Архив`, count: completedRequests },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`relative flex-1 sm:flex-none px-3 sm:px-5 py-2.5 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap
                                ${activeTab === tab.key
                                    ? tab.accent
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                                        : 'bg-white dark:bg-[#111827] text-blue-600 shadow-md'
                                    : tab.accent
                                        ? 'text-indigo-500 dark:text-indigo-400 hover:text-indigo-600'
                                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            {tab.label}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black
                                ${activeTab === tab.key
                                    ? tab.accent ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {/* === TAB: Active own requests === */}
                {activeTab === 'active' && (
                    <>
                        {myReqs.filter(r => r.status === 'open').length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-[#111827] rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-bold">
                                У вас пока нет активных заявок. Создайте первую заявку!
                            </div>
                        ) : myReqs.filter(r => r.status === 'open').map(req => {
                            const reqBids = bids.filter(b => b.requestId === req.id);
                            return (
                                <div key={req.id} className="bg-white dark:bg-[#111827] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden animate-in zoom-in-95 duration-500 hover:shadow-xl transition-shadow">
                                    <div className="p-4 sm:p-8 flex flex-col md:flex-row justify-between gap-4 sm:gap-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-transparent">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4 flex-wrap">
                                                <span className="text-[11px] font-bold text-slate-400">ID-{req.id.substring(0, 8)}</span>
                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${req.status === 'completed' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>{req.status === 'open' ? 'Идет поиск' : 'Завершена'}</span>
                                                <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{req.wagonType}</span>
                                                {onCancelRequest && (
                                                    <button
                                                        onClick={() => onCancelRequest(req.id)}
                                                        className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/40"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" /> Отменить
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-lg sm:text-2xl font-black dark:text-white flex items-center gap-2 sm:gap-4 mb-2 flex-wrap">
                                                <span className="flex items-center gap-1 sm:gap-2"><MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" /> {req.stationFrom}</span> <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-300 shrink-0" /> <span className="flex items-center gap-1 sm:gap-2"><MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" /> {req.stationTo}</span>
                                            </div>
                                            <div className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wider pl-0 sm:pl-9">{req.cargoType} • <span className="text-slate-700 dark:text-slate-300">План: {req.totalWagons} ваг. / {req.totalTons} т.</span></div>
                                        </div>
                                        <div className="bg-white dark:bg-[#0B1120] p-6 rounded-3xl min-w-[240px] text-center border border-slate-200/60 dark:border-slate-700/50 shadow-sm flex flex-col justify-center">
                                            <div className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Прогресс погрузки</div>
                                            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                                {req.fulfilledWagons || 0}<span className="text-base text-slate-300">/{req.totalWagons} в.</span>
                                            </div>
                                            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
                                                {req.fulfilledTons || 0}<span className="text-base text-slate-300">/{req.totalTons} т.</span>
                                            </div>
                                        </div>
                                    </div>
                                    {reqBids.length > 0 && (
                                        <div className="bg-slate-50 dark:bg-[#0B1120]/50 p-8 border-t border-slate-100 dark:border-slate-800/80">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20"><Sparkles className="w-4 h-4 text-white" /></div>
                                                <span className="text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">AI-сортировка: Лучшие отклики первыми</span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {(() => {
                                                    const sortedBids = [...reqBids].sort((a, b) => a.price - b.price);
                                                    return sortedBids.map((bid, idx) => {
                                                        const isBest = idx === 0 && req.status === 'open';
                                                        return (
                                                            <div key={bid.id} className={`p-6 rounded-3xl border shadow-md hover:-translate-y-1 transition-all relative overflow-hidden group ${isBest ? 'bg-white dark:bg-[#111827] border-blue-400 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-blue-500/10' : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-700/50'}`}>
                                                                {isBest && (
                                                                    <div className="absolute top-0 right-0 z-10 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg flex items-center gap-1.5">
                                                                        <Award className="w-3 h-3" /> Выгодное
                                                                    </div>
                                                                )}
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div className="font-black text-slate-800 dark:text-white text-base">
                                                                        {bid.ownerName}
                                                                        <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Владелец вагонов</div>
                                                                    </div>
                                                                    <div className="flex flex-col items-end">
                                                                        <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">{bid.wagons} ваг.</div>
                                                                        <div className="px-3 py-1 text-indigo-600 dark:text-indigo-400 text-[10px] font-black">{bid.tons} т.</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-2xl font-black text-slate-900 dark:text-white mb-6 bg-slate-50 dark:bg-[#0B1120] p-3 rounded-xl border border-slate-100 dark:border-slate-800">{bid.price.toLocaleString()} <span className="text-sm text-slate-400 font-bold">₽/шт</span></div>
                                                                {bid.status === 'pending' && onAcceptBid && (
                                                                    <button
                                                                        onClick={() => onAcceptBid(bid.id)}
                                                                        className="mt-4 w-full px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                                                                    >
                                                                        Принять ставку
                                                                    </button>
                                                                )}
                                                                {bid.status === 'accepted' && (
                                                                    <button
                                                                        onClick={() => onChat && onChat(bid)}
                                                                        className="mt-4 w-full px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                                                                    >
                                                                        <MessageSquare className="w-4 h-4" /> Открыть чат
                                                                    </button>
                                                                )}
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </>
                )}

                {/* === TAB: My Responses (bids I placed on other requests) === */}
                {activeTab === 'my-responses' && (
                    <>
                        {myBids.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-[#111827] rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-bold">
                                Вы пока не откликались на заявки. Перейдите на биржу, чтобы найти подходящие предложения.
                            </div>
                        ) : myBids.map(bid => {
                            const req = requests.find(r => r.id === bid.requestId) || {};
                            const creatorProfile = profiles?.find(p => p.id === req.shipperInn);
                            return (
                                <div key={bid.id} className={`bg-white dark:bg-[#111827] p-4 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row items-center gap-4 sm:gap-6 hover:shadow-xl transition-all group relative overflow-hidden
                                    ${bid.status === 'accepted'
                                        ? 'border-emerald-200 dark:border-emerald-800/40 ring-1 ring-emerald-200 dark:ring-emerald-800/30'
                                        : 'border-indigo-100 dark:border-indigo-900/30 ring-1 ring-indigo-100/60 dark:ring-indigo-900/20'
                                    }`}>
                                    {bid.status === 'accepted' && <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full -z-10 blur-xl"></div>}
                                    {bid.status === 'pending' && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -z-10 blur-xl"></div>}

                                    <div className="flex-1 w-full">
                                        <div className="flex items-center gap-4 mb-4">
                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${bid.status === 'accepted' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                                                {bid.status === 'pending' ? <Clock className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                                {bid.status === 'pending' ? 'Ожидает решения' : 'Сделка заключена'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg">{new Date(bid.created_at).toLocaleDateString()}</span>
                                            {creatorProfile && (
                                                <span className="text-xs font-bold text-slate-500">{creatorProfile.role === 'shipper' ? 'Грузоотправитель' : 'Владелец вагонов'}{creatorProfile.name ? ` · ${creatorProfile.name}` : ''}</span>
                                            )}
                                        </div>
                                        <div className="text-lg sm:text-2xl font-black dark:text-white flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" /> {req.stationFrom || 'Неизвестно'}</span> <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 shrink-0" /> <span className="flex items-center gap-1"><MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0" /> {req.stationTo || 'Неизвестно'}</span>
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

                                    <button onClick={() => onChat(bid)} className={`w-full md:w-auto p-6 rounded-3xl hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3 font-bold group ${bid.status === 'accepted' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30' : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-emerald-500/30'}`}>
                                        <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        <span>{bid.status === 'accepted' ? 'Открыть чат' : 'Начать обсуждение'}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </>
                )}

                {/* === TAB: Completed / Archive === */}
                {activeTab === 'completed' && (
                    <>
                        {myReqs.filter(r => r.status === 'completed').length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-[#111827] rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-bold">
                                Архив пуст
                            </div>
                        ) : myReqs.filter(r => r.status === 'completed').map(req => {
                            return (
                                <div key={req.id} className="bg-white dark:bg-[#111827] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="p-8 flex flex-col md:flex-row justify-between gap-6 bg-slate-50/50 dark:bg-transparent">
                                        <div>
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="text-[11px] font-bold text-slate-400">ID-{req.id.substring(0, 8)}</span>
                                                <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-200 text-slate-600">Завершена</span>
                                                <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{req.wagonType}</span>
                                            </div>
                                            <div className="text-2xl font-black dark:text-white flex items-center gap-4 mb-2 opacity-60">
                                                <MapPin className="w-5 h-5 text-slate-400" /> {req.stationFrom} <ArrowRight className="w-5 h-5 text-blue-300" /> <MapPin className="w-5 h-5 text-slate-400" /> {req.stationTo}
                                            </div>
                                            <div className="text-sm text-slate-500 font-bold uppercase tracking-wider pl-9">{req.cargoType} • {req.totalWagons} ваг. / {req.totalTons} т.</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}
