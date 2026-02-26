import React, { useState, useMemo } from 'react';
import {
    MapPin, Navigation2, Activity, Filter,
    TrainFront, Package, ArrowUpRight, Search,
    Maximize2, Minimize2, ZoomIn, ZoomOut
} from 'lucide-react';

export default function FleetDislocation() {
    const [selectedWagon, setSelectedWagon] = useState(null);
    const [filter, setFilter] = useState('all'); // all, full, empty

    // 1. МОК-ДАННЫЕ ПО ЗАГРУЗКЕ ВАГОНОВ (координаты нормализованы 0-100 для SVG)
    const wagons = useMemo(() => [
        { id: 'W-9021', name: 'Сибирь-Логистик', type: 'Полувагон', cargo: 'Уголь', x: 75, y: 45, status: 'full', speed: '42 км/ч', dest: 'Владивосток' },
        { id: 'W-3312', name: 'ТрансКом', type: 'Крытый', cargo: 'Зерно', x: 45, y: 35, status: 'full', speed: '58 км/ч', dest: 'Москва' },
        { id: 'W-5541', name: 'РЖД-Парк', type: 'Цистерна', cargo: 'Нефть', x: 25, y: 55, status: 'full', speed: '35 км/ч', dest: 'СПб' },
        { id: 'W-1102', name: 'ЕвроСиб', type: 'Платформа', cargo: 'Металл', x: 60, y: 40, status: 'full', speed: '62 км/ч', dest: 'Екатеринбург' },
        { id: 'W-7781', name: 'ТехноТранс', type: 'Полувагон', cargo: 'Пустой', x: 35, y: 25, status: 'empty', speed: '0 км/ч', dest: 'Тюмень' },
        { id: 'W-2234', name: 'Балтика', type: 'Крытый', cargo: 'Пустой', x: 15, y: 30, status: 'empty', speed: '0 км/ч', dest: 'Минск' },
    ], []);

    const filteredWagons = wagons.filter(w => filter === 'all' || w.status === filter);

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-180px)] animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Left Panel: Sidebar Info */}
            <div className="lg:w-80 flex flex-col gap-6">
                <div className="bg-white dark:bg-[#111827] p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm flex flex-col shrink-0">
                    <h2 className="text-xl font-black dark:text-white uppercase tracking-tight mb-2 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-500" /> Флот
                    </h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-6">Текущая дислокация</p>

                    <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl mb-6">
                        {['all', 'full', 'empty'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-white dark:bg-slate-800 shadow-sm dark:text-white' : 'text-slate-400'}`}
                            >
                                {f === 'all' ? 'Все' : f === 'full' ? 'Груз' : 'Порож'}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                        {filteredWagons.map(w => (
                            <div
                                key={w.id}
                                onClick={() => setSelectedWagon(w)}
                                className={`p-4 rounded-2xl cursor-pointer transition-all border ${selectedWagon?.id === w.id ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-blue-300'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`text-[10px] font-bold ${selectedWagon?.id === w.id ? 'text-blue-200' : 'text-slate-400'}`}>{w.id}</span>
                                    <div className={`w-2 h-2 rounded-full ${w.status === 'full' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`}></div>
                                </div>
                                <div className={`font-black text-sm tracking-tight ${selectedWagon?.id === w.id ? 'text-white' : 'dark:text-white'}`}>{w.name}</div>
                                <div className={`text-[10px] uppercase font-bold mt-1 ${selectedWagon?.id === w.id ? 'text-blue-100' : 'text-slate-500'}`}>{w.type} • {w.dest}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {selectedWagon && (
                    <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/30 animate-in slide-in-from-left-4">
                        <div className="flex items-center gap-3 mb-4">
                            <TrainFront className="w-8 h-8 opacity-50" />
                            <div>
                                <h3 className="font-black uppercase tracking-tight leading-none text-xl">{selectedWagon.id}</h3>
                                <p className="text-[10px] font-bold opacity-70 uppercase mt-1">{selectedWagon.type}</p>
                            </div>
                        </div>
                        <div className="space-y-4 mt-6">
                            <div><p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Текущий груз</p><p className="font-black text-sm">{selectedWagon.cargo}</p></div>
                            <div><p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Назначение</p><p className="font-black text-sm">{selectedWagon.dest}</p></div>
                            <div className="flex justify-between">
                                <div><p className="text-[9px] font-bold opacity-60 uppercase tracking-widest">Скорость</p><p className="font-black text-sm">{selectedWagon.speed}</p></div>
                                <button className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"><Maximize2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right: Interactive SVG Map */}
            <div className="flex-1 bg-white dark:bg-[#111827] rounded-[3.5rem] border dark:border-slate-800 shadow-xl relative overflow-hidden group">
                {/* Map Controls */}
                <div className="absolute top-8 left-8 flex flex-col gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl shadow-xl hover:bg-white dark:hover:bg-slate-700 transition-all dark:text-white"><ZoomIn className="w-5 h-5" /></button>
                    <button className="p-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl shadow-xl hover:bg-white dark:hover:bg-slate-700 transition-all dark:text-white"><ZoomOut className="w-5 h-5" /></button>
                </div>

                {/* SVG Container */}
                <svg className="w-full h-full p-12" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    {/* Background Gradients/Glows */}
                    <defs>
                        <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.05" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                        </radialGradient>
                    </defs>
                    <rect width="100" height="100" fill="url(#mapGlow)" rx="10" />

                    {/* Simplfied Landmass (Russia/CIS Shape Placeholder) */}
                    <path
                        d="M 10 30 Q 30 15 50 25 Q 70 15 90 40 Q 80 70 50 80 Q 20 70 10 30"
                        fill="none"
                        stroke="currentColor"
                        className="text-slate-100 dark:text-slate-800/50"
                        strokeWidth="0.5"
                    />

                    {/* Routes (Connecting Lines for Active Deliveries) */}
                    {filteredWagons.filter(w => w.status === 'full').map((w, i) => (
                        <path
                            key={`path-${i}`}
                            d={`M ${w.x} ${w.y} L ${w.x + 10} ${w.y - 10}`}
                            stroke="currentColor"
                            className="text-blue-500/20"
                            strokeWidth="0.2"
                            strokeDasharray="1 1"
                        />
                    ))}

                    {/* Wagon Markers */}
                    {filteredWagons.map(w => (
                        <g
                            key={w.id}
                            onClick={() => setSelectedWagon(w)}
                            className="cursor-pointer group"
                        >
                            {/* Pulse Effect */}
                            {w.status === 'full' && (
                                <circle
                                    cx={w.x}
                                    cy={w.y}
                                    r="2"
                                    fill="currentColor"
                                    className="text-blue-500 animate-ping opacity-25"
                                />
                            )}
                            {/* Marker Center */}
                            <circle
                                cx={w.x}
                                cy={w.y}
                                r={selectedWagon?.id === w.id ? "1.5" : "0.8"}
                                fill={selectedWagon?.id === w.id ? "#3b82f6" : "#64748b"}
                                className="transition-all duration-300 group-hover:r-1.5"
                            />
                            {/* Interaction Area */}
                            <circle cx={w.x} cy={w.y} r="4" fill="transparent" />
                        </g>
                    ))}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-8 right-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2rem] border dark:border-slate-800 shadow-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-200">В рейсе (Груженый)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-200">Простой (Порожний)</span>
                    </div>
                </div>

                {/* Map Overlay Text */}
                <div className="absolute top-8 right-8 text-right">
                    <div className="text-[12px] font-black dark:text-white uppercase tracking-tighter">Спутниковый мониторинг</div>
                    <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest flex items-center justify-end gap-2 animate-pulse">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> ГЛОНАСС Активен
                    </div>
                </div>
            </div>
        </div>
    );
}
