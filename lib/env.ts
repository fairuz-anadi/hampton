// Reading configuration that might be blank.
//
// `process.env.X ?? 'default'` looks safe but is not: `??` falls back only on undefined, and a
// dashboard variable that was added and left empty arrives as "". That empty string is then
// passed straight through — which is how this project ended up sending model "" to OpenAI and
// getting back "you must provide a model parameter" with a perfectly valid key.
//
// Trim first, then treat blank as absent.

export const envOr = (name: string, fallback: string): string =>
  process.env[name]?.trim() || fallback;

export const envOrUndefined = (name: string): string | undefined =>
  process.env[name]?.trim() || undefined;
