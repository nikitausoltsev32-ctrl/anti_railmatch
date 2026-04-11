import { useState } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '../src/supabaseClient';

export default function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleOpen() {
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 0.5,
        logging: false,
      });
      setScreenshot(canvas.toDataURL('image/png'));
    } catch {
      setScreenshot(null);
    }
    setOpen(true);
  }

  async function handleSubmit() {
    if (!description.trim()) return;
    setSending(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.functions.invoke('create-bug-report', {
      body: {
        description: description.trim(),
        screenshot_base64: screenshot || null,
        environment: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          user_id: user?.id || null,
          timestamp: new Date().toISOString(),
        },
      },
    });

    if (error) console.error('[BugReport] invoke error:', error);
    else console.log('[BugReport] success, id:', data?.id);

    setSending(false);
    setDone(true);
    setTimeout(() => {
      setOpen(false);
      setDone(false);
      setDescription('');
      setScreenshot(null);
    }, 2000);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          position: 'fixed',
          bottom: 80,
          right: 16,
          zIndex: 9000,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'rgba(229, 62, 62, 0.9)',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          fontSize: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        title="Сообщить об ошибке"
      >
        🐛
      </button>

      {open && (
        <div
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'flex-end',
          }}
        >
          <div style={{
            width: '100%',
            background: '#fff',
            borderRadius: '16px 16px 0 0',
            padding: '20px 16px 32px',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}>
            {done ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#38a169', fontSize: 16 }}>
                Отправлено. Спасибо!
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontWeight: 600, fontSize: 16 }}>Описание проблемы</span>
                  <button
                    onClick={() => setOpen(false)}
                    style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}
                  >
                    ×
                  </button>
                </div>

                {screenshot && (
                  <img
                    src={screenshot}
                    alt="screenshot"
                    style={{
                      width: '100%',
                      borderRadius: 8,
                      marginBottom: 12,
                      opacity: 0.65,
                      border: '1px solid #eee',
                    }}
                  />
                )}

                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Что произошло? Что ожидалось?"
                  rows={4}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #ddd',
                    fontSize: 14,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    onClick={() => setOpen(false)}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid #ddd',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: 14,
                    }}
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={sending || !description.trim()}
                    style={{
                      flex: 2,
                      padding: 12,
                      borderRadius: 8,
                      background: sending || !description.trim() ? '#feb2b2' : '#e53e3e',
                      color: '#fff',
                      border: 'none',
                      cursor: sending || !description.trim() ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    {sending ? 'Отправка...' : 'Отправить'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
