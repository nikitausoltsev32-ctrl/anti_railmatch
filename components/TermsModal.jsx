import React, { useState } from 'react';
import { X, FileText, Shield } from 'lucide-react';

export default function TermsModal({ onClose }) {
    const [tab, setTab] = useState('terms');

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white dark:bg-[#111827] rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full sm:max-w-2xl max-h-[88vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTab('terms')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                tab === 'terms'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <FileText className="w-4 h-4" /> Соглашение
                        </button>
                        <button
                            onClick={() => setTab('privacy')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                tab === 'privacy'
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Shield className="w-4 h-4" /> Конфиденциальность
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto p-8 text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-4 flex-1">
                    {tab === 'terms' ? <TermsContent /> : <PrivacyContent />}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black uppercase tracking-wide transition-all"
                    >
                        Понятно
                    </button>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <>
            <h2 className="text-sm font-black text-slate-800 dark:text-white pt-2">{title}</h2>
            {children}
        </>
    );
}

function TermsContent() {
    return (
        <>
            <p className="text-xs text-slate-400">
                Последнее обновление: 1 марта 2026 г. · RailMatch Platform ООО
            </p>

            <Section title="1. Предмет соглашения">
                <p>Настоящее Пользовательское соглашение регулирует использование платформы RailMatch, предназначенной для организации взаимодействия между грузоотправителями и владельцами железнодорожного подвижного состава.</p>
            </Section>

            <Section title="2. Регистрация и требования">
                <p>2.1. К использованию допускаются юридические лица и ИП, зарегистрированные на территории Российской Федерации.</p>
                <p>2.2. При регистрации пользователь обязан предоставить достоверные данные: наименование организации, ИНН и контактный телефон.</p>
                <p>2.3. Один ИНН может быть привязан только к одному аккаунту.</p>
            </Section>

            <Section title="3. Правила использования">
                <p>3.1. Запрещено обмениваться контактными данными (телефон, email, мессенджеры) в чате до оплаты комиссии.</p>
                <p>3.2. При нарушении п. 3.1 аккаунт блокируется. При повторном нарушении — удаляется без возможности восстановления.</p>
                <p>3.3. Размещение заведомо ложных заявок или ставок запрещено.</p>
            </Section>

            <Section title="4. Комиссия платформы">
                <p>4.1. Комиссия составляет 2.5% от суммы сделки и взимается только при успешном завершении (раскрытии контактов).</p>
                <p>4.2. Способ распределения (50/50 или полностью одной стороной) согласовывается в чате.</p>
                <p>4.3. Оплата комиссии является необходимым условием раскрытия контактных данных партнёра.</p>
            </Section>

            <Section title="5. Ответственность">
                <p>5.1. Платформа является организатором взаимодействия сторон и не несёт ответственности за исполнение договоров между пользователями.</p>
                <p>5.2. Пользователь несёт полную ответственность за достоверность предоставленных данных.</p>
            </Section>

            <Section title="6. Изменение условий">
                <p>Платформа вправе изменить условия, уведомив пользователей по email не позднее чем за 7 дней до вступления изменений в силу.</p>
            </Section>

            <Section title="7. Контакты">
                <p>По вопросам соглашения: <span className="font-bold text-blue-600">support@railmatch.ru</span></p>
            </Section>
        </>
    );
}

function PrivacyContent() {
    return (
        <>
            <p className="text-xs text-slate-400">
                Последнее обновление: 1 марта 2026 г. · RailMatch Platform ООО
            </p>

            <Section title="1. Какие данные мы собираем">
                <p><strong className="text-slate-700 dark:text-slate-300">Данные регистрации:</strong> email, название компании, ИНН, номер телефона.</p>
                <p><strong className="text-slate-700 dark:text-slate-300">Данные использования:</strong> заявки, ставки, сообщения в чате, история сделок.</p>
                <p><strong className="text-slate-700 dark:text-slate-300">Технические данные:</strong> IP-адрес, тип браузера, время сессии.</p>
            </Section>

            <Section title="2. Как мы используем данные">
                <p>2.1. Для предоставления функций платформы: публикация заявок, обмен сообщениями, проведение сделок.</p>
                <p>2.2. Для предотвращения мошенничества и защиты от обхода системы.</p>
                <p>2.3. Для отправки транзакционных уведомлений: новая ставка, оплата комиссии, раскрытие контактов.</p>
                <p>2.4. Для анализа и улучшения сервиса в агрегированном (обезличенном) виде.</p>
            </Section>

            <Section title="3. Раскрытие данных третьим лицам">
                <p>3.1. Контактные данные (телефон) раскрываются партнёру исключительно после оплаты комиссии обеими сторонами.</p>
                <p>3.2. Мы не продаём и не передаём персональные данные третьим лицам в маркетинговых целях.</p>
                <p>3.3. Данные могут быть переданы по обоснованному запросу государственных органов РФ.</p>
            </Section>

            <Section title="4. Хранение данных">
                <p>Данные хранятся на защищённых серверах Supabase и шифруются при передаче (TLS 1.3). Срок хранения — в течение действия аккаунта плюс 3 года.</p>
            </Section>

            <Section title="5. Права пользователя">
                <p>Вы вправе запросить выгрузку, исправление или удаление своих данных, направив запрос на <span className="font-bold text-blue-600">privacy@railmatch.ru</span>.</p>
            </Section>

            <Section title="6. Cookies">
                <p>Мы используем только технически необходимые cookies (сессия авторизации) и не применяем аналитические или маркетинговые трекеры.</p>
            </Section>

            <Section title="7. Контакты по вопросам приватности">
                <p><span className="font-bold text-blue-600">privacy@railmatch.ru</span></p>
            </Section>
        </>
    );
}
