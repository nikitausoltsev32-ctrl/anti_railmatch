import React, { useState } from 'react';
import { ShieldCheck, Settings, Bot, Users, FileText, Upload, Check, X, Mail, Phone, Building2, User, CreditCard, ArrowRight, Clock } from 'lucide-react';
import { supabase } from '../src/supabaseClient';

export default function ProfileSettings({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState('general');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    const handleFileDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...droppedFiles]);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);
        try {
            const filenames = files.map(f => f.name);
            const { error } = await supabase
                .from('profiles')
                .update({
                    verification_status: 'pending',
                    documents: filenames
                })
                .eq('id', user.id);

            if (error) throw error;

            alert("Документы отправлены на проверку. Срок обработки: 24 часа.");
            setFiles([]);
            // UI will update via parent state after Supabase notification or prop change
        } catch (err) {
            console.error("Verification submit error:", err);
            alert("Ошибка при отправке документов");
        } finally {
            setUploading(false);
        }
    };

    // Мок команды (в будущем запрос к БД)
    const teamMembers = [
        { id: 1, name: "Алексей Логистов", email: "alex@example.com", role: "Админ", status: "online" },
        { id: 2, name: "Мария Сбыт", email: "mariya@example.com", role: "Логист", status: "offline" }
    ];

    return (
        <div className="max-w-6xl mx-auto py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Левая колонка: Профиль и Навигация */}
                <div className="w-full md:w-80 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-10 shadow-sm border dark:border-slate-800 text-center relative overflow-hidden group">
                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm ${user.verification_status === 'verified' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                                user.verification_status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                    'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}>
                            {user.verification_status === 'verified' ? <ShieldCheck className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            {user.verification_status === 'verified' ? 'Верифицирован' : user.verification_status === 'pending' ? 'В проверке' : 'Не проверен'}
                        </div>
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[2rem] flex items-center justify-center text-3xl font-black mx-auto mb-6 mt-6 shadow-xl group-hover:scale-110 transition-transform duration-500">
                            {user.company?.[0] || 'RM'}
                        </div>
                        <h2 className="text-2xl font-black dark:text-white uppercase tracking-tight">{user.company}</h2>
                        <p className="text-blue-600 font-bold uppercase tracking-widest text-[10px] mt-2 flex items-center justify-center gap-2">
                            <Building2 className="w-3 h-3" /> ИНН: {user.inn}
                        </p>
                        <button onClick={onLogout} className="w-full mt-10 py-4 border border-red-100 dark:border-red-900/30 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-50 dark:hover:bg-red-950/30 transition-all active:scale-95">Выйти из системы</button>
                    </div>

                    <div className="bg-white dark:bg-[#111827] rounded-[2rem] border dark:border-slate-800 p-2 shadow-sm">
                        <button onClick={() => setActiveTab('general')} className={`w-full p-4 text-left rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-4 transition-all ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-blue-600'}`}>
                            <Settings className="w-5 h-5" /> Общие данные
                        </button>
                        <button onClick={() => setActiveTab('team')} className={`w-full p-4 text-left rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-4 transition-all ${activeTab === 'team' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-blue-600'}`}>
                            <Users className="w-5 h-5" /> Команда
                        </button>
                        <button onClick={() => setActiveTab('notif')} className={`w-full p-4 text-left rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-4 transition-all ${activeTab === 'notif' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-blue-600'}`}>
                            <Bot className="w-5 h-5" /> Уведомления
                        </button>
                        {user.role === 'owner' && (
                            <button onClick={() => setActiveTab('billing')} className={`w-full p-4 text-left rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-4 transition-all ${activeTab === 'billing' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-blue-600'}`}>
                                <CreditCard className="w-5 h-5" /> Биллинг
                            </button>
                        )}
                    </div>
                </div>

                {/* Правая колонка: Контент */}
                <div className="flex-1 space-y-6">
                    {activeTab === 'general' && (
                        <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-10 border dark:border-slate-800 shadow-sm">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">Верификация компании</h3>
                                {user.role === 'owner' && (
                                    <div className="px-5 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">Тариф: {user.plan}</div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                <div className="space-y-1.5 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Основной ИНН</p>
                                    <p className="text-xl font-black dark:text-white">{user.inn}</p>
                                </div>
                                <div className="space-y-1.5 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Телефон организации</p>
                                    <p className="text-xl font-black dark:text-white">{user.phone || 'Не указан'}</p>
                                </div>
                            </div>

                            <div className="border-t dark:border-slate-800 pt-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    <h4 className="font-black text-sm uppercase tracking-widest dark:text-white">Загрузка документов (ЕГРЮЛ / ОГРН)</h4>
                                </div>

                                {user.verification_status === 'pending' ? (
                                    <div className="p-10 bg-orange-50 dark:bg-orange-900/10 border-2 border-dashed border-orange-200 dark:border-orange-800 rounded-[2rem] text-center">
                                        <Clock className="w-12 h-12 text-orange-400 mx-auto mb-4 animate-pulse" />
                                        <p className="text-orange-600 dark:text-orange-400 font-bold">Ваши документы находятся на проверке</p>
                                        <p className="text-[10px] text-orange-400 font-black uppercase tracking-widest mt-2">Ожидаемое время подтверждения: до 24 часов</p>
                                    </div>
                                ) : user.verification_status === 'verified' ? (
                                    <div className="p-10 bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-200 dark:border-emerald-800 rounded-[2rem] text-center">
                                        <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">Компания успешно верифицирована</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Теперь ваши заявки будут отмечены специальным знаком доверия.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleFileDrop}
                                            className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] text-center group hover:border-blue-400 transition-all cursor-pointer bg-slate-50/50 dark:bg-transparent"
                                        >
                                            <Upload className="w-12 h-12 text-slate-300 mx-auto mb-4 group-hover:text-blue-500 transition-colors" />
                                            <p className="text-slate-500 dark:text-slate-400 font-bold mb-2">Перетащите PDF файлы сюда или нажмите для выбора</p>
                                            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">Макс. размер 10МБ • Формат PDF, JPG</p>
                                        </div>

                                        {files.length > 0 && (
                                            <div className="mt-8 space-y-3">
                                                {files.map((f, i) => (
                                                    <div key={i} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in slide-in-from-left-4">
                                                        <div className="flex items-center gap-3">
                                                            <FileText className="w-5 h-5 text-blue-600" />
                                                            <span className="text-sm font-bold dark:text-white">{f.name}</span>
                                                        </div>
                                                        <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={handleUpload}
                                                    disabled={uploading}
                                                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                                                >
                                                    {uploading ? 'Отправка...' : 'Отправить на проверку'}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'team' && (
                        <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-10 border dark:border-slate-800 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">Логисты компании</h3>
                                <button className="px-5 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all active:scale-95">+ Добавить сотрудника</button>
                            </div>

                            <div className="space-y-4">
                                {teamMembers.map(member => (
                                    <div key={member.id} className="p-6 bg-slate-50 dark:bg-[#0B1120] rounded-[2rem] border dark:border-slate-800 flex items-center justify-between group hover:border-blue-200 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border dark:border-slate-700 shadow-sm relative">
                                                <User className="w-7 h-7 text-slate-400" />
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#0B1120] ${member.status === 'online' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            </div>
                                            <div>
                                                <div className="font-black dark:text-white flex items-center gap-2">
                                                    {member.name}
                                                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md text-[8px] font-black uppercase tracking-widest">{member.role}</span>
                                                </div>
                                                <div className="text-xs text-slate-400 font-bold mt-1.5 flex items-center gap-4">
                                                    <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {member.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-3 text-slate-300 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"><Settings className="w-5 h-5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notif' && (
                        <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-10 border dark:border-slate-800 shadow-sm">
                            <h3 className="text-2xl font-black mb-6 dark:text-white uppercase tracking-tight">Telegram Уведомления</h3>
                            <p className="text-slate-400 mb-10 font-medium">Подключите официального бота RailMatch, чтобы мгновенно получать уведомления о новых ставках, сообщениях в чате и изменении статуса ваших документов.</p>

                            <div className="bg-slate-50 dark:bg-[#0B1120] rounded-3xl p-10 border-2 border-dashed border-blue-100 dark:border-blue-900/30 text-center relative overflow-hidden">
                                <Bot className="w-20 h-20 text-blue-100 dark:text-blue-900/20 absolute -top-4 -right-4 rotate-12" />
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4">Ваш уникальный код</p>
                                <div className="text-4xl font-black dark:text-white tracking-[0.5em] mb-10">CODE-881-22</div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-blue-500/40 transition-all">Копировать код</button>
                                    <button className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all">Открыть бот</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'billing' && user.role === 'owner' && (
                        <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-10 border dark:border-slate-800 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">Управление балансом</h3>
                                <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-2 shadow-sm">
                                    <ShieldCheck className="w-4 h-4" /> Безопасная оплата
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-500/20 mb-10 flex items-center justify-between">
                                <div>
                                    <p className="text-blue-200 text-xs font-black uppercase tracking-widest mb-2">Доступные отклики</p>
                                    <h2 className="text-5xl font-black">{user.bids_limit || 0}</h2>
                                </div>
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                                    <CreditCard className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            <h4 className="font-black text-lg mb-6 dark:text-white uppercase">Пакеты откликов</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Starter Package */}
                                <div className="border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group bg-slate-50 dark:bg-[#0B1120] relative overflow-hidden flex flex-col justify-between">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
                                    <div>
                                        <h5 className="font-black text-xl mb-2 dark:text-white relative z-10">Стартовый</h5>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">+ 10 откликов</p>
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <span className="text-3xl font-black text-blue-600 dark:text-blue-400">990 ₽</span>
                                        <button onClick={() => alert('Мок: Интеграция с платежным шлюзом (990₽)')} className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-md group-hover:bg-blue-600 group-hover:text-white transition-all text-blue-600 dark:text-blue-400"><ArrowRight className="w-5 h-5" /></button>
                                    </div>
                                </div>

                                {/* Pro Package */}
                                <div className="border-2 border-blue-500 dark:border-blue-600 rounded-[2rem] p-6 shadow-lg shadow-blue-500/10 cursor-pointer group bg-white dark:bg-[#111827] relative overflow-hidden flex flex-col justify-between">
                                    <div className="absolute top-4 right-4 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Хит</div>
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all"></div>
                                    <div>
                                        <h5 className="font-black text-xl mb-2 dark:text-white relative z-10">Бизнес</h5>
                                        <p className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-6 relative z-10">+ 50 откликов</p>
                                    </div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <span className="text-3xl font-black text-blue-600 dark:text-blue-400">3 900 ₽</span>
                                        <button onClick={() => alert('Мок: Интеграция с платежным шлюзом (3900₽)')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all">Купить</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
