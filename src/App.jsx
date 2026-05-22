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
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center p-4">
      
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between mb-6 pt-4">
        <div>
          <h1 className="text-xl font-bold">Rishabh's Twin 🤖</h1>
          <p className="text-zinc-500 text-xs">not him but basically him</p>
        </div>
        <button
          onClick={handleClear}
          className="text-zinc-600 hover:text-zinc-400 text-xs border border-zinc-800 px-3 py-1 rounded-full transition-colors"
        >
          clear chat
        </button>
      </div>

      {/* Messages */}
      <div className="w-full max-w-xl flex flex-col gap-3 mb-4 h-[70vh] overflow-y-auto pr-1 scrollbar-hide">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
            <p className="text-zinc-600 text-sm">say something to rishabh's twin</p>
            <p className="text-zinc-700 text-xs">it won't judge you. probably.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-purple-600 text-white rounded-br-sm'
                : 'bg-zinc-900 text-zinc-100 rounded-bl-sm border border-zinc-800'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-2.5 rounded-2xl rounded-bl-sm">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></div>
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div>
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 w-full max-w-xl">
        <input
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 outline-none text-sm placeholder-zinc-600 focus:border-zinc-600 transition-colors"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="say something..."
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-5 py-3 rounded-2xl text-sm font-semibold transition-colors"
        >
          send
        </button>
      </div>

    </div>
  )
}