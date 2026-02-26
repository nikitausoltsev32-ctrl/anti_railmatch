import React, { useMemo } from 'react';
import {
    LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import {
    TrendingUp, Package, TrainFront, Users, ArrowUpRight, ArrowDownRight,
    Activity, Globe, Zap, Clock, ArrowRight
} from 'lucide-react';

export default function AnalyticsDashboard({ requests, bids }) {
    // 1. ПОДГОТОВКА ДАННЫХ
    const stats = useMemo(() => {
        const totalReq = requests.length;
        const avgPrice = bids.length > 0
            ? Math.round(bids.reduce((acc, b) => acc + Number(b.price), 0) / bids.length)
            : 0;
        const totalWagons = requests.reduce((acc, r) => acc + (r.totalWagons || 0), 0);
        const completedDeals = bids.filter(b => b.status === 'accepted').length;

        return [
            { label: 'Всего заявок', value: totalReq, icon: Package, color: 'blue', trend: '+12%' },
            { label: 'Средняя ставка', value: `${avgPrice.toLocaleString()} ₽`, icon: TrendingUp, color: 'emerald', trend: '-3%' },
            { label: 'Объем парка', value: totalWagons, icon: TrainFront, color: 'indigo', trend: '+5%' },
            { label: 'Успешных сделок', value: completedDeals, icon: Zap, color: 'orange', trend: '+8%' },
        ];
    }, [requests, bids]);

    // Мок данных для графиков (в будущем агрегация из БД)
    const priceHistory = [
        { name: '01.02', price: 1850 }, { name: '05.02', price: 1900 },
        { name: '10.02', price: 1820 }, { name: '15.02', price: 2100 },
        { name: '20.02', price: 1950 }, { name: '23.02', price: 2050 },
    ];

    const demandByWagon = [
        { name: 'Полувагоны', value: 45 },
        { name: 'Крытые', value: 25 },
        { name: 'Цистерны', value: 20 },
        { name: 'Платформы', value: 10 },
    ];

    const topRoutes = [
        { route: 'Москва → Екатеринбург', count: 124, price: '1,950 ₽', growth: true },
        { route: 'СПб → Новосибирск', count: 86, price: '2,300 ₽', growth: false },
        { route: 'Казань → Краснодар', count: 54, price: '1,700 ₽', growth: true },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-4xl font-black dark:text-white uppercase tracking-tighter">Аналитика рынка</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-blue-500" /> Обновлено: Сегодня, {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest dark:text-white hover:bg-slate-50 transition-all shadow-sm">Экспорт PDF</button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">Премиум отчет</button>
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
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-3xl font-black dark:text-white tracking-tighter">{item.value}</h3>
                            <span className={`text-[10px] font-black ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {item.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Price Index Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111827] p-10 rounded-[3.5rem] border dark:border-slate-800 shadow-sm relative">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Индекс RailMatch</h3>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Средняя ставка за 1 вагон (полувагоны)</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl gap-1">
                            {['1Н', '1М', '3М', 'Г'].map(period => (
                                <button key={period} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${period === '1М' ? 'bg-white dark:bg-slate-800 shadow-sm dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}>
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
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
                    </div>
                </div>

                {/* Demand Breakdown */}
                <div className="bg-white dark:bg-[#111827] p-10 rounded-[3.5rem] border dark:border-slate-800 shadow-sm flex flex-col">
                    <h3 className="text-xl font-black dark:text-white uppercase tracking-tight mb-2">Спрос по типам</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-8">Распределение активных заявок</p>

                    <div className="h-[250px] w-full mb-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={demandByWagon} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#94a3b8', textTransform: 'uppercase' }} width={80} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                                    {demandByWagon.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'][index % 4]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-4 mt-auto">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest dark:text-slate-200">Дефицит парка</span>
                            </div>
                            <span className="text-[10px] font-black text-blue-600 bg-white dark:bg-blue-800 px-2 py-1 rounded-lg">Крытые</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Routes Table */}
            <div className="bg-white dark:bg-[#111827] p-10 rounded-[3.5rem] border dark:border-slate-800 shadow-sm">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black dark:text-white uppercase tracking-tight">Популярные направления</h3>
                    <button className="text-blue-600 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:translate-x-1 transition-transform">
                        Все маршруты <ArrowRight className="w-3 h-3" />
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b dark:border-slate-800">
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Маршрут</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Объем (ваг.)</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Актуальная цена</th>
                                <th className="pb-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Динамика</th>
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
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-blue-600 dark:text-blue-400">{route.price}</span>
                                        </div>
                                    </td>
                                    <td className="py-6">
                                        <div className={`flex items-center gap-1 font-black text-[10px] uppercase tracking-widest ${route.growth ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {route.growth ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                            {route.growth ? 'В росте' : 'Снижение'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
