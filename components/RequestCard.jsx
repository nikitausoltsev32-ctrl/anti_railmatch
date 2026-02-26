import React from 'react';
import { Package, TrainFront, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RequestCard({ req, onBid, bidCount = 0 }) {
    const isCompleted = req.status === 'completed';
    const isLimitReached = bidCount >= 15;
    return (
        <div className={`bg-white dark:bg-[#111827] rounded-[3rem] p-8 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col h-full ${isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}`}>
            <div className="flex justify-between items-start mb-6">
                <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600'}`}>{isCompleted ? 'Закрыта' : 'Актуально'}</span>
                    {!isCompleted && (
                        <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${isLimitReached ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            {bidCount}/15 откликов
                        </span>
                    )}
                </div>
                <span className="text-[11px] font-bold text-slate-300 font-mono">ID-{req.id}</span>
            </div>
            <h3 className="text-xl font-black mb-1 flex items-center gap-3 dark:text-white uppercase tracking-tight leading-tight">
                <span className="truncate">{req.stationFrom}</span> <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" /> <span className="truncate">{req.stationTo}</span>
            </h3>
            <div className="flex items-center gap-2 mb-8">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.shipperName || 'Грузоотправитель'}</span>
                {req.profiles?.is_verified && (
                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest flex items-center gap-1 shadow-sm">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED
                    </div>
                )}
            </div>
            <div className="grid grid-cols-2 gap-8 mb-auto">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Package className="w-3 h-3" />Груз</p><p className="font-extrabold text-sm dark:text-slate-200 truncate">{req.cargoType}</p></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1"><TrainFront className="w-3 h-3" />Вагон</p><p className="font-extrabold text-sm dark:text-slate-200 truncate">{req.wagonType}</p></div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800/50 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Прогресс погрузки</div>
                    <div className="flex items-baseline gap-3">
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{req.fulfilledWagons || 0}</span>
                            <span className="text-[10px] font-bold text-slate-300 uppercase">/ {req.totalWagons} ваг.</span>
                        </div>
                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 self-center"></div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-slate-700 dark:text-slate-200">{req.fulfilledTons || 0}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">/ {req.totalTons || 0} т.</span>
                        </div>
                    </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner flex leading-none">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 shadow-[0_0_12px_rgba(59,130,246,0.5)]" style={{ width: `${((req.fulfilledWagons || 0) / req.totalWagons) * 100}%` }}></div>
                </div>

                <button
                    onClick={onBid}
                    disabled={isCompleted || isLimitReached}
                    className={`w-full py-5 rounded-2xl text-[13px] font-black uppercase tracking-[0.15em] shadow-xl transition-all ${isCompleted || isLimitReached
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/40 hover:-translate-y-0.5 active:scale-95'
                        }`}
                >
                    {isCompleted ? 'Заявка закрыта' : isLimitReached ? 'Лимит откликов' : 'Сделать ставку'}
                </button>
            </div>
        </div>
    );
}
