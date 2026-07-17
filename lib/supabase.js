import { createClient } from '@supabase/supabase-js'

// Lazily create the client so importing this module never throws at build time
// (Next evaluates route modules during "collect page data", before runtime env
// is applied). The client is created on first actual use — i.e. at request time,
// where the env vars are present. Throws only if genuinely missing at runtime.
let _client = null
function getClient() {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  _client = createClient(url, key)
  return _client
}

// Proxy preserves the existing `supabase.from(...)`, `supabase.storage`, etc.
// API while deferring client creation until a property is actually accessed.
export const supabase = new Proxy({}, {
  get(_target, prop) {
    const client = getClient()
    const value = client[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})
