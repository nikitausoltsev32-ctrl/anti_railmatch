import { useState, useEffect } from 'react';

const MAX_DAILY_PROFILE_VIEWS = 50;
const VIEW_LIMIT_EXPIRED_HOURS = 24;

export const ProfileViewMonitor = () => {
    const [viewStats, setViewStats] = useState({ count: 0, lastReset: Date.now() });
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        const storedStats = localStorage.getItem('profileViewStats');
        if (storedStats) {
            const stats = JSON.parse(storedStats);
            const hoursSinceLastReset = (Date.now() - stats.lastReset) / (1000 * 60 * 60);
            
            if (hoursSinceLastReset > VIEW_LIMIT_EXPIRED_HOURS) {
                setViewStats({ count: 0, lastReset: Date.now() });
            } else {
                setViewStats(stats);
                if (stats.count >= MAX_DAILY_PROFILE_VIEWS) {
                    setIsBlocked(true);
                }
            }
        }
    }, []);

    const trackProfileView = () => {
        if (isBlocked) return false;
        
        const newCount = viewStats.count + 1;
        setViewStats({ count: newCount, lastReset: viewStats.lastReset });
        localStorage.setItem('profileViewStats', JSON.stringify({ count: newCount, lastReset: viewStats.lastReset }));
        
        if (newCount >= MAX_DAILY_PROFILE_VIEWS) {
            setIsBlocked(true);
            setTimeout(() => {
                setViewStats({ count: 0, lastReset: Date.now() });
                setIsBlocked(false);
            }, VIEW_LIMIT_EXPIRED_HOURS * 60 * 60 * 1000);
        }
        
        return true;
    };

    const getRemainingViews = () => {
        if (isBlocked) return 0;
        return MAX_DAILY_PROFILE_VIEWS - viewStats.count;
    };

    return {
        isBlocked,
        trackProfileView,
        getRemainingViews,
        viewStats,
        resetViews: () => {
            setViewStats({ count: 0, lastReset: Date.now() });
            setIsBlocked(false);
            localStorage.removeItem('profileViewStats');
        }
    };
};

export const ProfileAccessGuard = ({ userRole, targetRole, isEscrowActive }) => {
    const [canAccess, setCanAccess] = useState(false);
    const [remainingViews, setRemainingViews] = useState(MAX_DAILY_PROFILE_VIEWS);
    const [blockedReason, setBlockedReason] = useState('');
    const profileMonitor = ProfileViewMonitor();

    useEffect(() => {
        const checkAccess = () => {
            if (isEscrowActive) {
                setCanAccess(true);
                return;
            }

            if (profileMonitor.isBlocked) {
                setBlockedReason('Превышен лимит просмотров профилей');
                setCanAccess(false);
                return;
            }

            if (userRole === 'shipper' && targetRole === 'owner') {
                setCanAccess(true);
            } else if (userRole === 'owner' && targetRole === 'shipper') {
                const viewsLeft = profileMonitor.getRemainingViews();
                setRemainingViews(viewsLeft);
                setCanAccess(viewsLeft > 0);
                if (viewsLeft <= 0) {
                    setBlockedReason('Лимит просмотров исчерпан');
                }
            } else {
                setBlockedReason('Недостаточно прав доступа');
                setCanAccess(false);
            }
        };

        checkAccess();
    }, [userRole, targetRole, isEscrowActive, profileMonitor.isBlocked]);

    const requestAccess = () => {
        if (profileMonitor.trackProfileView()) {
            setCanAccess(true);
            setRemainingViews(profileMonitor.getRemainingViews());
            setBlockedReason('');
        }
    };

    return {
        canAccess,
        requestAccess,
        remainingViews,
        blockedReason,
        isBlocked: profileMonitor.isBlocked
    };
};

export const generateProfileViewWarning = (remainingViews) => {
    if (remainingViews <= 5 && remainingViews > 0) {
        return `Осталось ${remainingViews} просмотров профилей`;
    }
    return null;
};