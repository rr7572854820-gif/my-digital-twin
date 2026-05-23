const MOODS = [
  'normal',
  'locked_in',
  'playful',
  'tired',
  'existential',
  'emotionally_attached',
  'ambitious',
]

const BLEND_STEP = 0.18
const BLEND_STORAGE_KEY = 'twin-mood-blend'
const LAST_MOOD_LOG_KEY = 'twin-mood-last-logged'

const GENERATION_BY_MOOD = {
  normal: { temperature: 0.82, max_tokens: 200 },
  locked_in: { temperature: 0.72, max_tokens: 160 },
  playful: { temperature: 0.94, max_tokens: 230 },
  tired: { temperature: 0.76, max_tokens: 150 },
  existential: { temperature: 0.88, max_tokens: 210 },
  emotionally_attached: { temperature: 0.9, max_tokens: 220 },
  ambitious: { temperature: 0.84, max_tokens: 205 },
}

const POSITIVE = ['love', 'thanks', 'great', 'awesome', 'happy', 'lol', 'haha', 'nice', 'amazing']
const PLAYFUL = ['lol', 'lmao', 'haha', 'bro', 'joke', 'funny', 'wild', 'insane', 'crazy']
const EXISTENTIAL = ['meaning', 'purpose', 'life', 'death', 'universe', 'why', 'exist', 'forever', 'reality']
const AMBITIOUS = ['build', 'startup', 'goal', 'career', 'google', 'saas', 'project', 'learn', 'grind']
const LOW_ENERGY = ['tired', 'exhausted', 'sleep', 'bored', 'meh', 'idk', 'whatever']
const WARM = ['miss', 'care', 'appreciate', 'trust', 'feel', 'close', 'vulnerable', 'honest']

const emptyBlend = () => Object.fromEntries(MOODS.map((m) => [m, 0]))

const normalizeBlend = (blend) => {
  const sum = MOODS.reduce((acc, mood) => acc + (blend[mood] || 0), 0)
  if (sum <= 0) return { ...emptyBlend(), normal: 1 }
  return Object.fromEntries(MOODS.map((mood) => [mood, (blend[mood] || 0) / sum]))
}

const loadStoredBlend = () => {
  try {
    const raw = sessionStorage.getItem(BLEND_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    return normalizeBlend(parsed)
  } catch {
    return null
  }
}

const saveBlend = (blend) => {
  try {
    sessionStorage.setItem(BLEND_STORAGE_KEY, JSON.stringify(blend))
  } catch {
    // ignore quota / private mode
  }
}

let moodBlend = loadStoredBlend() || { ...emptyBlend(), normal: 1 }

const countKeywordHits = (text, words) =>
  words.reduce((count, word) => count + (text.includes(word) ? 1 : 0), 0)

const scoreSentiment = (userMessages) => {
  const text = userMessages.map((m) => (m.content || '').toLowerCase()).join(' ')

  if (!text.trim()) {
    return { playful: 0, existential: 0, warm: 0, low: 0, driven: 0 }
  }

  const playfulHits = countKeywordHits(text, PLAYFUL)
  const existentialHits = countKeywordHits(text, EXISTENTIAL)
  const warmHits = countKeywordHits(text, WARM) + countKeywordHits(text, POSITIVE) * 0.5
  const lowHits = countKeywordHits(text, LOW_ENERGY)
  const drivenHits = countKeywordHits(text, AMBITIOUS)

  return {
    playful: Math.min(0.45, playfulHits * 0.12),
    existential: Math.min(0.5, existentialHits * 0.14),
    warm: Math.min(0.55, warmHits * 0.13),
    low: Math.min(0.4, lowHits * 0.12),
    driven: Math.min(0.45, drivenHits * 0.11),
  }
}

const scoreLatency = (messages) => {
  const gaps = []

  for (let i = 1; i < messages.length; i += 1) {
    const prev = messages[i - 1]
    const curr = messages[i]
    if (!prev.sentAt || !curr.sentAt) continue

    const gapMs = curr.sentAt - prev.sentAt
    if (gapMs <= 0 || gapMs > 1000 * 60 * 60 * 6) continue
    gaps.push(gapMs)
  }

  if (gaps.length === 0) {
    return { fast: 0, slow: 0 }
  }

  const avgMs = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length
  const fast = avgMs < 45_000 ? Math.min(0.35, (45_000 - avgMs) / 45_000) : 0
  const slow = avgMs > 120_000 ? Math.min(0.4, (avgMs - 120_000) / 300_000) : 0

  return { fast, slow }
}

const computeTargetScores = (messages) => {
  const scores = emptyBlend()
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDay()
  const userMessages = messages.filter((m) => m.role === 'user')
  const count = userMessages.length
  const sentiment = scoreSentiment(userMessages.slice(-6))
  const latency = scoreLatency(messages.slice(-12))

  scores.normal += 0.22

  if (hour >= 9 && hour < 13) {
    scores.locked_in += 0.38
    scores.ambitious += 0.12
  }

  if (hour >= 13 && hour < 17) {
    scores.ambitious += 0.32
    scores.locked_in += 0.1
  }

  if (hour >= 17 && hour < 23) {
    scores.playful += 0.34
  }

  if (hour >= 23 || hour < 5) {
    scores.tired += 0.42
    scores.existential += 0.18
  } else if (hour >= 5 && hour < 8) {
    scores.tired += 0.4
  }

  if (hour >= 22) {
    scores.existential += 0.22
  }

  if (day === 0 || day === 6) {
    scores.playful += 0.18
  }

  if (day === 1 && hour < 12) {
    scores.tired += 0.14
  }

  if (day >= 1 && day <= 5 && hour >= 9 && hour < 18) {
    scores.ambitious += 0.16
    if (hour >= 10 && hour < 14) scores.locked_in += 0.1
  }

  if (count >= 4) scores.locked_in += Math.min(0.2, count * 0.02)
  if (count >= 8) scores.emotionally_attached += 0.28
  if (count >= 12) scores.emotionally_attached += 0.42
  if (count >= 16) scores.emotionally_attached += 0.2

  if (count >= 6 && (hour >= 22 || hour < 4)) {
    scores.existential += 0.2
  }

  scores.playful += sentiment.playful
  scores.existential += sentiment.existential
  scores.emotionally_attached += sentiment.warm
  scores.tired += sentiment.low
  scores.ambitious += sentiment.driven

  scores.locked_in += latency.fast * 0.28
  scores.playful += latency.fast * 0.12
  scores.tired += latency.slow * 0.3
  scores.existential += latency.slow * 0.08

  return normalizeBlend(scores)
}

const blendToward = (target) => {
  const next = emptyBlend()

  for (const mood of MOODS) {
    const current = moodBlend[mood] || 0
    const desired = target[mood] || 0
    next[mood] = current + (desired - current) * BLEND_STEP
  }

  moodBlend = normalizeBlend(next)
  saveBlend(moodBlend)
}

const getDominantMood = (blend) => {
  const [mood] = Object.entries(blend).sort((a, b) => b[1] - a[1])
  return mood || 'normal'
}

const weightedGeneration = (blend) => {
  let temperature = 0
  let max_tokens = 0

  for (const mood of MOODS) {
    const weight = blend[mood] || 0
    const params = GENERATION_BY_MOOD[mood]
    temperature += params.temperature * weight
    max_tokens += params.max_tokens * weight
  }

  return {
    temperature: Math.round(temperature * 100) / 100,
    max_tokens: Math.round(max_tokens),
  }
}

const logMoodChange = (mood, blend, target) => {
  if (!import.meta.env.DEV) return

  let lastLogged = 'normal'
  try {
    lastLogged = sessionStorage.getItem(LAST_MOOD_LOG_KEY) || 'normal'
  } catch {
    // ignore
  }

  if (mood === lastLogged) return

  console.log('[mood]', {
    mood,
    blend: Object.fromEntries(
      MOODS.filter((m) => (blend[m] || 0) > 0.08).map((m) => [m, Number((blend[m] || 0).toFixed(2))])
    ),
    target: getDominantMood(target),
    ...weightedGeneration(blend),
  })

  try {
    sessionStorage.setItem(LAST_MOOD_LOG_KEY, mood)
  } catch {
    // ignore
  }
}

export const getCurrentMood = (messages = []) => {
  const safeMessages = Array.isArray(messages) ? messages : []
  const target = computeTargetScores(safeMessages)

  blendToward(target)

  const mood = getDominantMood(moodBlend)
  const { temperature, max_tokens } = weightedGeneration(moodBlend)

  logMoodChange(mood, moodBlend, target)

  return {
    mood,
    blend: { ...moodBlend },
    temperature,
    max_tokens,
  }
}

/** @deprecated Use getCurrentMood(messages) instead */
export const getMood = (messages = []) => getCurrentMood(messages).mood

export { MOODS }
