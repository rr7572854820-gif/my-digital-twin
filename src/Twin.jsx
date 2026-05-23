import { useState, useEffect, useRef } from 'react'
import { sendMessage } from './utils/api'
import { loadMemory, saveMemory } from './utils/memory'

export default function Twin() {
  const [messages, setMessages] = useState([])
  const [memoryReady, setMemoryReady] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dark, setDark] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    loadMemory()
      .then((saved) => {
        setMessages(saved)
        setMemoryReady(true)
      })
      .catch((err) => {
        console.error('loadMemory failed:', err)
        setMemoryReady(true)
      })
  }, [])

  useEffect(() => {
    if (!memoryReady) return
    saveMemory(messages)
  }, [messages, memoryReady])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || !memoryReady) return

    const userMessage = { role: 'user', content: input.trim(), sentAt: Date.now() }
    const newMessages = [...(Array.isArray(messages) ? messages : []), userMessage]

    setMessages(newMessages)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const reply = await sendMessage(newMessages)
      setMessages((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        { role: 'assistant', content: reply, sentAt: Date.now() },
      ])
    } catch {
      setError('something went wrong, try again')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    setError(null)
  }

  const t = dark ? themes.dark : themes.light

  return (
    <div style={{
      minHeight: '100vh',
      background: t.bg,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'stretch',
      fontFamily: '"DM Sans", -apple-system, sans-serif',
      transition: 'all 0.3s ease'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0px; }
        input::placeholder { color: ${t.placeholder}; }
        input:focus { outline: none; border-color: ${t.accent} !important; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .msg { animation: fadeUp 0.25s ease forwards; }
        .send-btn:hover { transform: scale(1.03); }
        .send-btn:active { transform: scale(0.97); }
        .clear-btn:hover { opacity: 0.8; }
        .theme-btn:hover { opacity: 0.7; }
      `}</style>

      <div style={{
        width: '100%',
        maxWidth: '720px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${t.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: t.headerBg
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Avatar */}
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: t.avatarBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '600',
                color: t.avatarText,
                letterSpacing: '-0.5px'
              }}>R</div>
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#22c55e',
                border: `2px solid ${t.bg}`,
                animation: 'pulse 2s infinite'
              }}></div>
            </div>

            <div>
              <div style={{
                fontWeight: '600',
                fontSize: '15px',
                color: t.textPrimary,
                letterSpacing: '-0.3px'
              }}>Rishabh's Twin</div>
              <div style={{
                fontSize: '12px',
                color: t.textMuted,
                fontFamily: '"DM Mono", monospace',
                fontWeight: '400'
              }}>not him · basically him</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Theme toggle */}
            <button
              className="theme-btn"
              onClick={() => setDark(!dark)}
              style={{
                background: t.btnBg,
                border: `1px solid ${t.border}`,
                borderRadius: '10px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                color: t.textMuted,
                transition: 'all 0.2s'
              }}
            >{dark ? '☀️' : '🌙'}</button>

            {/* Clear */}
            <button
              className="clear-btn"
              onClick={handleClear}
              style={{
                background: t.btnBg,
                border: `1px solid ${t.border}`,
                borderRadius: '10px',
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: '12px',
                color: t.textMuted,
                fontWeight: '500',
                transition: 'all 0.2s',
                fontFamily: '"DM Mono", monospace'
              }}
            >clear</button>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>

          {messages.length === 0 && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '60vh',
              gap: '16px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '20px',
                background: t.avatarBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                fontWeight: '700',
                color: t.avatarText
              }}>R</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: t.textPrimary, marginBottom: '6px' }}>
                  Talk to Rishabh's Twin
                </div>
                <div style={{ fontSize: '13px', color: t.textMuted, lineHeight: '1.6', maxWidth: '260px' }}>
                  he won't remember you exist tomorrow · probably
                </div>
              </div>

              {/* Suggestion chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                {["what are you up to", "tell me about yourself", "are you an ai"].map(s => (
                  <button
                    key={s}
                    onClick={() => { setInput(s); }}
                    style={{
                      background: t.chipBg,
                      border: `1px solid ${t.border}`,
                      borderRadius: '20px',
                      padding: '7px 14px',
                      fontSize: '12px',
                      color: t.textSecondary,
                      cursor: 'pointer',
                      fontFamily: '"DM Sans", sans-serif',
                      transition: 'all 0.2s'
                    }}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className="msg"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '5px'
              }}
            >
              <div style={{
                fontSize: '11px',
                color: t.textMuted,
                fontFamily: '"DM Mono", monospace',
                paddingLeft: m.role === 'user' ? 0 : '2px',
                paddingRight: m.role === 'user' ? '2px' : 0
              }}>
                {m.role === 'user' ? 'you' : 'rishabh'}
              </div>
              <div style={{
                maxWidth: '72%',
                padding: '11px 16px',
                borderRadius: m.role === 'user'
                  ? '18px 18px 5px 18px'
                  : '18px 18px 18px 5px',
                background: m.role === 'user' ? t.userBubble : t.aiBubble,
                border: m.role === 'user' ? 'none' : `1px solid ${t.border}`,
                fontSize: '14px',
                lineHeight: '1.6',
                color: m.role === 'user' ? '#ffffff' : t.textPrimary,
                fontWeight: '400',
                letterSpacing: '-0.1px'
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {error && (
            <div
              className="msg"
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
              }}
            >
              <div
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  border: `1px solid ${t.border}`,
                  background: t.aiBubble,
                  fontSize: '13px',
                  color: t.textMuted,
                  fontFamily: '"DM Mono", monospace',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            </div>
          )}

          {loading && (
            <div className="msg" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '5px'
            }}>
              <div style={{
                fontSize: '11px',
                color: t.textMuted,
                fontFamily: '"DM Mono", monospace',
                paddingLeft: '2px'
              }}>rishabh</div>
              <div style={{
                padding: '14px 18px',
                borderRadius: '18px 18px 18px 5px',
                background: t.aiBubble,
                border: `1px solid ${t.border}`,
                display: 'flex',
                gap: '5px',
                alignItems: 'center'
              }}>
                {[0, 150, 300].map((delay, i) => (
                  <div key={i} style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: t.accent,
                    animation: `bounce 1.1s infinite`,
                    animationDelay: `${delay}ms`
                  }}></div>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '16px 24px 28px',
          borderTop: `1px solid ${t.border}`,
          background: t.headerBg,
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            background: t.inputBg,
            border: `1px solid ${t.border}`,
            borderRadius: '16px',
            padding: '6px 6px 6px 18px'
          }}>
            <input
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: t.textPrimary,
                fontSize: '14px',
                fontFamily: '"DM Sans", sans-serif',
                letterSpacing: '-0.1px'
              }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="say something..."
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={loading || !memoryReady}
              style={{
                background: loading ? t.textMuted : t.userBubble,
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: '"DM Sans", sans-serif',
                letterSpacing: '-0.2px',
                transition: 'all 0.2s'
              }}
            >send</button>
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            fontSize: '11px',
            color: t.textMuted,
            fontFamily: '"DM Mono", monospace'
          }}>
            powered by groq · built by rishabh
          </div>
        </div>

      </div>
    </div>
  )
}

const themes = {
  dark: {
    bg: '#0c0c0e',
    headerBg: 'rgba(12,12,14,0.85)',
    border: 'rgba(255,255,255,0.07)',
    textPrimary: '#f0f0f2',
    textSecondary: '#a0a0b0',
    textMuted: '#52525b',
    placeholder: '#3f3f50',
    accent: '#6d6af0',
    avatarBg: 'linear-gradient(135deg, #6d6af0, #4f46e5)',
    avatarText: '#ffffff',
    userBubble: 'linear-gradient(135deg, #6d6af0, #4f46e5)',
    aiBubble: 'rgba(255,255,255,0.04)',
    inputBg: 'rgba(255,255,255,0.04)',
    btnBg: 'rgba(255,255,255,0.05)',
    chipBg: 'rgba(255,255,255,0.04)'
  },
  light: {
    bg: '#f7f7f9',
    headerBg: 'rgba(247,247,249,0.85)',
    border: 'rgba(0,0,0,0.07)',
    textPrimary: '#111118',
    textSecondary: '#52525b',
    textMuted: '#a0a0b0',
    placeholder: '#c0c0cc',
    accent: '#4f46e5',
    avatarBg: 'linear-gradient(135deg, #6d6af0, #4f46e5)',
    avatarText: '#ffffff',
    userBubble: 'linear-gradient(135deg, #6d6af0, #4f46e5)',
    aiBubble: '#ffffff',
    inputBg: '#ffffff',
    btnBg: 'rgba(0,0,0,0.04)',
    chipBg: '#ffffff'
  }
}
