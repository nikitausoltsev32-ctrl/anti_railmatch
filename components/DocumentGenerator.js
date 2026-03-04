/**
 * DocumentGenerator.js
 * Генерация юридически корректных PDF-документов для RailMatch
 * Использует jsPDF (уже установлен) для создания векторных PDF с водяными знаками
 */
import { jsPDF } from 'jspdf';
import { RobotoBase64 } from '../src/roboto-font';

// ============================================
// КИРИЛЛИЧЕСКИЙ ШРИФТ
// ============================================
function setupCyrillicFont(doc) {
    doc.addFileToVFS('Roboto-Regular.ttf', RobotoBase64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'bold'); // jsPDF doesn't truly support bold with custom, but this prevents fallback
    doc.setFont('Roboto', 'normal');
}

// ============================================
// УТИЛИТЫ
// ============================================

const PAGE_W = 210; // A4 width mm
const PAGE_H = 297; // A4 height mm
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

function fmt(num) {
    return Number(num || 0).toLocaleString('ru-RU');
}

function fmtDate(date) {
    return new Date(date || Date.now()).toLocaleDateString('ru-RU', {
        day: '2-digit', month: 'long', year: 'numeric'
    });
}

function shortDate(date) {
    return new Date(date || Date.now()).toLocaleDateString('ru-RU');
}

/** Добавить водяной знак на текущую страницу */
function addWatermark(doc, userId) {
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.04 }));
    doc.setFontSize(28);
    doc.setTextColor(0, 0, 0);
    const text = `RailMatch  •  ${userId?.slice(0, 8) || 'USER'}  •  ${shortDate()}`;
    // Диагональный паттерн
    for (let y = 30; y < PAGE_H; y += 60) {
        for (let x = -40; x < PAGE_W; x += 180) {
            doc.text(text, x, y, { angle: -30 });
        }
    }
    doc.restoreGraphicsState();
}

/** Шапка документа */
function addHeader(doc, docTitle, docNumber, docDate) {
    // Логотип / название платформы
    doc.setFontSize(14);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(37, 99, 235); // blue-600
    doc.text('RailMatch', MARGIN, 18);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Система защищённого документооборота', MARGIN, 23);

    // Название и номер документа
    doc.setFontSize(8);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(100, 116, 139);
    const rightText = `${docTitle} № ${docNumber}`;
    doc.text(rightText, PAGE_W - MARGIN, 18, { align: 'right' });

    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(fmtDate(docDate), PAGE_W - MARGIN, 24, { align: 'right' });

    // Разделитель
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, 28, PAGE_W - MARGIN, 28);

    return 34; // y-позиция для контента
}

/** Блок реквизитов стороны */
function addPartyBlock(doc, y, label, data) {
    doc.setFontSize(7);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), MARGIN, y);
    y += 5;

    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(data.company || '—', MARGIN, y);
    y += 4.5;

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    const lines = [
        data.inn ? `ИНН ${data.inn}` + (data.kpp ? ` / КПП ${data.kpp}` : '') : null,
        data.ogrn ? `ОГРН ${data.ogrn}` : null,
        data.legal_address || null,
        data.bank_name ? `Банк: ${data.bank_name}` : null,
        data.account ? `Р/с: ${data.account}` : null,
        data.bik ? `БИК: ${data.bik}` + (data.corr_account ? ` / К/с: ${data.corr_account}` : '') : null,
    ].filter(Boolean);

    for (const line of lines) {
        doc.text(line, MARGIN, y);
        y += 3.8;
    }
    return y + 2;
}

/** Блок подписей */
function addSignatures(doc, y, signerShipper, signerOwner) {
    if (y > PAGE_H - 60) {
        doc.addPage();
        addWatermark(doc, null);
        y = MARGIN + 10;
    }

    y += 8;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 10;

    doc.setFontSize(8);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(15, 23, 42);

    const colW = CONTENT_W / 2 - 5;

    // Левая сторона — Грузоотправитель
    doc.text('ГРУЗООТПРАВИТЕЛЬ:', MARGIN, y);
    doc.text('ВЛАДЕЛЕЦ ВАГОНОВ:', MARGIN + colW + 10, y);
    y += 8;

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    doc.text(signerShipper?.position || 'Генеральный директор', MARGIN, y);
    doc.text(signerOwner?.position || 'Генеральный директор', MARGIN + colW + 10, y);
    y += 12;

    // Линии подписи
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, y, MARGIN + colW, y);
    doc.line(MARGIN + colW + 10, y, PAGE_W - MARGIN, y);
    y += 4;

    doc.setFontSize(7);
    doc.text(signerShipper?.name || '____________________', MARGIN, y);
    doc.text(signerOwner?.name || '____________________', MARGIN + colW + 10, y);
    y += 4;
    doc.setTextColor(148, 163, 184);
    doc.text('подпись / ФИО', MARGIN, y);
    doc.text('подпись / ФИО', MARGIN + colW + 10, y);

    y += 8;
    doc.text('М.П.', MARGIN + colW / 2, y, { align: 'center' });
    doc.text('М.П.', MARGIN + colW + 10 + colW / 2, y, { align: 'center' });

    return y;
}

/** Подвал */
function addFooter(doc) {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(6);
        doc.setTextColor(180, 180, 180);
        doc.text(
            `Электронный документ, сформирован системой RailMatch  •  Страница ${i} из ${totalPages}`,
            PAGE_W / 2, PAGE_H - 8, { align: 'center' }
        );
    }
}

/** Табличная строка */
function drawTableRow(doc, y, cols, widths, opts = {}) {
    const { bold, bg, header, fontSize = 8 } = opts;
    const rowH = header ? 8 : 7;

    if (bg) {
        doc.setFillColor(...bg);
        doc.rect(MARGIN, y - 4.5, CONTENT_W, rowH, 'F');
    }

    doc.setFontSize(fontSize);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(header ? [100, 116, 139] : [30, 41, 59]);

    let x = MARGIN;
    cols.forEach((text, i) => {
        const align = i === cols.length - 1 ? 'right' : 'left';
        const tx = align === 'right' ? x + widths[i] : x + 2;
        doc.text(String(text ?? ''), tx, y, { align });
        x += widths[i];
    });

    // Разделитель
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.line(MARGIN, y + 2.5, PAGE_W - MARGIN, y + 2.5);

    return y + rowH;
}

/** Проверка и добавление новой страницы если нужно */
function checkPage(doc, y, needed = 30, userId = null) {
    if (y > PAGE_H - MARGIN - needed) {
        doc.addPage();
        addWatermark(doc, userId);
        return MARGIN + 5;
    }
    return y;
}

// ============================================
// ШАБЛОН 1: ДОГОВОР ТЭО
// ============================================
function renderContract(doc, d) {
    let y = addHeader(doc, 'ДОГОВОР', d.docNumber, d.date);
    addWatermark(doc, d.userId);

    // Заголовок
    doc.setFontSize(12);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('ДОГОВОР НА ТРАНСПОРТНО-ЭКСПЕДИЦИОННОЕ ОБСЛУЖИВАНИЕ', PAGE_W / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`№ ${d.docNumber} от ${fmtDate(d.date)}`, PAGE_W / 2, y, { align: 'center' });
    y += 10;

    // Преамбула
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const preamble = `${d.shipper?.company || 'Грузоотправитель'}, именуемое в дальнейшем «Заказчик», в лице ${d.signerShipper?.position || 'Генерального директора'} ${d.signerShipper?.name || '____________'}, действующего на основании Устава, с одной стороны, и ${d.owner?.company || 'Владелец вагонов'}, именуемое в дальнейшем «Исполнитель», в лице ${d.signerOwner?.position || 'Генерального директора'} ${d.signerOwner?.name || '____________'}, действующего на основании Устава, с другой стороны, совместно именуемые «Стороны», заключили настоящий Договор о нижеследующем:`;
    const pLines = doc.splitTextToSize(preamble, CONTENT_W);
    doc.text(pLines, MARGIN, y);
    y += pLines.length * 4 + 6;

    // 1. Предмет договора
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.text('1. ПРЕДМЕТ ДОГОВОРА', MARGIN, y); y += 6;
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8.5);

    const subj = [
        `1.1. Исполнитель обязуется предоставить под погрузку технически исправный железнодорожный подвижной состав (вагоны типа «${d.wagonType || 'Крытый'}») в количестве ${d.wagons} шт.`,
        `1.2. Маршрут: ${d.stationFrom} → ${d.stationTo}.`,
        `1.3. Груз: ${d.cargoType || 'Не указан'}. Объём: ${d.wagons} вагонов, ${d.tons || '—'} тонн.`,
        `1.4. Заказчик обязуется оплатить услуги Исполнителя в порядке и на условиях, предусмотренных разделом 2 настоящего Договора.`,
    ];
    for (const s of subj) {
        const sl = doc.splitTextToSize(s, CONTENT_W - 4);
        doc.text(sl, MARGIN + 2, y);
        y += sl.length * 3.8 + 2;
    }
    y += 3;

    // 2. Стоимость и порядок расчётов
    y = checkPage(doc, y, 60, d.userId);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.text('2. СТОИМОСТЬ И ПОРЯДОК РАСЧЁТОВ', MARGIN, y); y += 6;
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8.5);

    const baseAmount = (d.price || 0) * (d.wagons || 0);
    const commission = Math.round(baseAmount * 0.025);
    const nds = Math.round(baseAmount * 0.2);

    const cost = [
        `2.1. Стоимость услуг Исполнителя составляет ${fmt(d.price)} руб. за один вагон. Общая стоимость по настоящему Договору: ${fmt(baseAmount)} (${numToWords(baseAmount)}) руб., в т.ч. НДС 20% — ${fmt(nds)} руб.`,
        `2.2. Оплата производится путём внесения гарантийного обеспечения (эскроу) на специализированный счёт платформы RailMatch до момента подачи вагонов.`,
        `2.3. Комиссия платформы RailMatch составляет 2,5% от суммы сделки (${fmt(commission)} руб.) и удерживается с Заказчика при финальном расчёте.`,
        `2.4. Средства размораживаются и перечисляются Исполнителю после подписания Акта выполненных работ обеими Сторонами.`,
    ];
    for (const s of cost) {
        y = checkPage(doc, y, 20, d.userId);
        const sl = doc.splitTextToSize(s, CONTENT_W - 4);
        doc.text(sl, MARGIN + 2, y);
        y += sl.length * 3.8 + 2;
    }
    y += 3;

    // 3. Обязанности сторон
    y = checkPage(doc, y, 50, d.userId);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.text('3. ОБЯЗАННОСТИ СТОРОН', MARGIN, y); y += 6;
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8.5);

    const duties = [
        '3.1. Исполнитель обязуется:',
        '   а) предоставить технически исправные вагоны в согласованные сроки;',
        '   б) обеспечить подачу вагонов на станцию погрузки;',
        '   в) предоставить документы, подтверждающие право собственности/аренды вагонов.',
        '3.2. Заказчик обязуется:',
        '   а) обеспечить погрузку груза в установленные сроки;',
        '   б) внести гарантийный платёж до подачи вагонов;',
        '   в) подписать Акт выполненных работ в течение 3 (трёх) рабочих дней после доставки.',
    ];
    for (const s of duties) {
        y = checkPage(doc, y, 12, d.userId);
        doc.text(s, MARGIN + 2, y);
        y += 4;
    }
    y += 3;

    // 4. Ответственность
    y = checkPage(doc, y, 40, d.userId);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.text('4. ОТВЕТСТВЕННОСТЬ СТОРОН', MARGIN, y); y += 6;
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8.5);

    const resp = [
        `4.1. За неисполнение или ненадлежащее исполнение обязательств Стороны несут ответственность в соответствии с действующим законодательством РФ.`,
        `4.2. В случае просрочки подачи вагонов свыше 5 рабочих дней Заказчик вправе отказаться от Договора с полным возвратом эскроу.`,
        `4.3. Споры разрешаются путём переговоров, при недостижении согласия — в Арбитражном суде по месту нахождения истца.`,
    ];
    for (const s of resp) {
        y = checkPage(doc, y, 16, d.userId);
        const sl = doc.splitTextToSize(s, CONTENT_W - 4);
        doc.text(sl, MARGIN + 2, y);
        y += sl.length * 3.8 + 2;
    }
    y += 3;

    // 5. Форс-мажор
    y = checkPage(doc, y, 30, d.userId);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.text('5. ФОРС-МАЖОР', MARGIN, y); y += 6;
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8.5);
    const fm = `5.1. Стороны освобождаются от ответственности за частичное или полное неисполнение обязательств, если оно явилось следствием обстоятельств непреодолимой силы (стихийные бедствия, действия органов власти, забастовки, эмбарго).`;
    const fmL = doc.splitTextToSize(fm, CONTENT_W - 4);
    doc.text(fmL, MARGIN + 2, y);
    y += fmL.length * 3.8 + 6;

    // 6. Заключительные положения
    y = checkPage(doc, y, 30, d.userId);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.text('6. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ', MARGIN, y); y += 6;
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8.5);
    const fin = [
        `6.1. Настоящий Договор вступает в силу с момента электронного подтверждения обеими Сторонами на платформе RailMatch и действует до полного исполнения обязательств.`,
        `6.2. Электронное подтверждение в системе RailMatch приравнивается к собственноручной подписи согласно п.2 ст.6 Федерального закона от 06.04.2011 № 63-ФЗ «Об электронной подписи».`,
    ];
    for (const s of fin) {
        y = checkPage(doc, y, 16, d.userId);
        const sl = doc.splitTextToSize(s, CONTENT_W - 4);
        doc.text(sl, MARGIN + 2, y);
        y += sl.length * 3.8 + 2;
    }

    // Реквизиты сторон
    y = checkPage(doc, y, 60, d.userId);
    y += 6;
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.text('7. РЕКВИЗИТЫ И ПОДПИСИ СТОРОН', MARGIN, y); y += 8;

    y = addPartyBlock(doc, y, 'Заказчик (Грузоотправитель)', d.shipper || {});
    y += 4;
    y = addPartyBlock(doc, y, 'Исполнитель (Владелец вагонов)', d.owner || {});

    y = addSignatures(doc, y, d.signerShipper, d.signerOwner);
}

// ============================================
// ШАБЛОН 2: ЗАЯВКА ГУ-12
// ============================================
function renderGU12(doc, d) {
    let y = addHeader(doc, 'ЗАЯВКА НА ПЕРЕВОЗКУ (ГУ-12)', d.docNumber, d.date);
    addWatermark(doc, d.userId);

    doc.setFontSize(11);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('ЗАЯВКА НА ПЕРЕВОЗКУ ГРУЗОВ', PAGE_W / 2, y, { align: 'center' });
    y += 4;
    doc.setFontSize(8);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('(форма ГУ-12, электронный формат)', PAGE_W / 2, y, { align: 'center' });
    y += 10;

    // Таблица заявки
    const widths = [55, CONTENT_W - 55];
    const rows = [
        ['Грузоотправитель', d.shipper?.company || '—'],
        ['ИНН грузоотправителя', d.shipper?.inn || '—'],
        ['Владелец вагонов', d.owner?.company || '—'],
        ['ИНН владельца вагонов', d.owner?.inn || '—'],
        ['Станция отправления', d.stationFrom || '—'],
        ['Станция назначения', d.stationTo || '—'],
        ['Наименование груза', d.cargoType || '—'],
        ['Код ЕТСНГ', d.etsnCode || '—'],
        ['Род вагона', d.wagonType || 'Крытый'],
        ['Количество вагонов', String(d.wagons || 0)],
        ['Масса нетто (тонн)', String(d.tons || '—')],
        ['Масса брутто (тонн)', d.grossWeight ? String(d.grossWeight) : '—'],
        ['Класс опасности', d.hazardClass || 'Нет'],
        ['Особые условия', d.specialConditions || 'Нет'],
        ['Плательщик', d.shipper?.company || '—'],
        ['Договор №', d.docNumber || '—'],
    ];

    for (const [label, value] of rows) {
        y = checkPage(doc, y, 12, d.userId);
        doc.setFontSize(8);
        doc.setFont('Roboto', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(label, MARGIN + 2, y);
        doc.setFont('Roboto', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(String(value), MARGIN + widths[0], y);
        doc.setDrawColor(226, 232, 240);
        doc.line(MARGIN, y + 2.5, PAGE_W - MARGIN, y + 2.5);
        y += 7;
    }

    y += 6;
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const note = 'Заявка оформлена в электронном виде на платформе RailMatch. Электронное подтверждение приравнивается к подписи (п.2 ст.6 ФЗ-63).';
    const noteL = doc.splitTextToSize(note, CONTENT_W);
    doc.text(noteL, MARGIN, y);
    y += noteL.length * 3.5 + 8;

    y = addSignatures(doc, y, d.signerShipper, d.signerOwner);
}

// ============================================
// ШАБЛОН 3: ЖД-НАКЛАДНАЯ
// ============================================
function renderWaybill(doc, d) {
    let y = addHeader(doc, 'ЖЕЛЕЗНОДОРОЖНАЯ НАКЛАДНАЯ', d.docNumber, d.date);
    addWatermark(doc, d.userId);

    doc.setFontSize(11);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('ЖЕЛЕЗНОДОРОЖНАЯ ТРАНСПОРТНАЯ НАКЛАДНАЯ', PAGE_W / 2, y, { align: 'center' });
    y += 10;

    // Данные отправления
    const widths = [55, CONTENT_W - 55];
    const rows1 = [
        ['Грузоотправитель', d.shipper?.company || '—'],
        ['Грузополучатель', d.owner?.company || '—'],
        ['Станция отправления', d.stationFrom || '—'],
        ['Станция назначения', d.stationTo || '—'],
        ['Наименование груза', d.cargoType || '—'],
        ['Род вагона', d.wagonType || 'Крытый'],
        ['Количество вагонов', String(d.wagons || 0)],
        ['Масса груза (тонн)', String(d.tons || '—')],
        ['Дата приёма к перевозке', fmtDate(d.date)],
    ];

    for (const [label, value] of rows1) {
        doc.setFontSize(8);
        doc.setFont('Roboto', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(label, MARGIN + 2, y);
        doc.setFont('Roboto', 'normal');
        doc.setTextColor(15, 23, 42);
        doc.text(String(value), MARGIN + widths[0], y);
        doc.setDrawColor(226, 232, 240);
        doc.line(MARGIN, y + 2.5, PAGE_W - MARGIN, y + 2.5);
        y += 7;
    }

    // Таблица вагонов
    y += 6;
    y = checkPage(doc, y, 30, d.userId);
    doc.setFontSize(9);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('РЕЕСТР ВАГОНОВ', MARGIN, y); y += 6;

    const tWidths = [15, 35, 30, 30, CONTENT_W - 110];
    y = drawTableRow(doc, y, ['№', 'Номер вагона', 'Тип', 'Масса (т)', 'Пломбы'], tWidths, { header: true });

    const wagonNumbers = d.wagonNumbers || [];
    const count = Math.min(d.wagons || 5, 20);
    for (let i = 0; i < count; i++) {
        y = checkPage(doc, y, 10, d.userId);
        const num = wagonNumbers[i] || String(60000000 + Math.floor(Math.random() * 10000000));
        y = drawTableRow(doc, y,
            [String(i + 1), num, d.wagonType || 'Крытый', d.tonPerWagon || '—', d.sealNumbers?.[i] || '—'],
            tWidths,
            { bg: i % 2 === 0 ? [248, 250, 252] : null }
        );
    }

    y += 8;
    y = addSignatures(doc, y, d.signerShipper, d.signerOwner);
}

// ============================================
// ШАБЛОН 4: УПД
// ============================================
function renderUPD(doc, d) {
    let y = addHeader(doc, 'УНИВЕРСАЛЬНЫЙ ПЕРЕДАТОЧНЫЙ ДОКУМЕНТ', d.docNumber, d.date);
    addWatermark(doc, d.userId);

    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('УНИВЕРСАЛЬНЫЙ ПЕРЕДАТОЧНЫЙ ДОКУМЕНТ', PAGE_W / 2, y, { align: 'center' });
    y += 4;
    doc.setFontSize(8);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Статус: 1 (счёт-фактура и передаточный документ)', PAGE_W / 2, y, { align: 'center' });
    y += 8;

    // Счёт-фактура шапка
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Счёт-фактура № ${d.docNumber} от ${fmtDate(d.date)}`, MARGIN, y); y += 4;
    doc.text(`Продавец: ${d.owner?.company || '—'}, ИНН/КПП: ${d.owner?.inn || '—'}/${d.owner?.kpp || '—'}`, MARGIN, y); y += 4;
    doc.text(`Покупатель: ${d.shipper?.company || '—'}, ИНН/КПП: ${d.shipper?.inn || '—'}/${d.shipper?.kpp || '—'}`, MARGIN, y); y += 4;
    doc.text(`Валюта: Российский рубль (643)`, MARGIN, y); y += 8;

    // Табличная часть
    const baseAmount = (d.price || 0) * (d.wagons || 0);
    const nds = Math.round(baseAmount * 0.2);
    const total = baseAmount + nds;

    const tW = [10, 50, 15, 15, 25, 20, 20, CONTENT_W - 155];
    y = drawTableRow(doc, y, ['№', 'Наименование', 'Ед.', 'Кол-во', 'Цена', 'Сумма', 'НДС', 'Всего'], tW, { header: true, fontSize: 7 });
    y = drawTableRow(doc, y, [
        '1',
        `Предоставление ЖД вагонов (${d.wagonType || 'Крытый'})`,
        'шт',
        String(d.wagons || 0),
        fmt(d.price),
        fmt(baseAmount),
        fmt(nds),
        fmt(total)
    ], tW, { fontSize: 7 });
    y += 2;

    // Итого
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    y = drawTableRow(doc, y, ['', 'ИТОГО', '', '', '', fmt(baseAmount), fmt(nds), fmt(total)], tW, { bold: true, fontSize: 7.5 });

    y += 6;
    doc.setFontSize(7.5);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Маршрут: ${d.stationFrom} → ${d.stationTo}`, MARGIN, y); y += 4;
    doc.text(`Груз: ${d.cargoType || '—'}, ${d.tons || '—'} тонн`, MARGIN, y); y += 4;
    doc.text(`Договор: № ${d.contractNumber || d.docNumber} от ${fmtDate(d.contractDate || d.date)}`, MARGIN, y); y += 8;

    // Комиссия платформы
    const commission = Math.round(baseAmount * 0.025);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y); y += 5;
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Комиссия платформы RailMatch (2,5%): ${fmt(commission)} руб. (удерживается с Заказчика)`, MARGIN, y);
    y += 10;

    // Подписи
    y = checkPage(doc, y, 50, d.userId);

    doc.setFontSize(8);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('Передаточный документ (акт)', MARGIN, y); y += 6;
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const actText = `Услуги по предоставлению железнодорожного подвижного состава оказаны в полном объёме и в установленные сроки. Претензий по качеству и срокам у Сторон не имеется.`;
    const actL = doc.splitTextToSize(actText, CONTENT_W);
    doc.text(actL, MARGIN, y);
    y += actL.length * 3.8 + 4;

    y = addSignatures(doc, y, d.signerShipper, d.signerOwner);
}

// ============================================
// ШАБЛОН 5: АКТ ВЫПОЛНЕННЫХ РАБОТ
// ============================================
function renderAct(doc, d) {
    let y = addHeader(doc, 'АКТ ВЫПОЛНЕННЫХ РАБОТ', d.docNumber, d.date);
    addWatermark(doc, d.userId);

    doc.setFontSize(12);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text('АКТ', PAGE_W / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(9);
    doc.text('выполненных работ (оказанных услуг)', PAGE_W / 2, y, { align: 'center' });
    y += 4;
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`к Договору № ${d.contractNumber || d.docNumber} от ${fmtDate(d.contractDate || d.date)}`, PAGE_W / 2, y, { align: 'center' });
    y += 10;

    // Стороны
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const intro = `Мы, нижеподписавшиеся, ${d.shipper?.company || 'Заказчик'} (Заказчик) и ${d.owner?.company || 'Исполнитель'} (Исполнитель), составили настоящий Акт о нижеследующем:`;
    const introL = doc.splitTextToSize(intro, CONTENT_W);
    doc.text(introL, MARGIN, y);
    y += introL.length * 4 + 8;

    // Табличная часть
    const baseAmount = (d.price || 0) * (d.wagons || 0);
    const nds = Math.round(baseAmount * 0.2);
    const total = baseAmount + nds;

    const tW = [10, 65, 15, 15, 25, CONTENT_W - 130];
    y = drawTableRow(doc, y, ['№', 'Наименование работ (услуг)', 'Ед.', 'Кол-во', 'Цена, руб.', 'Сумма, руб.'], tW, { header: true, fontSize: 7 });
    y = drawTableRow(doc, y, [
        '1',
        `Предоставление ЖД подвижного состава (${d.wagonType || 'Крытый'}), маршрут: ${d.stationFrom} → ${d.stationTo}`,
        'ваг.',
        String(d.wagons || 0),
        fmt(d.price),
        fmt(baseAmount)
    ], tW, { fontSize: 7 });

    y += 2;
    y = drawTableRow(doc, y, ['', 'Итого без НДС', '', '', '', fmt(baseAmount)], tW, { bold: true, fontSize: 7.5 });
    y = drawTableRow(doc, y, ['', 'НДС (20%)', '', '', '', fmt(nds)], tW, { fontSize: 7.5 });
    y = drawTableRow(doc, y, ['', 'ИТОГО С НДС', '', '', '', fmt(total)], tW, { bold: true, fontSize: 8 });

    y += 8;
    doc.setFontSize(8.5);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(30, 41, 59);
    const conclusion = [
        `Общая стоимость работ составляет ${fmt(total)} (${numToWords(total)}) руб., в т.ч. НДС 20% — ${fmt(nds)} руб.`,
        '',
        'Вышеперечисленные услуги выполнены полностью и в срок.',
        'Заказчик претензий по объёму, качеству и срокам оказания услуг не имеет.',
    ];
    for (const s of conclusion) {
        if (!s) { y += 3; continue; }
        y = checkPage(doc, y, 12, d.userId);
        const sl = doc.splitTextToSize(s, CONTENT_W);
        doc.text(sl, MARGIN, y);
        y += sl.length * 3.8 + 2;
    }

    y += 4;
    y = addSignatures(doc, y, d.signerShipper, d.signerOwner);
}

// ============================================
// ЧИСЛО ПРОПИСЬЮ (упрощённая версия)
// ============================================
function numToWords(n) {
    if (!n || n === 0) return 'ноль';
    const units = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
    const teens = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
    const tens = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
    const hundreds = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];

    const num = Math.abs(Math.round(n));
    if (num >= 1000000) return `${fmt(num)} руб.`;
    if (num >= 1000) {
        const th = Math.floor(num / 1000);
        const rem = num % 1000;
        const thWord = th === 1 ? 'одна тысяча' : th === 2 ? 'две тысячи' : `${fmt(th)} тысяч`;
        return rem > 0 ? `${thWord} ${numToWords(rem)}` : thWord;
    }
    if (num >= 100) {
        const h = Math.floor(num / 100);
        const rem = num % 100;
        return rem > 0 ? `${hundreds[h]} ${numToWords(rem)}` : hundreds[h];
    }
    if (num >= 20) {
        const t = Math.floor(num / 10);
        const u = num % 10;
        return u > 0 ? `${tens[t]} ${units[u]}` : tens[t];
    }
    if (num >= 10) return teens[num - 10];
    return units[num];
}

// ============================================
// ГЛАВНАЯ ЭКСПОРТИРУЕМАЯ ФУНКЦИЯ
// ============================================
export function generateDocument(templateType, dealData) {
    const doc = new jsPDF('p', 'mm', 'a4');
    setupCyrillicFont(doc);

    switch (templateType) {
        case 'contract': renderContract(doc, dealData); break;
        case 'gu12': renderGU12(doc, dealData); break;
        case 'waybill': renderWaybill(doc, dealData); break;
        case 'upd': renderUPD(doc, dealData); break;
        case 'act': renderAct(doc, dealData); break;
        default: throw new Error(`Unknown template: ${templateType}`);
    }

    addFooter(doc);
    return doc;
}

/**
 * Скачать PDF
 * @param {string} templateType - contract|gu12|waybill|upd|act
 * @param {object} dealData - merge данных из БД + формы
 */
export function downloadDocument(templateType, dealData) {
    const doc = generateDocument(templateType, dealData);
    const docNames = {
        contract: 'Договор_ТЭО',
        gu12: 'Заявка_ГУ-12',
        waybill: 'ЖД_накладная',
        upd: 'УПД',
        act: 'Акт_выполненных_работ',
    };
    const filename = `RailMatch_${docNames[templateType]}_${dealData.docNumber || 'draft'}.pdf`;
    doc.save(filename);
}

/**
 * Получить PDF как blob (для загрузки в Supabase Storage)
 */
export function getDocumentBlob(templateType, dealData) {
    const doc = generateDocument(templateType, dealData);
    return doc.output('blob');
}
