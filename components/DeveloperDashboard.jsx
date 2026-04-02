import React, { useState, useEffect, useCallback } from 'react';
import {
    Code2, Users, FileText, AlertTriangle, CheckCircle,
    Activity, RefreshCw, Trash2, Search, Shield, Plus,
    X, ChevronDown, Clock, MessageSquare, TrendingUp,
    AlertCircle, UserPlus, Eye, Ban, Database, Zap
} from 'lucide-react';

const ROLE_LABELS = {
    shipper: 'Отправитель',
    owner: 'Владелец',
    developer: 'Разработчик',
    demo: 'Гость',
};

const ERROR_TYPE_LABELS = {
    js_error: 'JS Ошибка',
    api_error: 'API Ошибка',
    auth_error: 'Ошибка Auth',
    manual: 'Вручную',
};

const ERROR_TYPE_COLORS = {
    js_error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    api_error: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    auth_error: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    manual: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

function StatCard({ icon: Icon, label, value, sub, color = 'blue', loading }) {
    const colors = {
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
        emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/20',
        red: 'from-red-500 to-red-600 shadow-red-500/20',
        indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20',
        violet: 'from-violet-500 to-violet-600 shadow-violet-500/20',
    };
    return (
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                {sub && <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sub}</span>}
            </div>
            <div className="text-3xl font-black dark:text-white mb-1">
                {loading ? <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" /> : value}
            </div>
            <div className="text-sm font-bold text-slate-500">{label}</div>
        </div>
    );
}

export default function DeveloperDashboard({ user, supabase }) {
    const [stats, setStats] = useState(null);
    const [errorLogs, setErrorLogs] = useState([]);
    const [developers, setDevelopers] = useState([]);
    const [allProfiles, setAllProfiles] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorFilter, setErrorFilter] = useState('all');
    const [addEmail, setAddEmail] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [addMsg, setAddMsg] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all data in parallel
            const [
                profilesRes,
                requestsRes,
                bidsRes,
                messagesRes,
                errorLogsRes,
            ] = await Promise.all([
                supabase.from('profiles').select('id, name, company, role, created_at, email, verification_status'),
                supabase.from('requests').select('id, status, created_at'),
                supabase.from('bids').select('id, status, created_at'),
                supabase.from('messages').select('id, created_at'),
                supabase.from('error_logs').select('*, profiles(name, company)').order('created_at', { ascending: false }).limit(100),
            ]);

            const profiles = profilesRes.data || [];
            const requests = requestsRes.data || [];
            const bids = bidsRes.data || [];
            const messages = messagesRes.data || [];
            const errors = errorLogsRes.data || [];

            // Compute stats
            const now = new Date();
            const today = new Date(now); today.setHours(0, 0, 0, 0);
            const week = new Date(now); week.setDate(week.getDate() - 7);
            const month = new Date(now); month.setDate(week.getDate() - 30);

            const newToday = profiles.filter(p => new Date(p.created_at) >= today).length;
            const newWeek = profiles.filter(p => new Date(p.created_at) >= week).length;
            const newMonth = profiles.filter(p => new Date(p.created_at) >= month).length;

            const errorsToday = errors.filter(e => new Date(e.created_at) >= today).length;

            const roleDistribution = profiles.reduce((acc, p) => {
                acc[p.role] = (acc[p.role] || 0) + 1;
                return acc;
            }, {});

            setStats({
                totalUsers: profiles.length,
                activeRequests: requests.filter(r => r.status === 'open').length,
                completedDeals: bids.filter(b => b.status === 'accepted').length,
                totalMessages: messages.length,
                errorsToday,
                newToday,
                newWeek,
                newMonth,
                roleDistribution,
            });

            setAllProfiles(profiles);
            setDevelopers(profiles.filter(p => p.role === 'developer'));
            setErrorLogs(errors);

            // Recent activity: last 20 requests + bids combined
            const reqActivity = (requestsRes.data || []).slice(-20).map(r => ({
                id: r.id,
                type: 'request',
                label: 'Новая заявка',
                time: r.created_at,
                status: r.status,
            }));
            const bidActivity = (bidsRes.data || []).slice(-20).map(b => ({
                id: b.id,
                type: 'bid',
                label: 'Новая ставка',
                time: b.created_at,
                status: b.status,
            }));
            const combined = [...reqActivity, ...bidActivity]
                .sort((a, b) => new Date(b.time) - new Date(a.time))
                .slice(0, 20);
            setRecentActivity(combined);
        } catch (e) {
            console.error('Dev dashboard fetch error:', e);
        } finally {
            setLoading(false);
            setLastRefresh(new Date());
        }
    }, [supabase]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddDeveloper = async () => {
        if (!addEmail.trim()) return;
        setAddLoading(true);
        setAddMsg(null);
        try {
            // Find profile by email
            const { data: found } = await supabase
                .from('profiles')
                .select('id, name, company, role, email')
                .eq('email', addEmail.trim().toLowerCase())
                .single();

            if (!found) {
                setAddMsg({ type: 'error', text: 'Пользователь с таким email не найден' });
                return;
            }
            if (found.role === 'developer') {
                setAddMsg({ type: 'warn', text: `${found.company || found.name} уже является разработчиком` });
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .update({ role: 'developer' })
                .eq('id', found.id);

            if (error) throw error;

            setAddMsg({ type: 'success', text: `${found.company || found.name} назначен разработчиком` });
            setAddEmail('');
            fetchData();
        } catch (e) {
            setAddMsg({ type: 'error', text: e.message || 'Ошибка при добавлении' });
        } finally {
            setAddLoading(false);
        }
    };

    const handleRevokeDeveloper = async (devId, devName) => {
        if (!window.confirm(`Отозвать доступ у ${devName}? Их роль будет изменена на 'owner'.`)) return;
        try {
            await supabase.from('profiles').update({ role: 'owner' }).eq('id', devId);
            fetchData();
        } catch (e) {
            console.error('Revoke error:', e);
        }
    };

    const handleClearOldErrors = async () => {
        if (!window.confirm('Удалить ошибки старше 7 дней?')) return;
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        try {
            await supabase.from('error_logs').delete().lt('created_at', cutoff.toISOString());
            fetchData();
        } catch (e) {
            console.error('Clear errors error:', e);
        }
    };

    const filteredErrors = errorFilter === 'all'
        ? errorLogs
        : errorLogs.filter(e => e.error_type === errorFilter);

    const formatTime = (ts) => {
        if (!ts) return '—';
        const d = new Date(ts);
        return d.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const tabs = [
        { id: 'overview', label: 'Обзор', icon: Activity },
        { id: 'errors', label: 'Ошибки', icon: AlertTriangle },
        { id: 'developers', label: 'Разработчики', icon: Code2 },
        { id: 'users', label: 'Пользователи', icon: Users },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Code2 className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-black dark:text-white tracking-tight">Dev Panel</h1>
                        <span className="px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-black uppercase tracking-widest rounded-full">
                            Internal
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium ml-13">
                        Панель мониторинга · Обновлено {formatTime(lastRefresh)}
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-slate-600 dark:text-slate-300 hover:text-violet-700 dark:hover:text-violet-400 rounded-2xl font-bold text-sm transition-all border border-transparent hover:border-violet-200 dark:hover:border-violet-800"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Обновить
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                : 'bg-white dark:bg-[#111827] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                            {tab.id === 'errors' && stats?.errorsToday > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-[10px] font-black rounded-full">
                                    {stats.errorsToday}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── TAB: OVERVIEW ── */}
            {activeTab === 'overview' && (
                <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard icon={Users} label="Всего пользователей" value={stats?.totalUsers ?? 0} color="blue" loading={loading} />
                        <StatCard icon={FileText} label="Активных заявок" value={stats?.activeRequests ?? 0} color="emerald" loading={loading} />
                        <StatCard icon={CheckCircle} label="Завершённых сделок" value={stats?.completedDeals ?? 0} color="indigo" loading={loading} />
                        <StatCard icon={AlertTriangle} label="Ошибок сегодня" value={stats?.errorsToday ?? 0} color={stats?.errorsToday > 0 ? 'red' : 'orange'} loading={loading} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* User Growth */}
                        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Прирост пользователей
                            </h3>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Сегодня', value: stats?.newToday ?? 0, color: 'text-emerald-600 dark:text-emerald-400' },
                                    { label: 'За 7 дней', value: stats?.newWeek ?? 0, color: 'text-blue-600 dark:text-blue-400' },
                                    { label: 'За 30 дней', value: stats?.newMonth ?? 0, color: 'text-indigo-600 dark:text-indigo-400' },
                                ].map(item => (
                                    <div key={item.label} className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                        <div className={`text-2xl font-black ${item.color}`}>{loading ? '—' : item.value}</div>
                                        <div className="text-xs font-bold text-slate-500 mt-1">{item.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Role Distribution */}
                        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Роли пользователей
                            </h3>
                            <div className="space-y-3">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <div key={i} className="h-8 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                                    ))
                                ) : (
                                    Object.entries(stats?.roleDistribution || {}).map(([role, count]) => {
                                        const total = stats?.totalUsers || 1;
                                        const pct = Math.round((count / total) * 100);
                                        const barColors = {
                                            shipper: 'bg-blue-500',
                                            owner: 'bg-emerald-500',
                                            developer: 'bg-violet-500',
                                            demo: 'bg-slate-400',
                                        };
                                        return (
                                            <div key={role} className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-slate-500 w-24 shrink-0">{ROLE_LABELS[role] || role}</span>
                                                <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${barColors[role] || 'bg-slate-500'} transition-all duration-700`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-black dark:text-white w-8 text-right">{count}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                            <Activity className="w-4 h-4" /> Последняя активность
                        </h3>
                        {loading ? (
                            <div className="space-y-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                                ))}
                            </div>
                        ) : recentActivity.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 font-bold">Нет активности</div>
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {recentActivity.map(item => (
                                    <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'request'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                            }`}>
                                            {item.type === 'request' ? <FileText className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-bold dark:text-white">{item.label}</span>
                                            <span className="ml-2 text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full font-bold">{item.status}</span>
                                        </div>
                                        <span className="text-xs text-slate-400 font-medium shrink-0">{formatTime(item.time)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: ERRORS ── */}
            {activeTab === 'errors' && (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap gap-2">
                            {['all', 'js_error', 'api_error', 'auth_error', 'manual'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setErrorFilter(type)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${errorFilter === type
                                        ? 'bg-red-600 text-white shadow-md shadow-red-500/20'
                                        : 'bg-white dark:bg-[#111827] text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-red-300'
                                        }`}
                                >
                                    {type === 'all' ? 'Все' : ERROR_TYPE_LABELS[type]}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={handleClearOldErrors}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs transition-all border border-red-200 dark:border-red-800"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Очистить старые (7+ дней)
                        </button>
                    </div>

                    <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="p-8 space-y-3">
                                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                            </div>
                        ) : filteredErrors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                <CheckCircle className="w-12 h-12 mb-3 text-emerald-500" />
                                <span className="font-bold text-lg dark:text-white">Ошибок нет</span>
                                <span className="text-sm mt-1">Всё работает исправно</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                                {filteredErrors.map(err => (
                                    <div key={err.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="flex flex-col items-start gap-2 shrink-0 min-w-[120px]">
                                                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${ERROR_TYPE_COLORS[err.error_type] || ERROR_TYPE_COLORS.manual}`}>
                                                    {ERROR_TYPE_LABELS[err.error_type] || err.error_type}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(err.created_at)}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold dark:text-white break-words">{err.message || '(без сообщения)'}</p>
                                                {err.url && (
                                                    <p className="text-[11px] text-slate-400 mt-1 truncate">{err.url}</p>
                                                )}
                                                {err.profiles && (
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                                        Пользователь: {err.profiles.company || err.profiles.name || '—'}
                                                    </p>
                                                )}
                                                {err.stack && (
                                                    <details className="mt-2">
                                                        <summary className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300 font-bold uppercase tracking-wider">Stack trace</summary>
                                                        <pre className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl p-3 overflow-x-auto max-h-40">{err.stack}</pre>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: DEVELOPERS ── */}
            {activeTab === 'developers' && (
                <div className="space-y-6">
                    {/* Add Developer Form */}
                    <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-5 flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Добавить разработчика
                        </h3>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="email"
                                    value={addEmail}
                                    onChange={e => setAddEmail(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddDeveloper()}
                                    placeholder="Email пользователя..."
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-medium focus:outline-none focus:border-violet-400 dark:focus:border-violet-600 dark:text-white placeholder:text-slate-400 transition-colors"
                                />
                            </div>
                            <button
                                onClick={handleAddDeveloper}
                                disabled={addLoading || !addEmail.trim()}
                                className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-violet-500/20"
                            >
                                <Plus className="w-4 h-4" />
                                {addLoading ? 'Поиск...' : 'Добавить'}
                            </button>
                        </div>

                        {addMsg && (
                            <div className={`mt-3 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 ${addMsg.type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : addMsg.type === 'warn'
                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                                }`}>
                                {addMsg.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                                {addMsg.text}
                                <button onClick={() => setAddMsg(null)} className="ml-auto hover:opacity-70 transition-opacity">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Developers List */}
                    <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Shield className="w-4 h-4" /> Разработчики ({developers.length})
                            </h3>
                        </div>
                        {loading ? (
                            <div className="p-6 space-y-3">
                                {[1, 2].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                            </div>
                        ) : developers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Code2 className="w-10 h-10 mb-3" />
                                <span className="font-bold">Нет разработчиков</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {developers.map(dev => (
                                    <div key={dev.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="w-10 h-10 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center font-bold text-violet-700 dark:text-violet-400 shrink-0">
                                            {(dev.company || dev.name || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold dark:text-white truncate">{dev.company || dev.name || '—'}</div>
                                            <div className="text-xs text-slate-400 font-medium">{dev.email || '—'}</div>
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2.5 py-1 rounded-full">
                                            Dev
                                        </span>
                                        {dev.id !== user?.id && (
                                            <button
                                                onClick={() => handleRevokeDeveloper(dev.id, dev.company || dev.name)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                title="Отозвать доступ"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TAB: USERS ── */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <Database className="w-4 h-4" /> Все пользователи ({allProfiles.length})
                        </h3>
                    </div>
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                            {allProfiles.map(p => {
                                const badgeColors = {
                                    shipper: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
                                    owner: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
                                    developer: 'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
                                    demo: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
                                };
                                const verBadge = {
                                    verified: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
                                    pending: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
                                    unverified: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
                                };
                                return (
                                    <div key={p.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm shrink-0">
                                            {(p.company || p.name || '?')[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold dark:text-white truncate">{p.company || p.name || '—'}</div>
                                            <div className="text-[11px] text-slate-400">{formatTime(p.created_at)}</div>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${badgeColors[p.role] || badgeColors.demo}`}>
                                            {ROLE_LABELS[p.role] || p.role}
                                        </span>
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg hidden sm:block ${verBadge[p.verification_status] || verBadge.unverified}`}>
                                            {p.verification_status === 'verified' ? 'Верифицирован' : p.verification_status === 'pending' ? 'На проверке' : 'Не верифицирован'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
