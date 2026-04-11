// --- БИЗНЕС-ЛОГИКА БЕЗОПАСНОСТИ (Anti-leakage) ---
// Многоуровневая защита чата RailMatch от утечки контактов

// === СТОП-ФРАЗЫ (контекстные — не одиночные слова) ===
export const STOP_WORDS = [
    // Прямые попытки обхода
    'давайте в обход', 'скину в телегу', 'оплата на карту', 'наберите мне напрямую',
    'мой номер', 'мой телефон', 'мои контакты', 'дайте контакт', 'дам контакт',
    'пишите в вотсап', 'связаться в телеграме', 'перезвоните на', 'мои реквизиты',
    'оплатить на карту', 'дам номер', 'скину номер', 'скину реквизиты',
    'отправлю реквизиты', 'в обход платформы', 'без платформы', 'вне платформы',
    'минуя платформу', 'напрямую без', 'встретимся лично и', 'оплатим наличными',
    'передам напрямую', 'найди меня в', 'найдите меня в', 'пиши мне в',
    'написать мне в', 'свяжись со мной', 'свяжитесь со мной',
    // Ссылки на сторонние площадки
    'найди на авито', 'найдите на авито', 'мы на авито', 'есть на авито',
    'на hh.ru', 'на headhunter', 'на 2гис', 'в 2гис', 'найди в 2гис',
    'на rabota', 'на superjob',
    // Мессенджеры в контексте
    'пишите в личку', 'в личку', 'в директ',
    'наберите в вотсапе', 'пишите в вотсапе', 'добавьте в вотсап',
    'найдите в телеграм', 'пишите в телеграм', 'добавьте в телеграм',
    'вконтакте у меня', 'одноклассники мой', 'vk.com/',
];

// === ЦИФРЫ ПРОПИСЬЮ ===
const DIGIT_WORDS_RU = {
    'ноль': '0', 'нуль': '0',
    'один': '1', 'одна': '1', 'одно': '1', 'одного': '1', 'одной': '1',
    'два': '2', 'две': '2', 'двух': '2',
    'три': '3', 'трёх': '3', 'трех': '3',
    'четыре': '4', 'четырёх': '4', 'четырех': '4',
    'пять': '5', 'пяти': '5',
    'шесть': '6', 'шести': '6',
    'семь': '7', 'семи': '7',
    'восемь': '8', 'восьми': '8',
    'девять': '9', 'девяти': '9',
};

const DIGIT_WORDS_KZ = {
    'bir': '1', 'бир': '1',
    'eki': '2', 'еки': '2',
    'ush': '3', 'уш': '3', 'үш': '3',
    'tort': '4', 'торт': '4', 'төрт': '4',
    'bes': '5', 'бес': '5',
    'alty': '6', 'алты': '6',
    'zheti': '7', 'жети': '7', 'жеті': '7',
    'sekiz': '8', 'секиз': '8', 'сегіз': '8',
    'togyz': '9', 'тогыз': '9', 'тоғыз': '9',
};

// Слова-числа на латинице
const DIGIT_WORDS_EN = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
};

const ALL_DIGIT_WORDS = { ...DIGIT_WORDS_RU, ...DIGIT_WORDS_KZ, ...DIGIT_WORDS_EN };

// Замена цифр символами (лит-код: а=1, б=2...)
const CYRILLIC_DIGIT_MAP = {
    'а': '1', 'б': '2', 'в': '3', 'г': '4', 'д': '5',
    'е': '6', 'ж': '7', 'з': '8', 'и': '9', 'й': '0',
};

// Замена цифр схожими символами
const LOOKALIKE_MAP = {
    'о': '0', 'O': '0', 'o': '0', 'О': '0',
    'l': '1', 'I': '1', 'і': '1', '|': '1',
    'з': '3', 'З': '3',
    'ч': '4', 'Ч': '4',
    'б': '6', 'Б': '6',
    'г': '7', 'Г': '7',
    'в': '8', 'В': '8',
};

// === ДЕТЕКТОРЫ ===

/** Нормализует текст: убирает разделители, раскрывает обфускацию */
function normalizeForPhone(text) {
    let s = text;

    // Убираем разделители между цифрами/буквами
    s = s.replace(/[\s\-_.()\[\]{}/\\|,;:*"'«»]+/g, '');

    // Lookalike-символы → цифры
    s = s.replace(/[оOoОlIі|зЗчЧбБгГвВ]/g, ch => LOOKALIKE_MAP[ch] || ch);

    return s;
}

/** Восстанавливает цифры прописью в строке в числа */
function replaceDigitWords(text) {
    const words = text.toLowerCase().split(/\s+/);
    return words.map(w => {
        const clean = w.replace(/[,.\-!?]/g, '');
        return ALL_DIGIT_WORDS[clean] !== undefined ? ALL_DIGIT_WORDS[clean] : w;
    }).join(' ');
}

/**
 * Основной детектор телефонных номеров.
 * Работает с нормализованным текстом — ловит любой способ написания.
 */
function detectPhone(text) {
    // --- Прямые форматы ---
    // +7 / 8 / 007 / +7 / 7 (с разделителями и без)
    if (/(?:\+?7|8|007)\s*[-.(]?\s*\d{3}\s*[-.)]\s*\d{3}\s*[-.]?\s*\d{2}\s*[-.]?\s*\d{2}/.test(text)) return true;

    // Нормализуем и проверяем подряд идущие цифры
    const norm = normalizeForPhone(text);

    // 10+ цифр подряд после удаления разделителей (любой телефон мира)
    if (/\d{10,}/.test(norm)) return true;

    // Российский номер: 7 или 8 + 10 цифр
    if (/^[78]\d{10}$/.test(norm)) return true;
    if (/[78]\d{10}/.test(norm)) return true;

    // Группы цифр: минимум 7 цифр суммарно в группах через стандартные разделители
    const digitGroups = text.match(/\d[\d\s\-.]{4,}\d/g);
    if (digitGroups) {
        for (const group of digitGroups) {
            const digits = group.replace(/\D/g, '');
            if (digits.length >= 7) return true;
        }
    }

    // Цифры прописью восстановленные
    const withDigits = replaceDigitWords(text);
    if (withDigits !== text.toLowerCase()) {
        // Повторная проверка после замены прописью
        const normAfter = normalizeForPhone(withDigits.replace(/\s/g, ''));
        if (/\d{7,}/.test(normAfter)) return true;
    }

    return false;
}

/** Пробелы между отдельными цифрами: "8 9 5 0 1 2 3 4 5 6 7" */
function detectSpacedDigits(text) {
    // 5+ одиночных цифр через пробелы
    return /(?:^|\s)(\d\s+){4,}\d(?:\s|$)/.test(text);
}

/**
 * Цифры прописью: "восемь девять пять ноль один два три"
 * Порог снижен до 4 (было 3) чтобы ловить более длинные последовательности
 * но не блокировать "три вагона пять тонн"
 */
function detectWrittenDigits(text) {
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);
    let consecutive = 0;

    for (const word of words) {
        const clean = word.replace(/[,.\-!?]/g, '');
        if (ALL_DIGIT_WORDS[clean] !== undefined) {
            consecutive++;
            if (consecutive >= 4) return true;
        } else {
            consecutive = 0;
        }
    }
    return false;
}

/** Кириллические буквы как коды цифр (нестандартная обфускация) */
function detectCyrillicEncoding(text) {
    // Паттерн: отдельные кириллические буквы через пробел (5+ штук)
    // Например: "в о с е м ь"
    const isolated = text.match(/(?:^|\s)([а-яёА-ЯЁ])(?=\s|$)/g);
    if (isolated && isolated.length >= 5) return true;

    // Буквы через дефис/точку: "в-о-с-е-м-ь"
    if (/[а-яёА-ЯЁ][-\.][а-яёА-ЯЁ][-\.][а-яёА-ЯЁ]/.test(text)) return true;

    return false;
}

/** Мессенджеры и соцсети */
function detectMessenger(text) {
    const lower = text.toLowerCase();

    // Прямые ссылки
    if (/t\.me\/\S+/.test(lower)) return true;
    if (/wa\.me\/\S+/.test(lower)) return true;
    if (/vk\.com\/\S+/.test(lower)) return true;
    if (/instagram\.com\/\S+/.test(lower)) return true;
    if (/discord\.gg\/\S+/.test(lower)) return true;
    if (/skype\.com\/\S+/.test(lower)) return true;

    // Обфусцированные ссылки
    if (/t\s*[\[(.]?\s*\.?\s*[\])]?\s*me\s*\/\S+/i.test(lower)) return true;
    if (/wa\s*[\[(.]?\s*\.?\s*[\])]?\s*me\s*\/?\S*/i.test(lower)) return true;

    // @username (кроме @railmatch)
    if (/@[a-zA-Z0-9_]{2,}/.test(text) && !/@railmatch/i.test(text)) return true;

    // Ключевые слова мессенджеров
    if (/\b(telegram|whats\s*app|viber|signal|discord|skype)\b/i.test(lower)) return true;

    // Русские аббревиатуры
    if (/\b(тг|т\.г\.?|тлг|телега|tg|вотсапп|ватсапп|вотсап|ватсап|вайбер)\b/i.test(lower)) return true;

    // тг/tg + username
    if (/\b(тг|т\.г\.?|телега|тлг)\s*[:\-]?\s*@?[a-zA-Z][a-zA-Z0-9_.]{1,}/i.test(lower)) return true;
    if (/\btg\s*[:\-]?\s*@?[a-zA-Z][a-zA-Z0-9_.]{1,}/i.test(lower)) return true;

    // Мессенджер + username
    if (/\b(telegram|телеграм|whatsapp|viber|вайбер|signal|тг|tg|телега|discord|skype)\s*[:\-–]?\s*[a-zA-Z][a-zA-Z0-9_.]{2,}/i.test(lower)) return true;

    // Skype ID формат: live:username или live:.cid.xxx
    if (/\blive\s*:\s*[a-zA-Z0-9_.]{3,}/i.test(lower)) return true;

    // ICQ: 9 цифр (исторический формат UIN)
    if (/\bicq\s*:?\s*\d{8,10}\b/i.test(lower)) return true;

    // Discord: username#1234
    if (/[a-zA-Z0-9_]{3,}#\d{4}\b/.test(text)) return true;

    return false;
}

/** Подозрительные username-паттерны на латинице */
function detectLatinUsername(text) {
    const LATIN_WHITELIST = new Set([
        'cargo', 'express', 'online', 'market', 'russia', 'global',
        'trans', 'logistic', 'service', 'group', 'https', 'http', 'gmail',
        'yandex', 'railmatch', 'mobile', 'signal', 'viber', 'telegram',
        'whatsapp', 'instagram', 'google', 'hello', 'thanks', 'order', 'price',
        'delivery', 'truck', 'train', 'wagon', 'route', 'depot', 'agent',
        'client', 'manager', 'driver', 'office', 'company', 'partner',
        'import', 'export', 'freight', 'platform', 'system', 'contact',
        'request', 'contract', 'payment', 'invoice', 'document', 'report',
        'status', 'update', 'confirm', 'cancel', 'accept', 'decline',
        'email', 'phone', 'number', 'address', 'location', 'station',
    ]);

    const hasCyrillic = /[а-яёА-ЯЁ]/.test(text);

    // Username с цифрами или underscore — явный признак
    const usernamePattern = /\b[a-zA-Z][a-zA-Z0-9_]{2,}[0-9_][a-zA-Z0-9_]*\b/g;
    const matches = text.match(usernamePattern);
    if (matches) {
        for (const word of matches) {
            if (!LATIN_WHITELIST.has(word.toLowerCase())) return true;
        }
    }

    // Короткое сообщение целиком на латинице без пробелов (5-32 символа) = вероятный username
    const trimmed = text.trim();
    if (!hasCyrillic && /^[a-zA-Z0-9_.]{5,32}$/.test(trimmed)) return true;

    return false;
}

/** Email-адреса */
function detectEmail(text) {
    const lower = text.toLowerCase();
    if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) return true;
    if (/\S+\s*[\[(]\s*(?:at|собака|dog|эт)\s*[\])]\s*\S+/i.test(lower)) return true;
    return false;
}

/** URL-адреса */
function detectUrl(text) {
    const lower = text.toLowerCase();
    if (/https?:\/\/\S+/.test(lower)) return true;
    if (/www\.\S+/.test(lower)) return true;
    if (/\w+\.(ru|kz|com|net|org|info|biz|su|by|uz|kg|tj|io|me|app)\b/.test(lower)) {
        if (!/(?:тыс|руб|коп|шт|ед|кг|км|м|г)\./i.test(lower.match(/\S+\.(ru|kz|com|net|org|info|biz|su|by|uz|kg|tj|io|me|app)\b/)?.[0] || '')) {
            return true;
        }
    }
    if (/\w+\s*[\[(]\s*(?:dot|точка|тчк)\s*[\])]\s*(?:ru|kz|com|net|org)/i.test(lower)) return true;
    return false;
}

/**
 * Адреса — достаточно для встречи вне платформы.
 * Ловит: "ул. Ленина д.5", "офис 301 этаж 3", "г. Москва пр. Победы"
 */
function detectAddress(text) {
    const lower = text.toLowerCase();

    // Улица / проспект / переулок + что-то после
    if (/\b(?:ул|улица|пр|проспект|пер|переулок|пл|площадь|бул|бульвар|ш|шоссе|наб|набережная)\s*\.?\s+[а-яёА-ЯЁ\w]{3,}/i.test(lower)) return true;

    // "д. 5", "дом 12", "корп. 3"
    if (/\b(?:д|дом)\s*\.?\s*\d+/i.test(lower) && /\b(?:ул|улица|пр|проспект|г|город|офис|корп)/i.test(lower)) return true;

    // "офис 301" или "офис №5" в контексте адреса
    if (/\bофис\s*[№#]?\s*\d+/.test(lower)) return true;

    // "г. Москва", "г. Казань" + что-то дальше похожее на адрес
    if (/\bг\s*\.?\s*[А-ЯЁ][а-яё]{2,}/.test(text) && /\b(?:ул|улица|пр|проспект|д\.|дом|офис)\b/i.test(lower)) return true;

    return false;
}

/** Обфускация ключевых слов: т.е.л.е.ф.о.н, т-е-л-е-г-р-а-м */
function detectObfuscated(text) {
    const lower = text.toLowerCase();
    const keyWords = [
        'телефон', 'телеграм', 'вотсап', 'ватсап', 'вайбер',
        'контакт', 'номер', 'почта', 'телега', 'вконтакте',
        'скайп', 'дискорд', 'инстаграм',
    ];

    for (const word of keyWords) {
        if (word.length < 4) continue;
        const pattern = word.split('').join('[\\s\\-._*+|,;:!?]+');
        if (new RegExp(pattern, 'i').test(lower)) return true;
    }

    return false;
}

/** Фамилии с типичными русскими / СНГ окончаниями */
const SURNAME_ENDINGS = new RegExp(
    '(?:' + [
        // -ов/-ев/-ёв (муж.) и -ова/-ева/-ёва (жен.)
        'овы?', 'евы?', 'ёвы?',
        'овой', 'евой',
        // -ин/-ын и -ина/-ына
        'иных?', 'ыных?',
        // -ских/-ских/-цких
        'ски[йх]', 'ска[яой]', 'ских',
        'цки[йх]', 'цка[яой]', 'цких',
        'жски[йх]', 'жска[яой]',
        // -ых/-их (Черных, Лютых)
        'ых', 'их',
        // -ко/-енко/-ченко/-нко (украинские/южнорусские)
        'енко', 'ченко', 'нко', 'ько',
        // -ук/-юк (украинские)
        'уку?', 'юку?',
        // -евич/-ович (белорусские)
        'евич', 'ович',
        // -вна/-овна/-евна (отчества)
        'овна', 'евна', 'вна',
        // -цев/-цева и все аналоги на согл.+ев
        'цева?', 'шева?', 'нева?', 'жева?', 'щева?',
        'лева?', 'рева?', 'зева?', 'дева?', 'хева?',
        'тева?', 'сева?', 'мева?', 'пева?', 'фева?',
        'чева?', 'бева?', 'гева?', 'кева?', 'вева?',
        // -зов/-дов/-тов и аналоги
        'зова?', 'дова?', 'това?', 'хова?', 'шова?',
        'жова?', 'бова?', 'мова?', 'пова?', 'рова?',
        'сова?', 'фова?', 'лова?', 'нова?', 'кова?',
        'гова?', 'чова?',
    ].join('|') + ')$',
    'iu'
);

// Слова-исключения которые выглядят как фамилии но ими не являются
const SURNAME_EXCEPTIONS = new Set([
    'готов', 'готова', 'здоров', 'здорова', 'знакова', 'знаков',
    'живов', 'живова', 'новый', 'новая', 'новое', 'нового',
    'основа', 'основы', 'основов',
    'любовь', 'морковь', 'свекровь', 'кровь',
    'корова', 'корову', 'коровы',
    'голова', 'головы', 'голову',
    'подкова', 'подковы',
    'кладова', 'столова',
]);

function detectSurname(text) {
    // Ищем кириллические слова с заглавной буквы (вероятное имя собственное)
    const words = text.match(/[А-ЯЁ][а-яё]{4,}/gu);
    if (!words) return false;

    for (const word of words) {
        const lower = word.toLowerCase();
        if (SURNAME_EXCEPTIONS.has(lower)) continue;
        if (SURNAME_ENDINGS.test(word)) return true;
    }
    return false;
}

/** Банковские и налоговые реквизиты */
function detectRequisites(text) {
    const stripped = text.replace(/[\s\-]/g, '');

    if (/\bинн\s*:?\s*\d{10,12}\b/i.test(text)) return true;
    if (/\binn\s*:?\s*\d{10,12}\b/i.test(text)) return true;
    if (/\bогрн\s*:?\s*\d{13,15}\b/i.test(text)) return true;
    if (/\bкпп\s*:?\s*\d{9}\b/i.test(text)) return true;
    if (/\bбик\s*:?\s*\d{9}\b/i.test(text)) return true;
    if (/\b(?:р\/?с|к\/?с|расч[её]тный счёт|корр?\. счёт)\s*:?\s*\d{20}\b/i.test(text)) return true;
    if (/\b\d{20}\b/.test(stripped)) return true;

    return false;
}

/** Компании (ООО, ИП, АО и т.д.) — только с идентифицирующей информацией */
function detectCompanyName(text) {
    // ОПФ + название (3+ символа)
    if (/\b(ООО|ОАО|ЗАО|ПАО|АО|ИП|ГУП|МУП|НКО|АНО|ФГУП|ФГБУ|Ltd|LLC|Inc|GmbH|Corp|OOO|OAO)\s*[«"'][\wа-яА-ЯёЁ\s]{3,}[»"']/i.test(text)) return true;
    // ОПФ + название без кавычек (более строго — минимум 4 символа)
    if (/\b(ООО|ОАО|ЗАО|ПАО|АО|ИП)\s+[А-ЯЁ][а-яёА-ЯЁ\w]{3,}/u.test(text)) return true;
    return false;
}

/** ЖД коды станций (6 цифр — уникально идентифицируют ТЦФТО/грузоотправителя) */
function detectRailwayCode(text) {
    // 6-значный код в контексте "код станции", "ТЦФТО", "ЭТРАН"
    if (/\b(?:код\s*станции|тцфто|этран|ЕК\s*ИОДВ)\s*:?\s*\d{6}\b/i.test(text)) return true;
    return false;
}

// --- ГЛАВНАЯ ФУНКЦИЯ ВАЛИДАЦИИ ---

/**
 * @param {string} text
 * @returns {{ valid: boolean, cleaned: string, isViolation: boolean, violationType: string|null }}
 */
export const validateMessageIntent = (text) => {
    if (!text || !text.trim()) {
        return { valid: true, cleaned: text, isViolation: false, violationType: null };
    }

    const lower = text.toLowerCase();

    if (detectPhone(text))           return violation(text, 'phone');
    if (detectSpacedDigits(text))    return violation(text, 'phone');
    if (detectWrittenDigits(text))   return violation(text, 'phone');
    if (detectCyrillicEncoding(text)) return violation(text, 'obfuscated');
    if (detectMessenger(text))       return violation(text, 'messenger');
    if (detectLatinUsername(text))   return violation(text, 'messenger');
    if (detectEmail(text))           return violation(text, 'email');
    if (detectUrl(text))             return violation(text, 'url');
    if (detectObfuscated(text))      return violation(text, 'obfuscated');
    if (detectAddress(text))         return violation(text, 'address');
    if (detectSurname(text))         return violation(text, 'surname');
    if (detectCompanyName(text))     return violation(text, 'company_name');
    if (detectRequisites(text))      return violation(text, 'requisites');
    if (detectRailwayCode(text))     return violation(text, 'requisites');

    if (STOP_WORDS.some(sw => lower.includes(sw))) return violation(text, 'stop_word');

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

// --- ПРОВЕРКА ПОСЛЕДОВАТЕЛЬНОСТИ СООБЩЕНИЙ ---
// Ловит попытки разбить контакт на части: по словам, по буквам, по цифрам.

/**
 * @param {string[]} recentSenderTexts — последние до 15 сообщений от того же отправителя
 * @param {string} newText
 */
export const validateMessageSequence = (recentSenderTexts, newText) => {
    // 1. Проверка одного сообщения
    const single = validateMessageIntent(newText);
    if (single.isViolation) return single;

    const allMessages = [...recentSenderTexts, newText];

    // 2. Sliding window: проверяем комбинацию последних 1–4 сообщений
    for (let n = 1; n <= Math.min(4, recentSenderTexts.length); n++) {
        const slice = recentSenderTexts.slice(-n);
        const combined = [...slice, newText].join(' ');
        if (validateMessageIntent(combined).isViolation) {
            return violation(newText, 'split_contact');
        }
    }

    // 3. Детектор побуквенной передачи (single-letter accumulation)
    // Если человек отправляет много коротких сообщений (1–3 символа) — это подозрительно
    const shortMessages = allMessages.filter(m => m && m.trim().length <= 3);
    if (shortMessages.length >= 5) {
        // Собираем всё вместе и проверяем
        const reconstructed = shortMessages.map(m => m.trim()).join('');
        if (validateMessageIntent(reconstructed).isViolation) {
            return violation(newText, 'split_letter');
        }

        // Цифры из коротких сообщений
        const digits = reconstructed.replace(/\D/g, '');
        if (digits.length >= 7) {
            return violation(newText, 'split_letter');
        }

        // Буквы из коротких сообщений → восстанавливаем слово и проверяем
        const letters = reconstructed.replace(/[^а-яёА-ЯЁa-zA-Z]/g, '');
        if (letters.length >= 5 && validateMessageIntent(letters).isViolation) {
            return violation(newText, 'split_letter');
        }
    }

    // 4. Проверяем цифровые фрагменты во всех последних сообщениях (до 10)
    const allDigits = allMessages
        .slice(-10)
        .map(m => (m || '').replace(/\D/g, ''))
        .join('');
    if (allDigits.length >= 10) {
        // 10+ цифр суммарно за последние 10 сообщений = вероятный номер телефона
        // (исключаем очевидные деловые числа: суммы, объёмы, даты)
        // Проверяем что это не просто обсуждение цены/тоннажа
        const priceContext = /(?:руб|тыс|млн|тонн|вагон|км|т\.)/i.test(allMessages.slice(-10).join(' '));
        if (!priceContext && allDigits.length >= 10) {
            return violation(newText, 'split_contact');
        }
    }

    return single;
};
