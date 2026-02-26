import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ShieldCheck, MoreVertical, MessageSquare, Send, CheckCircle2, FileText, Ban } from 'lucide-react';

export default function ChatWindow({ chat, messages, currentUserId, userRole, onSend, onAccept, onBack }) {
    const [inputText, setInputText] = useState("");
    const scrollRef = useRef(null);

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

    return (
        <div className="min-h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white dark:bg-[#111827] h-[750px] rounded-[3.5rem] border dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden relative">

                {/* Header */}
                <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl z-20">
                    <div className="flex items-center gap-5">
                        <button onClick={onBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-400 md:hidden">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 relative group">
                            <MessageSquare className="w-7 h-7 group-hover:scale-110 transition-transform" />
                            {isAccepted && <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-[#111827] animate-bounce"><CheckCircle2 className="w-3 h-3" /></div>}
                        </div>
                        <div>
                            <div className="font-black dark:text-white uppercase tracking-tight text-lg flex items-center gap-2">
                                {chat.ownerName || chat.shipperName || 'Переговоры'}
                                {isAccepted && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-black tracking-widest">СДЕЛКА</span>}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                                <div className="text-[10px] text-emerald-600 font-black uppercase flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md">
                                    <ShieldCheck className="w-3 h-3" /> Проверен
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest sm:block hidden">
                                    {chat.stationFrom} → {chat.stationTo}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!isAccepted && (
                            <button
                                onClick={onAccept}
                                disabled={isShipper ? chat.shipper_confirmed : chat.owner_confirmed}
                                className={`group relative px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 overflow-hidden ${(isShipper ? chat.shipper_confirmed : chat.owner_confirmed)
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default shadow-none'
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-95'
                                    }`}
                            >
                                <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full ${!(isShipper ? chat.shipper_confirmed : chat.owner_confirmed) && 'group-hover:animate-[shimmer_1.5s_infinite]'}`}></div>
                                <CheckCircle2 className={`w-4 h-4 ${!(isShipper ? chat.shipper_confirmed : chat.owner_confirmed) && 'animate-pulse'}`} />
                                <span className="relative">
                                    {(isShipper ? chat.shipper_confirmed : chat.owner_confirmed)
                                        ? 'Ждем партнера...'
                                        : 'Оформить сделку'}
                                </span>
                            </button>
                        )}
                        {isAccepted && (
                            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 hover:scale-105 transition-all">
                                <FileText className="w-4 h-4" /> Документы
                            </button>
                        )}
                        <button className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors text-slate-400 hidden sm:block">
                            <MoreVertical />
                        </button>
                    </div>
                </div>

                {/* VISUAL DEAL STATUS BAR */}
                <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-900/30 border-b dark:border-slate-800 flex flex-col gap-5 z-10 shadow-inner">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Маршрут</span>
                                <div className="text-sm font-bold dark:text-white flex items-center gap-2">
                                    {chat.stationFrom} <ArrowLeft className="w-3 h-3 rotate-180 text-blue-500" /> {chat.stationTo}
                                </div>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:border-slate-800 mx-2 hidden sm:block"></div>
                            <div className="flex flex-col gap-1 hidden sm:flex">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Объем</span>
                                <div className="text-sm font-bold dark:text-white">{chat.wagons} ваг. / {chat.tons} т.</div>
                            </div>
                            <div className="w-px h-8 bg-slate-200 dark:border-slate-800 mx-2 hidden lg:block"></div>
                            <div className="flex flex-col gap-1 hidden lg:flex">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Финальная цена</span>
                                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{chat.price?.toLocaleString()} ₽/шт</div>
                            </div>
                        </div>

                        {/* STEP INDICATOR */}
                        <div className="flex items-center gap-2 sm:gap-4 relative px-2 py-1 bg-white dark:bg-slate-950/50 rounded-2xl border dark:border-slate-800 shadow-sm">
                            {/* Step 1: Discussion */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl">
                                <div className={`w-2 h-2 rounded-full ${isAccepted ? 'bg-emerald-500' : 'bg-blue-600 animate-pulse'}`}></div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isAccepted ? 'text-emerald-500' : 'text-blue-600'}`}>1. Переговоры</span>
                            </div>

                            <div className="w-4 h-px bg-slate-200 dark:bg-slate-800"></div>

                            {/* Step 2: Confirmation */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${(!isAccepted && (chat.shipper_confirmed || chat.owner_confirmed)) ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                                <div className={`w-2 h-2 rounded-full ${(chat.shipper_confirmed || chat.owner_confirmed) ? (isAccepted ? 'bg-emerald-500' : 'bg-orange-500 animate-pulse') : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${(chat.shipper_confirmed || chat.owner_confirmed) ? (isAccepted ? 'text-emerald-500' : 'text-orange-500') : 'text-slate-400'}`}>2. Подтверждение</span>
                            </div>

                            <div className="w-4 h-px bg-slate-200 dark:bg-slate-800"></div>

                            {/* Step 3: Deal */}
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${isAccepted ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}`}>
                                <div className={`w-2 h-2 rounded-full ${isAccepted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                                <span className={`text-[9px] font-black uppercase tracking-widest ${isAccepted ? 'text-emerald-500' : 'text-slate-400'}`}>3. Сделка</span>
                            </div>
                        </div>
                    </div>

                    {/* CONFIRMATION STATUS CHIPS */}
                    <div className="flex gap-4 pt-4 border-t dark:border-slate-800/50">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${chat.shipper_confirmed
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                            : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                            {chat.shipper_confirmed ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 border-2 border-slate-200 dark:border-slate-800 rounded-full"></div>}
                            Отправитель подтвердил
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${chat.owner_confirmed
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                            : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400'}`}>
                            {chat.owner_confirmed ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 border-2 border-slate-200 dark:border-slate-800 rounded-full"></div>}
                            Владелец подтвердил
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 bg-[#fafafa] dark:bg-transparent custom-scrollbar">
                    {(!messages || messages.length === 0) ? (
                        <div className="h-full flex flex-col justify-center items-center text-center opacity-40">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-600 mb-6">
                                <MessageSquare className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black dark:text-white uppercase tracking-[0.2em]">Начало диалога</h3>
                            <p className="text-xs text-slate-500 max-w-xs mt-3 font-bold leading-relaxed">
                                Согласуйте финальные условия и нажмите кнопку «Заключить сделку» для фиксации лота.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, i) => {
                            const isMe = msg.sender_id === currentUserId;
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

                {/* Input Area */}
                <div className="p-8 bg-white dark:bg-[#111827] border-t dark:border-slate-800">
                    <div className="flex gap-4 items-center bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-3xl border dark:border-slate-800 focus-within:ring-4 ring-blue-500/10 transition-all border-l-4 border-l-blue-600">
                        <input
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Напишите сообщение..."
                            className="flex-1 bg-transparent px-6 py-4 outline-none dark:text-white font-bold placeholder:text-slate-400"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!inputText.trim()}
                            className="w-14 h-14 bg-blue-600 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Send className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
