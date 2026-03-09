// Единое место для бизнес-констант платформы.
// Изменение здесь автоматически применяется везде.

/** Ставка комиссии платформы (2.5%). */
export const PLATFORM_COMMISSION_RATE = 0.025;

/** Допустимые MIME-типы для загрузки верификационных документов. */
export const ALLOWED_DOC_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

/** Максимальный размер загружаемого документа в байтах (10 МБ). */
export const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024;
