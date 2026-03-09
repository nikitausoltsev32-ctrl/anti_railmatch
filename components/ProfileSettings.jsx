import React, { useState, useMemo } from 'react';
import { ShieldCheck, Settings, Bot, Users, FileText, Upload, Check, X, Mail, Phone, Building2, User, History, ArrowRight, Clock, TrendingUp, Wallet, Pencil, Save } from 'lucide-react';
import { supabase } from '../src/supabaseClient';
import { PLATFORM_COMMISSION_RATE, ALLOWED_DOC_TYPES, MAX_DOC_SIZE_BYTES } from '../src/constants.js';

export default function ProfileSettings({ user, onLogout, bids = [], requests = [], showToast = () => {}, onProfileUpdate = () => {} }) {
    const [activeTab, setActiveTab] = useState('general');
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState({ company: user.company || '', phone: user.phone || '' });

    const handleFileDrop = (e) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...droppedFiles]);
    };

    const handleSaveProfile = async () => {
        if (!editData.company.trim()) { showToast('Название компании не может быть пустым', 'warning'); return; }
        setSaving(true);
        try {
            const { error } = await supabase.from('profiles').update({ company: editData.company.trim(), phone: editData.phone.trim() }).eq('id', user.id);
            if (error) throw error;
            onProfileUpdate({ company: editData.company.trim(), phone: editData.phone.trim() });
            showToast('Профиль обновлён', 'success');
            setIsEditing(false);
        } catch (err) {
            console.error('Profile update error:', err);
            showToast('Ошибка при сохранении профиля', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        // Валидация перед загрузкой
        for (const file of files) {
            if (!ALLOWED_DOC_TYPES.includes(file.type)) {
                showToast(`Недопустимый тип файла: ${file.name}. Разрешены PDF, JPG, PNG.`, 'error');
                return;
            }
            if (file.size > MAX_DOC_SIZE_BYTES) {
                showToast(`Файл ${file.name} превышает 10 МБ.`, 'error');
                return;
            }
        }

        setUploading(true);
        try {
            const uploadedUrls = [];

            // Загружаем каждый файл в бакет 'Documents'
            for (const file of files) {
                // Используем только расширение из разрешённого списка — не доверяем оригинальному имени
                const mimeToExt = { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
                const safeExt = mimeToExt[file.type] || 'bin';
                const fileName = `${user.id}_verification_${Date.now()}.${safeExt}`;
                const filePath = `verification/${fileName}`;

                const { data, error: uploadError } = await supabase.storage
                    .from('Documents')
                    .upload(filePath, file, { contentType: file.type });

                if (uploadError) {
                    console.error("Ошибка загрузки файла в Storage:", uploadError);
                    throw uploadError;
                }

                const { data: { publicUrl } } = supabase.storage
                    .from('Documents')
                    .getPublicUrl(filePath);

                uploadedUrls.push(publicUrl);
            }

            // Обновляем профиль с новыми ссылками на документы и статусом 'pending'
            const { error: profileUpdateError } = await supabase
                .from('profiles')
                .update({
                    verification_status: 'pending',
                    documents: uploadedUrls // теперь здесь массив публичных ссылок, а не просто имен
                })
                .eq('id', user.id);

            if (profileUpdateError) throw profileUpdateError;

            showToast("Документы отправлены на проверку. Срок обработки: до 24 часов.", 'success');
            setFiles([]);
            user.verification_status = 'pending'; // Локальное обновление для UI
        } catch (err) {
            console.error("Verification submit error:", err);
            showToast("Ошибка при отправке документов. Убедитесь, что бакет 'Documents' создан в Supabase.", 'error');
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
                        <button onClick={() => setActiveTab('deals')} className={`w-full p-4 text-left rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-4 transition-all ${activeTab === 'deals' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-blue-600'}`}>
                            <History className="w-5 h-5" /> История сделок
                        </button>
                    </div>
                </div>

                {/* Правая колонка: Контент */}
                <div className="flex-1 space-y-6">
                    {activeTab === 'general' && (
                        <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-10 border dark:border-slate-800 shadow-sm">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">Данные компании</h3>
                                <div className="flex items-center gap-3">
                                    {user.role === 'owner' && (
                                        <div className="px-5 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">Тариф: {user.plan}</div>
                                    )}
                                    {!isEditing ? (
                                        <button onClick={() => { setEditData({ company: user.company || '', phone: user.phone || '' }); setIsEditing(true); }} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 transition-all">
                                            <Pencil className="w-3.5 h-3.5" /> Редактировать
                                        </button>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Отмена</button>
                                            <button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50">
                                                <Save className="w-3.5 h-3.5" /> {saving ? 'Сохранение...' : 'Сохранить'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                                <div className="space-y-2 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Название компании</p>
                                    {isEditing ? (
                                        <input value={editData.company} onChange={e => setEditData(p => ({ ...p, company: e.target.value }))} className="w-full text-xl font-black bg-white dark:bg-slate-800 dark:text-white px-3 py-2 rounded-xl border border-blue-400 outline-none focus:ring-2 focus:ring-blue-500" />
                                    ) : (
                                        <p className="text-xl font-black dark:text-white">{user.company || '—'}</p>
                                    )}
                                </div>
                                <div className="space-y-2 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Основной ИНН</p>
                                    <p className="text-xl font-black dark:text-white">{user.inn}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">ИНН изменению не подлежит</p>
                                </div>
                                <div className="space-y-2 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Телефон организации</p>
                                    {isEditing ? (
                                        <input value={editData.phone} onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} placeholder="+7 (___) ___-__-__" className="w-full text-xl font-black bg-white dark:bg-slate-800 dark:text-white px-3 py-2 rounded-xl border border-blue-400 outline-none focus:ring-2 focus:ring-blue-500" />
                                    ) : (
                                        <p className="text-xl font-black dark:text-white">{user.phone || 'Не указан'}</p>
                                    )}
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
                        <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-10 border dark:border-slate-800 shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/60 dark:bg-[#111827]/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                                <div className="p-4 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl mb-4">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-widest mb-2 dark:text-white">В разработке</h3>
                                <p className="text-sm font-bold text-slate-500 max-w-sm">Функционал управления командой и ролевого доступа появится в следующем обновлении.</p>
                            </div>
                            <div className="opacity-40 pointer-events-none filter blur-[2px]">
                                <div className="flex justify-between items-center mb-8">
                                    <div><h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">Управление командой</h3><p className="text-slate-400 font-medium">Приглашайте коллег и настраивайте права доступа.</p></div>
                                    <button disabled className="px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"><Plus className="w-4 h-4" /> Добавить сотрудника</button>
                                </div>
                                <div className="space-y-4">
                                    {teamMembers.map(member => (
                                        <div key={member.id} className="p-6 bg-slate-50 dark:bg-[#0B1120] rounded-[2rem] border dark:border-slate-800 flex items-center justify-between">
                                            <div className="flex items-center gap-6">
                                                <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center border dark:border-slate-700 shadow-sm relative"><User className="w-7 h-7 text-slate-400" /></div>
                                                <div>
                                                    <div className="font-black dark:text-white flex items-center gap-2">{member.name}</div>
                                                    <div className="text-xs text-slate-400 font-bold mt-1.5">{member.email}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notif' && (
                        <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-10 border dark:border-slate-800 shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/60 dark:bg-[#111827]/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-6">
                                <div className="p-4 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl mb-4">
                                    <Bot className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-widest mb-2 dark:text-white">Интеграция с Telegram</h3>
                                <p className="text-sm font-bold text-slate-500 max-w-sm">Бот уведомлений RailMatch проходит финальное тестирование. Запуск в ближайшее время.</p>
                            </div>
                            <div className="opacity-30 pointer-events-none filter blur-sm">
                                <h3 className="text-2xl font-black mb-6 dark:text-white uppercase tracking-tight">Telegram Уведомления</h3>
                                <p className="text-slate-400 mb-10 font-medium">Подключите официального бота RailMatch, чтобы мгновенно получать уведомления о новых ставках, сообщениях в чате и изменении статуса ваших документов.</p>

                                <div className="bg-slate-50 dark:bg-[#0B1120] rounded-3xl p-10 border-2 border-dashed border-blue-100 dark:border-blue-900/30 text-center relative overflow-hidden">
                                    <Bot className="w-20 h-20 text-blue-100 dark:text-blue-900/20 absolute -top-4 -right-4 rotate-12" />
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-4">Ваш уникальный код</p>
                                    <div className="text-4xl font-black dark:text-white tracking-[0.5em] mb-10">CODE-881-22</div>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button disabled className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg transition-all">Копировать код</button>
                                        <button disabled className="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs transition-all">Открыть бот</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'deals' && (() => {
                        // Фильтруем сделки текущего пользователя
                        const userDeals = bids.filter(b => {
                            const isOwner = b.ownerId === user.id;
                            const relatedReq = requests.find(r => r.id === b.requestId);
                            const isShipper = relatedReq?.shipperInn === user.inn;
                            return isOwner || isShipper;
                        });

                        const completedDeals = userDeals.filter(b => b.status === 'accepted' || b.status === 'completed');
                        const activeDeals = userDeals.filter(b => ['escrow_held', 'loading', 'in_transit', 'pending_payment'].includes(b.status));

                        const totalVolume = completedDeals.reduce((sum, b) => sum + (b.price * b.wagons), 0);
                        const totalCommission = Math.round(totalVolume * PLATFORM_COMMISSION_RATE);

                        const statusLabels = {
                            'pending': 'Ожидает',
                            'pending_payment': 'Ожидает оплаты',
                            'escrow_held': 'Эскроу внесён',
                            'loading': 'Погрузка',
                            'in_transit': 'В пути',
                            'accepted': 'Завершена',
                            'completed': 'Завершена',
                            'rejected': 'Отклонена'
                        };
                        const statusColors = {
                            'pending': 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                            'pending_payment': 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
                            'escrow_held': 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
                            'loading': 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
                            'in_transit': 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
                            'accepted': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
                            'completed': 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
                            'rejected': 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400'
                        };

                        return (
                            <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-10 border dark:border-slate-800 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                                <div className="flex justify-between items-center mb-10">
                                    <h3 className="text-2xl font-black dark:text-white uppercase tracking-tight">История сделок</h3>
                                    <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-2 shadow-sm">
                                        <ShieldCheck className="w-4 h-4" /> Эскроу защита
                                    </div>
                                </div>

                                {/* Сводка */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                                    <div className="bg-slate-50 dark:bg-[#0B1120] rounded-[2rem] p-6 border dark:border-slate-800">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center"><History className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Всего сделок</span>
                                        </div>
                                        <p className="text-3xl font-black dark:text-white">{userDeals.length}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-[#0B1120] rounded-[2rem] p-6 border dark:border-slate-800">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center"><TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Объём завершённых</span>
                                        </div>
                                        <p className="text-3xl font-black dark:text-white">{totalVolume.toLocaleString()} ₽</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-[#0B1120] rounded-[2rem] p-6 border dark:border-slate-800">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center"><Wallet className="w-5 h-5 text-violet-600 dark:text-violet-400" /></div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Комиссия (2.5%)</span>
                                        </div>
                                        <p className="text-3xl font-black text-violet-600 dark:text-violet-400">{totalCommission.toLocaleString()} ₽</p>
                                    </div>
                                </div>

                                {/* Активные сделки */}
                                {activeDeals.length > 0 && (
                                    <div className="mb-8">
                                        <h4 className="font-black text-sm uppercase tracking-widest dark:text-white mb-4 flex items-center gap-2">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span> Активные ({activeDeals.length})
                                        </h4>
                                        <div className="space-y-3">
                                            {activeDeals.map(deal => {
                                                const relatedReq = requests.find(r => r.id === deal.requestId);
                                                const amount = deal.price * deal.wagons;
                                                const commission = Math.round(amount * PLATFORM_COMMISSION_RATE);
                                                return (
                                                    <div key={deal.id} className="p-5 bg-slate-50 dark:bg-[#0B1120] rounded-[1.5rem] border dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-black dark:text-white text-sm truncate">{relatedReq?.stationFrom || '—'} → {relatedReq?.stationTo || '—'}</div>
                                                            <div className="text-xs text-slate-400 font-bold mt-1">{deal.wagons} ваг. × {deal.price?.toLocaleString()} ₽ = {amount.toLocaleString()} ₽</div>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className="text-[10px] font-black text-violet-500">−{commission.toLocaleString()} ₽</span>
                                                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${statusColors[deal.status] || 'bg-slate-100 text-slate-500'}`}>
                                                                {statusLabels[deal.status] || deal.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Завершённые сделки */}
                                <div>
                                    <h4 className="font-black text-sm uppercase tracking-widest dark:text-white mb-4">Завершённые ({completedDeals.length})</h4>
                                    {completedDeals.length === 0 ? (
                                        <div className="p-12 text-center bg-slate-50 dark:bg-[#0B1120] rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                            <History className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                                            <p className="text-slate-400 font-bold">Пока нет завершённых сделок</p>
                                            <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest mt-2">Завершённые сделки и удержанная комиссия появятся здесь</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {completedDeals.map(deal => {
                                                const relatedReq = requests.find(r => r.id === deal.requestId);
                                                const amount = deal.price * deal.wagons;
                                                const commission = Math.round(amount * PLATFORM_COMMISSION_RATE);
                                                return (
                                                    <div key={deal.id} className="p-5 bg-slate-50 dark:bg-[#0B1120] rounded-[1.5rem] border dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-black dark:text-white text-sm truncate flex items-center gap-2">
                                                                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                                                                {relatedReq?.stationFrom || '—'} → {relatedReq?.stationTo || '—'}
                                                            </div>
                                                            <div className="text-xs text-slate-400 font-bold mt-1">{deal.wagons} ваг. × {deal.price?.toLocaleString()} ₽ = {amount.toLocaleString()} ₽</div>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <span className="text-[10px] font-black text-violet-500">комиссия: {commission.toLocaleString()} ₽</span>
                                                            <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">Завершена</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
