import React from 'react';
import { MapPin, Package, TrainFront, ArrowRight, ShieldCheck, Clock, FileText, Settings, MessageSquare, CreditCard, Sparkles } from 'lucide-react';

export default function UserDashboard({ userProfile, onLogout, setView }) {
    const getDashboardStats = () => {
        const stats = [];
        
        if (userProfile.role === 'shipper') {
            stats.push({
                icon: <Package className="w-8 h-8" />,
                title: 'Активные заявки',
                value: '12',
                color: 'bg-blue-100 dark:bg-blue-900/20',
                trend: 'up',
                trendColor: 'text-emerald-600'
            });
            
            stats.push({
                icon: <TrainFront className="w-8 h-8" />,
                title: 'Выполнено рейсов',
                value: '87',
                color: 'bg-emerald-100 dark:bg-emerald-900/20',
                trend: 'up',
                trendColor: 'text-emerald-600'
            });
            
            stats.push({
                icon: <Clock className="w-8 h-8" />,
                title: 'Среднее время',
                value: '3.2 дня',
                color: 'bg-purple-100 dark:bg-purple-900/20',
                trend: 'stable',
                trendColor: 'text-slate-400'
            });
            
            stats.push({
                icon: <FileText className="w-8 h-8" />,
                title: 'Документы',
                value: '24',
                color: 'bg-orange-100 dark:bg-orange-900/20',
                trend: 'new',
                trendColor: 'text-orange-600'
            });
        } else if (userProfile.role === 'owner') {
            stats.push({
                icon: <TrainFront className="w-8 h-8" />,
                title: 'Активные вагоны',
                value: '48',
                color: 'bg-blue-100 dark:bg-blue-900/20',
                trend: 'up',
                trendColor: 'text-emerald-600'
            });
            
            stats.push({
                icon: <MapPin className="w-8 h-8" />,
                title: 'Маршруты',
                value: '156',
                color: 'bg-emerald-100 dark:bg-emerald-900/20',
                trend: 'up',
                trendColor: 'text-emerald-600'
            });
            
            stats.push({
                icon: <Clock className="w-8 h-8" />,
                title: 'Средний простой',
                value: '12 часов',
                color: 'bg-purple-100 dark:bg-purple-900/20',
                trend: 'down',
                trendColor: 'text-red-600'
            });
            
            stats.push({
                icon: <Sparkles className="w-8 h-8" />,
                title: 'Рейтинг',
                value: '⭐ 4.8',
                color: 'bg-yellow-100 dark:bg-yellow-900/20',
                trend: 'up',
                trendColor: 'text-emerald-600'
            });
        }
        
        return stats;
    };

    const getQuickActions = () => {
        const actions = [];

        if (userProfile.role === 'shipper') {
            actions.push({
                title: 'Создать заявку',
                icon: <Package className="w-6 h-6" />,
                color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
                action: () => setView('create')
            });

            actions.push({
                title: 'Мои заявки',
                icon: <FileText className="w-6 h-6" />,
                color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
                action: () => setView('my-requests')
            });
        } else if (userProfile.role === 'owner') {
            actions.push({
                title: 'Флот онлайн',
                icon: <TrainFront className="w-6 h-6" />,
                color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
                action: () => setView('fleet')
            });

            actions.push({
                title: 'Мои ставки',
                icon: <MessageSquare className="w-6 h-6" />,
                color: 'bg-gradient-to-r from-emerald-500 to-teal-500',
                action: () => setView('my-bids')
            });
        }

        return actions;
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white dark:bg-[#111827] rounded-[3rem] p-8 border dark:border-slate-800 shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-black dark:text-white mb-2">Добро пожаловать, {userProfile.company}</h2>
                        <p className="text-sm font-medium text-slate-400 dark:text-slate-500">
                            {userProfile.role === 'shipper' ? 'Грузоотправитель' : 'Владелец вагонов'}
                        </p>
                    </div>
                    <button 
                        onClick={onLogout} 
                        className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                    >
                        <span className="text-sm font-medium">Выйти</span>
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {getDashboardStats().map((stat, index) => (
                        <div key={index} className={`p-5 rounded-2xl transition-all hover:shadow-lg ${stat.color}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 dark:bg-slate-700 flex items-center justify-center">
                                    {stat.icon}
                                </div>
                                {stat.trend === 'up' && (
                                    <div className="text-xs text-emerald-500 font-bold flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 0014 0l-.548.547a4 4 0 00-5.684-.547l-.548-.548a4 4 0 00-5.684 5.684l-.548.548a7 7 0 004.133 4.133l-.548.547a4 4 0 00-5.684.547l-.548-.547a4 4 0 00-5.684 5.684l-.548.548z" clipRule="evenodd" />
                                        </svg>
                                        +12%
                                    </div>
                                )}
                                {stat.trend === 'down' && (
                                    <div className="text-xs text-red-500 font-bold flex items-center">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 0014 0l-.548.547a4 4 0 00-5.684-.547l-.548-.548a4 4 0 00-5.684 5.684l-.548.548a7 7 0 004.133 4.133l-.548.547a4 4 0 00-5.684.547l-.548-.547a4 4 0 00-5.684 5.684l-.548.548z" clipRule="evenodd" />
                                        </svg>
                                        -8%
                                    </div>
                                )}
                                {stat.trend === 'stable' && (
                                    <div className="text-xs text-slate-400 font-bold">—</div>
                                )}
                                {stat.trend === 'new' && (
                                    <div className="text-xs text-orange-500 font-bold">
                                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 2a1 1 0 000 2h2a1 1 0 000-2H9z" />
                                            <path d="M4 4h7a1 1 0 00.781.625l4.834 4.834a1 1 0 101.422 1.422L13 10.5V13h1a1 1 0 00.364.848l3.413 4.95a1 1 0 01-.929 1.697H3.5a1 1 0 01-.929-.697l-3.413-4.95a1 1 0 00-.069-.195v-4a1 1 0 00-1-1h-2a1 1 0 00-1 1v7h3v2H2v-7a3 3 0 013-3z" />
                                        </svg>
                                        NEW
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-2xl font-black dark:text-white mb-1">{stat.value}</p>
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.title}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 pt-6 border-t border-slate-50 dark:border-slate-800/50">
                    <h3 className="text-xl font-black dark:text-white mb-6">Быстрые действия</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {getQuickActions().map((action, index) => (
                            <button
                                key={index}
                                onClick={action.action}
                                className="p-6 rounded-2xl bg-white dark:bg-[#111827] border dark:border-slate-800 shadow-sm hover:shadow-lg transition-all"
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${action.color}`}>
                                    {action.icon}
                                </div>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                    {action.title}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="mt-8 bg-white dark:bg-[#111827] rounded-[3rem] p-8 border dark:border-slate-800 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black dark:text-white">Последняя активность</h3>
                    <button className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        Посмотреть все
                    </button>
                </div>
                
                <div className="space-y-4">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 2a1 1 0 000 2h2a1 1 0 000-2H9z" />
                                        <path d="M4 4h7a1 1 0 00.781.625l4.834 4.834a1 1 0 101.422 1.422L13 10.5V13h1a1 1 0 00.364.848l3.413 4.95a1 1 0 01-.929 1.697H3.5a1 1 0 01-.929-.697l-3.413-4.95a1 1 0 00-.069-.195v-4a1 1 0 00-1-1h-2a1 1 0 00-1 1v7h3v2H2v-7a3 3 0 013-3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-slate-600 dark:text-slate-300">Новая заявка создана</p>
                                    <p className="text-sm text-slate-400 dark:text-slate-500">"Москва - Санкт-Петербург"</p>
                                </div>
                            </div>
                            <div className="text-sm text-slate-400 dark:text-slate-500">2 часа назад</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}