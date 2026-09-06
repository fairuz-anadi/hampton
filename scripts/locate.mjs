/** Exact quote -> character offsets into the answer text.
 *
 *  We never ask a model for character offsets — models cannot count characters
 *  reliably. We ask for a verbatim quote and find it here. If the quote is not
 *  found, the award ships with NO evidence rather than a highlight sitting on
 *  the wrong words, which is worse than no highlight at all.
 *
 *  Returns [[start, end]] or [].
 */
export function locate(text, quote) {
  if (!quote || !quote.trim()) return [];

  const direct = text.indexOf(quote);
  if (direct !== -1) return [[direct, direct + quote.length]];

  // Whitespace-tolerant fallback: models re-wrap long quotes.
  const squash = (s) => s.replace(/\s+/g, ' ').trim();
  const flatQuote = squash(quote);
  const flatText = squash(text);
  const at = flatText.indexOf(flatQuote);
  if (at === -1) return [];

  // Walk the original text, counting the characters the flattened form kept,
  // to map the flattened index back onto real offsets.
  let flatIndex = 0;
  let start = -1;
  let i = 0;
  for (; i < text.length; i++) {
    const isWs = /\s/.test(text[i]);
    const prevWs = i > 0 && /\s/.test(text[i - 1]);
    if (isWs && (prevWs || i === 0)) continue; // collapsed away
    if (flatIndex === at && start === -1) start = i;
    flatIndex++;
    if (start !== -1 && flatIndex - at >= flatQuote.length) return [[start, i + 1]];
  }
  return start === -1 ? [] : [[start, text.length]];
}
