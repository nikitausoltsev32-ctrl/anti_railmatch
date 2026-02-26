import React from 'react';
import { Lock } from 'lucide-react';

export default function DemoModal({ onClose, onReg }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white dark:bg-[#111827] w-full max-w-sm rounded-[2.5rem] p-10 text-center border dark:border-slate-800 shadow-2xl animate-in zoom-in-95">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-600"><Lock className="w-10 h-10" /></div>
                <h3 className="text-2xl font-black mb-4 dark:text-white">Нужна регистрация</h3>
                <p className="text-slate-400 dark:text-slate-500 mb-10 font-medium leading-relaxed">Для подачи ставок и управления сделками необходимо создать подтвержденный профиль компании.</p>
                <button onClick={onReg} className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl mb-4 shadow-lg shadow-blue-500/20 uppercase tracking-widest text-xs">Создать аккаунт</button>
                <button onClick={onClose} className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors uppercase tracking-widest text-[10px]">Продолжить просмотр</button>
            </div>
        </div>
    );
}
