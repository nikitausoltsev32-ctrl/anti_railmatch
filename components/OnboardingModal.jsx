import React, { useState } from 'react';
import {
    ArrowRight, TrainFront, MessageSquare, CheckCircle,
    Package, Sparkles, Search, FileText, ShieldCheck, CreditCard
} from 'lucide-react';

const colorMap = {
    blue:    { bg: 'bg-blue-50 dark:bg-blue-900/30',    text: 'text-blue-600 dark:text-blue-400',    btn: 'bg-blue-600 hover:bg-blue-700',    bar: 'bg-blue-600' },
    indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400', btn: 'bg-indigo-600 hover:bg-indigo-700', bar: 'bg-indigo-600' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-700', bar: 'bg-emerald-600' },
    violet:  { bg: 'bg-violet-50 dark:bg-violet-900/30', text: 'text-violet-600 dark:text-violet-400', btn: 'bg-violet-600 hover:bg-violet-700', bar: 'bg-violet-600' },
};

const shipperSteps = [
    {
        icon: <Package className="w-10 h-10" />,
        color: 'blue',
        title: 'Добро пожаловать, грузоотправитель!',
        desc: 'RailMatch — биржа, где вы публикуете заявки на перевозку и получаете ставки от десятков владельцев вагонов. Прямые сделки без посредников.',
    },
    {
        icon: <FileText className="w-10 h-10" />,
        color: 'indigo',
        title: 'Как разместить заявку',
        list: [
            { num: 1, label: 'Нажмите «+ Заявка»', sub: 'Кнопка в верхнем правом углу или через AI-агент' },
            { num: 2, label: 'Укажите маршрут и груз', sub: 'Станция отправления, назначения, тип вагона, тоннаж' },
            { num: 3, label: 'Получайте ставки', sub: 'Владельцы вагонов откликаются — вы выбираете лучшее предложение' },
        ],
    },
    {
        icon: <ShieldCheck className="w-10 h-10" />,
        color: 'emerald',
        title: 'Безопасная сделка',
        list: [
            { num: 1, label: 'Переговоры в защищённом чате', sub: 'Контакты скрыты до оплаты комиссии' },
            { num: 2, label: 'Комиссия 2.5%', sub: 'Только при успешной сделке — после оплаты открываются прямые контакты' },
            { num: 3, label: 'Документы', sub: 'Счёт, Договор-заявка, УПД, Реестр вагонов, Акт — всё автоматически' },
        ],
    },
    {
        icon: <CreditCard className="w-10 h-10" />,
        color: 'violet',
        title: 'Готовы к первой заявке?',
        desc: 'Воспользуйтесь AI-агентом для автозаполнения — опишите груз и маршрут текстом, и заявка создастся за 30 секунд.',
    },
];

const ownerSteps = [
    {
        icon: <TrainFront className="w-10 h-10" />,
        color: 'blue',
        title: 'Добро пожаловать, владелец вагонов!',
        desc: 'RailMatch — биржа, где вы находите грузы и делаете ставки на заявки грузоотправителей. Прямые сделки, без посредников.',
    },
    {
        icon: <Search className="w-10 h-10" />,
        color: 'indigo',
        title: 'Как найти груз',
        list: [
            { num: 1, label: 'Откройте биржу', sub: 'Каталог заявок грузоотправителей — по маршруту, типу вагона, тоннажу' },
            { num: 2, label: 'Нажмите «Откликнуться»', sub: 'Укажите вашу цену за вагон и количество вагонов' },
            { num: 3, label: 'Или разместите свои вагоны', sub: 'Опубликуйте свободный парк — грузоотправители сами вас найдут' },
        ],
    },
    {
        icon: <ShieldCheck className="w-10 h-10" />,
        color: 'emerald',
        title: 'Как проходит сделка',
        list: [
            { num: 1, label: 'Переговоры в чате', sub: 'Обсуждайте условия — контакты раскрываются после оплаты комиссии' },
            { num: 2, label: 'Комиссия 2.5%', sub: 'Только при успешной сделке. Способ оплаты согласуется с партнёром' },
            { num: 3, label: 'Подтверждение этапов', sub: 'Подача вагонов → Погрузка → Доставка → деньги разморожены' },
        ],
    },
    {
        icon: <Sparkles className="w-10 h-10" />,
        color: 'violet',
        title: 'Начните зарабатывать',
        desc: 'Найдите первую заявку в каталоге и нажмите «Откликнуться». Или разместите свободные вагоны — и пусть грузы приходят к вам.',
    },
];

export default function OnboardingModal({ role, onComplete }) {
    const [step, setStep] = useState(0);
    const steps = role === 'owner' ? ownerSteps : shipperSteps;
    const current = steps[step];
    const isLast = step === steps.length - 1;
    const colors = colorMap[current.color];

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#111827] rounded-t-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-10">

                {/* Progress bar */}
                <div className="flex gap-2 mb-6 sm:mb-10">
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
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl ${colors.bg} ${colors.text} flex items-center justify-center mb-5 sm:mb-8 shadow-inner`}>
                    {current.icon}
                </div>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-black mb-3 sm:mb-4 dark:text-white leading-tight">{current.title}</h2>

                {/* Text description */}
                {current.desc && (
                    <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-5 sm:mb-8">{current.desc}</p>
                )}

                {/* List steps */}
                {current.list && (
                    <div className="mb-5 sm:mb-8 space-y-2 sm:space-y-3">
                        {current.list.map((item) => (
                            <div key={item.num} className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                <span className={`w-7 h-7 rounded-full ${colors.bg} ${colors.text} text-xs font-black flex items-center justify-center shrink-0 mt-0.5`}>
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
