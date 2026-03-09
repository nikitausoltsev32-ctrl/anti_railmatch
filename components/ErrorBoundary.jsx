import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Перехватывает JS-ошибки в дочернем дереве и показывает
 * понятный экран вместо белого листа.
 */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        // Сюда подключить Sentry: Sentry.captureException(error, { extra: info });
        console.error('[ErrorBoundary]', error, info.componentStack);
    }

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white dark:bg-[#111827] rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-10 text-center">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black dark:text-white mb-3">Что-то пошло не так</h2>
                    <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed">
                        Произошла непредвиденная ошибка. Попробуйте обновить страницу — данные не будут потеряны.
                    </p>
                    {import.meta.env.DEV && this.state.error && (
                        <pre className="text-left text-xs bg-slate-100 dark:bg-slate-800 text-red-500 p-4 rounded-xl mb-6 overflow-auto max-h-32">
                            {this.state.error.message}
                        </pre>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black flex items-center justify-center gap-2 transition-all"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Обновить страницу
                    </button>
                </div>
            </div>
        );
    }
}
