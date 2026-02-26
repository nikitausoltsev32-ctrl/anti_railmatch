import React, { useState } from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import { parsePrompt } from '../src/aiService';

export default function AiAgentBar({ onSearch, activeFilters, onClearFilter, userRole }) {
    const [prompt, setPrompt] = useState("");

    const handleSearch = () => {
        if (!prompt.trim()) return;
        const parsed = parsePrompt(prompt);
        onSearch(parsed);
        setPrompt('');
    };

    return (
        <div className="mb-8">
            <div className="bg-white dark:bg-[#111827] p-1.5 rounded-[24px] border border-blue-100 dark:border-slate-800 shadow-xl shadow-blue-500/5 flex items-center gap-2 focus-within:shadow-[0_0_30px_rgba(37,99,235,0.15)] focus-within:border-blue-300 dark:focus-within:border-blue-700 focus-within:-translate-y-1 hover:-translate-y-0.5 transition-all duration-500 group overflow-hidden bg-gradient-to-r from-transparent via-blue-50/10 to-transparent bg-[length:200%_100%] focus-within:animate-[shimmer_2s_infinite]">
                <div className="pl-4 pr-3 py-3.5 bg-blue-50 dark:bg-blue-900/30 rounded-[18px] ml-1 text-blue-600 dark:text-blue-400 flex items-center gap-2 border border-blue-100/50 group-focus-within:bg-blue-600 group-focus-within:text-white group-focus-within:border-blue-500 transition-all duration-500 shadow-inner">
                    <Sparkles className="w-5 h-5 group-focus-within:animate-spin" />
                    <span className="text-xs font-black uppercase tracking-wider hidden lg:block transition-all duration-300">AI Agent</span>
                </div>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                    placeholder="Найти или создать (например: 'Ищу крытые вагоны из Москвы')..."
                    className="flex-1 py-4 px-3 outline-none text-slate-700 dark:text-white font-semibold placeholder:text-slate-300 dark:placeholder:text-slate-600 bg-transparent transition-all duration-300"
                />
                <button
                    onClick={handleSearch}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 mr-1 rounded-[18px] font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-105 active:scale-95 hover:-translate-y-1 transition-all duration-300 group-focus-within:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                >
                    <span className="hidden sm:block">Поиск</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
            </div>

            {/* AI Filter Chips */}
            {activeFilters && (
                <div className="flex flex-wrap gap-2 mt-4 ml-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest self-center mr-2">Активные фильтры:</span>
                    {activeFilters.stationFrom && (
                        <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800/50">
                            Откуда: {activeFilters.stationFrom}
                            <button onClick={() => onClearFilter('stationFrom')} className="hover:text-blue-900 dark:hover:text-blue-100 focus:outline-none"><X className="w-3 h-3" /></button>
                        </div>
                    )}
                    {activeFilters.stationTo && (
                        <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800/50">
                            Куда: {activeFilters.stationTo}
                            <button onClick={() => onClearFilter('stationTo')} className="hover:text-blue-900 dark:hover:text-blue-100 focus:outline-none"><X className="w-3 h-3" /></button>
                        </div>
                    )}
                    {activeFilters.wagonType && (
                        <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800/50">
                            Вагон: {activeFilters.wagonType}
                            <button onClick={() => onClearFilter('wagonType')} className="hover:text-blue-900 dark:hover:text-blue-100 focus:outline-none"><X className="w-3 h-3" /></button>
                        </div>
                    )}
                    {activeFilters.cargoType && (
                        <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-200 dark:border-blue-800/50">
                            Груз: {activeFilters.cargoType}
                            <button onClick={() => onClearFilter('cargoType')} className="hover:text-blue-900 dark:hover:text-blue-100 focus:outline-none"><X className="w-3 h-3" /></button>
                        </div>
                    )}
                    <button onClick={() => onClearFilter('all')} className="flex items-center gap-1 text-slate-400 hover:text-red-500 text-[10px] font-black uppercase tracking-widest px-2 py-1.5 transition-colors">
                        Сбросить все
                    </button>
                </div>
            )}
        </div>
    );
}
