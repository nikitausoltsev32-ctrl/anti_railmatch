// --- БИЗНЕС-ЛОГИКА БЕЗОПАСНОСТИ (Anti-leakage) ---
// 4-уровневая система защиты чата RailMatch

// === УРОВЕНЬ 1: REGEX-ФИЛЬТРАЦИЯ ===

// Стоп-слова: прямые попытки обхода платформы
export const STOP_WORDS = [
    // Прямые попытки обхода
    'давайте в обход', 'скину в телегу', 'оплата на карту', 'наберите мне напрямую',
    'мой номер', 'мой телефон', 'пишите в вотсап', 'связаться в телеграме',
    'перезвоните на', 'мои реквизиты', 'оплатить на карту',
    'контакты', 'телефон', 'email', 'почта', 'whatsapp', 'telegram', 'viber',
    'личку', 'в личку', 'direct', 'директ', 'мобильный', 'сотовый', 'созвонимся',
    // Глаголы и фразы поиска контактов
    'набери меня', 'набери мне', 'наберите меня', 'наберите мне',
    'позвони мне', 'позвоните мне', 'позвони на', 'позвоните на',
    'звони мне', 'звоните мне', 'перезвони',
    'найди меня', 'найдите меня', 'найди в', 'найдите в',
    'пиши мне', 'пишите мне', 'написать мне',
    'свяжись', 'свяжитесь', 'свяжись со мной', 'свяжитесь со мной',
    'отправлю реквизиты', 'скину реквизиты', 'дам номер', 'дам контакт', 'скину номер',
    'в обход платформы', 'без платформы', 'напрямую', 'вне платформы', 'минуя платформу',
    'вконтакте', 'одноклассники', 'ok.ru', 'вк ',
    // Мессенджеры (русские варианты)
    'вотсап', 'ватсап', 'вайбер', 'телеграм', 'сигнал',
    'инстаграм', 'инста',
];

// Цифры прописью (русский)
const DIGIT_WORDS_RU = {
    'ноль': '0', 'нуль': '0',
    'один': '1', 'одна': '1', 'одно': '1',
    'два': '2', 'две': '2',
    'три': '3',
    'четыре': '4',
    'пять': '5',
    'шесть': '6',
    'семь': '7',
    'восемь': '8',
    'девять': '9',
};

// Цифры прописью (казахский транслит)
const DIGIT_WORDS_KZ = {
    'bir': '1', 'бир': '1',
    'eki': '2', 'еки': '2',
    'ush': '3', 'уш': '3', 'үш': '3',
    'tort': '4', 'торт': '4', 'төрт': '4',
    'bes': '5', 'бес': '5', 'бiс': '5',
    'alty': '6', 'алты': '6',
    'zheti': '7', 'жети': '7', 'жеті': '7',
    'sekiz': '8', 'секиз': '8', 'сегіз': '8',
    'togyz': '9', 'тогыз': '9', 'тоғыз': '9',
};

const ALL_DIGIT_WORDS = { ...DIGIT_WORDS_RU, ...DIGIT_WORDS_KZ };
const DIGIT_WORD_PATTERN = new RegExp(
    `(?:${Object.keys(ALL_DIGIT_WORDS).join('|')})`,
    'gi'
);

// --- Детекторы ---

/** Телефонные номера: +7/8/007 + 10 цифр, с любыми разделителями */
function detectPhone(text) {
    const normalized = text.replace(/[\s\-().+]/g, '');

    // Стандартные форматы: +7, 8, 007 + 10 цифр
    if (/(?:\+?7|8|007)\s*[-.(]?\s*\d{3}\s*[-.)]\s*\d{3}\s*[-.]?\s*\d{2}\s*[-.]?\s*\d{2}/.test(text)) {
        return true;
    }

    // 7+ последовательных цифр (после удаления разделителей)
    if (/\d{7,}/.test(normalized)) {
        return true;
    }

    // Частичные номера: группы цифр через дефисы/пробелы (минимум 6 цифр суммарно)
    const digitGroups = text.match(/\d[\d\s\-.]{5,}\d/g);
    if (digitGroups) {
        for (const group of digitGroups) {
            const digits = group.replace(/\D/g, '');
            if (digits.length >= 6) return true;
        }
    }

    return false;
}

/** Цифры через пробелы: "8 7 7 7 1 2 3 4 5 6 7" */
function detectSpacedDigits(text) {
    // Одиночные цифры, разделённые пробелами (минимум 5 штук подряд)
    return /(?:^|\s)(\d\s+){4,}\d(?:\s|$)/.test(text);
}

/** Цифры прописью: "восемь семь семь один два три" */
function detectWrittenDigits(text) {
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);
    let consecutive = 0;

    for (const word of words) {
        const clean = word.replace(/[,.-]/g, '');
        if (ALL_DIGIT_WORDS[clean]) {
            consecutive++;
            if (consecutive >= 3) return true;
        } else {
            consecutive = 0;
        }
    }
    return false;
}

/** Мессенджеры и соцсети */
function detectMessenger(text) {
    const lower = text.toLowerCase();

    // Прямые ссылки: t.me/, wa.me/, vk.com/, instagram.com/
    if (/t\.me\/\S+/.test(lower)) return true;
    if (/wa\.me\/\S+/.test(lower)) return true;
    if (/vk\.com\/\S+/.test(lower)) return true;
    if (/instagram\.com\/\S+/.test(lower)) return true;

    // Обфусцированные ссылки: t(.)me, t[.]me, t me/, t(me)
    if (/t\s*[\[(.]?\s*\.?\s*[\])]?\s*me\s*\/\S+/i.test(lower)) return true;
    if (/wa\s*[\[(.]?\s*\.?\s*[\])]?\s*me\s*\/?\S*/i.test(lower)) return true;

    // @username (не @платформа — разрешаем @railmatch)
    if (/@[a-zA-Z0-9_]{2,}/.test(text) && !/@railmatch/i.test(text)) return true;

    // Ключевые слова мессенджеров (английские)
    if (/\b(telegram|whats\s*app|viber|signal)\b/i.test(lower)) return true;

    return false;
}

/** Email-адреса */
function detectEmail(text) {
    const lower = text.toLowerCase();

    // Стандартный email
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) return true;

    // Обфусцированные: [at], (at), собака, [dog]
    if (/\S+\s*[\[(]\s*(?:at|собака|dog|эт)\s*[\])]\s*\S+/i.test(lower)) return true;

    return false;
}

/** URL-адреса */
function detectUrl(text) {
    const lower = text.toLowerCase();

    // Протоколы
    if (/https?:\/\/\S+/.test(lower)) return true;
    if (/www\.\S+/.test(lower)) return true;

    // TLD после слов: слово.ru, слово.kz, слово.com
    if (/\w+\.(ru|kz|com|net|org|info|biz|su|by|uz|kg|tj)\b/.test(lower)) {
        // Исключаем типичные сокращения (напр. "тыс.руб", "г.р")
        if (!/(?:тыс|руб|коп|шт|ед|кг|км|м|г)\./i.test(lower.match(/\S+\.(ru|kz|com|net|org|info|biz|su|by|uz|kg|tj)\b/)?.[0] || '')) {
            return true;
        }
    }

    // Обфусцированные домены: (dot), [.], точка
    if (/\w+\s*[\[(]\s*(?:dot|точка|тчк)\s*[\])]\s*(?:ru|kz|com|net|org)/i.test(lower)) return true;

    return false;
}

/** Обфускация стоп-слов: т.е.л.е.ф.о.н, т-е-л-е-г-р-а-м */
function detectObfuscated(text) {
    const lower = text.toLowerCase();
    const keyWords = ['телефон', 'телеграм', 'вотсап', 'ватсап', 'вайбер', 'контакт', 'номер', 'почта'];

    for (const word of keyWords) {
        if (word.length < 4) continue;
        // Каждый символ слова может быть разделён точками, дефисами, пробелами
        const pattern = word.split('').join('[\\s\\-._*]+');
        if (new RegExp(pattern, 'i').test(lower)) return true;
    }
    return false;
}

// --- Главная функция валидации ---

/**
 * Проверяет сообщение на попытки обхода платформы.
 * @param {string} text - текст сообщения
 * @returns {{ valid: boolean, cleaned: string, isViolation: boolean, violationType: string|null }}
 */
export const validateMessageIntent = (text) => {
    if (!text || !text.trim()) {
        return { valid: true, cleaned: text, isViolation: false, violationType: null };
    }

    const lower = text.toLowerCase();

    // 1. Телефонные номера
    if (detectPhone(text)) {
        return violation(text, 'phone');
    }

    // 2. Цифры через пробелы
    if (detectSpacedDigits(text)) {
        return violation(text, 'phone');
    }

    // 3. Цифры прописью
    if (detectWrittenDigits(text)) {
        return violation(text, 'phone');
    }

    // 4. Мессенджеры и соцсети
    if (detectMessenger(text)) {
        return violation(text, 'messenger');
    }

    // 5. Email
    if (detectEmail(text)) {
        return violation(text, 'email');
    }

    // 6. URL
    if (detectUrl(text)) {
        return violation(text, 'url');
    }

    // 7. Обфускация ключевых слов
    if (detectObfuscated(text)) {
        return violation(text, 'obfuscated');
    }

    // 8. Стоп-слова
    if (STOP_WORDS.some(sw => lower.includes(sw))) {
        return violation(text, 'stop_word');
    }

    return { valid: true, cleaned: text, isViolation: false, violationType: null };
};

function violation(text, type) {
    return {
        valid: false,
        cleaned: '[КОНТАКТЫ СКРЫТЫ СИСТЕМОЙ БЕЗОПАСНОСТИ]',
        isViolation: true,
        violationType: type,
    };
}
