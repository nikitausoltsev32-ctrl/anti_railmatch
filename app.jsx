import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
    TrainFront, ArrowRight, AlertCircle, User,
    MessageSquare, Sparkles, Moon, Sun, Ban
} from 'lucide-react';

import LandingScreen from './components/LandingScreen';
import AuthScreen from './components/AuthScreen';
import RequestCard from './components/RequestCard';
import MyRequestsView from './components/MyRequestsView';
import BidModal from './components/BidModal';
import DemoModal from './components/DemoModal';
import ProfileSettings from './components/ProfileSettings';
import ChatWindow from './components/ChatWindow';
import CreateRequestForm from './components/CreateRequestForm';
import AiAgentBar from './components/AiAgentBar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import OnboardingModal from './components/OnboardingModal.jsx';
import TermsModal from './components/TermsModal.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

import { supabase } from './src/supabaseClient';
import { PLATFORM_COMMISSION_RATE } from './src/constants.js';
import { validateMessageIntent } from './src/security.js';

// --- ГЛАВНЫЙ КОМПОНЕНТ ---
export default function App() {
    const [isDark, setIsDark] = useState(false);
    const [sbUser, setSbUser] = useState(null);

    // Состояния данных
    const [requests, setRequests] = useState([]);
    const [bids, setBids] = useState([]);
    const [messages, setMessages] = useState([]);
    const [profiles, setProfiles] = useState([]);

    // Навигация
    const [screen, setScreen] = useState(() => localStorage.getItem('rm_screen') || 'landing'); // 'landing' | 'auth' | 'app'
    const [view, setView] = useState(() => localStorage.getItem('rm_view') || 'catalog'); // 'catalog' | 'my-requests' | 'my-bids' | 'messenger' | 'profile' | 'create'

    // Persist state across reloads so user isn't kicked to main page
    useEffect(() => { localStorage.setItem('rm_screen', screen); }, [screen]);
    useEffect(() => { localStorage.setItem('rm_view', view); }, [view]);

    // Состояние пользователя
    const [userProfile, setUserProfile] = useState(null);
    const [authMode, setAuthMode] = useState('login');
    const [authLoading, setAuthLoading] = useState(false);
    const [regRole, setRegRole] = useState('owner');

    // UI стейты
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [activeChat, setActiveChat] = useState(null);
    const [showDemoAlert, setShowDemoAlert] = useState(false);
    const [aiFilters, setAiFilters] = useState(null);
    const [aiCreateData, setAiCreateData] = useState(null);
    const [isAiSearching, setIsAiSearching] = useState(false);
    const [quickFilter, setQuickFilter] = useState({ wagonType: null, direction: null });
    const [securityWarning, setSecurityWarning] = useState(null); // { message: string, severity: 'warning' | 'critical' }
    const [toasts, setToasts] = useState([]); // { id, message, type: 'success'|'error'|'warning'|'info' }
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showTerms, setShowTerms] = useState(false);

    const showToast = useCallback((message, type = 'success') => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
    }, []);

    // Email-уведомление партнёру через Edge Function (non-blocking, fire-and-forget)
    const sendNotification = useCallback(async (toUserId, subject, bodyText) => {
        if (!toUserId) return;
        try {
            await supabase.functions.invoke('notify', { body: { userId: toUserId, subject, bodyText } });
        } catch (e) {
            console.warn('Email notification skipped:', e);
        }
    }, []);

    // 1a. ШРИФТ — загружается один раз при монтировании
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
        return () => document.head.removeChild(link);
    }, []);

    // 1b. ТЕМА — реагирует на isDark
    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    // 2. АВТОРИЗАЦИЯ SUPABASE И ЗАГРУЗКА ПРОФИЛЯ
    useEffect(() => {
        let mounted = true;

        const fetchProfile = async (userId, isInitialLogin = false) => {
            try {
                const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
                if (!mounted) return;
                if (error) {
                    console.error("Profile fetch error:", error);
                    if (error.code === 'PGRST116') {
                        // Новая регистрация — профиль ещё не вставлен, ждём и повторяем
                        setTimeout(async () => {
                            if (!mounted) return;
                            const { data: retryData } = await supabase.from('profiles').select('*').eq('id', userId).single();
                            if (!mounted) return;
                            if (retryData) {
                                setUserProfile(retryData);
                                if (isInitialLogin) {
                                    const savedScreen = localStorage.getItem('rm_screen');
                                    setScreen('app');
                                    if (savedScreen !== 'app') setView('catalog');
                                    const onboardedKey = `rm_onboarded_${userId}`;
                                    if (!retryData.onboarded && !localStorage.getItem(onboardedKey)) {
                                        setShowOnboarding(true);
                                    }
                                }
                            } else {
                                showToast("Профиль не найден. Попробуйте войти через минуту.", 'error');
                                await supabase.auth.signOut();
                            }
                        }, 1500);
                        return;
                    }
                    throw error;
                }

                if (data) {
                    setUserProfile(data);
                    if (isInitialLogin) {
                        const savedScreen = localStorage.getItem('rm_screen');
                        setScreen('app');
                        if (savedScreen !== 'app') setView('catalog');
                        const onboardedKey = `rm_onboarded_${userId}`;
                        if (!data.onboarded && !localStorage.getItem(onboardedKey)) {
                            setShowOnboarding(true);
                        }
                    }
                }
            } catch (err) {
                if (mounted) console.error("fetchProfile failed:", err);
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setSbUser(session.user);
                fetchProfile(session.user.id, true);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const user = session?.user || null;
            setSbUser(user);
            if (user) {
                // Только при явном входе меняем экраны, чтобы не выкидывало при TOKEN_REFRESHED
                const isInitialLogin = _event === 'SIGNED_IN';
                fetchProfile(user.id, isInitialLogin);
            } else {
                setUserProfile(null);
                // setScreen('landing'); // Изменил: если логаут, мы идём на лендинг (вызывается в handleLogout)
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // 3. СИНХРОНИЗАЦИЯ С БД (Supabase Realtime)
    useEffect(() => {
        if (!sbUser) return;

        const fetchInitialData = async () => {
            const [
                { data: initialRequests, error: reqError },
                { data: initialBids },
                { data: initialMessages },
                { data: initialProfiles },
            ] = await Promise.all([
                supabase.from('requests').select('*').order('created_at', { ascending: false }),
                supabase.from('bids').select('*').order('created_at', { ascending: false }),
                supabase.from('messages').select('*').order('created_at', { ascending: true }),
                supabase.from('profiles').select('id, inn, role, company, phone'),
            ]);
            if (reqError) console.error("Error fetching requests:", reqError);
            if (initialRequests) setRequests(initialRequests);
            if (initialBids) setBids(initialBids);
            if (initialMessages) setMessages(initialMessages);
            if (initialProfiles) setProfiles(initialProfiles);
        };
        fetchInitialData();

        const requestChannel = supabase.channel('public:requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
                if (payload.eventType === 'INSERT') setRequests(prev => [payload.new, ...prev]);
                else if (payload.eventType === 'UPDATE') setRequests(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
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

    // 4. ЗАГРУЗКА ДАННЫХ ДЛЯ ДЕМО-РЕЖИМА
    useEffect(() => {
        if (userProfile?.role !== 'demo') return;
        const fetchDemoData = async () => {
            const [{ data: demoRequests }, { data: demoProfiles }] = await Promise.all([
                supabase.from('requests').select('*').order('created_at', { ascending: false }),
                supabase.from('profiles').select('id, inn, role, company, phone'),
            ]);
            if (demoRequests) setRequests(demoRequests);
            if (demoProfiles) setProfiles(demoProfiles);
        };
        fetchDemoData();
    }, [userProfile?.role]);

    // --- ЛОГИКА ---

    const handleOnboardingComplete = useCallback(async () => {
        setShowOnboarding(false);
        if (sbUser) {
            localStorage.setItem(`rm_onboarded_${sbUser.id}`, '1');
            await supabase.from('profiles').update({ onboarded: true }).eq('id', sbUser.id);
        }
    }, [sbUser]);

    const handleEnterDemo = () => {
        setUserProfile({ name: 'Гость', company: 'Демо режим', role: 'demo', inn: '000000' });
        setScreen('app');
        setView('catalog');
    };

    const handleAuthSubmit = async (formData) => {
        if (authLoading) return;
        const email = formData.email?.trim();
        const password = formData.password?.trim();
        const { company, inn, phone } = formData;

        if (!email || !password) {
            showToast("Пожалуйста, заполните все поля", 'warning');
            return;
        }

        setAuthLoading(true);

        try {
            if (authMode === 'register') {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) {
                    console.error("Registration failed:", error);
                    showToast("Ошибка регистрации: " + (error.message || "Проверьте данные"), 'error');
                    setAuthLoading(false);
                    return;
                }

                const userId = data.user?.id;
                if (userId) {
                    const { error: profileError } = await supabase.from('profiles').insert([
                        { id: userId, company, inn, phone, role: regRole, plan: 'Free', leakage_attempts: 0, daily_profile_views: 0 }
                    ]);
                    if (profileError) { console.error("Ошибка сохранения профиля", profileError); }
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    console.error("Login failed:", error);
                    showToast("Ошибка входа: " + (error.status === 400 ? "Неверный email или пароль" : error.message), 'error');
                }
            }
        } catch (e) {
            console.error("Auth submit catch:", e);
            showToast("Произошла непредвиденная ошибка", 'error');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setScreen('landing');
        localStorage.removeItem('rm_screen');
        localStorage.removeItem('rm_view');
    };

    /**
     * Строит нормализованный объект чата из ставки + заявки + профилей.
     * Единственная точка сборки — гарантирует одинаковую форму везде.
     */
    const buildChatObject = useCallback((bid, req, profilesList) => {
        const shipperProfile = (profilesList || profiles).find(p => p.inn === req?.shipperInn);
        return {
            ...bid,
            stationFrom:  req?.stationFrom  ?? bid.stationFrom  ?? null,
            stationTo:    req?.stationTo    ?? bid.stationTo    ?? null,
            cargoType:    req?.cargoType    ?? bid.cargoType    ?? null,
            wagonType:    req?.wagonType    ?? bid.wagonType    ?? null,
            totalWagons:  req?.totalWagons  ?? bid.totalWagons  ?? null,
            totalTons:    req?.totalTons    ?? bid.totalTons    ?? null,
            shipperInn:   req?.shipperInn   ?? bid.shipperInn   ?? null,
            shipperName:  shipperProfile?.company ?? bid.shipperName ?? 'Грузоотправитель',
            shipperPhone: shipperProfile?.phone   ?? bid.shipperPhone ?? null,
        };
    }, [profiles]);

    const securityWarningTimerRef = useRef(null);

    const requireAuth = useCallback((callback) => {
        if (!sbUser || userProfile?.role === 'demo') {
            setShowDemoAlert(true);
            return false;
        }
        callback();
    }, [sbUser, userProfile?.role]);

    const handleBidSubmit = async (price, wagons, tons) => {
        if (!sbUser || !userProfile) return;

        // Проверка: владелец уже откликался на эту заявку
        const alreadyBid = bids.find(
            b => b.requestId === selectedRequest.id && b.ownerId === sbUser.id
        );
        if (alreadyBid) {
            showToast("Вы уже откликнулись на эту заявку. Откройте чат для продолжения.", 'warning');
            setIsModalOpen(false);
            setActiveChat(buildChatObject(alreadyBid, selectedRequest, profiles));
            setView('chat');
            return;
        }

        // Проверка лимита в 15 откликов на заявку
        const reqBids = bids.filter(b => b.requestId === selectedRequest.id);
        if (reqBids.length >= 15) {
            showToast("Лимит откликов на эту заявку (15) исчерпан.", 'warning');
            return;
        }

        const bidData = {
            requestId: selectedRequest.id,
            ownerId: sbUser.id,
            ownerName: userProfile.company,
            ownerPhone: userProfile.phone,
            ownerInn: userProfile.inn,
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

        setIsModalOpen(false);

        // Уведомление грузоотправителю о новой ставке
        const shipperProfile = profiles.find(p => p.inn === selectedRequest.shipperInn);
        if (shipperProfile?.id) {
            sendNotification(
                shipperProfile.id,
                'Новая ставка на вашу заявку — RailMatch',
                `Компания «${userProfile.company}» откликнулась на вашу заявку:\n${selectedRequest.stationFrom} → ${selectedRequest.stationTo}, ${selectedRequest.cargoType}.\n\nЦена: ${Number(price).toLocaleString()} ₽ · Вагонов: ${wagons} · Тонн: ${tons}\n\nОткройте платформу, чтобы продолжить переговоры.`
            );
        }

        // Мгновенный переход в чат
        setActiveChat(buildChatObject(data, selectedRequest, profiles));
        setView('chat');
    };

    const handleSendMessage = async (chatId, text) => {
        if (!sbUser || !text.trim()) return;

        const validation = validateMessageIntent(text);

        try {
            // Если нарушение - инкрементируем счетчик в профиле
            if (validation.isViolation) {
                const newAttempts = (userProfile.leakage_attempts || 0) + 1;

                // Shadow flagging: инкрементируем попытки
                await supabase.from('profiles').update({ leakage_attempts: newAttempts }).eq('id', sbUser.id);
                setUserProfile(prev => ({ ...prev, leakage_attempts: newAttempts }));

                if (newAttempts >= 3) {
                    setSecurityWarning({
                        message: "ВНИМАНИЕ: Зафиксированы множественные попытки обхода платформы. Ваш аккаунт передан на модерацию.",
                        severity: 'critical'
                    });
                } else {
                    setSecurityWarning({
                        message: "Система безопасности RailMatch скрыла контактные данные. Пожалуйста, используйте безопасную сделку.",
                        severity: 'warning'
                    });
                }

                clearTimeout(securityWarningTimerRef.current);
                securityWarningTimerRef.current = setTimeout(() => setSecurityWarning(null), 5000);
            }

            const { error } = await supabase.from('messages').insert([{
                chat_id: chatId,
                sender_id: sbUser.id,
                text: validation.cleaned
            }]);
            if (error) throw error;
        } catch (err) {
            console.error("Error sending message:", err);
            // setSecurityWarning({ message: "Ошибка при отправке сообщения", severity: 'warning' });
        }
    };

    const handleCancelRequest = async (reqId) => {
        if (!sbUser || !userProfile) return;
        const req = requests.find(r => r.id === reqId);
        if (!req || req.shipperInn !== userProfile.inn) return;

        // Нельзя отменить заявку с принятыми сделками
        const hasAccepted = bids.some(b => b.requestId === reqId && b.status === 'accepted');
        if (hasAccepted) {
            showToast('Нельзя отменить заявку — по ней уже есть принятая сделка.', 'warning');
            return;
        }

        if (!window.confirm('Отменить заявку? Все входящие отклики будут закрыты.')) return;

        const { error } = await supabase.from('requests').update({ status: 'cancelled' }).eq('id', reqId);
        if (error) {
            showToast('Ошибка при отмене заявки', 'error');
            return;
        }
        setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'cancelled' } : r));
        showToast('Заявка отменена и снята с биржи', 'info');
    };

    const handleConfirmDeal = async (bid) => {
        if (!sbUser || !userProfile) return;

        try {
            const isShipper = userProfile.role === 'shipper';
            const updateField = isShipper ? { shipper_confirmed: true } : { owner_confirmed: true };

            const { data: updatedBid, error } = await supabase
                .from('bids')
                .update(updateField)
                .eq('id', bid.id)
                .select()
                .single();

            if (error) throw error;

            const fullyConfirmed = updatedBid.shipper_confirmed && updatedBid.owner_confirmed;

            if (fullyConfirmed && updatedBid.status === 'pending') {
                await supabase.from('bids').update({ status: 'commission_pending' }).eq('id', bid.id);
                setActiveChat(prev => ({ ...prev, ...updateField, status: 'commission_pending' }));
                setBids(prev => prev.map(b => b.id === bid.id ? { ...b, ...updateField, status: 'commission_pending' } : b));
                await supabase.from('messages').insert([{
                    chat_id: bid.id,
                    sender_id: 'system',
                    text: 'Условия согласованы обеими сторонами! Следующий шаг — оплата комиссии платформы (2.5%) для раскрытия контактов партнёра.'
                }]);
            } else {
                setActiveChat(prev => ({ ...prev, ...updateField }));
                setBids(prev => prev.map(b => b.id === bid.id ? { ...b, ...updateField } : b));
                const roleName = isShipper ? 'Грузоотправитель' : 'Владелец';
                await supabase.from('messages').insert([{
                    chat_id: bid.id,
                    sender_id: 'system',
                    text: `${roleName} подтвердил условия. Ожидаем подтверждение второй стороны.`
                }]);
            }

        } catch (e) {
            console.error("Deal confirmation error:", e);
            showToast("Ошибка при подтверждении условий", 'error');
        }
    };

    const handleProposeCommission = async (bidId, mode) => {
        if (!sbUser || !userProfile) return;
        const roleName = userProfile.role === 'shipper' ? 'Грузоотправитель' : 'Владелец';
        const modeText = mode === 'split' ? 'разделить комиссию 50/50' : 'оплатить комиссию полностью';
        const updates = { commission_mode: mode, commission_proposer_id: sbUser.id, commission_agreed: false };
        const { error } = await supabase.from('bids').update(updates).eq('id', bidId);
        if (!error) {
            setActiveChat(prev => ({ ...prev, ...updates }));
            setBids(prev => prev.map(b => b.id === bidId ? { ...b, ...updates } : b));
            await supabase.from('messages').insert([{
                chat_id: bidId, sender_id: 'system',
                text: `${roleName} предлагает ${modeText}. Пожалуйста, подтвердите или отклоните предложение.`
            }]);
            // Уведомление партнёру
            const bid = bids.find(b => b.id === bidId) || activeChat;
            const partnerId = userProfile.role === 'shipper' ? bid?.ownerId : profiles.find(p => p.inn === bid?.shipperInn)?.id;
            if (partnerId) {
                sendNotification(
                    partnerId,
                    'Предложение по оплате комиссии — RailMatch',
                    `Компания «${userProfile.company}» предлагает ${modeText}.\n\nОткройте платформу, чтобы подтвердить или отклонить предложение.`
                );
            }
        }
    };

    const handleApproveCommission = async (bidId) => {
        if (!sbUser || !userProfile) return;
        const roleName = userProfile.role === 'shipper' ? 'Грузоотправитель' : 'Владелец';
        const currentBid = bids.find(b => b.id === bidId) || activeChat;
        const mode = currentBid?.commission_mode;
        const modeText = mode === 'split' ? 'разделение 50/50' : 'полную оплату';
        const updates = { commission_agreed: true };
        const { error } = await supabase.from('bids').update(updates).eq('id', bidId);
        if (!error) {
            setActiveChat(prev => ({ ...prev, ...updates }));
            setBids(prev => prev.map(b => b.id === bidId ? { ...b, ...updates } : b));
            await supabase.from('messages').insert([{
                chat_id: bidId, sender_id: 'system',
                text: `${roleName} подтвердил способ оплаты: ${modeText}. Оба участника теперь могут оплатить комиссию.`
            }]);
            showToast('Способ оплаты согласован! Нажмите «Оплатить комиссию».', 'success');
            // Уведомление тому, кто предлагал
            if (currentBid?.commission_proposer_id && currentBid.commission_proposer_id !== sbUser.id) {
                sendNotification(
                    currentBid.commission_proposer_id,
                    'Партнёр подтвердил способ оплаты — RailMatch',
                    `Компания «${userProfile.company}» согласовала ${modeText}.\n\nОткройте платформу и оплатите комиссию для раскрытия контактов.`
                );
            }
        }
    };

    const handleRejectCommission = async (bidId) => {
        if (!sbUser || !userProfile) return;
        const roleName = userProfile.role === 'shipper' ? 'Грузоотправитель' : 'Владелец';
        const updates = { commission_mode: null, commission_proposer_id: null, commission_agreed: false };
        const { error } = await supabase.from('bids').update(updates).eq('id', bidId);
        if (!error) {
            setActiveChat(prev => ({ ...prev, ...updates }));
            setBids(prev => prev.map(b => b.id === bidId ? { ...b, ...updates } : b));
            await supabase.from('messages').insert([{
                chat_id: bidId, sender_id: 'system',
                text: `${roleName} отклонил предложение. Обсудите и предложите другой вариант оплаты.`
            }]);
            showToast('Предложение отклонено', 'warning');
        }
    };

    // mode: 'split' (half) | 'full' (full commission, contacts revealed immediately)
    const handleCommissionPayment = async (bidId, mode) => {
        if (!sbUser || !userProfile) return;
        const isShipper = userProfile.role === 'shipper';

        const currentBid = bids.find(b => b.id === bidId) || activeChat;
        if (!currentBid) return;

        // Сумма сделки вычисляется только из канонических данных ставки.
        // Никакие клиентские значения не принимаются — защита от занижения комиссии.
        const dealAmount = (currentBid.price * currentBid.wagons) || currentBid.deal_amount || 0;
        if (dealAmount <= 0) return;
        const commissionTotal = Math.round(dealAmount * PLATFORM_COMMISSION_RATE);
        const now = new Date().toISOString();

        const myPaidField = isShipper ? 'shipper_paid' : 'owner_paid';
        const myPaidAtField = isShipper ? 'shipper_paid_at' : 'owner_paid_at';
        const otherPaidField = isShipper ? 'owner_paid' : 'shipper_paid';
        const otherPaidAtField = isShipper ? 'owner_paid_at' : 'shipper_paid_at';
        const otherAlreadyPaid = isShipper ? currentBid.owner_paid : currentBid.shipper_paid;

        let updates = {
            commission_amount: commissionTotal,
            deal_amount: dealAmount,
            [myPaidField]: true,
            [myPaidAtField]: now,
        };

        const willReveal = mode === 'full' || otherAlreadyPaid;

        if (mode === 'full') {
            // Paying full commission upfront — mark other side as paid too
            updates[otherPaidField] = true;
            updates[otherPaidAtField] = now;
        }

        if (willReveal) {
            updates.contacts_revealed = true;
            updates.status = 'contacts_revealed';
        } else {
            // First payer — set 1-hour deadline for the other side
            updates.split_deadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        }

        const { error } = await supabase.from('bids').update(updates).eq('id', bidId);

        if (!error) {
            setActiveChat(prev => ({ ...prev, ...updates }));
            setBids(prev => prev.map(b => b.id === bidId ? { ...b, ...updates } : b));

            const roleName = isShipper ? 'Грузоотправитель' : 'Владелец';
            const halfAmount = Math.round(commissionTotal / 2);
            const msg = willReveal
                ? 'Комиссия оплачена! Контакты партнёра теперь открыты. Удачной сделки!'
                : `${roleName} оплатил свою часть комиссии (${halfAmount.toLocaleString()} ₽). Партнёру отправлено уведомление — у него 1 час для оплаты своей части.`;

            await supabase.from('messages').insert([{ chat_id: bidId, sender_id: 'system', text: msg }]);

            // Уведомление партнёру об оплате
            const partnerId = isShipper ? currentBid.ownerId : profiles.find(p => p.inn === currentBid.shipperInn)?.id;
            if (partnerId) {
                const notifText = willReveal
                    ? `Комиссия полностью оплачена! Контакты партнёра открыты.\n\nОткройте платформу, чтобы увидеть контакты и подписать документы.`
                    : `Компания «${userProfile.company}» оплатила свою часть комиссии (${Math.round(commissionTotal / 2).toLocaleString()} ₽).\n\nУ вас 1 час, чтобы оплатить вашу часть и раскрыть контакты.`;
                sendNotification(
                    partnerId,
                    willReveal ? 'Контакты открыты — сделка завершена! RailMatch' : 'Партнёр оплатил комиссию — ваша очередь! RailMatch',
                    notifText
                );
            }
        }
    };

    const handleDocUpload = async (bidId, stage) => {
        if (!sbUser) return;
        const docField = `${stage}_doc_uploaded`;

        const { error } = await supabase
            .from('bids')
            .update({ [docField]: true })
            .eq('id', bidId);

        if (!error) {
            setActiveChat(prev => ({ ...prev, [docField]: true }));
            const docNames = {
                'payment': 'платёжное поручение',
                'loading': 'подтверждение подачи вагонов',
                'transit': 'ж/д накладную',
                'act': 'акт выполненных работ'
            };
            await supabase.from('messages').insert([{
                chat_id: bidId,
                sender_id: 'system',
                text: `📄 Загружен документ: ${docNames[stage] || stage}`
            }]);
        }
    };

    const handleDocumentSign = async (bidId, docType, blob, formData, mergedData) => {
        if (!sbUser || !userProfile) return;
        try {
            const isShipper = userProfile.role === 'shipper';
            const signField = isShipper ? 'signed_by_shipper' : 'signed_by_owner';
            const signerField = isShipper ? 'signer_shipper_name' : 'signer_owner_name';
            const signerName = formData.signer_name || userProfile.ceo_name || userProfile.company;

            // 1. Try to upload to Supabase Storage
            let filePath = null;
            try {
                const fileName = `${bidId}/${docType}_v1.pdf`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('Documents')
                    .upload(fileName, blob, { contentType: 'application/pdf', upsert: true });
                if (!uploadError) filePath = uploadData?.path || fileName;
            } catch (storageErr) {
                console.warn('Storage upload skipped (bucket may not exist):', storageErr);
            }

            // 2. Save document record to deal_documents
            try {
                await supabase.from('deal_documents').insert([{
                    bid_id: bidId,
                    doc_type: docType,
                    status: 'signed_one',
                    [signField]: true,
                    [signerField]: signerName,
                    file_path: filePath,
                    form_data: formData,
                }]);
            } catch (dbErr) {
                console.warn('deal_documents insert skipped (table may not exist yet):', dbErr);
            }

            // 3. Update bid doc flag
            const docFlagMap = { contract: 'payment_doc_uploaded', gu12: 'loading_doc_uploaded', waybill: 'transit_doc_uploaded', upd: 'act_doc_uploaded', act: 'act_doc_uploaded' };
            const docFlag = docFlagMap[docType];
            if (docFlag) {
                await supabase.from('bids').update({ [docFlag]: true }).eq('id', bidId);
                setActiveChat(prev => ({ ...prev, [docFlag]: true }));
            }

            // 4. System message
            const docNames = { contract: 'Договор ТЭО', gu12: 'Заявка ГУ-12', waybill: 'ЖД-накладная', upd: 'УПД', act: 'Акт выполненных работ' };
            const roleName = isShipper ? 'Грузоотправитель' : 'Владелец';
            await supabase.from('messages').insert([{
                chat_id: bidId,
                sender_id: 'system',
                text: `📝 ${roleName} подписал документ: ${docNames[docType] || docType}`
            }]);

        } catch (e) {
            console.error('Document sign error:', e);
            showToast('Ошибка при подписании документа', 'error');
        }
    };
    const handleCreateRequest = async (data) => {
        if (!sbUser || !userProfile) return;
        const reqData = {
            stationFrom: data.stationFrom,
            stationTo: data.stationTo,
            cargoType: data.cargoType || 'ТНП',
            wagonType: data.wagonType || 'Крытый',
            totalWagons: Number(data.totalWagons || 0),
            totalTons: Number(data.totalTons || 0),
            target_price: Number(data.targetPrice || 0), // Default to 0 instead of NaN if empty
            fulfilledWagons: 0,
            fulfilledTons: 0,
            shipperInn: userProfile.inn || '000000',
            status: 'open'
        }
        const { error, data: insertedReq } = await supabase.from('requests').insert([reqData]);
        if (error) {
            console.error("Error creating request", error);
            showToast("Ошибка при сохранении заявки: " + (error.message || JSON.stringify(error)), 'error');
        } else {
            showToast("Заявка успешно опубликована на бирже!", 'success');
            setView('my-requests');
        }
    };

    const handleAiCreate = (parsedData) => {
        setAiCreateData(parsedData);
        setView('create');
    };

    const handleSeedDemoData = async () => {
        if (!sbUser) return;

        // Сначала создаём демо-профили обеих ролей, чтобы фильтрация по ролям на бирже работала
        const demoProfiles = [
            { id: crypto.randomUUID(), company: 'ДемоГруз ООО', inn: '7700000000', role: 'shipper', phone: '+7 (999) 100-00-01', plan: 'Free', leakage_attempts: 0, daily_profile_views: 0 },
            { id: crypto.randomUUID(), company: 'ДемоГруз-2 ОАО', inn: '7711111111', role: 'shipper', phone: '+7 (999) 100-00-02', plan: 'Free', leakage_attempts: 0, daily_profile_views: 0 },
            { id: crypto.randomUUID(), company: 'ТрансВагон ЗАО', inn: '7722222222', role: 'owner', phone: '+7 (999) 200-00-01', plan: 'Free', leakage_attempts: 0, daily_profile_views: 0 },
            { id: crypto.randomUUID(), company: 'ВагонПарк ООО', inn: '7733333333', role: 'owner', phone: '+7 (999) 200-00-02', plan: 'Free', leakage_attempts: 0, daily_profile_views: 0 },
        ];
        // Upsert чтобы не дублировать
        for (const dp of demoProfiles) {
            await supabase.from('profiles').upsert(dp, { onConflict: 'inn', ignoreDuplicates: true });
        }

        // Заявки от грузоотправителей (видны владельцам)
        const shipperRequests = [
            { stationFrom: 'Москва', stationTo: 'Екатеринбург', cargoType: 'Металл', wagonType: 'Полувагон', totalWagons: 20, totalTons: 1200, target_price: 180000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7700000000', status: 'open' },
            { stationFrom: 'Санкт-Петербург', stationTo: 'Казань', cargoType: 'Уголь', wagonType: 'Полувагон', totalWagons: 50, totalTons: 3500, target_price: 120000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7700000000', status: 'open' },
            { stationFrom: 'Краснодар', stationTo: 'Москва', cargoType: 'Зерно', wagonType: 'Хоппер', totalWagons: 30, totalTons: 2100, target_price: 95000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7700000000', status: 'open' },
            { stationFrom: 'Новосибирск', stationTo: 'Челябинск', cargoType: 'ТНП', wagonType: 'Крытый', totalWagons: 8, totalTons: 480, target_price: 140000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7711111111', status: 'open' },
        ];
        // Заявки от владельцев (видны отправителям)
        const ownerRequests = [
            { stationFrom: 'Екатеринбург', stationTo: 'Москва', cargoType: 'ТНП', wagonType: 'Крытый', totalWagons: 10, totalTons: 600, target_price: 180000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7722222222', status: 'open' },
            { stationFrom: 'Москва', stationTo: 'Челябинск', cargoType: 'ТНП', wagonType: 'Крытый', totalWagons: 15, totalTons: 900, target_price: 150000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7722222222', status: 'open' },
            { stationFrom: 'Казань', stationTo: 'Санкт-Петербург', cargoType: 'Нефть', wagonType: 'Цистерна', totalWagons: 25, totalTons: 1500, target_price: 200000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7733333333', status: 'open' },
            { stationFrom: 'Самара', stationTo: 'Воронеж', cargoType: 'Щебень', wagonType: 'Полувагон', totalWagons: 40, totalTons: 2800, target_price: 85000, fulfilledWagons: 0, fulfilledTons: 0, shipperInn: '7733333333', status: 'open' },
        ];
        const allRequests = [...shipperRequests, ...ownerRequests];
        const { error } = await supabase.from('requests').insert(allRequests);
        if (error) {
            console.error("Error seeding data:", error);
            showToast("Ошибка при добавлении демо-данных", 'error');
        }
    };

    const handleAiSearchResult = (parsed) => {
        if (parsed.intent === 'create' && userProfile?.role === 'shipper') {
            handleAiCreate(parsed);
        } else {
            setIsAiSearching(true);
            // Simulate AI analyzing and comparing prices
            setTimeout(() => {
                setAiFilters(parsed);
                setIsAiSearching(false);
            }, 2000);
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

    // Filter requests for catalog — memoized to prevent re-filtering on every render
    const filteredCatalogRequests = useMemo(() => requests.filter(req => {
        // Скрываем закрытые/завершённые/отменённые заявки с биржи
        if (req.status === 'completed' || req.status === 'closed' || req.status === 'cancelled') return false;

        // Проверка ролей: владельцы видят заявки отправителей, а отправители — предложения владельцев
        if (userProfile && userProfile.role !== 'demo') {
            // Пока профили не загрузились — не показываем ничего (убираем мерцание)
            if (profiles.length === 0) return false;
            const creatorProfile = profiles.find(p => p.inn === req.shipperInn);
            const creatorRole = creatorProfile?.role;
            if (userProfile.role === 'shipper' && creatorRole !== 'owner') return false;
            if (userProfile.role === 'owner' && creatorRole !== 'shipper') return false;
        }

        // Быстрые фильтры
        if (quickFilter.wagonType && req.wagonType !== quickFilter.wagonType) return false;
        if (quickFilter.direction) {
            const dir = quickFilter.direction;
            if (!req.stationFrom.toLowerCase().includes(dir.toLowerCase()) && !req.stationTo.toLowerCase().includes(dir.toLowerCase())) return false;
        }

        if (!aiFilters) return true;
        if (aiFilters.stationFrom && !req.stationFrom.toLowerCase().includes(aiFilters.stationFrom.toLowerCase())) return false;
        if (aiFilters.stationTo && !req.stationTo.toLowerCase().includes(aiFilters.stationTo.toLowerCase())) return false;
        if (aiFilters.wagonType && !req.wagonType.toLowerCase().includes(aiFilters.wagonType.toLowerCase())) return false;
        if (aiFilters.cargoType && !req.cargoType.toLowerCase().includes(aiFilters.cargoType.toLowerCase())) return false;
        return true;
    }), [requests, userProfile, profiles, quickFilter, aiFilters]);

    // Memoize unread indicator — only chats this user participates in, excluding system messages
    const myBidIds = useMemo(() => new Set(
        bids
            .filter(b => b.ownerId === sbUser?.id || requests.find(r => r.id === b.requestId && r.shipperInn === userProfile?.inn))
            .map(b => b.id)
    ), [bids, sbUser, requests, userProfile?.inn]);

    const hasUnread = useMemo(() =>
        messages.some(m => myBidIds.has(m.chat_id) && m.sender_id !== sbUser?.id && m.sender_id !== 'system'),
        [messages, myBidIds, sbUser]
    );

    // Precompute last message time per chat — avoids O(n*m) sort in messenger list
    const lastMsgTimeByChatId = useMemo(() => {
        const map = {};
        for (const m of messages) {
            if (!map[m.chat_id] || m.created_at > map[m.chat_id]) map[m.chat_id] = m.created_at;
        }
        return map;
    }, [messages]);

    // Sorted catalog requests — memoized outside JSX
    const sortedCatalogRequests = useMemo(
        () => [...filteredCatalogRequests].sort((a, b) => (b.target_price || 0) - (a.target_price || 0)),
        [filteredCatalogRequests]
    );

    // --- RENDERING ---

    if (screen === 'landing') return <LandingScreen onStart={() => { setAuthMode('register'); setScreen('auth'); }} onDemo={handleEnterDemo} isDark={isDark} setIsDark={setIsDark} onLogin={() => { setAuthMode('login'); setScreen('auth'); }} onShowTerms={() => setShowTerms(true)} />;

    if (screen === 'auth') return <AuthScreen mode={authMode} setMode={setAuthMode} role={regRole} setRole={setRegRole} onSubmit={handleAuthSubmit} onBack={() => { setScreen('landing'); setAuthMode('login'); }} isDark={isDark} loading={authLoading} />;

    return (
        <ErrorBoundary>
        <div className="min-h-screen transition-colors duration-700 ease-in-out bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white relative origin-top">
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setView('catalog')}>
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform"><TrainFront className="text-white w-5 h-5" /></div>
                        <span className="text-2xl font-black tracking-tight dark:text-white hidden sm:block">RailMatch</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8">
                        <button onClick={() => setView('catalog')} className={`text-sm font-black uppercase tracking-widest transition-all ${view === 'catalog' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>Биржа</button>
                        <button onClick={() => setView('my-requests')} className={`text-sm font-black uppercase tracking-widest transition-all ${view === 'my-requests' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>
                            Мои заявки
                        </button>
                        <button onClick={() => setView('analytics')} className={`text-sm font-black uppercase tracking-widest transition-all ${view === 'analytics' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>Аналитика</button>
                        <button onClick={() => setView('messenger')} className={`text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 ${view === 'messenger' || view === 'chat' ? 'text-blue-600' : 'text-slate-500 hover:text-blue-600'}`}>
                            Сообщения
                            {hasUnread && (
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsDark(!isDark)} className="p-3 text-slate-400 hover:text-blue-600 hover:rotate-[360deg] hover:scale-110 active:scale-95 transition-all duration-700 ease-out rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-900/40 border border-transparent dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 shadow-sm">
                            {isDark ? <Sun className="w-5 h-5 text-orange-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
                        </button>

                        {/* Removed Отклики Counter */}

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

            <main className="max-w-7xl mx-auto px-6 py-10 relative">
                {/* SECURITY WARNING BANNER */}
                {securityWarning && (
                    <div className={`mb-8 p-6 rounded-[2rem] border animate-in fade-in slide-in-from-top-4 duration-500 z-40 shadow-xl flex items-center gap-6 ${securityWarning.severity === 'critical'
                        ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 shadow-red-500/10'
                        : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 shadow-amber-500/10'
                        }`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${securityWarning.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/40 text-red-600' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'}`}>
                            <Ban className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-1">{securityWarning.severity === 'critical' ? 'Критическая угроза' : 'Предупреждение платформы'}</h4>
                            <p className="text-sm font-bold leading-relaxed">{securityWarning.message}</p>
                        </div>
                        <button onClick={() => setSecurityWarning(null)} className="p-3 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-colors">
                            <ArrowRight className="w-5 h-5 rotate-45" />
                        </button>
                    </div>
                )}
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

                        {/* Quick Filters */}
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">Фильтры:</span>
                            {['Крытый', 'Полувагон', 'Цистерна', 'Платформа', 'Хоппер'].map(wt => (
                                <button key={wt} onClick={() => setQuickFilter(prev => ({ ...prev, wagonType: prev.wagonType === wt ? null : wt }))}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${quickFilter.wagonType === wt ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'}`}>
                                    {wt}
                                </button>
                            ))}
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
                            {['Москва', 'Екатеринбург', 'Санкт-Петербург', 'Казань'].map(city => (
                                <button key={city} onClick={() => setQuickFilter(prev => ({ ...prev, direction: prev.direction === city ? null : city }))}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${quickFilter.direction === city ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}>
                                    {city}
                                </button>
                            ))}
                            {(quickFilter.wagonType || quickFilter.direction) && (
                                <button onClick={() => setQuickFilter({ wagonType: null, direction: null })} className="px-4 py-2 rounded-xl text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition-all">
                                    ✕ Сбросить
                                </button>
                            )}
                        </div>

                        {isAiSearching ? (
                            <div className="mt-10 py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                                <Sparkles className="w-12 h-12 text-blue-500 animate-[spin_3s_linear_infinite] mb-6" />
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest mb-2">AI-агент анализирует рынок</h3>
                                <p className="text-sm font-bold text-slate-400 mb-8 max-w-md">Сравниваем ставки, маршруты и тоннаж для поиска самого оптимального варианта...</p>
                                <div className="w-64 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-600 rounded-full animate-[shimmer_2s_infinite] w-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', backgroundSize: '200% 100%' }}></div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Aviasales Logic: Best Recommendation */}
                                {filteredCatalogRequests.length > 0 && (
                                    <div className="mt-10 mb-6 px-6 py-4 bg-blue-600/5 dark:bg-blue-400/5 rounded-3xl border border-blue-600/10 dark:border-blue-400/10 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20"><Sparkles className="w-4 h-4 text-white" /></div>
                                            <span className="text-sm font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Интеллектуальный подбор: Лучшие предложения первыми</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Сортировка: выгода</div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mt-6">
                                    {sortedCatalogRequests.length === 0 ? (
                                        <div className="col-span-full py-20 text-center text-slate-400 font-bold bg-white dark:bg-[#111827] rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center gap-4">
                                            <p>Ничего не найдено по вашему запросу.</p>
                                            <button onClick={handleSeedDemoData} className="px-6 py-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" /> Сгенерировать демо-заявки
                                            </button>
                                        </div>
                                    ) : sortedCatalogRequests.map((req, idx) => {
                                        const creatorProfile = profiles.find(p => p.inn === req.shipperInn);
                                        return (
                                            <div key={req.id} className={idx < 3 ? 'md:col-span-2 xl:col-span-1 relative group animate-in zoom-in-95 duration-500' : 'animate-in fade-in slide-in-from-bottom-4'}>
                                                <RequestCard
                                                    req={req}
                                                    bidCount={bids.filter(b => b.requestId === req.id).length}
                                                    onBid={() => requireAuth(() => {
                                                        setSelectedRequest(req);
                                                        setIsModalOpen(true);
                                                    })}
                                                    rank={idx}
                                                    creatorRole={creatorProfile?.role}
                                                    creatorCompany={creatorProfile?.company}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {view === 'analytics' && <AnalyticsDashboard requests={requests} bids={bids} />}


                {view === 'messenger' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[700px] animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="lg:col-span-1 bg-white dark:bg-[#111827] rounded-[2.5rem] border dark:border-slate-800 p-6 shadow-xl overflow-hidden flex flex-col">
                            <h2 className="text-xl font-black mb-6 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-blue-600" /> Диалоги
                            </h2>
                            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                {(bids || [])
                                    .filter(b => b.ownerId === sbUser?.id || requests.find(r => r.id === b.requestId && r.shipperInn === userProfile?.inn))
                                    .slice()
                                    .sort((a, b) => {
                                        const lastA = lastMsgTimeByChatId[a.id] ?? a.created_at;
                                        const lastB = lastMsgTimeByChatId[b.id] ?? b.created_at;
                                        return new Date(lastB) - new Date(lastA);
                                    })
                                    .map(chatBid => {
                                    const req = requests.find(r => r.id === chatBid.requestId);
                                    const isMeOwner = chatBid.ownerId === sbUser?.id;
                                    const creatorProfile = profiles.find(p => p.inn === req?.shipperInn);
                                    const contactsRevealedForBid = chatBid.contacts_revealed || chatBid.status === 'contacts_revealed' || chatBid.status === 'accepted';
                                    const realPartnerName = isMeOwner ? (creatorProfile?.company || req?.stationTo || 'Заявка') : (chatBid.ownerName || 'Партнёр');
                                    const partnerName = contactsRevealedForBid ? realPartnerName : 'Переговоры';
                                    const isActive = activeChat?.id === chatBid.id;

                                    return (
                                        <div
                                            key={chatBid.id}
                                            onClick={() => setActiveChat(buildChatObject(chatBid, req, profiles))}
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
                                    userProfile={userProfile}
                                    onSend={(text) => handleSendMessage(activeChat.id, text)}
                                    onAccept={() => handleConfirmDeal(activeChat)}
                                    onPayCommission={(mode) => handleCommissionPayment(activeChat.id, mode)}
                                    onProposeCommission={(mode) => handleProposeCommission(activeChat.id, mode)}
                                    onApproveCommission={() => handleApproveCommission(activeChat.id)}
                                    onRejectCommission={() => handleRejectCommission(activeChat.id)}
                                    onDocUpload={(stage) => handleDocUpload(activeChat.id, stage)}
                                    onDocSign={handleDocumentSign}
                                    onBack={() => setActiveChat(null)}
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



                {view === 'my-requests' && (
                    <MyRequestsView
                        requests={requests}
                        bids={bids}
                        userInn={userProfile?.inn}
                        userRole={userProfile?.role}
                        userId={sbUser?.id}
                        profiles={profiles}
                        setView={setView}
                        onAccept={handleConfirmDeal}
                        onChat={(b) => {
                            const req = requests.find(r => r.id === b.requestId);
                            setActiveChat(buildChatObject(b, req, profiles));
                            setView('chat');
                        }}
                        onAiCreate={handleAiCreate}
                        onCancelRequest={handleCancelRequest}
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
                        bids={bids}
                        requests={requests}
                        showToast={showToast}
                        onProfileUpdate={(updated) => setUserProfile(prev => ({ ...prev, ...updated }))}
                    />
                )}

                {view === 'chat' && activeChat && (
                    <div className="animate-in fade-in zoom-in-95 duration-500">
                        <ChatWindow
                            chat={activeChat}
                            messages={(messages || []).filter(m => m.chat_id === activeChat.id)}
                            currentUserId={sbUser?.id}
                            userRole={userProfile?.role}
                            userProfile={userProfile}
                            onSend={(text) => handleSendMessage(activeChat.id, text)}
                            onAccept={() => handleConfirmDeal(activeChat)}
                            onPayCommission={(mode) => handleCommissionPayment(activeChat.id, mode)}
                            onProposeCommission={(mode) => handleProposeCommission(activeChat.id, mode)}
                            onApproveCommission={() => handleApproveCommission(activeChat.id)}
                            onRejectCommission={() => handleRejectCommission(activeChat.id)}
                            onDocUpload={(stage) => handleDocUpload(activeChat.id, stage)}
                            onDocSign={handleDocumentSign}
                            onBack={() => setView('messenger')}
                        />
                    </div>
                )}
            </main>

                    {/* ===== TOAST NOTIFICATIONS ===== */}
            <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
                {toasts.map(toast => (
                    <div key={toast.id} className={`flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl border pointer-events-auto animate-in slide-in-from-right-4 fade-in duration-300 ${
                        toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200' :
                        toast.type === 'error'   ? 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200' :
                        toast.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200' :
                                                   'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                    }`}>
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            toast.type === 'success' ? 'bg-emerald-500' :
                            toast.type === 'error'   ? 'bg-red-500' :
                            toast.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <span className="text-sm font-bold leading-relaxed">{toast.message}</span>
                    </div>
                ))}
            </div>

    {isModalOpen && selectedRequest && (
                <BidModal
                    request={selectedRequest}
                    userLimit={userProfile?.role === 'owner' ? userProfile?.bids_limit : null}
                    onClose={() => setIsModalOpen(false)}
                    onConfirm={handleBidSubmit}
                />
            )}{showDemoAlert && <DemoModal onClose={() => setShowDemoAlert(false)} onReg={() => { setShowDemoAlert(false); setScreen('auth'); }} />}
            {showOnboarding && userProfile && (
                <OnboardingModal role={userProfile.role} onComplete={handleOnboardingComplete} />
            )}
            {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
        </div>
        </ErrorBoundary>
    );
}