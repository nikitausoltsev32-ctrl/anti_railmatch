    -- Migration 25: Улучшенный флоу согласования оплаты комиссии
    -- 3 режима: i_pay (я плачу), you_pay (ты платишь), split (пополам)
    -- Контрпредложения с лимитом раундов, история переговоров

    -- Добавляем новые поля
    ALTER TABLE public.bids
        ADD COLUMN IF NOT EXISTS commission_payer_id UUID,
        ADD COLUMN IF NOT EXISTS commission_round INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS commission_history JSONB DEFAULT '[]'::jsonb,
        ADD COLUMN IF NOT EXISTS payment_reminder_sent BOOLEAN DEFAULT FALSE;

    -- Мигрируем существующие данные ПЕРЕД добавлением constraint
    UPDATE public.bids
    SET commission_mode = 'i_pay',
        commission_payer_id = commission_proposer_id::uuid
    WHERE commission_mode = 'full';

    -- Сбрасываем невалидные значения (на случай если есть другие старые значения)
    UPDATE public.bids
    SET commission_mode = NULL
    WHERE commission_mode IS NOT NULL AND commission_mode NOT IN ('i_pay', 'you_pay', 'split');

    -- Обновляем constraint для commission_mode (drop old, add new)
    ALTER TABLE public.bids DROP CONSTRAINT IF EXISTS bids_commission_mode_check;
    ALTER TABLE public.bids ADD CONSTRAINT bids_commission_mode_check
        CHECK (commission_mode IS NULL OR commission_mode IN ('i_pay', 'you_pay', 'split'));
