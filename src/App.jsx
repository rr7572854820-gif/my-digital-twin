import { useState, useEffect, useRef } from 'react'
import { sendMessage } from './utils/api'

export default function App() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('twin-messages')
    return saved ? JSON.parse(saved) : []
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    localStorage.setItem('twin-messages', JSON.stringify(messages))
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    const userMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const reply = await sendMessage(newMessages)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    localStorage.removeItem('twin-messages')
    setMessages([])
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: 'white'
    }}>

      {/* Header */}
      <div style={{
        width: '100%',
        maxWidth: '680px',
        padding: '24px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>R</div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '15px' }}>Rishabh's Twin</div>
            <div style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }}></div>
              online
            </div>
          </div>
        </div>
        <button
          onClick={handleClear}
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#71717a',
            padding: '6px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          clear
        </button>
      </div>

      {/* Messages */}
      <div style={{
        width: '100%',
        maxWidth: '680px',
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: 'calc(100vh - 160px)'
      }}>
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '8px',
            opacity: 0.4
          }}>
            <div style={{ fontSize: '32px' }}>👋</div>
            <div style={{ fontSize: '14px', color: '#71717a' }}>say something to rishabh's twin</div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
            gap: '4px'
          }}>
            <div style={{
              fontSize: '11px',
              color: '#52525b',
              paddingLeft: m.role === 'user' ? '0' : '4px',
              paddingRight: m.role === 'user' ? '4px' : '0'
            }}>
              {m.role === 'user' ? 'you' : 'rishabh'}
            </div>
            <div style={{
              maxWidth: '75%',
              padding: '10px 14px',
              borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: m.role === 'user'
                ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                : 'rgba(255,255,255,0.06)',
              border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
              fontSize: '14px',
              lineHeight: '1.5',
              color: 'white'
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <div style={{ fontSize: '11px', color: '#52525b', paddingLeft: '4px' }}>rishabh</div>
            <div style={{
              padding: '10px 16px',
              borderRadius: '18px 18px 18px 4px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              gap: '4px',
              alignItems: 'center'
            }}>
              {[0, 150, 300].map((delay, i) => (
                <div key={i} style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#7c3aed',
                  animation: 'bounce 1s infinite',
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
        width: '100%',
        maxWidth: '680px',
        padding: '12px 20px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        gap: '10px'
      }}>
        <input
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: '12px 18px',
            color: 'white',
            fontSize: '14px',
            outline: 'none'
          }}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="say something..."
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            border: 'none',
            borderRadius: '24px',
            padding: '12px 22px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            opacity: loading ? 0.5 : 1
          }}
        >
          send
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        ::-webkit-scrollbar { width: 0px; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  )
}