import React, { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, Send, Clock, CheckCircle, MessageSquare, Wifi } from 'lucide-react';

export default function AdminPanel({ supabase, sbUser, isDark }) {
    const [stats, setStats] = useState(null);
    const [broadcasts, setBroadcasts] = useState([]);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        fetchStats();
        fetchBroadcasts();
    }, []);

    const fetchStats = async () => {
        setLoadingStats(true);
        const [
            { data: profiles },
            { data: requests },
            { data: bids },
        ] = await Promise.all([
            supabase.from('profiles').select('role, telegram_id, created_at'),
            supabase.from('requests').select('status, created_at'),
            supabase.from('bids').select('status, commission_amount, created_at'),
        ]);

        const totalUsers = profiles?.length ?? 0;
        const tgUsers = profiles?.filter(p => p.telegram_id)?.length ?? 0;
        const totalRequests = requests?.length ?? 0;
        const activeRequests = requests?.filter(r => r.status === 'open')?.length ?? 0;
        const totalBids = bids?.length ?? 0;
        const completedDeals = bids?.filter(b => b.status === 'contacts_revealed' || b.status === 'accepted')?.length ?? 0;
        const revenue = bids
            ?.filter(b => b.status === 'contacts_revealed' || b.status === 'accepted')
            ?.reduce((sum, b) => sum + (b.commission_amount || 0), 0) ?? 0;

        // Last 5 registrations
        const lastRegs = [...(profiles || [])]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        setStats({ totalUsers, tgUsers, totalRequests, activeRequests, totalBids, completedDeals, revenue, lastRegs });
        setLoadingStats(false);
    };

    const fetchBroadcasts = async () => {
        const { data } = await supabase
            .from('broadcasts')
            .select('*')
            .order('sent_at', { ascending: false })
            .limit(10);
        if (data) setBroadcasts(data);
    };

    const handleBroadcast = async () => {
        if (!broadcastMsg.trim()) return;
        setSending(true);
        setSendResult(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await supabase.functions.invoke('telegram-broadcast', {
                body: { message: broadcastMsg },
            });
            if (res.error) throw new Error(res.error.message);
            const result = res.data;
            setSendResult({ success: true, sent: result.sent, total: result.total });
            setBroadcastMsg('');
            fetchBroadcasts();
        } catch (err) {
            setSendResult({ success: false, error: err.message });
        } finally {
            setSending(false);
        }
    };

    const StatCard = ({ icon: Icon, label, value, sub, color = 'blue' }) => {
        const colorMap = {
            blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600',
            green: 'bg-green-50 dark:bg-green-900/20 text-green-600',
            purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600',
            amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600',
        };
        return (
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-700">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colorMap[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="text-2xl font-black dark:text-white">{value}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1">{label}</div>
                {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-black uppercase tracking-tight dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" /> Панель администратора
            </h2>

            {/* Stats */}
            {loadingStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 animate-pulse">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl mb-3" />
                            <div className="h-7 w-16 bg-slate-100 dark:bg-slate-700 rounded mb-2" />
                            <div className="h-3 w-24 bg-slate-100 dark:bg-slate-700 rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    <StatCard icon={Users} label="Пользователей" value={stats.totalUsers} color="blue" />
                    <StatCard icon={Wifi} label="Telegram" value={stats.tgUsers}
                        sub={`${stats.totalUsers > 0 ? Math.round(stats.tgUsers / stats.totalUsers * 100) : 0}% базы`} color="purple" />
                    <StatCard icon={FileText} label="Заявок" value={stats.totalRequests}
                        sub={`${stats.activeRequests} активных`} color="blue" />
                    <StatCard icon={MessageSquare} label="Ставок" value={stats.totalBids} color="amber" />
                    <StatCard icon={CheckCircle} label="Сделок" value={stats.completedDeals} color="green" />
                    <StatCard icon={TrendingUp} label="Выручка" value={`${(stats.revenue / 1000).toFixed(0)}к ₽`} color="green" />
                </div>
            )}

            {/* Last registrations */}
            {stats?.lastRegs?.length > 0 && (
                <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-black uppercase tracking-widest text-sm dark:text-white">Последние регистрации</h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {stats.lastRegs.map((p, i) => (
                            <div key={i} className="px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-xs font-black">
                                        {(p.role === 'shipper' ? 'Г' : p.role === 'owner' ? 'В' : p.role === 'admin' ? 'А' : 'Д')}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                            {p.role === 'shipper' ? 'Грузовладелец' : p.role === 'owner' ? 'Владелец' : p.role === 'admin' ? 'Администратор' : 'Демо'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.telegram_id && (
                                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full font-bold">TG</span>
                                    )}
                                    <span className="text-xs text-slate-400">
                                        {new Date(p.created_at).toLocaleDateString('ru-RU')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Broadcast */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-black uppercase tracking-widest text-sm dark:text-white flex items-center gap-2">
                        <Send className="w-4 h-4 text-blue-600" /> Рассылка Telegram
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        Сообщение получат все пользователи с привязанным Telegram
                        {stats && ` (${stats.tgUsers} чел.)`}
                    </p>
                </div>
                <div className="p-5 space-y-3">
                    <textarea
                        value={broadcastMsg}
                        onChange={e => setBroadcastMsg(e.target.value)}
                        placeholder="Текст рассылки..."
                        rows={4}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 px-4 py-3 text-sm dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleBroadcast}
                            disabled={sending || !broadcastMsg.trim()}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all"
                        >
                            <Send className="w-4 h-4" />
                            {sending ? 'Отправка...' : 'Отправить всем'}
                        </button>
                        {sendResult && (
                            <div className={`text-sm font-bold ${sendResult.success ? 'text-green-600' : 'text-red-500'}`}>
                                {sendResult.success
                                    ? `✓ Доставлено ${sendResult.sent} из ${sendResult.total}`
                                    : `✗ ${sendResult.error}`}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Broadcasts history */}
            {broadcasts.length > 0 && (
                <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-black uppercase tracking-widest text-sm dark:text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" /> История рассылок
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {broadcasts.map(b => (
                            <div key={b.id} className="px-5 py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <p className="text-sm dark:text-white line-clamp-2 flex-1">{b.message}</p>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-bold text-green-600">{b.recipients_count} получ.</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">
                                            {new Date(b.sent_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
