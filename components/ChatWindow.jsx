import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, ShieldCheck, MoreVertical, MessageSquare, Send, CheckCircle2,
    FileText, Wallet, Phone, Download, Loader2, Clock, Lock, Unlock,
    Info, PenTool, CreditCard, X, ChevronRight, ThumbsUp, SplitSquareHorizontal,
    Shield, AlertTriangle, Ban, Star
} from 'lucide-react';
const loadDocGen = () => import('./DocumentGenerator');
import DocumentSigningModal from './DocumentSigningModal';
import { PLATFORM_COMMISSION_RATE, MAX_COMMISSION_ROUNDS } from '../src/constants.js';
import { validateMessageIntent } from '../src/security.js';
import { supabase } from '../src/supabaseClient.js';
import { haptic } from '../src/haptic.js';

export default function ChatWindow({
    chat, messages, currentUserId, userRole, userProfile,
    violationInfo, onDismissViolation,
    onSend, onAccept, onPayCommission, onProposeCommission, onApproveCommission, onDocSign, onBack,
    partnerAverageRating = null, partnerReviewCount = 0
}) {
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [showTinkoffModal, setShowTinkoffModal] = useState(false);
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [paymentMode, setPaymentMode] = useState(() => chat.commission_mode || 'split');
    const [selectedDoc, setSelectedDoc] = useState('contract');
    const [inputText, setInputText] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [docSigningType, setDocSigningType] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [inputWarning, setInputWarning] = useState(false); // pre-send validation hint
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [selectedStars, setSelectedStars] = useState(0);
    const [selectedTags, setSelectedTags] = useState([]);
    const [reviewComment, setReviewComment] = useState('');
    const [isSubmittingReview, setIsSubmittingReview] = useState(false);
    const [reviewSubmitted, setReviewSubmitted] = useState(false);
    const [showReviewsModal, setShowReviewsModal] = useState(false);
    const [partnerReviews, setPartnerReviews] = useState([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const scrollRef = useRef(null);
    const inputWarningTimer = useRef(null);

    // Sync payment mode from agreed commission mode
    useEffect(() => {
        if (chat.commission_mode) setPaymentMode(chat.commission_mode);
    }, [chat.commission_mode]);

    const prevContactsRevealed = useRef(false);
    useEffect(() => {
        const revealed = chat.contacts_revealed || chat.status === 'contacts_revealed' || chat.status === 'accepted';
        if (revealed && !prevContactsRevealed.current) {
            haptic.notification('success');
        }
        prevContactsRevealed.current = revealed;
    }, [chat.contacts_revealed, chat.status]);

    useEffect(() => {
        if (violationInfo) haptic.notification('error');
    }, [violationInfo]);

    // Countdown timer for split payment deadline
    useEffect(() => {
        if (!chat.split_deadline || chat.contacts_revealed) return;
        const update = () => {
            const remaining = new Date(chat.split_deadline) - new Date();
            setTimeLeft(remaining > 0 ? remaining : 0);
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [chat.split_deadline, chat.contacts_revealed]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Pre-send validation: check input as user types (debounced)
    const handleInputChange = (e) => {
        const val = e.target.value;
        setInputText(val);
        clearTimeout(inputWarningTimer.current);
        if (val.trim().length > 2) {
            inputWarningTimer.current = setTimeout(() => {
                const check = validateMessageIntent(val);
                setInputWarning(check.isViolation);
            }, 300);
        } else {
            setInputWarning(false);
        }
    };

    const isChatBlocked = userProfile?.chat_blocked_until && new Date(userProfile.chat_blocked_until) > new Date();
    const isBanned = userProfile?.is_banned;

    const handleSend = () => {
        if (!inputText.trim() || isChatBlocked || isBanned) return;
        haptic.impact('light');
        onSend(inputText);
        setInputText('');
        setInputWarning(false);
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const docTypeMap = { contract: 'contract', act: 'act', upd: 'upd', registry: 'waybill' };
            const templateType = docTypeMap[selectedDoc] || 'contract';
            const dealData = {
                docNumber: chat.id?.slice(0, 8) || 'DRAFT',
                date: chat.created_at || new Date().toISOString(),
                userId: currentUserId,
                stationFrom: chat.stationFrom, stationTo: chat.stationTo,
                cargoType: chat.cargoType, wagonType: chat.wagonType || 'Крытый',
                wagons: chat.wagons, tons: chat.tons, price: chat.price,
                shipper: { company: chat.shipperName, inn: '' },
                owner: { company: chat.ownerName, inn: '' },
            };
            const { downloadDocument } = await loadDocGen();
            downloadDocument(templateType, dealData);
        } catch (e) {
            console.error('PDF generation failed', e);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // — Derived state —
    const isShipper = userRole === 'shipper';
    const isRequestCreator = chat.shipperInn === currentUserId;
    const isMyBid = chat.ownerId === currentUserId;
    const contactsRevealed = chat.contacts_revealed || chat.status === 'contacts_revealed' || chat.status === 'accepted';

    // До оплаты показываем только имя, после — компанию и телефон
    const partnerName = (isMyBid ? chat.shipperName : chat.ownerName) || (isMyBid ? 'Грузоотправитель' : 'Владелец вагонов');
    const partnerCompany = contactsRevealed ? (isMyBid ? chat.shipperCompany : chat.ownerCompany) : null;
    const partnerPhone = contactsRevealed
        ? (isMyBid ? chat.shipperPhone : chat.ownerPhone)
        : null;

    const dealAmount = chat.deal_amount ?? ((chat.price * chat.wagons) || 0);
    const commissionTotal = Math.round(dealAmount * PLATFORM_COMMISSION_RATE);
    const commissionHalf = Math.round(commissionTotal / 2);

    const myHalfPaid = isShipper ? chat.shipper_paid : chat.owner_paid;
    const partnerHalfPaid = isShipper ? chat.owner_paid : chat.shipper_paid;

    const isNegotiating = chat.status === 'pending' || !chat.status;
    const isCommissionPending = chat.status === 'commission_pending' || chat.status === 'pending_payment';

    const myConfirmed = isShipper ? chat.shipper_confirmed : chat.owner_confirmed;

    // Stage index: 0=переговоры, 1=комиссия, 2=контакты открыты
    const stageIndex = contactsRevealed ? 2 : isCommissionPending ? 1 : 0;

    const POSITIVE_TAGS = ['Надёжный', 'Оперативный', 'Честный', 'Рекомендую'];
    const NEGATIVE_TAGS = ['Медлительный', 'Не отвечал', 'Проблемы с оплатой', 'Не рекомендую'];
    const getTagsForRating = (stars) => {
        if (stars >= 4) return POSITIVE_TAGS;
        if (stars <= 2) return NEGATIVE_TAGS;
        return [...POSITIVE_TAGS, ...NEGATIVE_TAGS];
    };

    const hasCompleted = isShipper ? chat.completed_by_shipper : chat.completed_by_owner;
    const partnerId = isMyBid ? chat.shipperInn : chat.ownerId;

    // Commission proposal state
    const commissionRound = chat.commission_round || 0;
    const roundsExhausted = commissionRound >= MAX_COMMISSION_ROUNDS;
    const iProposed = chat.commission_proposer_id === currentUserId;
    const partnerProposed = !!chat.commission_mode && !!chat.commission_proposer_id && !iProposed;
    const commissionAgreed = !!chat.commission_agreed;
    const modeLabel = (chat.commission_mode === 'full' || chat.commission_mode === 'i_pay')
        ? (partnerProposed ? 'Партнёр готов оплатить комиссию' : 'Оплатить полностью')
        : 'Разделить 50/50';

    // Timer display
    const formatTime = (ms) => {
        if (ms === null || ms === undefined) return null;
        if (ms <= 0) return '00:00';
        const h = Math.floor(ms / 3600000);
        const m = Math.floor((ms % 3600000) / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Is the agreed mode "one person pays full"?
    const isFullMode = paymentMode === 'full' || paymentMode === 'i_pay';
    // Who should pay in i_pay mode — only the proposer
    const iAmPayer = isFullMode && chat.commission_proposer_id === currentUserId;
    const partnerIsPayer = isFullMode && chat.commission_proposer_id && chat.commission_proposer_id !== currentUserId;

    const handleConfirmDealCompletion = async () => {
        const completionField = isShipper ? 'completed_by_shipper' : 'completed_by_owner';
        const { error } = await supabase.from('bids')
            .update({ [completionField]: true })
            .eq('id', chat.id);
        if (!error) {
            setSelectedStars(0);
            setSelectedTags([]);
            setReviewComment('');
            setShowRatingModal(true);
        }
    };

    const handleSubmitReview = async () => {
        if (selectedStars === 0 || isSubmittingReview) return;
        setIsSubmittingReview(true);
        const { error } = await supabase.from('reviews').insert([{
            from_user_id: currentUserId,
            to_user_id: partnerId,
            bid_id: chat.id,
            rating: selectedStars,
            tags: selectedTags,
            comment: reviewComment.trim() || null,
        }]);
        setIsSubmittingReview(false);
        if (!error || error.code === '23505') {
            setShowRatingModal(false);
            setReviewSubmitted(true);
        }
    };

    const handleOpenReviewsModal = async () => {
        setShowReviewsModal(true);
        if (partnerReviews.length > 0) return;
        setReviewsLoading(true);
        const { data } = await supabase
            .from('reviews')
            .select('id, rating, tags, comment, created_at, from_user_id')
            .eq('to_user_id', partnerId)
            .order('created_at', { ascending: false });
        setPartnerReviews(data || []);
        setReviewsLoading(false);
    };

    // Amount to show in Tinkoff stub
    const tinkoffAmount = (() => {
        if (isFullMode) return commissionTotal;
        if (myHalfPaid) return commissionHalf;
        return commissionHalf;
    })();

    return (
        <div className="min-h-full flex flex-col animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#111827] h-[100dvh] sm:h-[800px] rounded-none sm:rounded-[2.5rem] border-0 sm:border dark:border-slate-800 sm:shadow-2xl flex flex-col overflow-hidden relative">

                {/* ===== HEADER ===== */}
                <div className="px-3 sm:px-6 py-3 sm:py-4 border-b dark:border-slate-800 bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl z-20">
                    {/* Top row: back + partner info + docs/menu */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 shrink-0">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 ${contactsRevealed ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600'}`}>
                            {contactsRevealed ? <Unlock className="w-4 h-4 sm:w-5 sm:h-5" /> : <Lock className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="font-black dark:text-white text-sm sm:text-base flex items-center gap-1.5 sm:gap-2 truncate">
                                <span className="truncate">{partnerName}</span>
                                {contactsRevealed && (
                                    <span className="text-[8px] sm:text-[9px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-1 sm:px-1.5 py-0.5 rounded font-black shrink-0 whitespace-nowrap">ОТКРЫТЫ</span>
                                )}
                                {isCommissionPending && !contactsRevealed && (
                                    <span className="text-[8px] sm:text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1 sm:px-1.5 py-0.5 rounded font-black shrink-0 whitespace-nowrap">ОПЛАТА</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {contactsRevealed ? (
                                    <>
                                        {partnerCompany && (
                                            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold truncate">
                                                {partnerCompany}
                                            </span>
                                        )}
                                        {partnerPhone && (
                                            <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                                <Phone className="w-3 h-3" /> {partnerPhone}
                                            </span>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> <span className="hidden sm:inline">Компания раскроется после оплаты комиссии</span><span className="sm:hidden">Скрыто до оплаты</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            {contactsRevealed && (
                                <button
                                    onClick={handleOpenReviewsModal}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                                >
                                    <Star className="w-3.5 h-3.5 fill-current" />
                                    {partnerAverageRating != null ? partnerAverageRating.toFixed(1) : 'Отзывы'}
                                </button>
                            )}
                            <button
                                onClick={() => setShowDocsModal(true)}
                                className="p-2 sm:px-4 sm:py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 transition-all"
                            >
                                <FileText className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Документы</span>
                            </button>
                            <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Action buttons row - separate line on mobile */}
                    <div className="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar">
                        {/* Confirm terms button (negotiations stage) */}
                        {isNegotiating && (
                            <button
                                onClick={() => { haptic.impact('heavy'); onAccept(); }}
                                disabled={myConfirmed}
                                className={`px-3 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                                    myConfirmed
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95'
                                }`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {myConfirmed ? 'Ждём партнёра...' : 'Подтвердить условия'}
                            </button>
                        )}

                        {/* Commission flow */}
                        {isCommissionPending && !contactsRevealed && (
                            <>
                                {!chat.commission_mode && !iProposed && (
                                    <button
                                        onClick={() => onProposeCommission(isRequestCreator ? 'i_pay' : 'split')}
                                        className="px-3 sm:px-5 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md bg-amber-500 hover:bg-amber-600 text-white animate-pulse whitespace-nowrap shrink-0"
                                    >
                                        <Wallet className="w-3.5 h-3.5" />
                                        {isRequestCreator
                                            ? <><span className="hidden sm:inline">Взять комиссию на себя</span><span className="sm:hidden">Взять на себя</span></>
                                            : <><span className="hidden sm:inline">Предложить 50/50</span><span className="sm:hidden">50/50</span></>
                                        }
                                    </button>
                                )}

                                {iProposed && !commissionAgreed && (
                                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap shrink-0">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Ожидаем согласия партнёра…</span><span className="sm:hidden">Ожидаем партнёра…</span>
                                    </div>
                                )}

                                {partnerProposed && !commissionAgreed && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[9px] sm:text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest hidden sm:block whitespace-nowrap">
                                            {modeLabel}?
                                        </span>
                                        <button onClick={onApproveCommission} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[9px] sm:text-[10px] font-black flex items-center gap-1.5 transition-all whitespace-nowrap">
                                            <ThumbsUp className="w-3 h-3" /> Принять
                                        </button>
                                        {!roundsExhausted ? (
                                            <button
                                                onClick={() => { haptic.selection(); onProposeCommission(chat.commission_mode === 'i_pay' ? 'split' : 'i_pay'); }}
                                                className="px-3 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-xl text-[9px] sm:text-[10px] font-black flex items-center gap-1.5 transition-all whitespace-nowrap"
                                            >
                                                <SplitSquareHorizontal className="w-3 h-3" />
                                                {chat.commission_mode === 'i_pay'
                                                    ? <span>50/50</span>
                                                    : <><span className="hidden sm:inline">Взять на себя</span><span className="sm:hidden">Взять</span></>
                                                }
                                            </button>
                                        ) : (
                                            <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">Лимит предложений</span>
                                        )}
                                    </div>
                                )}

                                {commissionAgreed && (
                                    partnerIsPayer ? (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-[9px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest whitespace-nowrap shrink-0">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Партнёр оплачивает комиссию
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowCommissionModal(true)}
                                            disabled={myHalfPaid && !partnerHalfPaid && timeLeft > 0}
                                            className={`px-3 sm:px-5 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-md whitespace-nowrap shrink-0 ${
                                                myHalfPaid && !partnerHalfPaid && timeLeft > 0
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white animate-pulse'
                                            }`}
                                        >
                                            <Wallet className="w-3.5 h-3.5" />
                                            {myHalfPaid ? `Ожидаем (${formatTime(timeLeft)})` : isFullMode ? 'Оплатить полностью' : 'Оплатить'}
                                        </button>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* ===== COMMISSION MODAL ===== */}
                {showCommissionModal && (
                    <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex p-3 sm:p-4 items-end sm:items-center justify-center animate-in fade-in zoom-in-95">
                        <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl border dark:border-slate-800 overflow-hidden max-h-[90vh] overflow-y-auto">
                            <button onClick={() => setShowCommissionModal(false)} className="absolute top-3 right-3 sm:top-6 sm:right-6 p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all z-10">
                                <X className="w-4 h-4" />
                            </button>

                            <div className="p-5 sm:p-8 pb-4 sm:pb-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-slate-100 dark:border-slate-800">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
                                    <CreditCard className="w-6 h-6 sm:w-7 sm:h-7" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-black dark:text-white mb-2">Оплата комиссии</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    После оплаты комиссии вы получите контакты партнёра и сможете завершить сделку напрямую.
                                </p>
                            </div>

                            <div className="p-5 sm:p-8 space-y-4 sm:space-y-5">
                                {/* Deal amount breakdown */}
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 sm:p-5 space-y-3 border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-slate-500">Сумма сделки</span>
                                        <span className="dark:text-white font-bold">{dealAmount.toLocaleString()} ₽</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-slate-500">Комиссия платформы (2.5%)</span>
                                        <span className="text-rose-500 font-bold">{commissionTotal.toLocaleString()} ₽</span>
                                    </div>
                                </div>

                                {/* Agreed payment mode (locked) */}
                                <div className="space-y-3">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Согласованный способ</p>
                                    <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${
                                        !isFullMode
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                    }`}>
                                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${!isFullMode ? 'text-blue-600' : 'text-emerald-600'}`} />
                                        <div className="flex-1">
                                            <div className="font-black text-sm dark:text-white">
                                                {!isFullMode ? 'Разделить 50/50' : iAmPayer ? 'Вы оплачиваете полностью' : 'Партнёр оплачивает полностью'}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {!isFullMode
                                                    ? `Ваша часть: ${commissionHalf.toLocaleString()} ₽`
                                                    : iAmPayer
                                                        ? `Полная сумма: ${commissionTotal.toLocaleString()} ₽`
                                                        : 'Вам платить не нужно'}
                                            </div>
                                        </div>
                                        <span className={`text-lg font-black ${!isFullMode ? 'text-blue-600' : 'text-emerald-600'}`}>
                                            {!isFullMode ? commissionHalf.toLocaleString() : iAmPayer ? commissionTotal.toLocaleString() : '0'} ₽
                                        </span>
                                    </div>
                                </div>

                                {/* Partner payment status */}
                                {partnerHalfPaid && paymentMode === 'split' && (
                                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Партнёр уже оплатил свою часть — контакты откроются сразу!</span>
                                    </div>
                                )}

                                {!isFullMode && (
                                    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                            При разделении: если партнёр не оплатит в течение 1 часа, вы получите уведомление с возможностью оплатить за него.
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={() => { setShowCommissionModal(false); setShowTinkoffModal(true); }}
                                    className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-yellow-400/30 transition-all flex items-center justify-center gap-3"
                                >
                                    <span className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-yellow-400 font-black shrink-0">T</span>
                                    Оплатить через Тинькофф · {tinkoffAmount.toLocaleString()} ₽
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== TINKOFF PAYMENT STUB ===== */}
                {showTinkoffModal && (
                    <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex p-4 items-center justify-center animate-in fade-in zoom-in-95">
                        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden">
                            <div className="bg-yellow-400 px-6 py-5 flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                                    <span className="text-yellow-400 font-black text-lg">T</span>
                                </div>
                                <div>
                                    <div className="font-black text-slate-900">Тинькофф Бизнес</div>
                                    <div className="text-xs text-slate-700 font-medium">Безопасная оплата</div>
                                </div>
                            </div>

                            <div className="p-6 space-y-4">
                                <div className="text-center py-2">
                                    <div className="text-3xl font-black text-slate-900 mb-1">{tinkoffAmount.toLocaleString()} ₽</div>
                                    <div className="text-xs text-slate-500 font-medium">Комиссия платформы RailMatch</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                        {isFullMode ? 'Полная оплата — контакты откроются сразу' : 'Оплата своей части (50%)'}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <input disabled placeholder="•••• •••• •••• ••••" className="w-full px-4 py-3 bg-slate-100 rounded-xl text-sm font-bold text-slate-400 outline-none" />
                                    <div className="flex gap-3">
                                        <input disabled placeholder="ММ/ГГ" className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm font-bold text-slate-400 outline-none" />
                                        <input disabled placeholder="CVV" className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-sm font-bold text-slate-400 outline-none" />
                                    </div>
                                </div>

                                <div className="text-center text-xs text-slate-400 font-medium py-1">
                                    Демо-режим: оплата засчитывается автоматически
                                </div>

                                <button
                                    onClick={async () => {
                                        haptic.impact('heavy');
                                        setIsProcessingPayment(true);
                                        await new Promise(r => setTimeout(r, 2000));
                                        setIsProcessingPayment(false);
                                        setShowTinkoffModal(false);
                                        await onPayCommission(paymentMode);
                                    }}
                                    disabled={isProcessingPayment}
                                    className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-70 text-slate-900 rounded-xl font-black transition-all flex items-center justify-center gap-2"
                                >
                                    {isProcessingPayment
                                        ? <><Loader2 className="w-5 h-5 animate-spin" /> Обработка...</>
                                        : 'Оплатить'
                                    }
                                </button>

                                <button onClick={() => setShowTinkoffModal(false)} className="w-full py-3 text-slate-400 text-sm font-bold hover:text-slate-600 transition-colors">
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== DOCUMENTS MODAL ===== */}
                {showDocsModal && (
                    <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col p-4 md:p-10 items-center justify-start overflow-y-auto animate-in fade-in zoom-in-95">
                        <button onClick={() => setShowDocsModal(false)} className="absolute top-4 right-4 md:top-10 md:right-10 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all z-50">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="w-full max-w-3xl flex flex-col items-center mt-12 md:mt-0">
                            <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Документы для личного использования</p>

                            {/* Doc type tabs */}
                            <div className="flex gap-2 mb-6 bg-white/10 p-2 rounded-2xl overflow-x-auto w-full shrink-0 no-scrollbar">
                                {[
                                    { id: 'contract', label: 'Договор-заявка' },
                                    { id: 'act', label: 'Акт вып. работ' },
                                    { id: 'upd', label: 'УПД' },
                                    { id: 'registry', label: 'Реестр вагонов' },
                                ].map(doc => (
                                    <button
                                        key={doc.id}
                                        onClick={() => setSelectedDoc(doc.id)}
                                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedDoc === doc.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        {doc.label}
                                    </button>
                                ))}
                            </div>

                            <div className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden text-slate-800">
                                <div className="p-10 border-b-2 border-dashed border-slate-200">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <div className="flex items-center gap-2 text-blue-600 font-black text-xl mb-1">RailMatch</div>
                                            <div className="text-[10px] text-slate-400 font-bold">Платформа железнодорожной логистики</div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-slate-400">
                                                {selectedDoc === 'contract' && 'Договор-заявка'}
                                                {selectedDoc === 'act' && 'Акт выполненных работ'}
                                                {selectedDoc === 'upd' && 'УПД'}
                                                {selectedDoc === 'registry' && 'Реестр отгруженных вагонов'}
                                                {' № '}{chat.id?.slice(0, 8)}
                                            </p>
                                            <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8 space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Грузоотправитель:</span>
                                            <span className="font-bold">{contactsRevealed ? (chat.shipperName || '—') : '[Скрыто до оплаты комиссии]'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Владелец парка:</span>
                                            <span className="font-bold">{contactsRevealed ? (chat.ownerName || '—') : '[Скрыто до оплаты комиссии]'}</span>
                                        </div>
                                        <div className="w-full h-px bg-slate-200"></div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Маршрут:</span>
                                            <span className="font-bold">{chat.stationFrom} → {chat.stationTo}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Груз / тип вагона:</span>
                                            <span className="font-bold">{chat.cargoType} / {chat.wagonType || 'Крытый'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Объём:</span>
                                            <span className="font-bold">{chat.wagons} вагонов · {chat.price?.toLocaleString()} ₽/шт</span>
                                        </div>
                                    </div>

                                    {selectedDoc === 'contract' && (
                                        <div className="space-y-3">
                                            <h4 className="font-black text-lg">Предмет договора</h4>
                                            <p className="text-sm leading-relaxed">Владелец обязуется предоставить под погрузку технически исправный железнодорожный подвижной состав в количестве {chat.wagons} шт., а Грузоотправитель — оплатить услуги по тарифу {chat.price?.toLocaleString()} руб./ваг. Общая сумма договора: {dealAmount.toLocaleString()} руб.</p>
                                            <p className="text-xs text-slate-400">Документ носит информационный характер и предназначен для личного использования сторон.</p>
                                        </div>
                                    )}
                                    {selectedDoc === 'act' && (
                                        <div className="space-y-3">
                                            <h4 className="font-black text-lg">Сведения о выполненных работах</h4>
                                            <p className="text-sm leading-relaxed">Услуги по предоставлению подвижного состава ({chat.wagons} вагонов) выполнены в полном объёме и надлежащем качестве.</p>
                                            <div className="flex justify-between text-lg font-black pt-4 border-t border-slate-200">
                                                <span className="uppercase tracking-widest">ИТОГО:</span>
                                                <span>{dealAmount.toLocaleString()} ₽</span>
                                            </div>
                                        </div>
                                    )}
                                    {selectedDoc === 'upd' && (
                                        <div className="space-y-3">
                                            <h4 className="font-black text-lg">УПД (Статус: 1)</h4>
                                            <table className="w-full text-left text-xs">
                                                <thead><tr className="border-b border-slate-200"><th className="pb-2">Наименование</th><th className="pb-2">Кол-во</th><th className="pb-2">Цена</th><th className="pb-2 text-right">Сумма</th></tr></thead>
                                                <tbody><tr><td className="py-3">Предоставление вагонов</td><td className="py-3">{chat.wagons}</td><td className="py-3">{chat.price?.toLocaleString()}</td><td className="py-3 text-right font-bold">{dealAmount.toLocaleString()}</td></tr></tbody>
                                            </table>
                                            <div className="flex justify-end text-lg font-black pt-4 border-t border-slate-200">
                                                <span className="mr-8 text-sm uppercase tracking-widest self-center">Итого:</span>
                                                <span>{dealAmount.toLocaleString()} ₽</span>
                                            </div>
                                        </div>
                                    )}
                                    {selectedDoc === 'registry' && (
                                        <div className="space-y-3">
                                            <h4 className="font-black text-lg">Реестр отгруженных вагонов</h4>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                                                {Array.from({ length: Math.min(chat.wagons || 8, 16) }).map((_, idx) => (
                                                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                                        <span className="font-bold text-slate-400 font-sans">№ {(idx + 1).toString().padStart(2, '0')}</span>
                                                        <span>{Math.floor(60000000 + Math.random() * 10000000)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {(chat.wagons || 0) > 16 && <p className="text-xs text-slate-400 text-center">... и ещё {chat.wagons - 16} вагонов</p>}
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 bg-slate-50 flex flex-col md:flex-row gap-4 justify-between items-center">
                                    <p className="text-[10px] text-slate-400 font-bold max-w-xs text-center md:text-left leading-relaxed">
                                        Документы носят информационный характер и предназначены для личного использования. Названия сторон скрыты до оплаты комиссии.
                                    </p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleDownloadPDF}
                                            disabled={isGeneratingPdf}
                                            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                        >
                                            {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                            Скачать PDF
                                        </button>
                                        <button
                                            onClick={() => { setDocSigningType(selectedDoc); setShowDocsModal(false); }}
                                            className="px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg"
                                        >
                                            <PenTool className="w-4 h-4" /> Подписать
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ===== DEAL PIPELINE STEPPER ===== */}
                <div className="px-3 sm:px-6 py-2 sm:py-3 bg-slate-50/80 dark:bg-slate-900/30 border-b dark:border-slate-800 z-10">
                    {/* Row 1: Route info */}
                    <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs font-bold mb-2">
                        <span className="dark:text-white flex items-center gap-1 sm:gap-1.5 truncate max-w-[45vw] sm:max-w-none">
                            {chat.stationFrom} <ChevronRight className="w-3 h-3 text-blue-500 shrink-0" /> {chat.stationTo}
                        </span>
                        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0"></span>
                        <span className="text-slate-500 shrink-0">{chat.wagons} ваг.</span>
                        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block shrink-0"></span>
                        <span className="text-blue-600 dark:text-blue-400 hidden sm:block shrink-0">{chat.price?.toLocaleString()} ₽/шт</span>
                    </div>

                    {/* Row 2: Full-width 3-stage stepper */}
                    <div className="flex items-center w-full gap-0">
                        {[
                            { label: 'Переговоры', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                            { label: 'Комиссия', icon: <Wallet className="w-3.5 h-3.5" /> },
                            { label: 'Контакты', icon: <Unlock className="w-3.5 h-3.5" /> },
                        ].map((s, i) => (
                            <React.Fragment key={i}>
                                <div className={`flex-1 flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                                    i < stageIndex ? 'text-emerald-500' :
                                    i === stageIndex ? 'text-blue-600' :
                                    'text-slate-400 dark:text-slate-600'
                                }`}>
                                    <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                                        i < stageIndex ? 'bg-emerald-100 dark:bg-emerald-900/30' :
                                        i === stageIndex ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-300 dark:ring-blue-700' :
                                        'bg-slate-100 dark:bg-slate-800'
                                    }`}>
                                        {i < stageIndex ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.icon}
                                    </div>
                                    <span className="leading-none">{s.label}</span>
                                </div>
                                {i < 2 && (
                                    <div className={`flex-1 h-0.5 rounded mt-[-10px] mb-[10px] mx-1 ${i < stageIndex ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Split payment timer banner */}
                    {isCommissionPending && myHalfPaid && !partnerHalfPaid && !contactsRevealed && (
                        <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                                    Ожидаем оплату от партнёра
                                    {timeLeft !== null && timeLeft > 0 && ` · ${formatTime(timeLeft)}`}
                                </span>
                            </div>
                            {timeLeft === 0 && (
                                <button
                                    onClick={() => { setPaymentMode('full'); setShowTinkoffModal(true); }}
                                    className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline whitespace-nowrap"
                                >
                                    Оплатить за партнёра ({commissionHalf.toLocaleString()} ₽)
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* ===== ПОСТОЯННАЯ ПЛАШКА БЕЗОПАСНОСТИ (Уровень 3) ===== */}
                <div className="px-3 sm:px-6 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/50 flex items-center gap-3">
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <p className="text-[10px] sm:text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                        Передача контактов вне платформы = блокировка аккаунта. Раскрывайте контакты через кнопку «Раскрыть контакты».
                        <span className="hidden sm:inline text-amber-500 dark:text-amber-500/70"> Верификация, история сделок и защита при спорах действуют только внутри RailMatch.</span>
                    </p>
                </div>

                {/* ===== МОДАЛЬНОЕ ОКНО НАРУШЕНИЯ (Уровень 3) ===== */}
                {violationInfo && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300">
                            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6 ${
                                violationInfo.sanctionLevel === 'banned' ? 'bg-red-100 dark:bg-red-900/40 text-red-600' :
                                violationInfo.sanctionLevel === 'blocked' ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-600' :
                                violationInfo.sanctionLevel === 'unverified' ? 'bg-red-100 dark:bg-red-900/40 text-red-600' :
                                'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
                            }`}>
                                {violationInfo.sanctionLevel === 'banned' ? <Ban className="w-8 h-8" /> :
                                 violationInfo.sanctionLevel === 'blocked' ? <Lock className="w-8 h-8" /> :
                                 <AlertTriangle className="w-8 h-8" />}
                            </div>
                            <h3 className="text-center text-lg font-black dark:text-white uppercase tracking-wider mb-3">
                                {violationInfo.sanctionLevel === 'banned' ? 'Аккаунт заблокирован' :
                                 violationInfo.sanctionLevel === 'blocked' ? 'Чат заблокирован' :
                                 violationInfo.sanctionLevel === 'unverified' ? 'Верификация снята' :
                                 'Сообщение заблокировано'}
                            </h3>
                            <p className="text-center text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                {violationInfo.message}
                            </p>
                            <div className="text-center text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
                                Нарушений: {violationInfo.warningCount}
                            </div>
                            <p className="text-center text-xs text-slate-500 dark:text-slate-500 mb-6 leading-relaxed">
                                Защита сделки действует только при оплате через RailMatch. Используйте кнопку «Раскрыть контакты» для безопасной передачи данных.
                            </p>
                            <button
                                onClick={onDismissViolation}
                                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm uppercase tracking-widest rounded-2xl hover:opacity-90 transition-opacity"
                            >
                                Понятно
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== MESSAGES AREA ===== */}
                <div ref={scrollRef} className="flex-1 p-3 sm:p-8 overflow-y-auto space-y-3 sm:space-y-4 bg-[#fafafa] dark:bg-transparent custom-scrollbar">
                    {(!messages || messages.length === 0) ? (
                        <div className="h-full flex flex-col justify-center items-center text-center opacity-40">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 mb-6">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black dark:text-white uppercase tracking-[0.2em]">Начало диалога</h3>
                            <p className="text-xs text-slate-500 max-w-xs mt-3 font-bold leading-relaxed">
                                Обсудите условия перевозки, затем нажмите «Подтвердить условия» для перехода к оплате комиссии и раскрытию контактов.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.sender_id === currentUserId;
                            const isSystem = msg.sender_id === 'system';

                            if (isSystem) {
                                return (
                                    <div key={msg.id || i} className="flex justify-center animate-in fade-in slide-in-from-bottom-2">
                                        <div className="max-w-[85%] px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 text-center shadow-sm">
                                            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-relaxed">{msg.text}</p>
                                            <div className="text-[9px] mt-1.5 font-black uppercase tracking-widest text-blue-400/60">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • система
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                    <div className={`max-w-[75%] p-5 rounded-[2.5rem] shadow-sm ${isMe
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-slate-800 dark:text-white rounded-bl-none border dark:border-slate-700'
                                    }`}>
                                        <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                                        <div className={`text-[9px] mt-2 font-black uppercase tracking-widest opacity-40 flex items-center gap-2 ${isMe ? 'text-blue-100 justify-end' : 'text-slate-400'}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {isMe && <CheckCircle2 className="w-3 h-3" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ===== INPUT AREA ===== */}
                <div className="px-3 sm:px-6 py-3 sm:py-4 bg-white dark:bg-[#111827] border-t dark:border-slate-800">
                    {/* Status banners */}
                    {isCommissionPending && !myHalfPaid && !contactsRevealed && !partnerIsPayer && (
                        <div className="mb-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex items-center gap-3">
                            <Wallet className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex-1">
                                {commissionAgreed
                                    ? (isFullMode ? 'Оплатите полную комиссию для раскрытия контактов' : 'Оплатите свою часть комиссии для получения контактов партнёра')
                                    : 'Условия согласованы! Договоритесь о способе оплаты комиссии'}
                            </span>
                            {commissionAgreed && (
                                <button onClick={() => setShowCommissionModal(true)} className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline whitespace-nowrap">Оплатить</button>
                            )}
                        </div>
                    )}
                    {isCommissionPending && !contactsRevealed && partnerIsPayer && !myHalfPaid && (
                        <div className="mb-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl flex items-center gap-3">
                            <Info className="w-4 h-4 text-blue-500 shrink-0" />
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex-1">Партнёр взял комиссию на себя. Ожидайте оплату и раскрытие контактов.</span>
                        </div>
                    )}

                    {contactsRevealed && (
                        <div className="mb-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl flex items-center gap-3">
                            <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Контакты партнёра открыты! Завершайте сделку напрямую.</span>
                        </div>
                    )}

                    {contactsRevealed && (
                        <div className="px-0 pb-3">
                            {reviewSubmitted || hasCompleted ? (
                                <div className="text-center text-[11px] text-slate-400 py-2">Вы оценили партнёра</div>
                            ) : (
                                <button
                                    onClick={handleConfirmDealCompletion}
                                    className="w-full py-2 rounded-xl text-[12px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                                >
                                    Подтвердить завершение сделки
                                </button>
                            )}
                        </div>
                    )}

                    {/* Pre-send warning */}
                    {inputWarning && (
                        <div className="mb-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-xl flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400">Обнаружены контактные данные. Сообщение будет заблокировано.</span>
                        </div>
                    )}

                    {isBanned ? (
                        <div className="flex items-center justify-center gap-3 py-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800/50">
                            <Ban className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-bold text-red-600 dark:text-red-400">Аккаунт заблокирован. Отправка сообщений недоступна.</span>
                        </div>
                    ) : isChatBlocked ? (
                        <div className="flex items-center justify-center gap-3 py-4 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800/50">
                            <Lock className="w-5 h-5 text-orange-500" />
                            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                                Чат заблокирован до {new Date(userProfile.chat_blocked_until).toLocaleString('ru-RU')}
                            </span>
                        </div>
                    ) : (
                        <div className={`flex gap-3 items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border transition-all ${
                            inputWarning
                                ? 'border-red-300 dark:border-red-700 ring-2 ring-red-500/20'
                                : 'dark:border-slate-800 focus-within:ring-2 ring-blue-500/20'
                        }`}>
                            <input
                                value={inputText}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                onFocus={() => { setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 350); }}
                                placeholder="Напишите сообщение..."
                                className="flex-1 bg-transparent px-4 py-3 outline-none dark:text-white font-bold text-sm placeholder:text-slate-400"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputText.trim()}
                                className="w-11 h-11 bg-blue-600 disabled:opacity-50 text-white rounded-xl flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* ===== DOCUMENT SIGNING MODAL ===== */}
                {docSigningType && (
                    <DocumentSigningModal
                        docType={docSigningType}
                        deal={chat}
                        userRole={userRole}
                        userProfile={userProfile}
                        onSign={async (type, blob, formData, mergedData) => {
                            if (onDocSign) await onDocSign(chat.id, type, blob, formData, mergedData);
                            setDocSigningType(null);
                        }}
                        onClose={() => setDocSigningType(null)}
                    />
                )}
            </div>

            {/* ===== REVIEWS MODAL ===== */}
            {showReviewsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-black dark:text-white">Отзывы о партнёре</h2>
                            <button onClick={() => setShowReviewsModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {reviewsLoading ? (
                            <div className="text-center text-slate-400 py-8 text-[13px]">Загрузка...</div>
                        ) : partnerReviews.length === 0 ? (
                            <div className="text-center text-slate-400 py-8 text-[13px]">Отзывов пока нет</div>
                        ) : (() => {
                            const avg = partnerReviews.reduce((s, r) => s + r.rating, 0) / partnerReviews.length;
                            const positive = partnerReviews.filter(r => r.rating >= 4).length;
                            const negative = partnerReviews.filter(r => r.rating <= 2).length;
                            return (
                                <>
                                    <div className="flex items-center gap-4 mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-amber-500">{avg.toFixed(1)}</div>
                                            <div className="flex gap-0.5 justify-center mt-0.5">
                                                {[1,2,3,4,5].map(n => (
                                                    <Star key={n} className={`w-3 h-3 ${n <= Math.round(avg) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                                                ))}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{partnerReviews.length} отзывов</div>
                                        </div>
                                        <div className="flex flex-col gap-1 text-[11px]">
                                            <span className="text-emerald-600 font-bold">+ {positive} положительных</span>
                                            <span className="text-red-500 font-bold">- {negative} отрицательных</span>
                                        </div>
                                    </div>

                                    <div className="overflow-y-auto flex-1 flex flex-col gap-3">
                                        {partnerReviews.map(review => {
                                            const isOwn = review.from_user_id === currentUserId;
                                            return (
                                                <div key={review.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <div className="flex gap-0.5">
                                                            {[1,2,3,4,5].map(n => (
                                                                <Star key={n} className={`w-3.5 h-3.5 ${n <= review.rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
                                                            ))}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400">
                                                            {isOwn ? 'Ваш отзыв · ' : ''}{new Date(review.created_at).toLocaleDateString('ru-RU')}
                                                        </span>
                                                    </div>
                                                    {review.tags?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mb-1.5">
                                                            {review.tags.map(tag => (
                                                                <span key={tag} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300">{tag}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {review.comment && (
                                                        <p className="text-[12px] text-slate-600 dark:text-slate-300">{review.comment}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* ===== RATING MODAL ===== */}
            {showRatingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-base font-black dark:text-white">Оцените партнёра</h2>
                            <button onClick={() => setShowRatingModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex justify-center gap-2 mb-5">
                            {[1,2,3,4,5].map(n => (
                                <button key={n} onClick={() => { setSelectedStars(n); setSelectedTags([]); }}>
                                    <Star className={`w-9 h-9 transition-colors ${n <= selectedStars ? 'text-amber-400 fill-current' : 'text-slate-200 dark:text-slate-700'}`} />
                                </button>
                            ))}
                        </div>

                        {selectedStars > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {getTagsForRating(selectedStars).map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => setSelectedTags(prev =>
                                            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                                        )}
                                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                                            selectedTags.includes(tag)
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                        }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                        )}

                        <textarea
                            value={reviewComment}
                            onChange={e => setReviewComment(e.target.value)}
                            placeholder="Комментарий (необязательно)"
                            maxLength={300}
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-200 px-3 py-2 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <button
                            onClick={handleSubmitReview}
                            disabled={selectedStars === 0 || isSubmittingReview}
                            className="w-full py-3 rounded-2xl text-[13px] font-black bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmittingReview ? 'Отправка...' : 'Отправить оценку'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
