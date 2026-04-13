import React, { useState, useEffect } from 'react';
import { Users, FileText, TrendingUp, Send, Clock, CheckCircle, MessageSquare, Wifi, Trash2, AlertTriangle, Search, ShieldOff, Shield, RefreshCw, BarChart3, UserCheck, UserX, ExternalLink } from 'lucide-react';

export default function AdminPanel({ supabase, sbUser, isDark }) {
    const [stats, setStats] = useState(null);
    const [violationsFor, setViolationsFor] = useState(null);
    const [broadcasts, setBroadcasts] = useState([]);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [deletingRequests, setDeletingRequests] = useState(false);
    const [deletingBids, setDeletingBids] = useState(false);
    const [deleteResult, setDeleteResult] = useState(null);

    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');
    const [userActionResult, setUserActionResult] = useState(null);

    const [errorLogs, setErrorLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const [broadcastStats, setBroadcastStats] = useState(null);
    const [notionSyncing, setNotionSyncing] = useState(false);
    const [notionResult, setNotionResult] = useState(null);

    useEffect(() => {
        fetchStats();
        fetchBroadcasts();
        fetchUsers();
        fetchErrorLogs();
    }, []);

    const fetchStats = async () => {
        setLoadingStats(true);
        const [
            { data: profiles },
            { data: requests },
            { data: bids },
        ] = await Promise.all([
            supabase.from('profiles').select('id, name, company, role, telegram_id, is_banned, created_at'),
            supabase.from('requests').select('status, created_at, shipperId'),
            supabase.from('bids').select('status, commission_amount, created_at, ownerId'),
        ]);

        const totalUsers = profiles?.length ?? 0;
        const tgUsers = profiles?.filter(p => p.telegram_id)?.length ?? 0;
        const bannedUsers = profiles?.filter(p => p.is_banned)?.length ?? 0;
        const totalRequests = requests?.length ?? 0;
        const activeRequests = requests?.filter(r => r.status === 'open')?.length ?? 0;
        const totalBids = bids?.length ?? 0;
        const completedDeals = bids?.filter(b => b.status === 'contacts_revealed' || b.status === 'accepted')?.length ?? 0;
        const revenue = bids
            ?.filter(b => b.status === 'contacts_revealed' || b.status === 'accepted')
            ?.reduce((sum, b) => sum + (b.commission_amount || 0), 0) ?? 0;

        const lastRegs = [...(profiles || [])]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);

        const shippers = profiles?.filter(p => p.role === 'shipper') || [];
        const owners = profiles?.filter(p => p.role === 'owner') || [];
        const admins = profiles?.filter(p => p.role === 'admin') || [];
        const onboarded = profiles?.filter(p => p.name && p.name !== '—' && p.company && p.role !== 'demo') || [];
        const notOnboarded = profiles?.filter(p => !p.name || p.name === '—' || !p.company || p.role === 'demo') || [];

        const today = new Date(); today.setHours(0,0,0,0);
        const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
        const regsToday = profiles?.filter(p => new Date(p.created_at) >= today).length || 0;
        const regsWeek = profiles?.filter(p => new Date(p.created_at) >= weekAgo).length || 0;

        const madeRequest = new Set(requests?.map(r => r.shipperId) || []);
        const madeBid = new Set(bids?.map(b => b.ownerId) || []);
        const activeUsers = profiles?.filter(p => madeRequest.has(p.id) || madeBid.has(p.id)) || [];

        setBroadcastStats({
            shippers: shippers.length,
            owners: owners.length,
            admins: admins.length,
            onboarded: onboarded.length,
            notOnboarded: notOnboarded.length,
            regsToday,
            regsWeek,
            activeUsers: activeUsers.length,
            byRole: [
                { role: 'Грузовладельцы', count: shippers.length, color: 'text-blue-600' },
                { role: 'Владельцы вагонов', count: owners.length, color: 'text-purple-600' },
                { role: 'Админы', count: admins.length, color: 'text-amber-600' },
            ],
            allProfiles: profiles || [],
        });

        setStats({ totalUsers, tgUsers, bannedUsers, totalRequests, activeRequests, totalBids, completedDeals, revenue, lastRegs });
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

    const fetchUsers = async () => {
        setUsersLoading(true);
        const { data } = await supabase
            .from('profiles')
            .select('id, name, company, role, is_banned, is_verified, telegram_id, telegram_username, violation_count, created_at, chat_violations(count)')
            .order('created_at', { ascending: false })
            .limit(100);
        if (data) setUsers(data);
        setUsersLoading(false);
    };

    const fetchErrorLogs = async () => {
        setLogsLoading(true);
        const { data } = await supabase
            .from('error_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);
        if (data) setErrorLogs(data);
        setLogsLoading(false);
    };

    const handleBanUser = async (userId, ban) => {
        setUserActionResult(null);
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: ban, ...(ban ? {} : { violation_count: 0, chat_blocked_until: null }) })
            .eq('id', userId);
        if (error) {
            setUserActionResult({ success: false, error: error.message });
        } else {
            setUserActionResult({ success: true, message: ban ? 'Пользователь заблокирован' : 'Блокировка снята' });
            fetchUsers();
            fetchStats();
        }
    };

    const handleChangeRole = async (userId, role) => {
        setUserActionResult(null);
        const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
        if (error) {
            setUserActionResult({ success: false, error: error.message });
        } else {
            setUserActionResult({ success: true, message: `Роль изменена на ${role}` });
            fetchUsers();
        }
    };

    const handleResetViolations = async (userId) => {
        setUserActionResult(null);
        const { error } = await supabase
            .from('profiles')
            .update({ violation_count: 0, chat_blocked_until: null, sanction_level: null })
            .eq('id', userId);
        if (error) {
            setUserActionResult({ success: false, error: error.message });
        } else {
            setUserActionResult({ success: true, message: 'Нарушения сброшены' });
            fetchUsers();
        }
    };

    const handleDeleteAllRequests = async () => {
        if (!window.confirm('Удалить ВСЕ заявки? Это действие необратимо.')) return;
        setDeletingRequests(true);
        setDeleteResult(null);
        const { error, count } = await supabase
            .from('requests')
            .delete({ count: 'exact' })
            .neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
            setDeleteResult({ success: false, error: error.message });
        } else {
            setDeleteResult({ success: true, count });
            fetchStats();
        }
        setDeletingRequests(false);
    };

    const handleDeleteAllBids = async () => {
        if (!window.confirm('Удалить ВСЕ ставки и чаты? Это действие необратимо.')) return;
        setDeletingBids(true);
        setDeleteResult(null);
        const { error, count } = await supabase
            .from('bids')
            .delete({ count: 'exact' })
            .neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
            setDeleteResult({ success: false, error: error.message });
        } else {
            setDeleteResult({ success: true, count, type: 'bids' });
            fetchStats();
        }
        setDeletingBids(false);
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

    const handleNotionSync = async () => {
        setNotionSyncing(true);
        setNotionResult(null);
        try {
            const res = await supabase.functions.invoke('notion-sync-users', {
                body: { profiles: broadcastStats?.allProfiles || [] },
            });
            if (res.error) throw new Error(res.error.message);
            setNotionResult({ success: true, synced: res.data?.synced || 0 });
        } catch (err) {
            setNotionResult({ success: false, error: err.message });
        } finally {
            setNotionSyncing(false);
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

            {/* Broadcast Tracker */}
            {broadcastStats && (
                <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <h3 className="font-black uppercase tracking-widest text-sm dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-600" /> Трекер регистраций
                        </h3>
                        <div className="flex items-center gap-2">
                            {notionResult && (
                                <span className={`text-xs font-bold ${notionResult.success ? 'text-green-600' : 'text-red-500'}`}>
                                    {notionResult.success ? `Notion: ${notionResult.synced} синхр.` : notionResult.error}
                                </span>
                            )}
                            <button
                                onClick={handleNotionSync}
                                disabled={notionSyncing}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {notionSyncing ? 'Синхр...' : 'Notion'}
                            </button>
                        </div>
                    </div>
                    <div className="p-5 space-y-5">
                        {/* Quick stats row */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center">
                                <div className="text-lg font-black text-green-600">{broadcastStats.regsToday}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-green-600/70">Сегодня</div>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
                                <div className="text-lg font-black text-blue-600">{broadcastStats.regsWeek}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70">За неделю</div>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
                                <div className="text-lg font-black text-emerald-600">{broadcastStats.activeUsers}</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">Активных</div>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-center">
                                <div className="text-lg font-black text-amber-600">
                                    {stats?.totalUsers > 0 ? Math.round(broadcastStats.onboarded / stats.totalUsers * 100) : 0}%
                                </div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-amber-600/70">Конверсия</div>
                            </div>
                        </div>

                        {/* Roles breakdown */}
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">По ролям</div>
                            <div className="space-y-2">
                                {broadcastStats.byRole.map(r => (
                                    <div key={r.role} className="flex items-center gap-3">
                                        <span className="text-sm font-bold dark:text-white w-40 truncate">{r.role}</span>
                                        <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${
                                                    r.color === 'text-blue-600' ? 'bg-blue-500' :
                                                    r.color === 'text-purple-600' ? 'bg-purple-500' : 'bg-amber-500'
                                                }`}
                                                style={{ width: `${stats?.totalUsers > 0 ? (r.count / stats.totalUsers * 100) : 0}%` }}
                                            />
                                        </div>
                                        <span className={`text-sm font-black w-10 text-right ${r.color}`}>{r.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Onboarding status */}
                        <div>
                            <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Онбординг</div>
                            <div className="flex gap-3">
                                <div className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 flex items-center gap-3">
                                    <UserCheck className="w-8 h-8 text-green-500" />
                                    <div>
                                        <div className="text-xl font-black text-green-600">{broadcastStats.onboarded}</div>
                                        <div className="text-xs text-green-600/70 font-bold">Прошли</div>
                                    </div>
                                </div>
                                <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-xl p-4 flex items-center gap-3">
                                    <UserX className="w-8 h-8 text-red-400" />
                                    <div>
                                        <div className="text-xl font-black text-red-500">{broadcastStats.notOnboarded}</div>
                                        <div className="text-xs text-red-500/70 font-bold">Не прошли</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dev tools */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800/40 p-5">
                <h3 className="font-black uppercase tracking-widest text-sm text-red-700 dark:text-red-400 flex items-center gap-2 mb-3">
                    <Trash2 className="w-4 h-4" /> Dev tools
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                    {deleteResult && (
                        <span className={`text-sm font-bold ${deleteResult.success ? 'text-green-600' : 'text-red-600'}`}>
                            {deleteResult.success
                                ? `Удалено ${deleteResult.count} ${deleteResult.type === 'bids' ? 'ставок' : 'заявок'}`
                                : deleteResult.error}
                        </span>
                    )}
                    <button
                        onClick={handleDeleteAllRequests}
                        disabled={deletingRequests}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        {deletingRequests ? 'Удаление...' : 'Все заявки'}
                    </button>
                    <button
                        onClick={handleDeleteAllBids}
                        disabled={deletingBids}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        {deletingBids ? 'Удаление...' : 'Все ставки'}
                    </button>
                </div>
            </div>

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
                                        <div className="text-sm font-bold dark:text-white">{p.name || '—'}</div>
                                        <div className="text-xs text-slate-400">{p.company || p.role}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.telegram_id && (
                                        <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full font-bold">TG</span>
                                    )}
                                    {p.is_banned && (
                                        <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full font-bold">БАН</span>
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

            {/* Users list */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 flex-wrap">
                    <h3 className="font-black uppercase tracking-widest text-sm dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" /> Пользователи
                        {!usersLoading && <span className="text-slate-400 font-normal normal-case tracking-normal">({users.length})</span>}
                    </h3>
                    <div className="flex items-center gap-2">
                        {userActionResult && (
                            <span className={`text-xs font-bold ${userActionResult.success ? 'text-green-600' : 'text-red-500'}`}>
                                {userActionResult.success ? userActionResult.message : userActionResult.error}
                            </span>
                        )}
                        <button onClick={fetchUsers} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={userSearch}
                            onChange={e => setUserSearch(e.target.value)}
                            placeholder="Поиск по имени или компании..."
                            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        />
                    </div>
                </div>
                {usersLoading ? (
                    <div className="p-5 text-center text-sm text-slate-400">Загрузка...</div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-96 overflow-y-auto">
                        {users
                            .filter(u => {
                                const q = userSearch.toLowerCase();
                                return !q || (u.name || '').toLowerCase().includes(q) || (u.company || '').toLowerCase().includes(q);
                            })
                            .map(u => (
                                <div key={u.id} className="px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                                            u.is_banned ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                                        }`}>
                                            {u.role === 'shipper' ? 'Г' : u.role === 'owner' ? 'В' : u.role === 'admin' ? 'А' : u.role === 'developer' ? 'Д' : '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold dark:text-white truncate flex items-center gap-1.5">
                                                {u.name || '—'}
                                                {u.violation_count > 0 && (
                                                    <span className="text-[10px] text-amber-500 font-bold">{u.violation_count} нар.</span>
                                                )}
                                                {(u.chat_violations?.[0]?.count ?? 0) > 0 && (
                                                    <button
                                                        onClick={() => setViolationsFor(u.id)}
                                                        className="inline-flex items-center rounded bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400 hover:bg-red-200 transition-colors"
                                                    >
                                                        {u.chat_violations[0].count} блок.
                                                    </button>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400 truncate">{u.company || '—'}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                        {u.telegram_id && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">TG</span>}
                                        {u.is_banned && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">БАН</span>}
                                        <select
                                            value={u.role}
                                            onChange={e => handleChangeRole(u.id, e.target.value)}
                                            disabled={u.id === sbUser?.id}
                                            className="text-xs border border-slate-200 dark:border-slate-600 rounded-lg px-1.5 py-1 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none"
                                        >
                                            <option value="owner">Владелец</option>
                                            <option value="shipper">Грузовладелец</option>
                                            <option value="admin">Админ</option>
                                            <option value="developer">Разработчик</option>
                                        </select>
                                        {u.violation_count > 0 && (
                                            <button
                                                onClick={() => handleResetViolations(u.id)}
                                                className="text-[10px] text-amber-600 hover:text-amber-700 font-bold border border-amber-300 dark:border-amber-700 px-2 py-1 rounded-lg transition-colors"
                                            >
                                                Сбросить
                                            </button>
                                        )}
                                        {u.id !== sbUser?.id && (
                                            <button
                                                onClick={() => handleBanUser(u.id, !u.is_banned)}
                                                className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                                                    u.is_banned
                                                        ? 'text-green-600 border-green-300 dark:border-green-700 hover:bg-green-50'
                                                        : 'text-red-600 border-red-300 dark:border-red-700 hover:bg-red-50'
                                                }`}
                                            >
                                                {u.is_banned ? <><Shield className="w-3 h-3" /> Разбан</> : <><ShieldOff className="w-3 h-3" /> Бан</>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* Error logs */}
            <div className="bg-white dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-black uppercase tracking-widest text-sm dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Логи ошибок
                    </h3>
                    <button onClick={fetchErrorLogs} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
                {logsLoading ? (
                    <div className="p-5 text-center text-sm text-slate-400">Загрузка...</div>
                ) : errorLogs.length === 0 ? (
                    <div className="p-5 text-center text-sm text-slate-400">Ошибок нет</div>
                ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-80 overflow-y-auto">
                        {errorLogs.map(log => (
                            <div key={log.id} className="px-5 py-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-red-500 uppercase tracking-widest">{log.error_type || 'error'}</div>
                                        <div className="text-sm dark:text-white mt-0.5 break-words">{log.message}</div>
                                        {log.user_id && <div className="text-[10px] text-slate-400 mt-1">user: {log.user_id.slice(0, 8)}...</div>}
                                    </div>
                                    <div className="text-[10px] text-slate-400 shrink-0">
                                        {new Date(log.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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

        {violationsFor && (
            <ViolationsModal
                supabase={supabase}
                userId={violationsFor}
                isDark={isDark}
                onClose={() => setViolationsFor(null)}
            />
        )}
    );
}

function ViolationsModal({ supabase, userId, isDark, onClose }) {
    const [rows, setRows] = useState([]);

    useEffect(() => {
        supabase
            .from('chat_violations')
            .select('id, detector, severity, snippet, created_at, match_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .then(({ data }) => setRows(data ?? []));
    }, [userId]);

    const severityColor = { high: 'text-red-600', medium: 'text-amber-500', low: 'text-slate-400' };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onClose}
        >
            <div
                className={`max-h-[80vh] w-[640px] overflow-auto rounded-2xl shadow-xl p-5 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}
                onClick={e => e.stopPropagation()}
            >
                <h2 className="mb-4 text-base font-black uppercase tracking-widest">Нарушения пользователя</h2>
                {rows.length === 0
                    ? <p className="text-sm text-slate-400">Нет заблокированных сообщений</p>
                    : (
                        <ul className="space-y-2">
                            {rows.map(r => (
                                <li key={r.id} className={`rounded-xl border p-3 text-sm ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-bold ${severityColor[r.severity] ?? 'text-slate-500'}`}>{r.detector}</span>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(r.created_at).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`text-xs break-words ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{r.snippet}</div>
                                    <div className="text-[10px] text-slate-400 mt-1">bid {String(r.match_id).slice(0, 8)}</div>
                                </li>
                            ))}
                        </ul>
                    )
                }
            </div>
        </div>
    );
}
