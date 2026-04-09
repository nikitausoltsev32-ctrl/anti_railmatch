import React, { useState, useEffect } from 'react';
import { ArrowRight, TrainTrack, Sparkles } from 'lucide-react';
import { MIN_PRICE_PER_WAGON } from '../src/constants.js';
import { haptic } from '../src/haptic.js';

export default function CreateRequestForm({ onBack, onPublish, initialData }) {
    const [formData, setFormData] = useState({
        stationFrom: initialData?.stationFrom || '',
        stationTo: initialData?.stationTo || '',
        cargoType: initialData?.cargoType || '',
        wagonType: initialData?.wagonType || 'Крытый',
        totalWagons: initialData?.totalWagons || '',
        totalTons: initialData?.totalTons || '',
        targetPrice: initialData?.targetPrice || ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData(prev => {
                const updated = { ...prev, ...initialData };
                if (!updated.wagonType) updated.wagonType = 'Крытый';
                if (!updated.cargoType) updated.cargoType = 'ТНП';
                return updated;
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const errs = {};
        if (!formData.stationFrom.trim()) errs.stationFrom = 'Укажите станцию отправления';
        if (!formData.stationTo.trim()) errs.stationTo = 'Укажите станцию назначения';
        if (!formData.cargoType.trim()) errs.cargoType = 'Укажите груз';
        if (!formData.totalWagons || Number(formData.totalWagons) <= 0)
            errs.totalWagons = 'Количество вагонов должно быть больше 0';
        if (formData.totalTons !== '' && Number(formData.totalTons) < 0)
            errs.totalTons = 'Тоннаж не может быть отрицательным';
        if (!formData.targetPrice || Number(formData.targetPrice) <= 0)
            errs.targetPrice = 'Ставка должна быть больше 0';
        else if (Number(formData.targetPrice) < MIN_PRICE_PER_WAGON)
            errs.targetPrice = `Ставка не может быть ниже ${MIN_PRICE_PER_WAGON.toLocaleString('ru-RU')} ₽/ваг. — минимальный рыночный порог`;
        return errs;
    };

    const handleSubmit = () => {
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            haptic.notification('error');
            setErrors(errs);
            return;
        }
        haptic.notification('success');
        onPublish({
            ...formData,
            stationFrom: formData.stationFrom.trim(),
            stationTo: formData.stationTo.trim(),
            cargoType: formData.cargoType.trim(),
        });
    };

    const isDisabled = !formData.stationFrom.trim() || !formData.stationTo.trim() ||
        !formData.cargoType.trim() || !formData.totalWagons || Number(formData.totalWagons) <= 0 ||
        !formData.targetPrice || Number(formData.targetPrice) < MIN_PRICE_PER_WAGON;

    return (
        <div className="max-w-3xl mx-auto py-10 animate-in slide-in-from-bottom-4 duration-500">
            <button onClick={onBack} className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"><ArrowRight className="w-4 h-4 rotate-180" /> Назад</button>
            <div className="bg-white dark:bg-[#111827] rounded-[3rem] border dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="p-10 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h2 className="text-3xl font-black dark:text-white">Новая публикация</h2>
                    <p className="text-slate-400 font-medium mt-2">Заполните данные для создания заявки на бирже</p>
                </div>
                <div className="p-10 space-y-8">
                    {initialData && (
                        <div className="mb-2 p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-start gap-4 text-white shadow-xl shadow-blue-500/20 animate-in slide-in-from-top-4">
                            <Sparkles className="w-8 h-8 flex-shrink-0 animate-pulse text-blue-200" />
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-widest mb-1">AI Agent заполнил черновик</h3>
                                <p className="text-blue-100 text-sm font-medium">Я распознал данные из вашего запроса. Пожалуйста, проверьте их и нажмите «Опубликовать заявку».</p>
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Станция отправления</label>
                            <input name="stationFrom" value={formData.stationFrom || ''} onChange={handleChange} placeholder="Напр. Екатеринбург" className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 dark:text-white font-bold ${errors.stationFrom ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-blue-500'}`} />
                            {errors.stationFrom && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.stationFrom}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Станция назначения</label>
                            <input name="stationTo" value={formData.stationTo || ''} onChange={handleChange} placeholder="Напр. Москва" className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 dark:text-white font-bold ${errors.stationTo ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-blue-500'}`} />
                            {errors.stationTo && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.stationTo}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Груз</label>
                            <input name="cargoType" value={formData.cargoType || ''} onChange={handleChange} placeholder="Напр. Уголь" className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 dark:text-white font-bold ${errors.cargoType ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-blue-500'}`} />
                            {errors.cargoType && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.cargoType}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Тип вагона</label>
                            <select name="wagonType" value={formData.wagonType || 'Крытый'} onChange={handleChange} className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-bold appearance-none">
                                <option value="Крытый">Крытый</option>
                                <option value="Полувагон">Полувагон</option>
                                <option value="Платформа">Платформа</option>
                                <option value="Цистерна">Цистерна</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Количество вагонов (шт)</label>
                            <input name="totalWagons" type="number" min="1" value={formData.totalWagons || ''} onChange={handleChange} placeholder="10" className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 dark:text-white font-bold ${errors.totalWagons ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-blue-500'}`} />
                            {errors.totalWagons && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.totalWagons}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4">Общий тоннаж (тонн)</label>
                            <input name="totalTons" type="number" min="0" value={formData.totalTons || ''} onChange={handleChange} placeholder="600" className={`w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-2 dark:text-white font-bold ${errors.totalTons ? 'ring-2 ring-red-400 focus:ring-red-400' : 'focus:ring-blue-500'}`} />
                            {errors.totalTons && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.totalTons}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-4 font-bold flex items-center gap-2">Ставка (₽ / ваг.) <Sparkles className="w-3 h-3 text-blue-500" /></label>
                            <input name="targetPrice" type="number" min={MIN_PRICE_PER_WAGON} value={formData.targetPrice || ''} onChange={handleChange} placeholder={`от ${MIN_PRICE_PER_WAGON.toLocaleString('ru-RU')}`} className={`w-full px-6 py-4 rounded-2xl outline-none focus:ring-2 dark:text-white font-black ${errors.targetPrice ? 'bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 ring-2 ring-red-400 focus:ring-red-400' : 'bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 focus:ring-blue-500'}`} />
                            {errors.targetPrice && <p className="text-red-500 text-[11px] font-bold ml-4">{errors.targetPrice}</p>}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isDisabled}
                        className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 uppercase tracking-widest transition-all hover:shadow-blue-500/40 active:scale-95 flex items-center justify-center gap-2">
                        Опубликовать заявку
                    </button>
                </div>
            </div>
        </div>
    );
}
