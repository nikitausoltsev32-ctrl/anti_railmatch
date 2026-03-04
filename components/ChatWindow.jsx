import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ShieldCheck, MoreVertical, MessageSquare, Send, CheckCircle2, FileText, Ban, Wallet, Package, TrainFront, Phone, Download, Loader2, Upload, Clock, AlertCircle, Truck, ClipboardCheck, ChevronDown, ChevronUp, Info, PenTool } from 'lucide-react';
import { downloadDocument } from './DocumentGenerator';
import DocumentSigningModal from './DocumentSigningModal';

export default function ChatWindow({ chat, messages, currentUserId, userRole, userProfile, onSend, onAccept, onEscrow, onCommissionAccept, onStageConfirm, onDocUpload, onDocSign, onBack, maskContact }) {
    const [showDocs, setShowDocs] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showCommissionModal, setShowCommissionModal] = useState(false);
    const [commissionChecked, setCommissionChecked] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState('invoice');
    const [inputText, setInputText] = useState("");
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [expandedStage, setExpandedStage] = useState(null);
    const [uploadingStage, setUploadingStage] = useState(null);
    const [docSigningType, setDocSigningType] = useState(null);
    const scrollRef = useRef(null);
    const pdfRef = useRef(null);

    const handleDownloadPDF = () => {
        setIsGeneratingPdf(true);
        try {
            const docTypeMap = { invoice: 'contract', contract: 'contract', act: 'act', upd: 'upd', registry: 'waybill' };
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
                signerShipper: { name: chat.shipperSignerName, position: 'Генеральный директор' },
                signerOwner: { name: chat.ownerSignerName, position: 'Генеральный директор' },
            };
            downloadDocument(templateType, dealData);
        } catch (error) {
            console.error('Failed to generate PDF', error);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const handleDocUploadClick = async (stage) => {
        setUploadingStage(stage);
        // Имитация загрузки (1.5 секунды)
        setTimeout(() => {
            onDocUpload(stage);
            setUploadingStage(null);
        }, 1500);
    };

    // Автопрокрутка вниз при новых сообщениях
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        onSend(inputText);
        setInputText("");
    };

    const isAccepted = chat.status === 'accepted';
    const isShipper = userRole === 'shipper';

    // Определяем, кто является партнером для текущего пользователя
    const isMyBid = chat.ownerId === currentUserId;
    const partnerName = isMyBid ? chat.shipperName : chat.ownerName;
    const partnerPhone = isMyBid ? chat.shipperPhone : chat.ownerPhone;

    // Статусы этапов
    const statusMap = { 'pending': 0, 'pending_payment': 1, 'escrow_held': 1, 'loading': 2, 'in_transit': 3, 'accepted': 4 };
    const currentStage = statusMap[chat.status] ?? 0;

    // Конфигурация этапов
    const stages = [
        {
            key: 'negotiations',
            label: 'Переговоры',
            icon: <MessageSquare className="w-3.5 h-3.5" />,
            description: 'Согласование условий перевозки',
            action: null
        },
        {
            key: 'payment',
            label: 'Платёж',
            icon: <Wallet className="w-3.5 h-3.5" />,
            description: 'Внесение гарантийного платежа (эскроу)',
            docName: 'Платёжное поручение',
            action: currentStage === 1 && isShipper && chat.status === 'pending_payment' ? 'payment' : null
        },
        {
            key: 'loading',
            label: 'Погрузка',
            icon: <Package className="w-3.5 h-3.5" />,
            description: 'Подача вагонов и погрузка груза',
            docName: 'Ж/д накладная',
            action: currentStage === 1 && chat.status === 'escrow_held' ? 'escrow_confirm' :
                currentStage === 2 ? 'loading_confirm' : null
        },
        {
            key: 'transit',
            label: 'В пути',
            icon: <Truck className="w-3.5 h-3.5" />,
            description: 'Груз в пути следования',
            docName: 'Транспортная накладная',
            action: currentStage === 3 ? 'transit_confirm' : null
        },
        {
            key: 'act',
            label: 'Акт',
            icon: <ClipboardCheck className="w-3.5 h-3.5" />,
            description: 'Подписание акта выполненных работ',
            docName: 'Акт выполненных работ',
            action: null
        }
    ];

    return (
        <div className="min-h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white dark:bg-[#111827] h-[800px] rounded-[2.5rem] border dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">

                {/* Compact Header */}
                <div className="px-6 py-4 border-b dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md relative">
                            <MessageSquare className="w-5 h-5" />
                            {isAccepted && <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#111827]"><CheckCircle2 className="w-2.5 h-2.5" /></div>}
                        </div>
                        <div>
                            <div className="font-black dark:text-white text-base flex items-center gap-2">
                                {partnerName || 'Переговоры'}
                                {isAccepted && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black">ЗАВЕРШЕНО</span>}
                                {chat.status === 'pending_payment' && <span className="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-black">ОЖИДАНИЕ ОПЛАТЫ</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Проверен</span>
                                <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1"><Phone className="w-3 h-3" /> {maskContact(partnerPhone, chat.status === 'escrow_held' || chat.status === 'loading' || chat.status === 'in_transit' || isAccepted)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Кнопка оформления сделки (этап Переговоры) */}
                        {!isAccepted && currentStage === 0 && (
                            <button
                                onClick={onAccept}
                                disabled={isShipper ? chat.shipper_confirmed : chat.owner_confirmed}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${(isShipper ? chat.shipper_confirmed : chat.owner_confirmed)
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-95'
                                    }`}
                            >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                {(isShipper ? chat.shipper_confirmed : chat.owner_confirmed) ? 'Ждем партнера...' : 'Оформить сделку'}
                            </button>
                        )}

                        {/* Кнопка платежа — только после принятия комиссии обеими сторонами */}
                        {chat.status === 'pending_payment' && isShipper && (
                            <button
                                onClick={() => {
                                    if (!chat.commission_accepted_shipper || !chat.commission_accepted_owner) {
                                        setShowCommissionModal(true);
                                    } else {
                                        setShowPaymentModal(true);
                                    }
                                }}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-2 ring-2 ring-blue-400/30 ring-offset-2 ring-offset-white dark:ring-offset-[#111827]"
                            >
                                <Wallet className="w-3.5 h-3.5" /> Внести гарантийный платеж
                            </button>
                        )}

                        {/* Кнопка принятия комиссии для владельца */}
                        {chat.status === 'pending_payment' && !isShipper && !chat.commission_accepted_owner && (
                            <button
                                onClick={() => setShowCommissionModal(true)}
                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-2 animate-pulse"
                            >
                                <AlertCircle className="w-3.5 h-3.5" /> Принять условия
                            </button>
                        )}

                        {/* Кнопка "ждём партнёра" для владельца на стадии оплаты */}
                        {chat.status === 'pending_payment' && !isShipper && chat.commission_accepted_owner && (
                            <span className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" /> Ожидаем оплату...
                            </span>
                        )}

                        {/* Документы */}
                        {(chat.status === 'escrow_held' || chat.status === 'loading' || chat.status === 'in_transit' || isAccepted) && (
                            <button
                                onClick={() => setShowDocs(true)}
                                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-2 hover:bg-blue-700 transition-all"
                            >
                                <FileText className="w-3.5 h-3.5" /> Документы
                            </button>
                        )}
                        <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ============= COMMISSION ACCEPTANCE MODAL ============= */}
                {showCommissionModal && (() => {
                    const baseAmount = chat.price * chat.wagons;
                    const platformFee = Math.round(baseAmount * 0.025);

                    return (
                        <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex p-4 md:p-0 items-center justify-center animate-in fade-in zoom-in-95">
                            <div className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-[2rem] shadow-2xl border dark:border-slate-800 overflow-hidden relative">
                                <button onClick={() => { setShowCommissionModal(false); setCommissionChecked(false); }} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all z-10">
                                    <MoreVertical className="w-5 h-5 rotate-45" />
                                </button>

                                <div className="p-8 pb-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10">
                                        <ShieldCheck className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-2xl font-black dark:text-white mb-2">Условия платформы</h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                        Для перехода к этапу оплаты обе стороны должны принять условия комиссии экосистемы RailMatch.
                                    </p>
                                </div>

                                <div className="p-8 space-y-5">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 space-y-3 border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-center text-sm font-medium">
                                            <span className="text-slate-500">Сумма сделки</span>
                                            <span className="dark:text-white font-bold">{baseAmount.toLocaleString()} ₽</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-medium">
                                            <span className="text-slate-500">Комиссия платформы (2.5%)</span>
                                            <span className="text-rose-500 font-bold">{platformFee.toLocaleString()} ₽</span>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-800/50">
                                        <div className="flex items-start gap-3 text-sm text-blue-800 dark:text-blue-300">
                                            <Info className="w-5 h-5 shrink-0 mt-0.5" />
                                            <div className="space-y-2 text-xs leading-relaxed font-medium">
                                                <p>Комиссия удерживается из суммы сделки при финальном расчёте после подписания акта выполненных работ.</p>
                                                <p>Средства грузоотправителя замораживаются на эскроу-счёте до момента взаимного подтверждения выполнения.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <label className="flex items-start gap-4 cursor-pointer group p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={commissionChecked}
                                            onChange={(e) => setCommissionChecked(e.target.checked)}
                                            className="w-5 h-5 mt-0.5 rounded-md border-2 border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0 accent-blue-600"
                                        />
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                                            Я ознакомлен и согласен с условиями удержания комиссии платформы RailMatch в размере 2.5% от суммы сделки. Принимаю правила безопасных расчётов через эскроу.
                                        </span>
                                    </label>

                                    {/* Статус второй стороны */}
                                    <div className="flex items-center gap-3 px-4">
                                        {isShipper ? (
                                            <div className="flex items-center gap-2 text-xs font-bold">
                                                {chat.commission_accepted_owner ? (
                                                    <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Владелец принял условия</span>
                                                ) : (
                                                    <span className="text-slate-400 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Ожидаем принятия владельцем</span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs font-bold">
                                                {chat.commission_accepted_shipper ? (
                                                    <span className="text-emerald-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Отправитель принял условия</span>
                                                ) : (
                                                    <span className="text-slate-400 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Ожидаем принятия отправителем</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-8 pt-0">
                                    <button
                                        onClick={() => {
                                            onCommissionAccept();
                                            setShowCommissionModal(false);
                                            setCommissionChecked(false);
                                            // Если обе стороны приняли — сразу открываем оплату для shipper
                                            if (isShipper && chat.commission_accepted_owner) {
                                                setTimeout(() => setShowPaymentModal(true), 300);
                                            }
                                        }}
                                        disabled={!commissionChecked || (isShipper ? chat.commission_accepted_shipper : chat.commission_accepted_owner)}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck className="w-5 h-5" />
                                        {(isShipper ? chat.commission_accepted_shipper : chat.commission_accepted_owner)
                                            ? 'Условия уже приняты'
                                            : 'Принять условия'
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* ============= ESCROW PAYMENT MODAL ============= */}
                {showPaymentModal && (() => {
                    const baseAmount = chat.price * chat.wagons;
                    const platformFee = Math.round(baseAmount * 0.025);
                    const totalPayable = baseAmount + platformFee;

                    return (
                        <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex p-4 md:p-0 items-center justify-center animate-in fade-in zoom-in-95">
                            <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-[2rem] shadow-2xl border dark:border-slate-800 overflow-hidden relative">
                                <button onClick={() => setShowPaymentModal(false)} className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"><MoreVertical className="w-5 h-5 rotate-45" /></button>

                                <div className="p-8 pb-6 bg-slate-50 border-b border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                                        <Wallet className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-xl font-black dark:text-white mb-2">Гарантийный платеж</h3>
                                    <p className="text-sm text-slate-500 font-medium">Безопасная сделка: средства замораживаются до подписания акта приемки (Эскроу).</p>
                                </div>

                                <div className="p-8 space-y-4">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-slate-500">Аренда парка ({chat.wagons} ваг.)</span>
                                        <span className="dark:text-white">{baseAmount.toLocaleString()} ₽</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-slate-500 pr-4">Комиссия экосистемы RailMatch (2.5%)</span>
                                        <span className="text-rose-500">+{platformFee.toLocaleString()} ₽</span>
                                    </div>

                                    <div className="w-full h-px bg-slate-100 dark:bg-slate-800 my-4" />

                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Итого к списанию</span>
                                        <span className="text-2xl font-black text-blue-600 leading-none">{totalPayable.toLocaleString()} ₽</span>
                                    </div>

                                    {/* Показываем что обе стороны приняли условия */}
                                    <div className="flex items-center gap-2 mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Обе стороны приняли условия комиссии</span>
                                    </div>
                                </div>
                                <div className="p-8 pt-0 mt-4">
                                    <button
                                        onClick={() => {
                                            setShowPaymentModal(false);
                                            onEscrow();
                                        }}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheck className="w-5 h-5" /> Оплатить счет и заморозить
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* ============= WATERMARKED DOCUMENT PREVIEW OVERLAY ============= */}
                {showDocs && (
                    <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col p-4 md:p-10 items-center justify-start overflow-y-auto animate-in fade-in zoom-in-95">
                        <button onClick={() => setShowDocs(false)} className="absolute top-4 right-4 md:top-10 md:right-10 p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all z-50"><MoreVertical className="w-6 h-6 rotate-45" /></button>

                        <div className="w-full max-w-3xl flex flex-col items-center mt-12 md:mt-0">
                            {/* Tabs for Document Type Selection */}
                            <div className="flex gap-2 mb-6 bg-white/10 p-2 rounded-2xl overflow-x-auto w-full shrink-0 no-scrollbar">
                                {[
                                    { id: 'invoice', label: 'Счет на оплату' },
                                    { id: 'contract', label: 'Договор-заявка' },
                                    { id: 'act', label: 'Акт вып. работ' },
                                    { id: 'upd', label: 'УПД' },
                                    { id: 'registry', label: 'Реестр вагонов' }
                                ].map(doc => (
                                    <button
                                        key={doc.id}
                                        onClick={() => setSelectedDoc(doc.id)}
                                        className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedDoc === doc.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {doc.label}
                                    </button>
                                ))}
                            </div>

                            <div ref={pdfRef} className="w-full bg-white rounded-2xl shadow-2xl overflow-hidden relative group shrink-0 mb-10 text-slate-800">
                                {/* Watermark Pattern */}
                                <div className="absolute inset-0 pointer-events-none opacity-[0.03] select-none flex flex-wrap gap-10 p-10 overflow-hidden rotate-[-25deg]">
                                    {Array(20).fill(`USERID_${currentUserId}_${new Date().toLocaleDateString()}`).map((text, i) => (
                                        <span key={i} className="text-black font-black text-xl whitespace-nowrap">{text}</span>
                                    ))}
                                </div>

                                <div className="p-10 border-b-2 border-dashed border-slate-200">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 text-blue-600 font-black text-xl mb-1"><TrainFront /> RailMatch</div>
                                            <div className="text-[10px] text-slate-400 font-bold max-w-[200px] leading-tight">Система защищенного документооборота и расчетов</div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase text-slate-400">
                                                {selectedDoc === 'invoice' && 'Счет на оплату'}
                                                {selectedDoc === 'contract' && 'Договор-заявка'}
                                                {selectedDoc === 'act' && 'Акт выполненных работ'}
                                                {selectedDoc === 'upd' && 'Универсальный передаточный документ'}
                                                {selectedDoc === 'registry' && 'Реестр отправленных вагонов'}
                                                {' № '}{chat.id?.slice(0, 8)}
                                            </p>
                                            <p className="text-sm font-bold">{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {/* COMMON DEAL DATA BLOCK */}
                                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8 space-y-4">
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">Грузоотправитель:</span> <span className="font-bold">{chat.shipperName || 'Реквизиты скрыты'}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">Владелец парка:</span> <span className="font-bold">{chat.ownerName || 'Реквизиты скрыты'}</span></div>
                                        <div className="w-full h-px bg-slate-200 my-2"></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">Маршрут:</span> <span className="font-bold">{chat.stationFrom} → {chat.stationTo}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">Груз:</span> <span className="font-bold">{chat.cargoType}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-slate-500">Объем:</span> <span className="font-bold">{chat.wagons} вагонов</span></div>
                                    </div>

                                    {/* DOC SPECIFIC CONTENT */}
                                    {selectedDoc === 'invoice' && (
                                        <div className="space-y-4">
                                            <h4 className="font-black text-lg mb-4">Назначение платежа</h4>
                                            <p className="text-sm leading-relaxed mb-6">Оплата гарантийного обеспечения (эскроу) по сделке на предоставление железнодорожного подвижного состава на платформе RailMatch.</p>
                                            <div className="flex justify-between text-lg font-black pt-4 border-t border-slate-200"><span className="uppercase tracking-widest">ИТОГО К ОПЛАТЕ:</span> <span>{(chat.price * chat.wagons).toLocaleString()} ₽</span></div>
                                        </div>
                                    )}

                                    {selectedDoc === 'contract' && (
                                        <div className="space-y-4">
                                            <h4 className="font-black text-lg mb-4">Предмет договора</h4>
                                            <p className="text-sm leading-relaxed mb-6">Владелец обязуется предоставить под погрузку технически исправный железнодорожный подвижной состав (вагоны) в количестве {chat.wagons} шт., а Грузоотправитель обязуется оплатить услуги по тарифу {chat.price?.toLocaleString()} руб. за вагон. Общая сумма договора составляет {(chat.price * chat.wagons).toLocaleString()} руб.</p>
                                            <p className="text-xs text-slate-500">Обе стороны обязуются выполнить условия согласно регламенту платформы RailMatch. Электронное подтверждение в системе приравнивается к подписи сторон.</p>
                                        </div>
                                    )}

                                    {selectedDoc === 'act' && (
                                        <div className="space-y-4">
                                            <h4 className="font-black text-lg mb-4">Сведения о выполненных работах</h4>
                                            <p className="text-sm leading-relaxed mb-6">Мы, нижеподписавшиеся, Грузоотправитель и Владелец, составили настоящий акт о том, что услуги по предоставлению подвижного состава ({chat.wagons} вагонов) выполнены в полном объеме и надлежащем качестве.</p>
                                            <div className="flex justify-between text-lg font-black pt-4 border-t border-slate-200"><span className="uppercase tracking-widest">ИТОГО:</span> <span>{(chat.price * chat.wagons).toLocaleString()} ₽</span></div>
                                            <p className="text-xs font-bold text-slate-500 mt-4">* Стороны не имеют претензий друг к другу.</p>
                                        </div>
                                    )}

                                    {selectedDoc === 'upd' && (
                                        <div className="space-y-4">
                                            <h4 className="font-black text-lg mb-4">Универсальный передаточный документ (Статус: 1)</h4>
                                            <p className="text-sm leading-relaxed mb-6">Счет-фактура № {chat.id?.slice(0, 8)} объединен с актом оказания услуг. Услуги предоставлены в полном объеме.</p>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs mb-4">
                                                    <thead>
                                                        <tr className="border-b border-slate-200"><th className="pb-2">Наименование</th><th className="pb-2">Ед.изм</th><th className="pb-2">Кол-во</th><th className="pb-2">Цена</th><th className="pb-2 text-right">Сумма</th></tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr><td className="py-3">Предоставление вагонов</td><td className="py-3">шт</td><td className="py-3">{chat.wagons}</td><td className="py-3">{chat.price?.toLocaleString()}</td><td className="py-3 text-right font-bold">{(chat.price * chat.wagons).toLocaleString()}</td></tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div className="flex justify-end text-lg font-black pt-4 mb-4"><span className="mr-8 uppercase tracking-widest text-sm self-center">Всего к оплате:</span> <span>{(chat.price * chat.wagons).toLocaleString()} ₽</span></div>
                                        </div>
                                    )}

                                    {selectedDoc === 'registry' && (
                                        <div className="space-y-4">
                                            <h4 className="font-black text-lg mb-4">Реестр отгруженных вагонов</h4>
                                            <p className="text-sm leading-relaxed mb-6">Приложение к Акту выполненных работ № {chat.id?.slice(0, 8)}.</p>
                                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                                                {Array.from({ length: Math.min(chat.wagons, 16) }).map((_, idx) => (
                                                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                                                        <span className="font-bold text-slate-400 font-sans">№ {(idx + 1).toString().padStart(2, '0')}</span>
                                                        <span>{Math.floor(60000000 + Math.random() * 10000000)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {chat.wagons > 16 && <p className="text-xs text-slate-400 mt-4 text-center">... и еще {chat.wagons - 16} вагонов</p>}
                                        </div>
                                    )}
                                </div>
                                <div className="p-10 bg-slate-50 flex flex-col md:flex-row gap-6 justify-between items-center" data-html2canvas-ignore>
                                    <p className="text-[10px] text-slate-400 font-bold max-w-sm text-center md:text-left">
                                        Это электронная копия документа. Оригинал с подписями доступен для выгрузки в формате XML для ЭДО после подтверждения акта обеими сторонами.
                                    </p>
                                    <button
                                        onClick={handleDownloadPDF}
                                        disabled={isGeneratingPdf}
                                        className="px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2 shrink-0 shadow-lg shadow-blue-500/30 w-full md:w-auto justify-center"
                                    >
                                        {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                        {isGeneratingPdf ? 'Сборка PDF...' : 'Скачать PDF'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ============= INTERACTIVE DEAL STEPPER ============= */}
                <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-900/30 border-b dark:border-slate-800 z-10">
                    <div className="flex items-center justify-between gap-4">
                        {/* Route + Volume + Price — inline */}
                        <div className="flex items-center gap-4 text-xs font-bold">
                            <span className="dark:text-white flex items-center gap-1.5">
                                {chat.stationFrom} <ArrowLeft className="w-3 h-3 rotate-180 text-blue-500" /> {chat.stationTo}
                            </span>
                            <span className="w-px h-4 bg-slate-200 dark:bg-slate-700"></span>
                            <span className="text-slate-500">{chat.wagons} ваг. / {chat.tons} т.</span>
                            <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 hidden sm:block"></span>
                            <span className="text-blue-600 dark:text-blue-400 hidden sm:block">{chat.price?.toLocaleString()} ₽/шт</span>
                        </div>

                        {/* Stepper */}
                        <div className="flex items-center gap-1">
                            {stages.map((s, i) => (
                                <React.Fragment key={i}>
                                    <button
                                        onClick={() => setExpandedStage(expandedStage === i ? null : i)}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${i < currentStage ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' :
                                            i === currentStage ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-200 dark:ring-blue-800' :
                                                'text-slate-400'
                                            } ${expandedStage === i ? 'ring-2 ring-blue-400' : ''}`}
                                    >
                                        {i < currentStage ? <CheckCircle2 className="w-3 h-3" /> : s.icon}
                                        {s.label}
                                    </button>
                                    {i < stages.length - 1 && <div className={`w-3 h-0.5 rounded ${i < currentStage ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`}></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Expanded stage details */}
                    {expandedStage !== null && (
                        <div className="mt-3 p-4 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {stages[expandedStage].icon}
                                    <span className="text-sm font-black dark:text-white">{stages[expandedStage].label}</span>
                                    {expandedStage < currentStage && <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Завершён</span>}
                                    {expandedStage === currentStage && <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-full font-bold animate-pulse">Активный</span>}
                                </div>
                                <button onClick={() => setExpandedStage(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                    <ChevronUp className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 font-medium mb-3">{stages[expandedStage].description}</p>

                            {/* Stage Actions */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {/* === DOCUMENT SIGNING BUTTONS (GATING) === */}
                                {/* Договор ТЭО — на этапе переговоров */}
                                {expandedStage === 0 && currentStage === 0 && (
                                    <button onClick={() => setDocSigningType('contract')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md">
                                        <PenTool className="w-3.5 h-3.5" /> Подписать договор ТЭО
                                    </button>
                                )}
                                {/* Заявка ГУ-12 — на этапе оплаты */}
                                {expandedStage === 1 && chat.status === 'pending_payment' && isShipper && (
                                    <button onClick={() => setDocSigningType('gu12')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md">
                                        <PenTool className="w-3.5 h-3.5" /> Заполнить заявку ГУ-12
                                    </button>
                                )}
                                {/* ЖД-накладная — на этапе погрузки (для owner) */}
                                {expandedStage === 2 && chat.status === 'escrow_held' && !isShipper && (
                                    <button onClick={() => setDocSigningType('waybill')} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md">
                                        <PenTool className="w-3.5 h-3.5" /> Оформить ЖД-накладную
                                    </button>
                                )}
                                {/* УПД + Акт — на этапе завершения */}
                                {expandedStage === 4 && chat.status === 'in_transit' && (
                                    <>
                                        <button onClick={() => setDocSigningType('upd')} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md">
                                            <PenTool className="w-3.5 h-3.5" /> Подписать УПД
                                        </button>
                                        <button onClick={() => setDocSigningType('act')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md">
                                            <PenTool className="w-3.5 h-3.5" /> Подписать Акт
                                        </button>
                                    </>
                                )}

                                {/* Подтверждение подачи вагонов (escrow_held → loading) */}
                                {chat.status === 'escrow_held' && expandedStage === 2 && !isShipper && (
                                    <button
                                        onClick={() => onStageConfirm('escrow')}
                                        disabled={!chat.loading_doc_uploaded}
                                        className={`px-4 py-2 ${chat.loading_doc_uploaded ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'} text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md`}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {chat.loading_doc_uploaded ? 'Подтвердить подачу вагонов' : 'Сначала загрузите Ж/Д накладную'}
                                    </button>
                                )}
                                {chat.status === 'escrow_held' && expandedStage === 2 && isShipper && (
                                    <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" /> Ожидаем подтверждение подачи от владельца
                                    </span>
                                )}

                                {/* Подтверждение погрузки (loading → in_transit) */}
                                {chat.status === 'loading' && expandedStage === 2 && isShipper && (
                                    <button
                                        onClick={() => onStageConfirm('loading')}
                                        disabled={!chat.transit_doc_uploaded}
                                        className={`px-4 py-2 ${chat.transit_doc_uploaded ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'} text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md`}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        {chat.transit_doc_uploaded ? 'Подтвердить погрузку' : 'Сначала загрузите Транспортную накладную'}
                                    </button>
                                )}
                                {chat.status === 'loading' && expandedStage === 2 && !isShipper && (
                                    <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5" /> Ожидаем подтверждение погрузки от отправителя
                                    </span>
                                )}

                                {/* Подтверждение акта (in_transit → accepted) */}
                                {chat.status === 'in_transit' && expandedStage === 3 && (
                                    <>
                                        {!(isShipper ? chat.transit_confirmed_shipper : chat.transit_confirmed_owner) ? (
                                            <button
                                                onClick={() => onStageConfirm('transit')}
                                                disabled={!chat.act_doc_uploaded}
                                                className={`px-4 py-2 ${chat.act_doc_uploaded ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'} text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md`}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                {chat.act_doc_uploaded ? 'Подтвердить доставку' : 'Сначала загрузите Акт выполненных работ'}
                                            </button>
                                        ) : (
                                            <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5" /> Ожидаем подтверждение партнёра
                                            </span>
                                        )}
                                    </>
                                )}

                                {/* Загрузка документа */}
                                {stages[expandedStage].docName && expandedStage <= currentStage && (
                                    <button
                                        onClick={() => handleDocUploadClick(stages[expandedStage].key)}
                                        disabled={uploadingStage === stages[expandedStage].key || chat[`${stages[expandedStage].key}_doc_uploaded`]}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${chat[`${stages[expandedStage].key}_doc_uploaded`]
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-200 dark:border-emerald-800'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        {uploadingStage === stages[expandedStage].key ? (
                                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Загрузка...</>
                                        ) : chat[`${stages[expandedStage].key}_doc_uploaded`] ? (
                                            <><CheckCircle2 className="w-3.5 h-3.5" /> {stages[expandedStage].docName} загружен</>
                                        ) : (
                                            <><Upload className="w-3.5 h-3.5" /> Загрузить {stages[expandedStage].docName}</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Confirmation badges removed for cleaner UI */}
                </div>

                {/* ============= MESSAGES AREA ============= */}
                <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-4 bg-[#fafafa] dark:bg-transparent custom-scrollbar">
                    {(!messages || messages.length === 0) ? (
                        <div className="h-full flex flex-col justify-center items-center text-center opacity-40">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 mb-6">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black dark:text-white uppercase tracking-[0.2em]">Начало диалога</h3>
                            <p className="text-xs text-slate-500 max-w-xs mt-3 font-bold leading-relaxed">
                                Согласуйте финальные условия перевозки, а затем нажмите «Оформить сделку» для фиксации.
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
                                            <p className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-relaxed">{msg.text.replace(/^[^А-Яа-яЁёA-Za-z0-9]+/, '')}</p>
                                            <div className="text-[9px] mt-1.5 font-black uppercase tracking-widest text-blue-400/60">
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • система
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                    <div className={`max-w-[75%] p-5 rounded-[2.5rem] shadow-sm relative group ${isMe
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

                {/* ============= INPUT AREA ============= */}
                <div className="px-6 py-4 bg-white dark:bg-[#111827] border-t dark:border-slate-800">
                    {/* Stage action banner */}
                    {chat.status === 'escrow_held' && !isShipper && (
                        <div className="mb-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-2xl flex items-center gap-3">
                            <Package className="w-4 h-4 text-amber-600 shrink-0" />
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex-1">Подтвердите подачу вагонов на этапе «Погрузка» в stepper выше</span>
                            <button onClick={() => setExpandedStage(2)} className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline">Открыть</button>
                        </div>
                    )}
                    {chat.status === 'loading' && isShipper && (
                        <div className="mb-3 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-2xl flex items-center gap-3">
                            <Truck className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex-1">Подтвердите погрузку груза на этапе «Погрузка» в stepper выше</span>
                            <button onClick={() => setExpandedStage(2)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Открыть</button>
                        </div>
                    )}
                    {chat.status === 'in_transit' && (
                        <div className="mb-3 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl flex items-center gap-3">
                            <ClipboardCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                            <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400 flex-1">Подтвердите доставку на этапе «В пути» для перехода к подписанию акта</span>
                            <button onClick={() => setExpandedStage(3)} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Открыть</button>
                        </div>
                    )}
                    {isAccepted && (
                        <div className="mb-3 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl flex items-center gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">🎉 Сделка завершена! Акт подписан обеими сторонами. Средства разморожены.</span>
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

                {/* ============= DOCUMENT SIGNING MODAL ============= */}
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
