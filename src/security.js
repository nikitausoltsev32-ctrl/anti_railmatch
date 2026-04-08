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

    // Standalone мессенджер-аббревиатуры без username — тг, ТГ, tg, Max, Вотсапп и т.д.
    if (/\b(тг|т\.г\.?|тлг|телега|tg|вотсапп|ватсапп|max)\b/i.test(lower)) return true;

    // Аббревиатуры "тг" / "tg" + username (с @ или без)
    // Ловит: "тг onemonba", "tg username", "тг: onemonba", "тг- username"
    if (/\b(тг|т\.г\.?|телега|тлг)\s*[:\-]?\s*@?[a-zA-Z][a-zA-Z0-9_.]{1,}/i.test(lower)) return true;
    if (/\btg\s*[:\-]?\s*@?[a-zA-Z][a-zA-Z0-9_.]{1,}/i.test(lower)) return true;

    // Любой мессенджер-keyword + username без @ (напр. "телеграм onemonba")
    if (/\b(telegram|телеграм|whatsapp|вотсап|ватсап|вотсапп|ватсапп|viber|вайбер|signal|тг|tg|телега|max)\s*[:\-–]?\s*[a-zA-Z][a-zA-Z0-9_.]{2,}/i.test(lower)) return true;

    // Username-подобный паттерн после любого слова-триггера (латинские слова 4+ симв. после пробела)
    // Ловит скрытые передачи типа "пишите мне username123"
    if (/\b(пиши|пишите|напиши|найди|ищи|найдите)\s+(?:мне\s+)?@?[a-zA-Z][a-zA-Z0-9_.]{3,}/i.test(lower)) return true;

    return false;
}

// Белый список латинских слов, легитимных в контексте грузоперевозок
const LATIN_WHITELIST = new Set([
    'cargo', 'express', 'online', 'email', 'market', 'russia', 'global',
    'trans', 'logistic', 'service', 'group', 'https', 'http', 'gmail',
    'yandex', 'railmatch', 'mobile', 'phone', 'signal', 'viber', 'telegram',
    'whatsapp', 'instagram', 'google', 'hello', 'thanks', 'order', 'price',
    'delivery', 'truck', 'train', 'wagon', 'route', 'depot', 'agent',
    'client', 'manager', 'driver', 'office', 'company', 'partner',
]);

/** Username-подобные строки на латинице (без @ и без мессенджер-префикса) */
function detectLatinUsername(text) {
    // Ищем латинские слова 4-32 символа: буква + буквы/цифры/underscore
    const latinWords = text.match(/\b[a-zA-Z][a-zA-Z0-9_]{3,31}\b/g);
    if (!latinWords) return false;

    const hasCyrillic = /[а-яёА-ЯЁ]/.test(text);
    const trimmed = text.trim();

    for (const word of latinWords) {
        const lower = word.toLowerCase();
        if (LATIN_WHITELIST.has(lower)) continue;

        // Содержит цифры или underscore — явный признак username (user_name, nick123)
        if (/[0-9_]/.test(word)) return true;

        // Латинское слово 6+ символов в кириллическом контексте — подозрительно
        if (word.length >= 6 && hasCyrillic) return true;

        // Короткое сообщение (≤35 символов) без кириллицы целиком — похоже на переданный username
        if (!hasCyrillic && word.length >= 6 && trimmed.length <= 35) return true;
    }
    return false;
}

/**
 * Названия юридических лиц: ООО «Название», ИП Фамилия, АО «Компания» и т.д.
 * Также ловит: OOO, OAO, 3АО (замена букв цифрами).
 */
function detectCompanyName(text) {
    // Организационно-правовые формы + что-то после них
    const orgForms = /\b(ООО|ОАО|ЗАО|ПАО|АО|ИП|ГУП|МУП|НКО|АНО|ФГУП|ФГБУ|ФГУ|Ltd|LLC|Inc|GmbH|Corp|OOO|OAO|3АО)\s*[«"']?[\wа-яА-ЯёЁ\s«»"']{2,}/i.test(text);
    if (orgForms) return true;

    // "Компания X", "фирма X", "организация X" + название 3+ символа
    if (/\b(компания|фирма|организация|предприятие|холдинг|группа|концерн|трест)\s+[«"']?[\wа-яА-ЯёЁ]{3,}/i.test(text)) return true;

    return false;
}

/**
 * ФИО: три слова с заглавной буквы кириллицей подряд (Фамилия Имя Отчество).
 * Имя + фамилия (два слова) тоже ловим если одно из них похоже на фамилию (-ов/-ев/-ин/-ых/-ский/-цкий).
 */
function detectFullName(text) {
    // Три кириллических слова подряд с заглавной (ФИО)
    if (/(?:^|[\s,])[А-ЯЁ][а-яё]{1,20}\s+[А-ЯЁ][а-яё]{1,20}\s+[А-ЯЁ][а-яё]{1,20}(?:\s|$|[,.])/u.test(text)) return true;

    // Фамилия + Имя: типичные окончания фамилий
    if (/[А-ЯЁ][а-яё]+(ов|ова|ев|ева|ин|ина|ых|их|ский|ская|цкий|цкая|зов|зова|нов|нова|лов|лова|ков|кова|гин|гина)\s+[А-ЯЁ][а-яё]{2,}/u.test(text)) return true;

    // Инициалы: А.Б. Фамилия или Фамилия А.Б.
    if (/[А-ЯЁ]\.[А-ЯЁ]\.\s*[А-ЯЁ][а-яё]{2,}/.test(text)) return true;
    if (/[А-ЯЁ][а-яё]{2,}\s+[А-ЯЁ]\.[А-ЯЁ]\./.test(text)) return true;

    return false;
}

/**
 * Банковские и налоговые реквизиты: ИНН, ОГРН, КПП, р/с, БИК.
 * Эти данные достаточно для установления личности / компании вне платформы.
 */
function detectRequisites(text) {
    const stripped = text.replace(/[\s\-]/g, '');

    // ИНН: 10 цифр (юрлицо) или 12 цифр (физлицо) — с контекстным словом
    if (/\bинн\s*:?\s*\d{10,12}\b/i.test(text)) return true;
    if (/\binn\s*:?\s*\d{10,12}\b/i.test(text)) return true;

    // ОГРН: 13 или 15 цифр
    if (/\bогрн\s*:?\s*\d{13,15}\b/i.test(text)) return true;

    // КПП: 9 цифр с контекстом
    if (/\bкпп\s*:?\s*\d{9}\b/i.test(text)) return true;

    // БИК: 9 цифр с контекстом
    if (/\bбик\s*:?\s*\d{9}\b/i.test(text)) return true;

    // Расчётный / корр. счёт: 20 цифр
    if (/\b(?:р\/?с|к\/?с|расч[её]тный счёт|корр?\. счёт)\s*:?\s*\d{20}\b/i.test(text)) return true;
    // 20 цифр подряд (без пробелов) — очень похоже на р/с
    if (/\b\d{20}\b/.test(stripped)) return true;

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
    const keyWords = ['телефон', 'телеграм', 'вотсап', 'ватсап', 'вайбер', 'контакт', 'номер', 'почта', 'телега'];

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

    // 5. Username-подобные строки на латинице
    if (detectLatinUsername(text)) {
        return violation(text, 'messenger');
    }

    // 6. Email
    if (detectEmail(text)) {
        return violation(text, 'email');
    }

    // 7. URL
    if (detectUrl(text)) {
        return violation(text, 'url');
    }

    // 8. Обфускация ключевых слов
    if (detectObfuscated(text)) {
        return violation(text, 'obfuscated');
    }

    // 9. Стоп-слова
    if (STOP_WORDS.some(sw => lower.includes(sw))) {
        return violation(text, 'stop_word');
    }

    // 10. Названия компаний (ООО, ИП, АО и т.д.)
    if (detectCompanyName(text)) {
        return violation(text, 'company_name');
    }

    // 11. ФИО / инициалы
    if (detectFullName(text)) {
        return violation(text, 'full_name');
    }

    // 12. Банковские / налоговые реквизиты (ИНН, ОГРН, р/с, БИК)
    if (detectRequisites(text)) {
        return violation(text, 'requisites');
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

/**
 * Проверяет новое сообщение с учётом последних сообщений того же отправителя.
 * Ловит попытки разбить контакт на несколько сообщений.
 * @param {string[]} recentSenderTexts - последние 1-2 сообщения от того же пользователя
 * @param {string} newText - новое сообщение
 */
export const validateMessageSequence = (recentSenderTexts, newText) => {
    const single = validateMessageIntent(newText);
    if (single.isViolation) return single;

    // Проверяем комбинацию последних N сообщений + новое
    for (let n = 1; n <= Math.min(2, recentSenderTexts.length); n++) {
        const slice = recentSenderTexts.slice(-n);
        const combined = [...slice, newText].join(' ');
        if (validateMessageIntent(combined).isViolation) {
            return violation(newText, 'split_contact');
        }
    }

    return single;
};
