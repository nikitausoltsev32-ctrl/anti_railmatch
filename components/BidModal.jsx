import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function BidModal({ request, onClose, onConfirm }) {
    const maxWagons = request.totalWagons - (request.fulfilledWagons || 0);
    const [price, setPrice] = useState("");
    const [wagons, setWagons] = useState(maxWagons);
    const [tons, setTons] = useState("");

    const MIN_PRICE = 45_000;
    const MAX_PRICE = 10_000_000;
    const isValid = Number(price) >= MIN_PRICE && Number(price) <= MAX_PRICE && Number(wagons) > 0 && Number(wagons) <= maxWagons;
    const totalSum = Number(price) * Number(wagons) || 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[#111827] w-full max-w-lg rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 border border-white dark:border-slate-800 max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-10">
                <div className="flex justify-between items-center mb-5 sm:mb-8"><h2 className="text-2xl sm:text-3xl font-black dark:text-white">Подача ставки</h2><button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors dark:text-white"><X /></button></div>
                <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl mb-5 sm:mb-8 font-bold text-blue-700 dark:text-blue-300 text-center text-sm sm:text-base">{request.stationFrom} → {request.stationTo}</div>


                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Цена за 1 вагон (₽)</label>
                        <input type="number" min="1" value={price} onChange={e => setPrice(e.target.value)} placeholder="Введите цену" className={`w-full px-6 sm:px-8 py-4 sm:py-5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-black text-xl sm:text-2xl text-center ${price !== '' && Number(price) <= 0 ? 'ring-2 ring-red-400' : ''}`} />
                        {price !== '' && Number(price) < MIN_PRICE && <p className="text-xs text-red-500 font-bold ml-4">Минимальная цена — {MIN_PRICE.toLocaleString()} ₽</p>}
                        {price !== '' && Number(price) > MAX_PRICE && <p className="text-xs text-red-500 font-bold ml-4">Цена не может превышать {MAX_PRICE.toLocaleString()} ₽</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Количество вагонов (макс. {maxWagons})</label>
                        <input type="number" min="1" max={maxWagons} value={wagons} onChange={e => setWagons(e.target.value)} className={`w-full px-6 sm:px-8 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold text-center ${Number(wagons) > maxWagons ? 'ring-2 ring-red-400' : ''}`} />
                        {Number(wagons) > maxWagons && <p className="text-xs text-red-500 font-bold ml-4">Максимум {maxWagons} вагонов</p>}
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Вес (тонн)</label>
                        <input type="number" min="0" value={tons} onChange={e => setTons(e.target.value)} className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold text-center" />
                    </div>

                    {totalSum > 0 && (
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-center border border-emerald-100 dark:border-emerald-800/50">
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Сумма сделки</div>
                            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalSum.toLocaleString()} ₽</div>
                        </div>
                    )}

                    <button
                        onClick={() => { if (isValid) onConfirm(price, wagons, tons); }}
                        disabled={!isValid}
                        className="w-full py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs hover:-translate-y-0.5 active:scale-95 transition-all mt-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >Отправить предложение</button>
                </div>
            </div>
        </div>
    );
}
