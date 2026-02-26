import React, { useState, useMemo, useEffect } from 'react';
import {
    TrainFront, MapPin, Package, Calendar,
    Weight, Box, Filter, Search, ChevronDown,
    ArrowRight, ShieldCheck, Zap,
    Clock, CheckCircle, PieChart, Wallet, TrendingUp,
    X, AlertCircle, Info, Lock, Mail, User, Building2,
    MessageSquare, Send, Phone, Paperclip, MoreVertical,
    Settings, CreditCard, Share2, Award, History, Copy,
    Sparkles, Bot, Plus, Moon, Sun, ArrowUpRight, Check,
    Briefcase, Activity, FileText, Handshake, Eye, Shield, Lock, AlertTriangle
} from 'lucide-react';

// --- БИЗНЕС-ЛОГИКА БЕЗОПАСНОСТИ ---
const STOP_WORDS = [
    'давайте в обход', 'скину в телегу', 'оплата на карту', 'наберите мне напрямую',
    'мой номер', 'мой телефон', 'пишите в вотсап', 'связаться в телеграме',
    'перезвоните на', 'мои реквизиты', 'оплатить на карту',
    'контакты', 'телефон', 'email', 'почта', 'whatsapp', 'telegram'
];

const MAX_PROFILE_VIEWS_PER_DAY = 50;

const AI_PRICING_BASE_RATES = {
    'уголь': 15000, 'нефтепродукты': 18000, 'металл': 12000,
    'зерно': 8000, 'цемент': 10000, 'соль': 7000,
    'цветные металлы': 14000, 'минеральные удобрения': 13000,
    'лес': 9000, 'строительные материалы': 11000
};

const SEASONAL_MULTIPLIERS = {
    'winter': 1.15, 'summer': 1.10, 'autumn': 1.05, 'spring': 1.00
};

const DEMAND_COEFFICIENTS = {
    'high': 1.20, 'medium': 1.10, 'low': 1.00
};

// --- ИМПОРТЫ КОМПОНЕНТОВ ---
import LandingScreen from './components/LandingScreen';
import AuthScreen from './components/AuthScreen';
import RequestCard from './components/RequestCard';
import MyBidsView from './components/MyBidsView';
import MyRequestsView from './components/MyRequestsView';
import BidModal from './components/BidModal';
import DemoModal from './components/DemoModal';
import ProfileSettings from './components/ProfileSettings';
import ChatWindow from './components/ChatWindow';
import CreateRequestForm from './components/CreateRequestForm';
import AiAgentBar from './components/AiAgentBar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import FleetDislocation from './components/FleetDislocation';
import { parsePrompt } from './src/aiService';

// --- СУПАБЕЙЗ ИНИЦИАЛИЗАЦИЯ ---
import { supabase } from './src/supabaseClient';

// --- ГЛАВНЫЙ КОМПОНЕНТ ---
export default function App() {
    const [isDark, setIsDark] = useState(false);
    const [sbUser, setSbUser] = useState(null);

    // Состояния данных
    const [requests, setRequests] = useState([]);
    const [bids, setBids] = useState([]);
    const [messages, setMessages] = useState([]);

    // Навигация
    const [screen, setScreen] = useState('landing'); // 'landing' | 'auth' | 'app'
    const [view, setView] = useState('catalog'); // 'catalog' | 'my-requests' | 'my-bids' | 'messenger' | 'profile' | 'create'

    // Состояние пользователя
    const [userProfile, setUserProfile] = useState(null);
    const [authMode, setAuthMode] = useState('login');
    const [regRole, setRegRole] = useState('owner');

    // UI стейты
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const [showDemoAlert, setShowDemoAlert] = useState(false);
    const [aiFilters, setAiFilters] = useState(null);
    const [aiCreateData, setAiCreateData] = useState(null);

    // 1. ШРИФТ И ТЕМА
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return () => document.head.removeChild(link);
    }, [isDark]);

    // 2. АВТОРИЗАЦИЯ SUPABASE И ЗАГРУЗКА ПРОФИЛЯ
    useEffect(() => {
        const fetchProfile = async (userId) => {
            const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
            if (data) {
                setUserProfile({
                    id: data.id,
                    name: "Пользователь", // можно расширить
                    company: data.company,
                    inn: data.inn,
                    role: data.role,
                    phone: data.phone,
                    plan: data.plan || 'Free',
                    verification_status: data.verification_status || 'unverified',
                    is_verified: data.is_verified || false
                });
                setScreen('app');
                setView(data.role === 'owner' ? 'catalog' : 'my-requests');
            } else {
                console.warn("Профиль не найден для юзера:", userId);
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setSbUser(session.user);
                fetchProfile(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user || null;
            setSbUser(user);
            if (user) {
                fetchProfile(user.id);
            } else {
                setUserProfile(null);
                // setScreen('landing'); // Изменил: если логаут, мы идём на лендинг (вызывается в handleLogout)
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // 3. СИНХРОНИЗАЦИЯ С БД (Supabase Realtime)
    useEffect(() => {
        if (!sbUser) return;

        const fetchInitialData = async () => {
            const { data: initialRequests } = await supabase.from('requests').select('*, profiles:shipperId(is_verified)').order('created_at', { ascending: false });
            if (initialRequests) setRequests(initialRequests);

            const { data: initialBids } = await supabase.from('bids').select('*').order('created_at', { ascending: false });
            if (initialBids) setBids(initialBids);

            const { data: initialMessages } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
            if (initialMessages) setMessages(initialMessages);
        };
        fetchInitialData();

        const requestChannel = supabase.channel('public:requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, async (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    // Fetch full data with join for the new/updated record
                    const { data } = await supabase.from('requests').select('*, profiles:shipperId(is_verified)').eq('id', payload.new.id).single();
                    if (data) {
                        if (payload.eventType === 'INSERT') setRequests(prev => [data, ...prev]);
                        else setRequests(prev => prev.map(r => r.id === data.id ? data : r));
                    }
                }
                else if (payload.eventType === 'DELETE') setRequests(prev => prev.filter(r => r.id !== payload.old.id));
            }).subscribe();

        const bidChannel = supabase.channel('public:bids')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, (payload) => {
                if (payload.eventType === 'INSERT') setBids(prev => [payload.new, ...prev]);
                else if (payload.eventType === 'UPDATE') setBids(prev => prev.map(b => b.id === payload.new.id ? payload.new : b));
                else if (payload.eventType === 'DELETE') setBids(prev => prev.filter(b => b.id !== payload.old.id));
            }).subscribe();

        const msgChannel = supabase.channel('public:messages')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
            }).subscribe();

        const profileChannel = supabase.channel(`public:profiles:${sbUser.id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'profiles',
                filter: `id=eq.${sbUser.id}`
            }, (payload) => {
                setUserProfile(prev => ({ ...prev, ...payload.new }));
            }).subscribe();

        return () => {
            supabase.removeChannel(requestChannel);
            supabase.removeChannel(bidChannel);
            supabase.removeChannel(msgChannel);
            supabase.removeChannel(profileChannel);
        };
    }, [sbUser]);

    // --- ЛОГИКА ---

    const handleEnterDemo = () => {
        setUserProfile({ name: 'Гость', company: 'Демо режим', role: 'demo', inn: '000000' });
        setScreen('app');
        setView('catalog');
    };

    const handleAuthSubmit = async (formData) => {
        const { email, password, company, inn, phone } = formData;

        try {
            if (authMode === 'register') {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) { alert("Ошибка регистрации: " + error.message); return; }

                const userId = data.user?.id;
                if (userId) {
                    const { error: profileError } = await supabase.from('profiles').insert([
                        { id: userId, company, inn, phone, role: regRole, plan: 'Free' }
                    ]);
                    if (profileError) { console.error("Ошибка сохранения профиля", profileError); }
                }

                // В Супабейсе если почта не требует подтверждения, юзер уже залогинен и триггернет useEffect
                // Если требует, authStateChange не сработает
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) alert("Ошибка входа: " + error.message);
            }
        } catch (e) { console.error(e); }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setScreen('landing');
    };

    const requireAuth = (callback) => {
        if (!sbUser || userProfile?.role === 'demo') {
            setShowDemoAlert(true);
            return false;
        }
        callback();
    };

    const handleBidSubmit = async (price, wagons, tons) => {
        if (!sbUser || !userProfile) return;

        // Проверка лимита в 15 откликов на заявку
        const reqBids = bids.filter(b => b.requestId === selectedRequest.id);
        if (reqBids.length >= 15) {
            alert("Лимит откликов на эту заявку (15) исчерпан.");
            return;
        }

        // Проверка глобального лимита пользователя (SaaS)
        if (userProfile.role === 'owner' && (userProfile.bids_limit === undefined || userProfile.bids_limit <= 0)) {
            alert("У вас исчерпан лимит откликов. Пополните баланс в профиле (Вкладка 'Биллинг').");
            setView('profile');
            setIsModalOpen(false);
            return;
        }

        const bidData = {
            requestId: selectedRequest.id,
            ownerId: sbUser.id,
            ownerName: userProfile.company,
            ownerPhone: userProfile.phone,
            price: Number(price),
            wagons: Number(wagons),
            tons: Number(tons),
            status: 'pending'
        };

        const { data, error } = await supabase.from('bids').insert([bidData]).select().single();
        if (error) {
            console.error("Error inserting bid", error);
            return;
        }

        if (userProfile.role === 'owner') {
            const newLimit = (userProfile.bids_limit || 0) - 1;
            await supabase.from('profiles').update({ bids_limit: newLimit }).eq('id', sbUser.id);
            setUserProfile(prev => ({ ...prev, bids_limit: newLimit }));
        }

        setIsModalOpen(false);
        // Мгновенный переход в чат
        setActiveChat({ ...selectedRequest, shipperName: 'Загрузка...', id: data.id }); // data.id is the bid ID
        setView('chat');
    };

    const handleSendMessage = async (chatId, text) => {
        if (!sbUser || !text.trim()) return;
        try {
            const { error } = await supabase.from('messages').insert([{
                chat_id: chatId,
                sender_id: sbUser.id,
                text: text
            }]);
            if (error) throw error;
        } catch (err) {
            console.error("Error sending message:", err);
            alert("Ошибка при отправке сообщения");
        }
    };

    const handleConfirmDeal = async (bid) => {
        if (!sbUser || !userProfile) return;

        try {
            const isShipper = userProfile.role === 'shipper';
            const updateField = isShipper ? { shipper_confirmed: true } : { owner_confirmed: true };

            // 1. Оптимистичное обновление локального стейта (опционально, realtime должно подхватить)
            // Но мы лучше сделаем update в базе, и получим ответ
            const { data: updatedBid, error } = await supabase
                .from('bids')
                .update(updateField)
                .eq('id', bid.id)
                .select()
                .single();

            if (error) throw error;

            // 2. Проверяем, подтвердили ли обе стороны
            const fullyConfirmed = (updatedBid.shipper_confirmed && updatedBid.owner_confirmed) || (isShipper && updatedBid.owner_confirmed) || (!isShipper && updatedBid.shipper_confirmed); // fallback logic

            if (fullyConfirmed && updatedBid.status !== 'accepted') {
                // Если обе стороны согласны, окончательно закрываем ставку
                await supabase.from('bids').update({ status: 'accepted' }).eq('id', bid.id);

                // Обновляем количество вагонов и тонн в заявке
                const targetReq = requests.find(r => r.id === bid.requestId);
                if (targetReq) {
                    const newFulfilledWagons = (targetReq.fulfilledWagons || 0) + bid.wagons;
                    const newFulfilledTons = (targetReq.fulfilledTons || 0) + (bid.tons || 0);
                    await supabase.from('requests').update({
                        fulfilledWagons: newFulfilledWagons,
                        fulfilledTons: newFulfilledTons,
                        status: newFulfilledWagons >= targetReq.totalWagons ? 'completed' : 'open'
                    }).eq('id', targetReq.id);
                }
            }

            // Обновляем текущий чат в стейте, чтобы UI моментально отреагировал
            setActiveChat(prev => ({ ...prev, ...updateField, status: fullyConfirmed ? 'accepted' : 'pending' }));

        } catch (e) {
            console.error("Deal confirmation error:", e);
            alert("Ошибка при подтверждении сделки");
        }
    };

    const handleCreateRequest = async (data) => {
        if (!sbUser || !userProfile) return;
        const reqData = {
            stationFrom: data.stationFrom,
            stationTo: data.stationTo,
            cargoType: data.cargoType,
            wagonType: data.wagonType,
            totalWagons: Number(data.totalWagons),
            totalTons: Number(data.totalTons),
            fulfilledWagons: 0,
            fulfilledTons: 0,
            shipperInn: userProfile.inn,
            status: 'open'
        }
        const { error } = await supabase.from('requests').insert([reqData]);
        if (error) console.error("Error creating request", error);
        setView('my-requests');
    };

    const handleAiCreate = (parsedData) => {
        setAiCreateData(parsedData);
        setView('create');
    };

    const handleAiSearchResult = (parsed) => {
        if (parsed.intent === 'create' && userProfile?.role === 'shipper') {
            handleAiCreate(parsed);
        } else {
            setAiFilters(parsed);
        }
    };

    const handleClearFilter = (key) => {
        if (key === 'all') {
            setAiFilters(null);
            return;
        }
        if (!aiFilters) return;
        const newFilters = { ...aiFilters, [key]: null };
        if (!newFilters.stationFrom && !newFilters.stationTo && !newFilters.wagonType && !newFilters.cargoType) {
            setAiFilters(null);
        } else {
            setAiFilters(newFilters);
        }
    };

    // Filter requests for catalog
    const filteredCatalogRequests = requests.filter(req => {
        if (!aiFilters) return true;
        if (aiFilters.stationFrom && !req.stationFrom.toLowerCase().includes(aiFilters.stationFrom.toLowerCase())) return false;
        if (aiFilters.stationTo && !req.stationTo.toLowerCase().includes(aiFilters.stationTo.toLowerCase())) return false;
        if (aiFilters.wagonType && !req.wagonType.toLowerCase().includes(aiFilters.wagonType.toLowerCase())) return false;
        if (aiFilters.cargoType && !req.cargoType.toLowerCase().includes(aiFilters.cargoType.toLowerCase())) return false;
        return true;
    });

    // --- RENDERING ---

    if (screen === 'landing') return <LandingScreen onStart={() => { setAuthMode('register'); setScreen('auth'); }} onDemo={handleEnterDemo} isDark={isDark} setIsDark={setIsDark} onLogin={() => { setAuthMode('login'); setScreen('auth'); }} />;

    if (screen === 'auth') return <AuthScreen mode={authMode} setMode={setAuthMode} role={regRole} setRole={setRegRole} onSubmit={handleAuthSubmit} onBack={() => { setScreen('landing'); setAuthMode('login'); }} isDark={isDark} />;

    return (
        <div className="min-h-screen transition-colors duration-700 ease-in-out bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white relative origin-top">
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('catalog')}>
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform"><TrainFront className="text-white w-5 h-5" /></div>
                        <span className="text-2xl font-black tracking-tight dark:text-white hidden sm:block">RailMatch</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <button onClick={() => setView('catalog')} className={`text-sm font-black uppercase tracking-widest transition-all ${view === 'catalog' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>Биржа</button>
                        {userProfile?.role === 'shipper' && (
                            <button onClick={() => setView('my-requests')} className={`text-sm font-black uppercase tracking-widest transition-all ${view === 'my-requests' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>Мои заявки</button>
                        )}
                        {userProfile?.role === 'owner' && (
                            <button onClick={() => setView('my-bids')} className={`text-sm font-black uppercase tracking-widest transition-all ${view === 'my-bids' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>Мои ставки</button>
                        )}
                        <button onClick={() => setView('analytics')} className={`text-sm font-black uppercase tracking-widest transition-all ${view === 'analytics' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>Аналитика</button>
                        <button onClick={() => setView('dislocation')} className={`text-sm font-black uppercase tracking-widest transition-all ${view === 'dislocation' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>Дислокация</button>
                        <button onClick={() => setView('messenger')} className={`text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'messenger' || view === 'chat' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>
                            Сообщения
                            {messages.filter(m => m.sender_id !== sbUser?.id).length > 0 && (
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsDark(!isDark)} className="p-3 text-slate-400 hover:text-blue-600 hover:rotate-[360deg] hover:scale-110 active:scale-95 transition-all duration-700 ease-out rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-transparent dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm">
                            {isDark ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                        </button>

                        {userProfile?.role === 'owner' && (
                            <div onClick={() => requireAuth(() => setView('profile'))} title="Остаток откликов" className="flex items-center gap-2 cursor-pointer bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hidden lg:block">Отклики</span>
                                <span className={`text-sm font-black ${userProfile.bids_limit > 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-600 dark:text-red-400'}`}>{userProfile?.bids_limit || 0}</span>
                            </div>
                        )}

                        <div onClick={() => requireAuth(() => setView('profile'))} className="flex items-center gap-3 cursor-pointer pl-6 border-l dark:border-slate-800 group">
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-bold group-hover:text-blue-600 transition-colors dark:text-white">{userProfile?.company || "Аноним"}</div>
                                <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">{userProfile?.role === 'shipper' ? 'Отправитель' : userProfile?.role === 'owner' ? 'Владелец' : 'Гость'}</div>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full flex items-center justify-center font-bold border border-slate-300 dark:border-slate-600 dark:text-white shadow-sm"><User className="w-5 h-5 text-slate-400" /></div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {view === 'catalog' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {(!sbUser || userProfile?.role === 'demo') && (
                            <div className="mb-10 p-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800/30 rounded-3xl flex justify-between items-center shadow-sm border-l-4 border-l-orange-500">
                                <div className="flex items-center gap-4 text-orange-600 dark:text-orange-400"><AlertCircle className="w-10 h-10" /><div><h3 className="font-extrabold text-lg">Демо-режим</h3><p className="text-sm font-medium opacity-80">Зарегистрируйтесь, чтобы иметь возможность публиковать грузы и делать ставки.</p></div></div>
                                <button onClick={() => setScreen('auth')} className="px-6 py-2.5 bg-orange-500 text-white rounded-xl font-bold text-sm shadow-sm">Авторизация</button>
                            </div>
                        )}

                        <AiAgentBar
                            onSearch={handleAiSearchResult}
                            activeFilters={aiFilters}
                            onClearFilter={handleClearFilter}
                            userRole={userProfile?.role}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-10">
                            {filteredCatalogRequests.length === 0 ? (
                                <div className="col-span-full py-20 text-center text-slate-400 font-bold bg-white dark:bg-[#111827] rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-800">
                                    Ничего не найдено по вашему запросу.
                                </div>
                            ) : filteredCatalogRequests.map(req => (
                                <RequestCard
                                    key={req.id}
                                    req={req}
                                    bidCount={bids.filter(b => b.requestId === req.id).length}
                                    onBid={() => requireAuth(() => {
                                        setSelectedRequest(req);
                                        setIsModalOpen(true);
                                    })}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {view === 'analytics' && <AnalyticsDashboard requests={requests} bids={bids} />}

                {view === 'dislocation' && <FleetDislocation />}

                {view === 'messenger' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="lg:col-span-1 bg-white dark:bg-[#111827] rounded-[2.5rem] border dark:border-slate-800 p-6 shadow-xl overflow-hidden flex flex-col">
                            <h2 className="text-xl font-black mb-6 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" /> Диалоги
                            </h2>
                            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                {(bids || []).filter(b => b.ownerId === sbUser?.id || requests.find(r => r.id === b.requestId && r.shipperInn === userProfile?.inn)).map(chatBid => {
                                    const req = requests.find(r => r.id === chatBid.requestId);
                                    const isMeOwner = chatBid.ownerId === sbUser?.id;
                                    const partnerName = isMeOwner ? (req?.stationTo || 'Заявка') : chatBid.ownerName;
                                    const isActive = activeChat?.id === chatBid.id;

                                    return (
                                        <div
                                            key={chatBid.id}
                                            onClick={() => setActiveChat({ ...chatBid, stationFrom: req?.stationFrom, stationTo: req?.stationTo, cargoType: req?.cargoType })}
                                            className={`p-4 rounded-2xl cursor-pointer transition-all border ${isActive
                                                ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-500/20'
                                                : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-blue-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className={`text-xs font-black uppercase tracking-widest mb-1 ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                                {isMeOwner ? 'Моя ставка' : 'Отклик'}
                                            </div>
                                            <div className={`font-bold truncate ${isActive ? 'text-white' : 'dark:text-white'}`}>
                                                {partnerName}
                                            </div>
                                            <div className={`text-[10px] mt-1 truncate ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                                                {req?.stationFrom || '...'} → {req?.stationTo || '...'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            {activeChat ? (
                                <ChatWindow
                                    chat={activeChat}
                                    messages={(messages || []).filter(m => m.chat_id === activeChat.id)}
                                    currentUserId={sbUser?.id}
                                    userRole={userProfile?.role}
                                    onSend={(text) => handleSendMessage(activeChat.id, text)}
                                    onAccept={() => handleConfirmDeal(activeChat)}
                                    onBack={() => setView('catalog')}
                                />
                            ) : (
                                <div className="h-full bg-white dark:bg-[#111827] rounded-[3.5rem] border-2 border-dashed dark:border-slate-800 flex flex-col items-center justify-center text-center p-10">
                                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 mb-6">
                                        <MessageSquare className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-black dark:text-white uppercase tracking-widest">Выберите чат</h3>
                                    <p className="text-slate-500 max-w-xs mt-3 font-bold leading-relaxed">
                                        Выберите диалог слева, чтобы начать обсуждение условий перевозки.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === 'my-bids' && (
                    <MyBidsView
                        bids={bids}
                        requests={requests}
                        userId={sbUser?.id}
                        setView={setView}
                        onChat={(b) => { setActiveChat({ ...b, shipperName: b.ownerName, shipperPhone: b.ownerPhone }); setView('chat'); }}
                    />
                )}

                {view === 'my-requests' && (
                    <MyRequestsView
                        requests={requests}
                        bids={bids}
                        userInn={userProfile?.inn}
                        setView={setView}
                        onAccept={handleConfirmDeal}
                        onAiCreate={handleAiCreate}
                    />
                )}

                {view === 'create' && (
                    <CreateRequestForm
                        onBack={() => { setView('my-requests'); setAiCreateData(null); }}
                        onPublish={(data) => { handleCreateRequest(data); setAiCreateData(null); }}
                        initialData={aiCreateData}
                    />
                )}

                {view === 'profile' && (
                    <ProfileSettings
                        user={userProfile || { name: 'Загрузка...', company: '', inn: '' }}
                        onLogout={handleLogout}
                    />
                )}

                {view === 'chat' && activeChat && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <ChatWindow
                            chat={activeChat}
                            messages={(messages || []).filter(m => m.chat_id === activeChat.id)}
                            currentUserId={sbUser?.id}
                            userRole={userProfile?.role}
                            onSend={(text) => handleSendMessage(activeChat.id, text)}
                            onAccept={() => handleConfirmDeal(activeChat)}
                            onBack={() => setView('messenger')}
                        />
                    </div>
                )}
            </main>

            {isModalOpen && selectedRequest && (
                <BidModal
                    request={selectedRequest}
                    userLimit={userProfile?.role === 'owner' ? userProfile?.bids_limit : null}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleBidSubmit}
                />
            )}{showDemoAlert && <DemoModal onClose={() => setShowDemoAlert(false)} onReg={() => { setShowDemoAlert(false); setScreen('auth'); }} />}
        </div >
    );
}