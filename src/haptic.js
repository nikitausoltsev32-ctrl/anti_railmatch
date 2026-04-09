const tg = () => window.Telegram?.WebApp?.HapticFeedback;

const vibrate = (pattern) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
};

const IMPACT_PATTERNS = {
    light: [15],
    medium: [30],
    heavy: [50],
    rigid: [50],
    soft: [15],
};

const NOTIFICATION_PATTERNS = {
    success: [20, 50, 20],
    warning: [40, 30, 40],
    error: [80],
};

export const haptic = {
    impact(style = 'medium') {
        const hf = tg();
        if (hf) {
            hf.impactOccurred(style);
        } else {
            vibrate(IMPACT_PATTERNS[style] || IMPACT_PATTERNS.medium);
        }
    },
    notification(type = 'success') {
        const hf = tg();
        if (hf) {
            hf.notificationOccurred(type);
        } else {
            vibrate(NOTIFICATION_PATTERNS[type] || NOTIFICATION_PATTERNS.success);
        }
    },
    selection() {
        const hf = tg();
        if (hf) {
            hf.selectionChanged();
        } else {
            vibrate([10]);
        }
    },
};
