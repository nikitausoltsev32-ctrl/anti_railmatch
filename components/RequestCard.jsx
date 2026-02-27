import React from 'react';
import { Package, TrainFront, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function RequestCard({ req, onBid, bidCount = 0, rank }) {
    const isCompleted = req.status === 'completed';
    const isLimitReached = bidCount >= 15;

    let borderStyle = 'border-slate-200/60 dark:border-slate-800';
    let badge = null;

    if (!isCompleted) {
        if (rank === 0) {
            borderStyle = 'border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20 bg-blue-50/30 dark:bg-blue-900/10';
            badge = <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md"><Sparkles className="w-3 h-3" /> Топ-1 выбор</div>;
        } else if (rank === 1) {
            borderStyle = 'border-indigo-400 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20';
            badge = <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-black uppercase tracking-widest">Отличное предложение</div>;
        } else if (rank === 2) {
            borderStyle = 'border-slate-300 dark:border-slate-700 shadow-md';
            badge = <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest">Хороший вариант</div>;
        }
    }

    return (
        <div className={`bg-white dark:bg-[#111827] rounded-3xl p-6 border ${borderStyle} transition-all hover:-translate-y-1 flex flex-col h-full ${isCompleted ? 'opacity-50 grayscale-[0.8]' : ''}`}>
            {badge}
            <div className="flex justify-between items-start mb-4">
                <div className="flex flex-wrap gap-2">
                    {isCompleted && <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500">Закрыта</span>}
                    {req.cargoType && <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-orange-50 text-orange-600">{req.cargoType}</span>}
                    {req.wagonType && <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600">{req.wagonType}</span>}
                </div>
            </div>

            <div className="mb-4">
                <h3 className="text-lg font-black dark:text-white flex items-center gap-2 mb-1">
                    <span className="truncate">{req.stationFrom}</span>
                    <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />
                    <span className="truncate">{req.stationTo}</span>
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500">{req.shipperName || 'Грузоотправитель'}</span>
                    {req.profiles?.is_verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" title="Проверен" />}
                </div>
            </div>

            <div className="mt-auto border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between text-[11px] font-bold">
                    <div className="text-slate-500">
                        Нужно: <span className="text-slate-800 dark:text-white">{req.totalWagons}</span> ваг. / <span className="text-slate-800 dark:text-white">{req.totalTons}</span> т.
                    </div>
                    {req.target_price && (
                        <div className="text-emerald-600 dark:text-emerald-400">
                            Бюджет: {Number(req.target_price).toLocaleString()} ₽
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-3 mt-1">
                    <div className="flex flex-col flex-1">
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-1">
                            <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${((req.fulfilledWagons || 0) / req.totalWagons) * 100}%` }}></div>
                        </div>
                        <span className="text-[9px] text-slate-400 text-right">{req.fulfilledWagons || 0} / {req.totalWagons} погружено</span>
                    </div>

                    <button
                        onClick={onBid}
                        disabled={isCompleted || isLimitReached}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${isCompleted || isLimitReached
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95'
                            }`}
                    >
                        {isCompleted ? 'Закрыто' : isLimitReached ? 'Лимит' : 'Откликнуться'}
                    </button>
                </div>
            </div>
        </div>
    );
}
