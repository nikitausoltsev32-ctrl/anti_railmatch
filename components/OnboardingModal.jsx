import React, { useState } from 'react';
import {
    ArrowRight, TrainFront, MessageSquare, CheckCircle,
    Package, CreditCard, Phone, Sparkles
} from 'lucide-react';

export default function OnboardingModal({ role, onComplete }) {
    const [step, setStep] = useState(0);
    const isOwner = role === 'owner';

    const steps = [
        {
            icon: <TrainFront className="w-10 h-10" />,
            color: 'blue',
            title: isOwner ? 'Добро пожаловать, владелец вагонов!' : 'Добро пожаловать, грузоотправитель!',
            desc: isOwner
                ? 'На RailMatch вы видите заявки грузоотправителей. Делайте ставки на интересные грузы и выходите на прямые сделки без посредников.'
                : 'На RailMatch вы видите предложения владельцев вагонов. Публикуйте заявки и получайте ставки от десятков перевозчиков.',
        },
        {
            icon: <MessageSquare className="w-10 h-10" />,
            color: 'indigo',
            title: 'Как проходит сделка',
            desc: null,
            flow: true,
        },
        {
            icon: isOwner ? <Sparkles className="w-10 h-10" /> : <Package className="w-10 h-10" />,
            color: 'emerald',
            title: isOwner ? 'Сделайте первую ставку' : 'Разместите первую заявку',
            desc: isOwner
                ? 'Найдите подходящую заявку в каталоге и нажмите «Откликнуться». Комиссия 2.5% — только при успешной сделке.'
                : 'Нажмите «+ Заявка» в верхнем углу или воспользуйтесь AI-агентом для автозаполнения за 30 секунд.',
        },
    ];

    const current = steps[step];
    const isLast = step === steps.length - 1;

    const colorMap = {
        blue:    { bg: 'bg-blue-50 dark:bg-blue-900/30',    text: 'text-blue-600 dark:text-blue-400',    btn: 'bg-blue-600 hover:bg-blue-700',    bar: 'bg-blue-600' },
        indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', btn: 'bg-indigo-600 hover:bg-indigo-700', bar: 'bg-indigo-600' },
        emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-700', bar: 'bg-emerald-600' },
    };
    const colors = colorMap[current.color];

    const flowSteps = [
        { label: 'Заявка опубликована',      sub: 'Грузоотправитель или владелец размещает объявление',       num: 1 },
        { label: 'Отклик → Переговоры',       sub: 'Стороны обсуждают условия в защищённом чате',              num: 2 },
        { label: 'Оплата комиссии 2.5%',      sub: 'Согласуется способ оплаты (50/50 или одна сторона)',        num: 3 },
        { label: 'Контакты открыты',          sub: 'После оплаты — прямая связь и подписание документов',       num: 4 },
    ];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">

                {/* Progress bar */}
                <div className="flex gap-2 mb-10">
                    {steps.map((s, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                                i <= step ? colors.bar : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                        />
                    ))}
                </div>

                {/* Icon */}
                <div className={`w-20 h-20 rounded-3xl ${colors.bg} ${colors.text} flex items-center justify-center mb-8 shadow-inner`}>
                    {current.icon}
                </div>

                {/* Title */}
                <h2 className="text-2xl font-black mb-4 dark:text-white leading-tight">{current.title}</h2>

                {/* Text description */}
                {current.desc && (
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">{current.desc}</p>
                )}

                {/* Flow diagram (step 2) */}
                {current.flow && (
                    <div className="mb-8 space-y-3">
                        {flowSteps.map((item) => (
                            <div key={item.num} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                                    {item.num}
                                </span>
                                <div>
                                    <p className="font-bold text-sm dark:text-white">{item.label}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                    {step > 0 && (
                        <button
                            onClick={() => setStep(s => s - 1)}
                            className="px-5 py-3.5 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            Назад
                        </button>
                    )}
                    <button
                        onClick={() => isLast ? onComplete() : setStep(s => s + 1)}
                        className={`flex-1 py-3.5 ${colors.btn} text-white rounded-2xl text-sm font-black uppercase tracking-wide transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2`}
                    >
                        {isLast ? 'Начать работу' : 'Далее'}
                        {isLast ? <CheckCircle className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </button>
                </div>

                {/* Skip */}
                <button
                    onClick={onComplete}
                    className="w-full mt-4 text-xs text-slate-400 hover:text-slate-500 transition-colors"
                >
                    Пропустить
                </button>
            </div>
        </div>
    );
}
