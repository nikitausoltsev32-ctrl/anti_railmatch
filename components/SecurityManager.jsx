import { useState, useEffect } from 'react';

export default function SecurityManager() {
    const [dailyLimits, setDailyLimits] = useState({
        profileViews: 0,
        contactAttempts: 0,
        lastReset: new Date().setHours(0,0,0,0)
    });

    useEffect(() => {
        // Проверяем ежедневный сброс
        const checkReset = () => {
            const now = new Date().setHours(0,0,0,0);
            if (now > dailyLimits.lastReset) {
                setDailyLimits(prev => ({
                    ...prev,
                    profileViews: 0,
                    contactAttempts: 0,
                    lastReset: now
                }));
            }
        };
        const interval = setInterval(checkReset, 60000); // Проверяем каждую минуту
        return () => clearInterval(interval);
    }, [dailyLimits.lastReset]);

    const canViewProfile = () => {
        // Лимит 50 просмотров в сутки
        return dailyLimits.profileViews < 50;
    };

    const canSendContact = () => {
        // Лимит 10 попыток контакта в сутки
        return dailyLimits.contactAttempts < 10;
    };

    const trackProfileView = () => {
        setDailyLimits(prev => ({
            ...prev,
            profileViews: prev.profileViews + 1
        }));
    };

    const trackContactAttempt = () => {
        setDailyLimits(prev => ({
            ...prev,
            contactAttempts: prev.contactAttempts + 1
        }));
    };

    return {
        canViewProfile,
        canSendContact,
        trackProfileView,
        trackContactAttempt,
        profileViews: dailyLimits.profileViews,
        contactAttempts: dailyLimits.contactAttempts
    };
}