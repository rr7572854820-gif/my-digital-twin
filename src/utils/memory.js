import { createClient } from '@supabase/supabase-js'

const TWIN_SLUG = import.meta.env.VITE_TWIN_SLUG || 'rishabh'
const VISITOR_ID_KEY = 'twin-visitor-id'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const getVisitorId = () => {
  let id = localStorage.getItem(VISITOR_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_ID_KEY, id)
  }
  return id
}

export const loadMemory = async () => {
  if (!supabase) return []

  const visitor_id = getVisitorId()

  const { data, error } = await supabase
    .from('memories')
    .select('messages')
    .eq('twin_slug', TWIN_SLUG)
    .eq('visitor_id', visitor_id)
    .maybeSingle()

  if (error) {
    console.error('loadMemory:', error)
    return []
  }

  const messages = data?.messages
  return Array.isArray(messages) ? messages : []
}

export const saveMemory = async (messages) => {
  if (!supabase) return

  const visitor_id = getVisitorId()

  const { error } = await supabase.from('memories').upsert(
    {
      twin_slug: TWIN_SLUG,
      visitor_id,
      messages,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'twin_slug,visitor_id' }
  )

  if (error) {
    console.error('saveMemory:', error)
  }
}
