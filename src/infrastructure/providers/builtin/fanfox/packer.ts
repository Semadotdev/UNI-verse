const PACKED_RE =
  /eval\(function\(\w+,\w+,\w+,\w+,\w+,\w+\)\{[\s\S]*?\}\('((?:[^'\\]|\\.)*)',(\d+),(\d+),'((?:[^'\\]|\\.)*)'\.split\('\|'\),\w+,\{\}\)\)?/;

function tokenFor(n: number, base: number): string {
  let token = '';
  do {
    token = (n % base).toString(36) + token;
    n = Math.floor(n / base);
  } while (n > 0);
  return token;
}

export function decodePackedJs(packed: string): string {
  const match = PACKED_RE.exec(packed);
  if (!match) {
    throw new Error('Unrecognized packed script format');
  }

  const [, , baseStr, countStr, dictStr] = match;
  let source = match[1];
  const base = parseInt(baseStr, 10);
  const count = parseInt(countStr, 10);
  const dictionary = dictStr.split('|');

  for (let c = Math.min(count, dictionary.length) - 1; c >= 0; c--) {
    const entry = dictionary[c];
    if (!entry) continue;
    source = source.replace(new RegExp(`\\b${tokenFor(c, base)}\\b`, 'g'), entry);
  }

  return source;
}

const IMAGE_URL_RE = /\/\/[a-z0-9][a-z0-9.-]*\/[^"'\s]*?\.(?:jpg|jpeg|png|webp|gif)(?:[?#][^"'\s]*)?/gi;
const BASE_URL_RE = /"(\/\/[a-z0-9][a-z0-9.-]*\/[^"]*)"/;
const STRING_ARRAY_RE = /\[(?:"(?:[^"\\]|\\.)*"(?:,"(?:[^"\\]|\\.)*")*)\]/;

export function extractImageUrls(decoded: string): string[] {
  const urls: string[] = [];
  const pushUrl = (url: string) => {
    const normalized = url.startsWith('//') ? `https:${url}` : url;
    if (normalized && !urls.includes(normalized)) urls.push(normalized);
  };

  const baseMatch = decoded.match(BASE_URL_RE);
  const wordToFragment = (word: string): string => {
    try {
      return JSON.parse(word);
    } catch {
      return word.slice(1, -1);
    }
  };

  const arrayMatch = decoded.match(STRING_ARRAY_RE);
  if (baseMatch && arrayMatch) {
    const base = baseMatch[1];
    const fragments = [...arrayMatch[0].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => wordToFragment(m[0]));
    for (const fragment of fragments) {
      if (/^https?:\/\//i.test(fragment)) pushUrl(fragment);
      else if (/^\/\//.test(fragment)) pushUrl(fragment);
      else pushUrl(base + fragment);
    }
  }

  for (const match of decoded.matchAll(IMAGE_URL_RE)) pushUrl(match[0]);

  return urls;
}

export function decodeImageUrls(packed: string): string[] {
  return extractImageUrls(decodePackedJs(packed));
}