import { buildSystemPrompt } from './promptEngine'
import { getCurrentMood } from './moodEngine'

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) return []

  return messages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0
    )
    .map(({ role, content }) => ({ role, content: content.trim() }))
}

export const sendMessage = async (messages) => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    throw new Error('API key is not configured. Add VITE_GROQ_API_KEY to your .env file.')
  }

  const safeMessages = sanitizeMessages(messages)
  const contextMessages = safeMessages.slice(-20)
  const { mood, temperature, max_tokens } = getCurrentMood(safeMessages)

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature,
      max_tokens,
      messages: [
        { role: 'system', content: buildSystemPrompt(contextMessages, mood) },
        ...contextMessages,
      ],
    }),
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Request failed (${response.status}). Could not parse response.`)
  }

  if (!response.ok) {
    const apiMessage =
      data?.error?.message || data?.message || `Request failed with status ${response.status}`
    throw new Error(apiMessage)
  }

  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('The API returned an empty or invalid response.')
  }

  return content
}
