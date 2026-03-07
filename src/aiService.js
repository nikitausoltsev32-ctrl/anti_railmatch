// src/aiService.js

/**
 * Heuristic NLP Parser for RailMatch
 * Parses natural language into structured filters or creation intents.
 */

const WAGON_TYPES = [
    { type: 'Крытый', synonyms: ['крыт', 'крытые', 'крытых', 'крытый'] },
    { type: 'Полувагон', synonyms: ['полувагон', 'полувагоны', 'пв', 'полуваг'] },
    { type: 'Платформа', synonyms: ['платформ', 'платформы', 'плат'] },
    { type: 'Цистерна', synonyms: ['цистерн', 'цистерны', 'бочк', 'цист'] },
    { type: 'Зерновоз', synonyms: ['зерновоз', 'зерновоз'] },
    { type: 'Хоппер', synonyms: ['хоппер', 'хопп'] },
    { type: 'Рефрижератор', synonyms: ['реф', 'рефрижератор'] }
];
const CARGO_TYPES = [
    { type: 'Уголь', synonyms: ['уголь', 'угля'] },
    { type: 'Зерно', synonyms: ['зерно', 'зерна'] },
    { type: 'Лес', synonyms: ['лес', 'леса', 'пиломатериал'] },
    { type: 'Металл', synonyms: ['металл', 'прокат'] },
    { type: 'Нефть', synonyms: ['нефть', 'бензин', 'дизель'] },
    { type: 'Щебень', synonyms: ['щебень', 'щебня'] },
    { type: 'Удобрения', synonyms: ['удобрен'] },
    { type: 'Песок', synonyms: ['песок', 'песка'] },
    { type: 'Руда', synonyms: ['руда', 'руды'] },
    { type: 'Трубы', synonyms: ['труб'] },
    { type: 'ТНП', synonyms: ['тнп', 'товары'] }
];

const CITY_ABBREVIATIONS = {
    'мск': 'Москва',
    'москва': 'Москва',
    'москвы': 'Москва',
    'москву': 'Москва',
    'москве': 'Москва',
    'спб': 'Санкт-Петербург',
    'питер': 'Санкт-Петербург',
    'питера': 'Санкт-Петербург',
    'екб': 'Екатеринбург',
    'екатеринбург': 'Екатеринбург',
    'екатеринбурга': 'Екатеринбург',
    'нск': 'Новосибирск',
    'новосибирск': 'Новосибирск',
    'новосибирска': 'Новосибирск',
    'рнд': 'Ростов-на-Дону',
    'ростов': 'Ростов-на-Дону',
    'ростов-на-дону': 'Ростов-на-Дону',
    'владик': 'Владивосток',
    'владивосток': 'Владивосток',
    'крд': 'Краснодар',
    'краснодар': 'Краснодар',
    'краснодара': 'Краснодар',
    'казань': 'Казань',
    'казани': 'Казань',
    'омск': 'Омск',
    'омска': 'Омск',
    'челябинск': 'Челябинск',
    'челябинска': 'Челябинск',
    'самара': 'Самара',
    'самары': 'Самара',
    'самару': 'Самара',
    'тюмень': 'Тюмень',
    'тюмени': 'Тюмень',
    'пермь': 'Пермь',
    'перми': 'Пермь',
    'уфа': 'Уфа',
    'уфы': 'Уфа',
    'уфу': 'Уфа',
    'воронеж': 'Воронеж',
    'воронежа': 'Воронеж',
    'красноярск': 'Красноярск',
    'красноярска': 'Красноярск',
    'иркутск': 'Иркутск',
    'иркутска': 'Иркутск',
    'санкт-петербург': 'Санкт-Петербург',
    'санкт-петербурга': 'Санкт-Петербург',
    'санкт-петербургу': 'Санкт-Петербург',
    'ростова-на-дону': 'Ростов-на-Дону',
    'ростову-на-дону': 'Ростов-на-Дону',
    'ростове-на-дону': 'Ростов-на-Дону'
};

const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const resolveCityName = (name) => {
    if (!name) return null;
    const cleanName = name.replace(/[.,]/g, '').toLowerCase().trim();
    if (CITY_ABBREVIATIONS[cleanName]) {
        return CITY_ABBREVIATIONS[cleanName];
    }
    // Basic lemmatization for Russian prepositions "из", "в"
    let lemmatized = cleanName;
    if (lemmatized.length > 4) {
        if (!lemmatized.includes('-')) {
            lemmatized = lemmatized.replace(/(ы|и|у|е|ом|ах|ях|а)$/i, '');
        } else {
            const parts = lemmatized.split('-');
            const lastPart = parts.pop().replace(/(ы|и|у|е|ом|ах|ях|а)$/i, '');
            lemmatized = [...parts, lastPart].join('-');
        }
    }
    // Correctly capitalize each part of a hyphenated city
    return lemmatized.split('-').map(part => capitalize(part)).join('-');
};

export const parsePrompt = (prompt) => {
    let lowerPrompt = prompt.toLowerCase();

    // Normalize disconnected dashes for routes (A - B) without destroying hyphenated cities (A-B)
    lowerPrompt = lowerPrompt.replace(/\s+-\s+/g, ' - ');

    let result = {
        intent: 'search',
        stationFrom: null,
        stationTo: null,
        wagonType: null,
        cargoType: null,
        totalWagons: null,
        totalTons: null,
        targetPrice: null
    };

    // 1. Determine Intent
    const createKeywords = ['хочу отправить', 'нужно отправить', 'отправляю', 'создать', 'сформировать', 'создай', 'мне нужно', 'буду отправлять', 'заявк'];
    if (createKeywords.some(kw => lowerPrompt.includes(kw))) {
        result.intent = 'create';
    }

    // 2. Extract Wagon Type
    for (const w of WAGON_TYPES) {
        if (w.synonyms.some(s => lowerPrompt.includes(s))) {
            result.wagonType = w.type;
            break;
        }
    }

    // 3. Extract Cargo Type
    for (const c of CARGO_TYPES) {
        if (c.synonyms.some(s => lowerPrompt.includes(s))) {
            result.cargoType = c.type;
            break;
        }
    }

    // 4. Extract Numbers for Wagons & Tons
    let numbers = [...lowerPrompt.matchAll(/(\d+)/g)].map(m => parseInt(m[1], 10));

    const wagonsMatch = lowerPrompt.match(/(\d+)\s*(?:вагон|вагонов|вагона|шт|штук|пв|цистерн|платформ)/i);
    if (wagonsMatch && wagonsMatch[1]) result.totalWagons = Number(wagonsMatch[1]);

    const tonsMatch = lowerPrompt.match(/(\d+)\s*(?:тонн|т\.|т\b)/i);
    let explicitTons = null;
    if (tonsMatch && tonsMatch[1]) {
        explicitTons = Number(tonsMatch[1]);
        if (lowerPrompt.includes(' по ' + explicitTons) && result.totalWagons) {
            explicitTons = explicitTons * result.totalWagons;
        }
        result.totalTons = explicitTons;
    }

    // 5. Extract Price
    const priceMatch = lowerPrompt.match(/(\d+)\s*(?:руб|р\.|рублей|за вагон)/i);
    if (priceMatch && priceMatch[1]) result.targetPrice = Number(priceMatch[1]);

    // 6. Extract Stations
    let promptForStations = lowerPrompt; // keep a copy to consume matched parts safely

    // A. "из X" / "в Y"
    const fromMatch = promptForStations.match(/(?:^|\s)(?:из|от)\s+([а-яА-ЯёЁa-zA-Z]+(?:-[а-яА-ЯёЁa-zA-Z]+)*)/i);
    if (fromMatch && fromMatch[1]) {
        result.stationFrom = resolveCityName(fromMatch[1]);
        promptForStations = promptForStations.replace(fromMatch[0], '');
    }

    const toMatch = promptForStations.match(/(?:^|\s)(?:в|до)\s+([а-яА-ЯёЁa-zA-Z]+(?:-[а-яА-ЯёЁa-zA-Z]+)*)/i);
    if (toMatch && toMatch[1] && !['вагонах', 'вагоне', 'цистернах', 'цистерне', 'полувагонах', 'бочках'].includes(toMatch[1].toLowerCase()
    )) {
        result.stationTo = resolveCityName(toMatch[1]);
        promptForStations = promptForStations.replace(toMatch[0], '');
    }

    // B. "X - Y"
    if (!result.stationFrom || !result.stationTo) {
        const routeMatch = promptForStations.match(/([а-яА-ЯёЁa-zA-Z]+(?:-[а-яА-ЯёЁa-zA-Z]+)*)\s+-\s+([а-яА-ЯёЁa-zA-Z]+(?:-[а-яА-ЯёЁa-zA-Z]+)*)/i);
        if (routeMatch) {
            if (!result.stationFrom) result.stationFrom = resolveCityName(routeMatch[1]);
            if (!result.stationTo) result.stationTo = resolveCityName(routeMatch[2]);
        }
    }

    // C. Fallback: Remaining capitalized/unrecognized words
    if (!result.stationFrom || !result.stationTo) {
        const stopWords = ['хочу', 'отправить', 'по', 'шт', 'т', 'вагон', 'вагонов', 'вагона', 'вагоны', 'вагонах', 'вагоне', 'ваг', 'тонн', 'нужно', 'из', 'в', 'от', 'до', 'мне', 'заявк', 'создать', 'найти', 'ищу', 'нужны', 'нужен', 'нужна', 'подойдут', 'есть'];
        // Split by space, keeping hyphens intact
        const words = promptForStations.split(/\s+/).map(w => w.replace(/[.,]/g, ''));

        let potentialCities = words.filter(w => {
            if (w.length < 3 || stopWords.includes(w) || !isNaN(w)) return false;
            if (CITY_ABBREVIATIONS[w]) return true;

            const isWagon = WAGON_TYPES.some(wt => wt.synonyms.some(s => w.includes(s)));
            const isCargo = CARGO_TYPES.some(ct => ct.synonyms.some(s => w.includes(s)));
            return !isWagon && !isCargo;
        });

        if (potentialCities.length >= 1 && !result.stationFrom) {
            result.stationFrom = resolveCityName(potentialCities[0]);
        }
        if (potentialCities.length >= 2 && !result.stationTo) {
            result.stationTo = resolveCityName(potentialCities[1]);
        }
    }

    return result;
};

/**
 * Returns missing required fields for 'create' intent.
 * Minimum required: wagonType + stationFrom
 */
export const getMissingFields = (parsed) => {
    const missing = [];
    if (!parsed.wagonType) missing.push('wagonType');
    if (!parsed.stationFrom) missing.push('stationFrom');
    if (!parsed.stationTo) missing.push('stationTo');
    return missing;
};

const CLARIFICATION_QUESTIONS = {
    wagonType: 'Какой тип вагона нужен? (крытый, полувагон, цистерна, платформа, хоппер, реф)',
    stationFrom: 'Укажите город отправления:',
    stationTo: 'Укажите город назначения (необязательно, можно пропустить):',
};

export const getClarificationQuestion = (missingFields) => {
    // Ask about most critical missing field first
    if (missingFields.includes('wagonType') && missingFields.includes('stationFrom')) {
        return 'Уточните: какой тип вагона и откуда? (например: крытые из Москвы)';
    }
    const first = missingFields.find(f => CLARIFICATION_QUESTIONS[f]);
    return first ? CLARIFICATION_QUESTIONS[first] : null;
};
