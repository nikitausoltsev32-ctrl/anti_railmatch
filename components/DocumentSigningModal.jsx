import { PLATFORM_COMMISSION_RATE } from '../src/constants.js';
import React, { useState, useMemo, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, FileText, Check, AlertCircle, ShieldCheck, Eye, Loader2, Sparkles } from 'lucide-react';
import { downloadDocument, getDocumentBlob } from './DocumentGenerator';

// ============================================
// ВАЛИДАЦИЯ
// ============================================
const VALIDATORS = {
    inn: (v) => {
        if (!v) return null; // optional
        if (!/^\d{10}$|^\d{12}$/.test(v)) return 'ИНН: 10 или 12 цифр';
        return null;
    },
    kpp: (v) => {
        if (!v) return null; // optional
        if (!/^\d{9}$/.test(v)) return 'КПП: 9 цифр';
        return null;
    },
    bik: (v) => {
        if (!v) return 'Укажите БИК';
        if (!/^04\d{7}$/.test(v)) return 'БИК: 9 цифр, начинается с 04';
        return null;
    },
    account: (v) => {
        if (!v) return 'Укажите расчётный счёт';
        if (!/^\d{20}$/.test(v)) return 'Р/с: 20 цифр';
        return null;
    },
    corrAccount: (v) => {
        if (!v) return null;
        if (!/^\d{20}$/.test(v)) return 'К/с: 20 цифр';
        return null;
    },
    fio: (v) => {
        if (!v) return 'Укажите ФИО';
        if (v.trim().split(/\s+/).length < 2) return 'Укажите полное ФИО';
        return null;
    },
    wagonNumber: (v) => {
        if (!v) return null;
        if (!/^\d{8}$/.test(v)) return 'Номер вагона: 8 цифр';
        return null;
    },
    etsnCode: (v) => {
        if (!v) return null;
        if (!/^\d{6}$/.test(v)) return 'Код ЕТСНГ: 6 цифр';
        return null;
    },
    required: (v) => {
        if (!v || !v.trim()) return 'Обязательное поле';
        return null;
    },
};

// ============================================
// КОНФИГУРАЦИЯ ПОЛЕЙ ПО ЭТАПАМ
// ============================================
function getStageConfig(docType, deal) {
    const baseAmount = (deal.price || 0) * (deal.wagons || 0);
    const commission = Math.round(baseAmount * PLATFORM_COMMISSION_RATE);

    const configs = {
        contract: {
            title: 'Договор ТЭО',
            subtitle: 'Транспортно-экспедиционное обслуживание',
            autoFields: [
                { label: 'Маршрут', value: `${deal.stationFrom} → ${deal.stationTo}` },
                { label: 'Груз', value: deal.cargoType },
                { label: 'Тип вагона', value: deal.wagonType },
                { label: 'Количество', value: `${deal.wagons} ваг. / ${deal.tons || '—'} т.` },
                { label: 'Ставка', value: `${Number(deal.price).toLocaleString()} ₽/ваг.` },
                { label: 'Сумма сделки', value: `${baseAmount.toLocaleString()} ₽` },
                { label: 'Комиссия (2.5%)', value: `${commission.toLocaleString()} ₽` },
            ],
            inputFields: [
                {
                    section: 'Банковские реквизиты', fields: [
                        { key: 'bank_name', label: 'Наименование банка', placeholder: 'ПАО Сбербанк', validate: 'required' },
                        { key: 'bik', label: 'БИК', placeholder: '044525225', validate: 'bik' },
                        { key: 'account', label: 'Расчётный счёт', placeholder: '40702810938000012345', validate: 'account' },
                        { key: 'corr_account', label: 'Корр. счёт', placeholder: '30101810400000000225', validate: 'corrAccount' },
                    ]
                },
                {
                    section: 'Подписант', fields: [
                        { key: 'signer_name', label: 'ФИО подписанта', placeholder: 'Иванов Иван Иванович', validate: 'fio' },
                        { key: 'signer_position', label: 'Должность', placeholder: 'Генеральный директор', validate: 'required', default: 'Генеральный директор' },
                        { key: 'signer_basis', label: 'Основание', placeholder: 'Устав', validate: 'required', default: 'Устав' },
                    ]
                },
            ],
        },
        gu12: {
            title: 'Заявка на перевозку',
            subtitle: 'Форма ГУ-12',
            autoFields: [
                { label: 'Грузоотправитель', value: deal.shipperName || deal.shipper?.company },
                { label: 'Владелец вагонов', value: deal.ownerName || deal.owner?.company },
                { label: 'Станция отправления', value: deal.stationFrom },
                { label: 'Станция назначения', value: deal.stationTo },
                { label: 'Груз', value: deal.cargoType },
                { label: 'Вагоны', value: `${deal.wagons} шт. (${deal.wagonType})` },
            ],
            inputFields: [
                {
                    section: 'Данные груза', fields: [
                        { key: 'etsn_code', label: 'Код ЕТСНГ', placeholder: '161009', validate: 'etsnCode' },
                        { key: 'net_weight', label: 'Масса нетто (тонн)', placeholder: '68', type: 'number' },
                        { key: 'gross_weight', label: 'Масса брутто (тонн)', placeholder: '92', type: 'number' },
                        { key: 'hazard_class', label: 'Класс опасности', placeholder: 'Нет', default: 'Нет' },
                        { key: 'special_conditions', label: 'Особые условия', placeholder: 'Нет', default: 'Нет' },
                    ]
                },
            ],
        },
        waybill: {
            title: 'ЖД-накладная',
            subtitle: 'Транспортная накладная',
            autoFields: [
                { label: 'Маршрут', value: `${deal.stationFrom} → ${deal.stationTo}` },
                { label: 'Груз', value: deal.cargoType },
                { label: 'Количество вагонов', value: String(deal.wagons) },
            ],
            inputFields: [
                {
                    section: 'Вагоны и погрузка', fields: [
                        ...Array.from({ length: Math.min(deal.wagons || 3, 10) }).map((_, i) => ({
                            key: `wagon_${i}`,
                            label: `Вагон #${i + 1} (номер)`,
                            placeholder: '60123456',
                            validate: 'wagonNumber',
                        })),
                        { key: 'loading_date', label: 'Дата погрузки', type: 'date' },
                    ]
                },
            ],
        },
        upd: {
            title: 'УПД',
            subtitle: 'Универсальный передаточный документ',
            autoFields: [
                { label: 'Продавец', value: deal.ownerName || deal.owner?.company },
                { label: 'Покупатель', value: deal.shipperName || deal.shipper?.company },
                { label: 'Маршрут', value: `${deal.stationFrom} → ${deal.stationTo}` },
                { label: 'Вагоны', value: `${deal.wagons} шт. × ${Number(deal.price).toLocaleString()} ₽` },
                { label: 'Сумма', value: `${baseAmount.toLocaleString()} ₽` },
                { label: 'НДС (20%)', value: `${Math.round(baseAmount * 0.2).toLocaleString()} ₽` },
                { label: 'Итого с НДС', value: `${(baseAmount + Math.round(baseAmount * 0.2)).toLocaleString()} ₽` },
            ],
            inputFields: [], // Автозаполнение — только подпись
        },
        act: {
            title: 'Акт выполненных работ',
            subtitle: 'Закрывающий документ',
            autoFields: [
                { label: 'Заказчик', value: deal.shipperName || deal.shipper?.company },
                { label: 'Исполнитель', value: deal.ownerName || deal.owner?.company },
                { label: 'Услуга', value: `Предоставление ${deal.wagons} вагонов (${deal.wagonType})` },
                { label: 'Маршрут', value: `${deal.stationFrom} → ${deal.stationTo}` },
                { label: 'Сумма без НДС', value: `${baseAmount.toLocaleString()} ₽` },
                { label: 'Итого с НДС', value: `${(baseAmount + Math.round(baseAmount * 0.2)).toLocaleString()} ₽` },
            ],
            inputFields: [], // Только подпись
        },
    };
    return configs[docType] || configs.contract;
}

// ============================================
// КОМПОНЕНТ
// ============================================
export default function DocumentSigningModal({ docType, deal, userRole, userProfile, onSign, onClose }) {
    const config = useMemo(() => getStageConfig(docType, deal), [docType, deal]);
    const hasInputs = config.inputFields.length > 0 && config.inputFields.some(s => s.fields.length > 0);
    const totalSteps = hasInputs ? 4 : 3; // auto → [input] → preview → sign

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState(() => {
        const defaults = {};
        config.inputFields.forEach(section => {
            section.fields.forEach(f => {
                if (f.default) defaults[f.key] = f.default;
                // Auto-fill from profile
                if (userProfile?.[f.key]) defaults[f.key] = userProfile[f.key];
            });
        });
        return defaults;
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [agreed, setAgreed] = useState(false);
    const [signing, setSigning] = useState(false);

    const stepLabels = hasInputs
        ? ['Данные сделки', 'Заполнение', 'Предпросмотр PDF', 'Подписание']
        : ['Данные сделки', 'Предпросмотр PDF', 'Подписание'];

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setTouched(prev => ({ ...prev, [key]: true }));
    };

    const validateField = (key, value) => {
        const field = config.inputFields.flatMap(s => s.fields).find(f => f.key === key);
        if (!field?.validate) return null;
        return VALIDATORS[field.validate]?.(value) || null;
    };

    const handleBlur = (key) => {
        setTouched(prev => ({ ...prev, [key]: true }));
        const err = validateField(key, formData[key]);
        setErrors(prev => ({ ...prev, [key]: err }));
    };

    const validateAll = () => {
        const newErrors = {};
        let valid = true;
        config.inputFields.forEach(section => {
            section.fields.forEach(f => {
                const err = validateField(f.key, formData[f.key]);
                if (err) { newErrors[f.key] = err; valid = false; }
            });
        });
        setErrors(newErrors);
        setTouched(Object.fromEntries(config.inputFields.flatMap(s => s.fields).map(f => [f.key, true])));
        return valid;
    };

    const handleNext = () => {
        if (step === 2 && hasInputs) {
            if (!validateAll()) return;
        }
        setStep(s => Math.min(s + 1, totalSteps));
    };

    const handleSign = async () => {
        setSigning(true);
        try {
            // Merge deal data + form data
            const mergedData = buildMergedData();
            const blob = getDocumentBlob(docType, mergedData);
            await onSign(docType, blob, formData, mergedData);
        } catch (err) {
            console.error('Signing error:', err);
        } finally {
            setSigning(false);
        }
    };

    const handlePreviewDownload = () => {
        const mergedData = buildMergedData();
        downloadDocument(docType, mergedData);
    };

    const buildMergedData = () => {
        const baseAmount = (deal.price || 0) * (deal.wagons || 0);
        return {
            docNumber: deal.id?.slice(0, 8) || 'DRAFT',
            date: deal.created_at || new Date().toISOString(),
            userId: userProfile?.id || 'unknown',
            stationFrom: deal.stationFrom,
            stationTo: deal.stationTo,
            cargoType: deal.cargoType,
            wagonType: deal.wagonType || 'Крытый',
            wagons: deal.wagons,
            tons: deal.tons,
            price: deal.price,
            baseAmount,
            shipper: {
                company: deal.shipperName || userProfile?.company,
                inn: formData.inn || '',
                kpp: formData.kpp,
                ogrn: formData.ogrn,
                legal_address: formData.legal_address,
                bank_name: formData.bank_name,
                bik: formData.bik,
                account: formData.account,
                corr_account: formData.corr_account,
            },
            owner: {
                company: deal.ownerName,
                inn: '',
            },
            signerShipper: {
                name: formData.signer_name || userProfile?.ceo_name,
                position: formData.signer_position || 'Генеральный директор',
            },
            signerOwner: {
                name: deal.ownerSignerName,
                position: deal.ownerSignerPosition || 'Генеральный директор',
            },
            etsnCode: formData.etsn_code,
            grossWeight: formData.gross_weight,
            hazardClass: formData.hazard_class,
            specialConditions: formData.special_conditions,
            wagonNumbers: Object.entries(formData)
                .filter(([k]) => k.startsWith('wagon_'))
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([, v]) => v),
            contractNumber: deal.contractDocNumber || deal.id?.slice(0, 8),
            contractDate: deal.contractDate || deal.created_at,
        };
    };

    // Determine which step maps to which content
    const getStepContent = () => {
        if (hasInputs) return step;
        // Map: 1→auto, 2→preview(3), 3→sign(4)
        return step === 1 ? 1 : step + 1;
    };
    const contentStep = getStepContent();

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-white dark:bg-[#111827] rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-500">

                {/* Header */}
                <div className="px-8 py-6 border-b dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 relative">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2.5 bg-white/80 dark:bg-slate-800 text-slate-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/10">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black dark:text-white">{config.title}</h3>
                            <p className="text-xs text-slate-500 font-medium">{config.subtitle}</p>
                        </div>
                    </div>

                    {/* Step indicator */}
                    <div className="flex gap-2 mt-4">
                        {stepLabels.map((label, i) => (
                            <div key={i} className="flex-1">
                                <div className={`h-1.5 rounded-full transition-all duration-500 ${i + 1 <= step ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                <span className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 block ${i + 1 <= step ? 'text-blue-600' : 'text-slate-400'}`}>{label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">

                    {/* Step 1: Auto-filled fields */}
                    {contentStep === 1 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-400">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Данные сделки (автозаполнение)</span>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                                {config.autoFields.map((f, i) => (
                                    <div key={i} className="px-5 py-3.5 flex justify-between items-center">
                                        <span className="text-sm text-slate-500 font-medium">{f.label}</span>
                                        <span className="text-sm font-bold dark:text-white">{f.value || '—'}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-slate-400 mt-4 font-medium leading-relaxed">
                                Эти данные заполнены автоматически из вашей сделки. На следующем шаге {hasInputs ? 'заполните недостающие реквизиты.' : 'вы сможете проверить документ.'}
                            </p>
                        </div>
                    )}

                    {/* Step 2: Manual input (if hasInputs) */}
                    {contentStep === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-6">
                            {config.inputFields.map((section, si) => (
                                <div key={si}>
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                                        {section.section}
                                    </h4>
                                    <div className="space-y-3">
                                        {section.fields.map((field) => (
                                            <div key={field.key}>
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-1 block">{field.label}</label>
                                                <input
                                                    type={field.type || 'text'}
                                                    value={formData[field.key] || ''}
                                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                                    onBlur={() => handleBlur(field.key)}
                                                    placeholder={field.placeholder}
                                                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl outline-none font-bold text-sm dark:text-white transition-all
                                                        ${touched[field.key] && errors[field.key]
                                                            ? 'ring-2 ring-rose-500 bg-rose-50/50 dark:bg-rose-900/20'
                                                            : 'focus:ring-2 focus:ring-blue-500 border border-slate-100 dark:border-slate-700'
                                                        }
                                                        ${!formData[field.key] && !touched[field.key] ? 'border-amber-300 dark:border-amber-700' : ''}
                                                    `}
                                                />
                                                {touched[field.key] && errors[field.key] && (
                                                    <p className="text-xs text-rose-500 font-bold mt-1 ml-1 flex items-center gap-1 animate-in slide-in-from-top-2">
                                                        <AlertCircle className="w-3 h-3" /> {errors[field.key]}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Step 3: Preview */}
                    {contentStep === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-400">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Eye className="w-3.5 h-3.5" /> Предпросмотр документа
                                </span>
                                <button
                                    onClick={handlePreviewDownload}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-md transition-all"
                                >
                                    <FileText className="w-3.5 h-3.5" /> Скачать PDF
                                </button>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 min-h-[200px]">
                                <div className="text-center mb-6">
                                    <div className="text-blue-600 font-black text-lg mb-1">RailMatch</div>
                                    <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{config.title}</div>
                                    <div className="text-xs text-slate-500 mt-1">№ {deal.id?.slice(0, 8)} от {new Date(deal.created_at || Date.now()).toLocaleDateString('ru-RU')}</div>
                                </div>
                                <div className="space-y-2">
                                    {config.autoFields.map((f, i) => (
                                        <div key={i} className="flex justify-between text-xs">
                                            <span className="text-slate-400">{f.label}:</span>
                                            <span className="font-bold dark:text-white">{f.value}</span>
                                        </div>
                                    ))}
                                </div>
                                {Object.keys(formData).length > 0 && (
                                    <>
                                        <div className="w-full h-px bg-slate-200 dark:bg-slate-700 my-4" />
                                        <div className="space-y-2">
                                            {Object.entries(formData).filter(([, v]) => v).map(([k, v]) => (
                                                <div key={k} className="flex justify-between text-xs">
                                                    <span className="text-slate-400">{k.replace(/_/g, ' ')}:</span>
                                                    <span className="font-bold dark:text-white">{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                                <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-[10px] text-blue-600 font-bold text-center">
                                    Полный документ доступен в PDF — нажмите «Скачать PDF» выше
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Sign */}
                    {contentStep === 4 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-6">
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-100 dark:border-emerald-800/50">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-black dark:text-white text-base mb-1">Электронная подпись</h4>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                            Подтверждение в системе RailMatch приравнивается к простой электронной подписи
                                            согласно п.2 ст.6 Федерального закона от 06.04.2011 № 63-ФЗ «Об электронной подписи».
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <label className="flex items-start gap-4 cursor-pointer group p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all">
                                <input
                                    type="checkbox"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="w-5 h-5 mt-0.5 rounded-md border-2 border-slate-300 text-emerald-600 focus:ring-emerald-500 shrink-0 accent-emerald-600"
                                />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                                    Я, <strong className="text-emerald-600">{formData.signer_name || userProfile?.ceo_name || userProfile?.company || '(ФИО)'}</strong>,
                                    подтверждаю корректность данных в документе «{config.title}» и подписываю его в электронной форме.
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center gap-4">
                    <button
                        onClick={() => setStep(s => Math.max(s - 1, 1))}
                        disabled={step === 1}
                        className="px-5 py-3 text-slate-400 hover:text-slate-600 disabled:opacity-30 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" /> Назад
                    </button>

                    {step < totalSteps ? (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            Далее <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSign}
                            disabled={!agreed || signing}
                            className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
                        >
                            {signing ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Оформление...</>
                            ) : (
                                <><ShieldCheck className="w-4 h-4" /> Подписать и сформировать</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
