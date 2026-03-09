import React, { useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import {
    TrendingUp, Package, TrainFront, Zap,
    Activity, Globe, ArrowUpRight, ArrowDownRight, ArrowRight
} from 'lucide-react';

export default function AnalyticsDashboard({ requests, bids }) {

    // ── KPI карточки (реальные данные) ──────────────────────────────────────
    const stats = useMemo(() => {
        const totalReq = requests.length;
        const avgPrice = bids.length > 0
            ? Math.round(bids.reduce((acc, b) => acc + Number(b.price), 0) / bids.length)
            : 0;
        const totalWagons = requests.reduce((acc, r) => acc + (r.totalWagons || 0), 0);
        const completedDeals = bids.filter(b => b.status === 'accepted').length;

        return [
            { label: 'Всего заявок', value: totalReq, icon: Package, color: 'blue' },
            { label: 'Средняя ставка', value: avgPrice > 0 ? `${avgPrice.toLocaleString()} ₽` : '---', icon: TrendingUp, color: 'emerald' },
            { label: 'Объем парка', value: `${totalWagons} ваг.`, icon: TrainFront, color: 'indigo' },
            { label: 'Успешных сделок', value: completedDeals, icon: Zap, color: 'orange' },
        ];
    }, [requests, bids]);

    // ── График ставок по дням (реальные биды, сгруппированные по дате) ──────
    const priceHistory = useMemo(() => {
        if (bids.length === 0) return [];

        const byDate = {};
        bids.forEach(b => {
            if (!b.created_at || !b.price) return;
            const day = new Date(b.created_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            if (!byDate[day]) byDate[day] = { sum: 0, count: 0 };
            byDate[day].sum += Number(b.price);
            byDate[day].count += 1;
        });

        return Object.entries(byDate)
            .map(([name, { sum, count }]) => ({ name, price: Math.round(sum / count) }))
            .slice(-8); // последние 8 точек
    }, [bids]);

    // ── Спрос по типам вагонов (реальное распределение заявок) ──────────────
    const demandByWagon = useMemo(() => {
        const counts = {};
        requests.forEach(r => {
            if (!r.wagonType) return;
            counts[r.wagonType] = (counts[r.wagonType] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [requests]);

    // ── Топ маршруты (реальная агрегация) ──────────────────────────────────
    const topRoutes = useMemo(() => {
        const routes = {};
        requests.forEach(r => {
            if (!r.stationFrom || !r.stationTo) return;
            const key = `${r.stationFrom} → ${r.stationTo}`;
            if (!routes[key]) routes[key] = { count: 0, prices: [] };
            routes[key].count += 1;

            const routeBids = bids.filter(b => b.requestId === r.id);
            routeBids.forEach(b => routes[key].prices.push(Number(b.price)));
        });

        return Object.entries(routes)
            .map(([route, { count, prices }]) => {
                const avgP = prices.length > 0
                    ? Math.round(prices.reduce((s, p) => s + p, 0) / prices.length)
                    : null;
                return { route, count, price: avgP ? `${avgP.toLocaleString()} ₽` : '---', growth: count > 1 };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [requests, bids]);

    // ── Самый дефицитный тип вагона ─────────────────────────────────────────
    const scarcestWagon = useMemo(() => {
        if (demandByWagon.length === 0) return null;
        return demandByWagon[0].name;
    }, [demandByWagon]);

    const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'];

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header — без кнопок PDF/Premium */}
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-4xl font-black dark:text-white uppercase tracking-tighter">Аналитика рынка</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-blue-500" /> Обновлено: Сегодня, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-blue-500">Данные на основе реальной активности</span>
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((item, i) => (
                    <div key={i} className="bg-white dark:bg-[#111827] p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${item.color}-500/5 rounded-full -mr-8 -mt-8 group-hover:scale-150 transition-transform duration-700`}></div>
                        <div className={`w-12 h-12 bg-${item.color}-50 dark:bg-${item.color}-950/30 rounded-2xl flex items-center justify-center text-${item.color}-600 mb-6 group-hover:scale-110 transition-transform`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                        <h3 className="text-3xl font-black dark:text-white tracking-tighter">{item.value}</h3>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Price history chart (real data) */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-10 rounded-[3.5rem] border dark:border-slate-800 shadow-sm relative">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Динамика ставок</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Средняя цена отклика по дням</p>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        {priceHistory.length > 1 ? (
                            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                                <AreaChart data={priceHistory}>
                                    <defs>
                                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#94a3b8' }} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}
                                    />
                                    <Area type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                                Недостаточно данных для графика
                            </div>
                        )}
                    </div>
                </div>

                {/* Demand by wagon type (real) */}
                <div className="bg-white dark:bg-[#111827] p-10 rounded-[3.5rem] border dark:border-slate-800 shadow-sm flex flex-col">
                    <h3 className="text-xl font-black dark:text-white uppercase tracking-tight mb-2">Спрос по типам</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-8">Распределение активных заявок</p>

                    <div className="h-[250px] w-full mb-8">
                        {demandByWagon.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                                <BarChart data={demandByWagon} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8', textTransform: 'uppercase' }} width={80} />
                                    <Tooltip cursor={{ fill: 'transparent' }} formatter={(v) => [`${v} заявок`, 'Количество']} />
                                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                                        {demandByWagon.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 font-bold text-sm">Нет данных</div>
                        )}
                    </div>

                    {scarcestWagon && (
                        <div className="mt-auto p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-200">Дефицит парка</span>
                            </div>
                            <span className="text-[10px] font-black text-blue-600 bg-white dark:bg-blue-800 px-2 py-1 rounded-lg">{scarcestWagon}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Top Routes (real) */}
            <div className="bg-white dark:bg-[#111827] p-10 rounded-[3.5rem] border dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Популярные направления</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">По количеству заявок</span>
                </div>
                {topRoutes.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 font-bold">Нет данных по маршрутам</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b dark:border-slate-800">
                                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Маршрут</th>
                                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Заявок</th>
                                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Сред. ставка</th>
                                    <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Активность</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-slate-800">
                                {topRoutes.map((route, i) => (
                                    <tr key={i} className="group">
                                        <td className="py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-sm dark:text-white uppercase tracking-tight">{route.route}</span>
                                            </div>
                                        </td>
                                        <td className="py-6 font-black dark:text-slate-200">{route.count}</td>
                                        <td className="py-6">
                                            <span className="font-black text-blue-600 dark:text-blue-400">{route.price}</span>
                                        </td>
                                        <td className="py-6">
                                            <div className={`flex items-center gap-1 font-black text-[10px] uppercase tracking-widest ${route.growth ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {route.growth ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                                {route.growth ? 'Активен' : 'Единичный'}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
