import React, { useState, useEffect, useRef } from 'react';
import {
    ArrowLeft, ShieldCheck, MoreVertical, MessageSquare, Send, CheckCircle2,
    FileText, Wallet, Phone, Download, Loader2, Clock, Lock, Unlock,
    Info, PenTool, CreditCard, X, ChevronRight
} from 'lucide-react';
import { downloadDocument } from './DocumentGenerator';
import DocumentSigningModal from './DocumentSigningModal';

export default function ChatWindow({
    chat, messages, currentUserId, userRole, userProfile,
    onSend, onAccept, onPayCommission, onDocSign, onBack
}) {
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [showTinkoffModal, setShowTinkoffModal] = useState(false);
    const [showDocsModal, setShowDocsModal] = useState(false);
    const [paymentMode, setPaymentMode] = useState('split'); // 'split' | 'full'
    const [selectedDoc, setSelectedDoc] = useState('contract');
    const [inputText, setInputText] = useState('');
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    const [docSigningType, setDocSigningType] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const scrollRef = useRef(null);

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

    const handleSend = () => {
        if (!inputText.trim()) return;
        onSend(inputText);
        setInputText('');
    };

    const handleDownloadPDF = () => {
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
                shipper: { company: chat.shipperName, inn: chat.shipperInn },
                owner: { company: chat.ownerName, inn: chat.ownerInn },
            };
            downloadDocument(templateType, dealData);
        } catch (e) {
            console.error('PDF generation failed', e);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // — Derived state —
    const isShipper = userRole === 'shipper';
    const isMyBid = chat.ownerId === currentUserId;
    const contactsRevealed = chat.contacts_revealed || chat.status === 'contacts_revealed' || chat.status === 'accepted';

    const partnerName = contactsRevealed
        ? (isMyBid ? chat.shipperName : chat.ownerName) || 'Партнёр'
        : 'Участник переговоров';
    const partnerPhone = contactsRevealed
        ? (isMyBid ? chat.shipperPhone : chat.ownerPhone)
        : null;

    const dealAmount = chat.deal_amount || (chat.price * chat.wagons) || 0;
    const commissionTotal = Math.round(dealAmount * 0.025);
    const commissionHalf = Math.round(commissionTotal / 2);

    const myHalfPaid = isShipper ? chat.shipper_paid : chat.owner_paid;
    const partnerHalfPaid = isShipper ? chat.owner_paid : chat.shipper_paid;

    const isNegotiating = chat.status === 'pending' || !chat.status;
    const isCommissionPending = chat.status === 'commission_pending' || chat.status === 'pending_payment';

    const myConfirmed = isShipper ? chat.shipper_confirmed : chat.owner_confirmed;

    // Stage index: 0=переговоры, 1=комиссия, 2=контакты открыты
    const stageIndex = contactsRevealed ? 2 : isCommissionPending ? 1 : 0;

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

    // Amount to show in Tinkoff stub
    const tinkoffAmount = (() => {
        if (paymentMode === 'full') return commissionTotal;
        if (myHalfPaid) return commissionHalf; // paying partner's remaining half
        return commissionHalf;
    })();

    return (
        <div className="min-h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white dark:bg-[#111827] h-[800px] rounded-[2.5rem] border dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">

                {/* ===== HEADER ===== */}
                <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md ${contactsRevealed ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-blue-600 to-indigo-600'}`}>
                            {contactsRevealed ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="font-black dark:text-white text-base flex items-center gap-2">
                                {partnerName}
                                {contactsRevealed && (
                                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black">КОНТАКТЫ ОТКРЫТЫ</span>
                                )}
                                {isCommissionPending && !contactsRevealed && (
                                    <span className="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-black">ОЖИДАНИЕ ОПЛАТЫ</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                {contactsRevealed && partnerPhone ? (
                                    <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {partnerPhone}
                                    </span>
                                ) : (
                                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                                        <Lock className="w-3 h-3" /> Контакты скрыты до оплаты комиссии
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Confirm terms button (negotiations stage) */}
                        {isNegotiating && (
                            <button
                                onClick={onAccept}
                                disabled={myConfirmed}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                                    myConfirmed
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                                        : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95'
                                }`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {myConfirmed ? 'Ждём партнёра...' : 'Подтвердить условия'}
                            </button>
                        )}

                        {/* Pay commission button */}
                        {isCommissionPending && !contactsRevealed && (
                            <button
                                onClick={() => setShowCommissionModal(true)}
                                disabled={myHalfPaid && !partnerHalfPaid && timeLeft > 0}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md ${
                                    myHalfPaid && !partnerHalfPaid && timeLeft > 0
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                                        : 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                                }`}
                            >
                                <Wallet className="w-3.5 h-3.5" />
                                {myHalfPaid ? `Ожидаем партнёра (${formatTime(timeLeft)})` : 'Оплатить комиссию'}
                            </button>
                        )}

                        {/* Documents — always accessible */}
                        <button
                            onClick={() => setShowDocsModal(true)}
                            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 transition-all"
                        >
                            <FileText className="w-3.5 h-3.5" /> Документы
                        </button>

                        <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ===== COMMISSION MODAL ===== */}
                {showCommissionModal && (
                    <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex p-4 items-center justify-center animate-in fade-in zoom-in-95">
                        <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-[2rem] shadow-2xl border dark:border-slate-800 overflow-hidden">
                            <button onClick={() => setShowCommissionModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all z-10">
                                <X className="w-4 h-4" />
                            </button>

                            <div className="p-8 pb-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-b border-slate-100 dark:border-slate-800">
                                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 text-amber-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
                                    <CreditCard className="w-7 h-7" />
                                </div>
                                <h3 className="text-2xl font-black dark:text-white mb-2">Оплата комиссии</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    После оплаты комиссии вы получите контакты партнёра и сможете завершить сделку напрямую.
                                </p>
                            </div>

                            <div className="p-8 space-y-5">
                                {/* Deal amount breakdown */}
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 space-y-3 border border-slate-100 dark:border-slate-800">
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-slate-500">Сумма сделки</span>
                                        <span className="dark:text-white font-bold">{dealAmount.toLocaleString()} ₽</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium">
                                        <span className="text-slate-500">Комиссия платформы (2.5%)</span>
                                        <span className="text-rose-500 font-bold">{commissionTotal.toLocaleString()} ₽</span>
                                    </div>
                                </div>

                                {/* Payment options */}
                                <div className="space-y-3">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Вариант оплаты</p>

                                    <label className={`flex items-center gap-4 cursor-pointer p-4 rounded-2xl border-2 transition-all ${paymentMode === 'split' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
                                        <input type="radio" name="payMode" value="split" checked={paymentMode === 'split'} onChange={() => setPaymentMode('split')} className="accent-blue-600" />
                                        <div className="flex-1">
                                            <div className="font-black text-sm dark:text-white">Разделить 50/50</div>
                                            <div className="text-xs text-slate-500 mt-0.5">Вы платите {commissionHalf.toLocaleString()} ₽, партнёр — {commissionHalf.toLocaleString()} ₽</div>
                                        </div>
                                        <span className="text-lg font-black text-blue-600">{commissionHalf.toLocaleString()} ₽</span>
                                    </label>

                                    <label className={`flex items-center gap-4 cursor-pointer p-4 rounded-2xl border-2 transition-all ${paymentMode === 'full' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'}`}>
                                        <input type="radio" name="payMode" value="full" checked={paymentMode === 'full'} onChange={() => setPaymentMode('full')} className="accent-emerald-600" />
                                        <div className="flex-1">
                                            <div className="font-black text-sm dark:text-white">Оплатить полностью</div>
                                            <div className="text-xs text-slate-500 mt-0.5">Контакты откроются сразу, без ожидания партнёра</div>
                                        </div>
                                        <span className="text-lg font-black text-emerald-600">{commissionTotal.toLocaleString()} ₽</span>
                                    </label>
                                </div>

                                {/* Partner payment status */}
                                {partnerHalfPaid && paymentMode === 'split' && (
                                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Партнёр уже оплатил свою часть — контакты откроются сразу!</span>
                                    </div>
                                )}

                                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                                    <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                                        При разделении: если партнёр не оплатит в течение 1 часа, вы получите уведомление с возможностью оплатить за него.
                                    </p>
                                </div>

                                <button
                                    onClick={() => { setShowCommissionModal(false); setShowTinkoffModal(true); }}
                                    className="w-full py-4 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-yellow-400/30 transition-all flex items-center justify-center gap-3"
                                >
                                    <span className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-yellow-400 font-black shrink-0">T</span>
                                    Оплатить через Тинькофф · {paymentMode === 'split' ? commissionHalf.toLocaleString() : commissionTotal.toLocaleString()} ₽
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
                                        {paymentMode === 'full' ? 'Полная оплата — контакты откроются сразу' : 'Оплата своей части (50%)'}
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
                <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-900/30 border-b dark:border-slate-800 z-10">
                    <div className="flex items-center justify-between gap-4">
                        {/* Route + info */}
                        <div className="flex items-center gap-3 text-xs font-bold flex-wrap">
                            <span className="dark:text-white flex items-center gap-1.5">
                                {chat.stationFrom} <ChevronRight className="w-3 h-3 text-blue-500" /> {chat.stationTo}
                            </span>
                            <span className="w-px h-4 bg-slate-200 dark:bg-slate-700"></span>
                            <span className="text-slate-500">{chat.wagons} ваг.</span>
                            <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block"></span>
                            <span className="text-blue-600 dark:text-blue-400 hidden sm:block">{chat.price?.toLocaleString()} ₽/шт</span>
                        </div>

                        {/* 3-stage stepper */}
                        <div className="flex items-center gap-1 shrink-0">
                            {[
                                { label: 'Переговоры', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                                { label: 'Комиссия', icon: <Wallet className="w-3.5 h-3.5" /> },
                                { label: 'Контакты', icon: <Unlock className="w-3.5 h-3.5" /> },
                            ].map((s, i) => (
                                <React.Fragment key={i}>
                                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                        i < stageIndex ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' :
                                        i === stageIndex ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800' :
                                        'text-slate-400'
                                    }`}>
                                        {i < stageIndex ? <CheckCircle2 className="w-3 h-3" /> : s.icon}
                                        {s.label}
                                    </div>
                                    {i < 2 && <div className={`w-3 h-0.5 rounded ${i < stageIndex ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`}></div>}
                                </React.Fragment>
                            ))}
                        </div>
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

                {/* ===== MESSAGES AREA ===== */}
                <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-4 bg-[#fafafa] dark:bg-transparent custom-scrollbar">
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
                <div className="px-6 py-4 bg-white dark:bg-[#111827] border-t dark:border-slate-800">
                    {/* Status banners */}
                    {isCommissionPending && !myHalfPaid && !contactsRevealed && (
                        <div className="mb-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex items-center gap-3">
                            <Wallet className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex-1">Условия согласованы! Оплатите комиссию для получения контактов партнёра</span>
                            <button onClick={() => setShowCommissionModal(true)} className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline whitespace-nowrap">Оплатить</button>
                        </div>
                    )}

                    {contactsRevealed && (
                        <div className="mb-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl flex items-center gap-3">
                            <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Контакты партнёра открыты! Завершайте сделку напрямую.</span>
                        </div>
                    )}

                    <div className="flex gap-3 items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border dark:border-slate-800 focus-within:ring-2 ring-blue-500/20 transition-all">
                        <input
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
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
        </div>
    );
}
