import React, { useState } from 'react';
import { ArrowRight, Plus, Check, CheckCircle, Sparkles, TrendingUp, Package, Clock, ShieldCheck, MapPin, Truck, AlertCircle, Activity, TrendingDown, Award } from 'lucide-react';
import { parsePrompt } from '../src/aiService';

export default function MyRequestsView({ requests, bids, userInn, setView, onAccept, onAiCreate }) {
    const myReqs = requests.filter(r => r.shipperInn === userInn);
    const [aiPrompt, setAiPrompt] = useState("");
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'completed'

    // Analytics calculations
    const activeRequests = myReqs.filter(r => r.status === 'open').length;
    const completedRequests = myReqs.filter(r => r.status === 'completed').length;
    const totalWagonsRequested = myReqs.reduce((sum, r) => sum + r.totalWagons, 0);
    const totalWagonsFulfilled = myReqs.reduce((sum, r) => sum + (r.fulfilledWagons || 0), 0);
    const totalTonsRequested = myReqs.reduce((sum, r) => sum + (r.totalTons || 0), 0);
    const totalTonsFulfilled = myReqs.reduce((sum, r) => sum + (r.fulfilledTons || 0), 0);

    const deficitWagons = totalWagonsRequested - totalWagonsFulfilled;
    const deficitTons = totalTonsRequested - totalTonsFulfilled;
    const fulfillmentRate = totalWagonsRequested > 0 ? Math.round((totalWagonsFulfilled / totalWagonsRequested) * 100) : 0;

    // Считаем среднюю ставку по предложенным бидам к нашим заявкам
    const myReqIds = myReqs.map(r => r.id);
    const incomingBids = bids.filter(b => myReqIds.includes(b.requestId));
    const avgBidPrice = incomingBids.length > 0
        ? Math.round(incomingBids.reduce((sum, b) => sum + b.price, 0) / incomingBids.length)
        : 0;

    return (
        <div className="max-w-6xl mx-auto py-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-black dark:text-white">Мои заявки</h1>
                <button onClick={() => setView('create')} className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all active:scale-95"><Plus className="w-5 h-5" /> Новая заявка</button>
            </div>

            {/* AI Agent Bar */}
            <div className="mb-10 bg-white dark:bg-[#111827] p-2 rounded-[2rem] border border-blue-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 flex items-center gap-3 focus-within:shadow-[0_0_30px_rgba(37,99,235,0.15)] focus-within:border-blue-300 dark:focus-within:border-blue-700 transition-all duration-500 group overflow-hidden bg-gradient-to-r from-transparent via-blue-50/10 to-transparent bg-[length:200%_100%] focus-within:animate-[shimmer_2s_infinite]">
                <div className="pl-5 pr-4 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-3xl text-blue-600 dark:text-blue-400 flex items-center gap-2 border border-blue-100/50 dark:border-blue-800/50 group-focus-within:bg-blue-600 group-focus-within:text-white transition-all shadow-inner">
                    <Sparkles className="w-6 h-6 group-focus-within:animate-spin" /><span className="text-sm font-black uppercase tracking-wider hidden lg:block">RailMatch AI</span>
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
                    placeholder="Попросить ИИ создать заявку (например: 'Нужно 10 крытых из Екб в Москву')..."
                    className="flex-1 py-4 px-4 outline-none text-slate-700 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent text-lg"
                />
                <button onClick={() => {
                    if (!aiPrompt.trim()) return;
                    const parsed = parsePrompt(aiPrompt);
                    parsed.intent = 'create';
                    setAiPrompt('');
                    onAiCreate(parsed);
                }} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-5 mr-1 rounded-[24px] font-black uppercase tracking-widest text-sm flex items-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all"><span className="hidden sm:block">Создать</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></button>
            </div>

            {/* Role-specific Analytics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {/* 1. Дефицит (Оранжевый) */}
                <div className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><AlertCircle className="w-24 h-24 text-orange-600" /></div>
                    <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 mb-6 border border-orange-100 dark:border-orange-800/50 relative z-10"><AlertCircle className="w-7 h-7" /></div>
                    <div className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2 relative z-10">Дефицит</div>
                    <div className="text-4xl font-black text-orange-600 dark:text-orange-500 relative z-10">{deficitWagons} в. / {deficitTons} т.</div>
                    <div className="text-xs font-bold text-slate-400 mt-3 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-orange-500" /> Требуется погрузка</div>
                </div>

                {/* 2. Покрытие парком (Зеленый) */}
                <div className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><CheckCircle className="w-24 h-24 text-emerald-600" /></div>
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100 dark:border-emerald-800/50 relative z-10"><CheckCircle className="w-7 h-7" /></div>
                    <div className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2 relative z-10">Покрытие парком</div>
                    <div className="text-4xl font-black dark:text-white relative z-10">{fulfillmentRate}%</div>
                    <div className="text-xs font-bold text-emerald-500 mt-3 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> В рамках нормы</div>
                </div>

                {/* 3. Средняя ставка (Синий/Neutral) */}
                <div className="bg-white dark:bg-[#111827] p-6 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-xl shadow-slate-200/20 relative overflow-hidden group hover:-translate-y-1 transition-transform">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Activity className="w-24 h-24 text-blue-600" /></div>
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 mb-6 border border-blue-100 dark:border-blue-800/50 relative z-10"><Activity className="w-7 h-7" /></div>
                    <div className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2 relative z-10">Средняя ставка</div>
                    <div className="text-3xl font-black dark:text-white relative z-10">{avgBidPrice > 0 ? `${avgBidPrice.toLocaleString()} ₽` : '---'}</div>
                    <div className="text-xs font-bold text-slate-400 mt-3 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-emerald-500" /> -2% к рынку</div>
                </div>

                {/* 4. Успешно закрыто (Градиент) */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-6 rounded-[2.5rem] shadow-xl shadow-blue-600/30 relative overflow-hidden group hover:-translate-y-1 transition-transform text-white">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><ShieldCheck className="w-24 h-24" /></div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-6 border border-white/30 relative z-10"><ShieldCheck className="w-7 h-7" /></div>
                    <div className="text-sm font-black uppercase tracking-widest text-blue-200 mb-2 relative z-10">Успешно закрыто</div>
                    <div className="text-4xl font-black relative z-10">{completedRequests} заявок</div>
                    <div className="text-xs font-bold text-blue-100 mt-3 opacity-90">+2 за эту неделю</div>
                </div>
            </div>

            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Truck className="w-6 h-6 text-slate-400" />
                    <h2 className="text-2xl font-black dark:text-white">Грузы</h2>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-2">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'active' ? 'bg-white dark:bg-[#111827] text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                        Активные ({activeRequests})
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'completed' ? 'bg-white dark:bg-[#111827] text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                    >
                        Архив ({completedRequests})
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                {myReqs.filter(r => activeTab === 'active' ? r.status === 'open' : r.status === 'completed').length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-[#111827] rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 font-bold">
                        {activeTab === 'active' ? 'У вас пока нет активных заявок' : 'Архив пуст'}
                    </div>
                ) : myReqs.filter(r => activeTab === 'active' ? r.status === 'open' : r.status === 'completed').map(req => {
                    const reqBids = bids.filter(b => b.requestId === req.id);
                    return (
                        <div key={req.id} className="bg-white dark:bg-[#111827] rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden animate-in zoom-in-95 duration-500 hover:shadow-xl transition-shadow">
                            <div className="p-8 flex flex-col md:flex-row justify-between gap-6 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-transparent">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-[11px] font-bold text-slate-400">ID-{req.id.substring(0, 8)}</span>
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${req.status === 'completed' ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>{req.status === 'open' ? 'Идет поиск' : 'Завершена'}</span>
                                        <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">{req.wagonType}</span>
                                    </div>
                                    <div className="text-2xl font-black dark:text-white flex items-center gap-4 mb-2">
                                        <MapPin className="w-5 h-5 text-slate-400" /> {req.stationFrom} <ArrowRight className="w-5 h-5 text-blue-300" /> <MapPin className="w-5 h-5 text-slate-400" /> {req.stationTo}
                                    </div>
                                    <div className="text-sm text-slate-500 font-bold uppercase tracking-wider pl-9">{req.cargoType} • <span className="text-slate-700 dark:text-slate-300">План: {req.totalWagons} ваг. / {req.totalTons} т.</span></div>
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
                                                                <div className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">ИНН: {bid.ownerInn || '---'}</div>
                                                            </div>
                                                            <div className="flex flex-col items-end">
                                                                <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold">{bid.wagons} ваг.</div>
                                                                <div className="px-3 py-1 text-indigo-600 dark:text-indigo-400 text-[10px] font-black">{bid.tons} т.</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-2xl font-black text-slate-900 dark:text-white mb-6 bg-slate-50 dark:bg-[#0B1120] p-3 rounded-xl border border-slate-100 dark:border-slate-800">{bid.price.toLocaleString()} <span className="text-sm text-slate-400 font-bold">₽/шт</span></div>
                                                        {bid.status === 'pending' ? <button onClick={() => onAccept(bid)} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Заключить сделку</button> : <div className="w-full py-3 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 text-[11px] font-black uppercase tracking-widest rounded-xl text-center flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Сделка активна</div>}
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
            </div>
        </div>
    );
}
