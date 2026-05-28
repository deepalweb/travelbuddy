import fetch from 'node-fetch';

const imageCache = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const categoryPalette = {
  beach: { bg: '#d9f3ff', fg: '#0f6c8d', icon: 'Waves' },
  temple: { bg: '#f8ead6', fg: '#9a5b16', icon: 'Temple' },
  restaurant: { bg: '#fde7dc', fg: '#a8431b', icon: 'Fork' },
  cafe: { bg: '#efe3d2', fg: '#7a4d24', icon: 'Cup' },
  hotel: { bg: '#e4ecff', fg: '#3557a5', icon: 'Stay' },
  museum: { bg: '#ece8f9', fg: '#5f4b97', icon: 'Frame' },
  attraction: { bg: '#e5f7ec', fg: '#237a47', icon: 'Pin' },
  park: { bg: '#e1f4df', fg: '#2d7d46', icon: 'Leaf' },
  shopping: { bg: '#ffe7f1', fg: '#b53873', icon: 'Bag' },
  default: { bg: '#eef2f7', fg: '#4b5b70', icon: 'Place' },
};

function normalizeCategory(category = '') {
  const value = category.toLowerCase();
  if (value.includes('food') || value.includes('restaurant') || value.includes('dining')) return 'restaurant';
  if (value.includes('cafe') || value.includes('coffee')) return 'cafe';
  if (value.includes('temple') || value.includes('shrine') || value.includes('religious')) return 'temple';
  if (value.includes('stupa') || value.includes('dagoba') || value.includes('pilgrimage')) return 'temple';
  if (value.includes('monastery') || value.includes('statue') || value.includes('ruins')) return 'attraction';
  if (value.includes('hotel') || value.includes('resort') || value.includes('stay')) return 'hotel';
  if (value.includes('museum') || value.includes('gallery')) return 'museum';
  if (value.includes('beach') || value.includes('coast')) return 'beach';
  if (value.includes('park') || value.includes('garden')) return 'park';
  if (value.includes('shop') || value.includes('market')) return 'shopping';
  if (value.includes('attraction') || value.includes('landmark')) return 'attraction';
  return 'default';
}

function buildCacheKey({ name = '', category = '', city = '', country = '' }) {
  return [name, category, city, country].map((item) => item.trim().toLowerCase()).join('|');
}

function readCache(key) {
  const cached = imageCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    imageCache.delete(key);
    return null;
  }
  return cached.value;
}

function writeCache(key, value) {
  imageCache.set(key, { value, timestamp: Date.now() });
  return value;
}

function buildPlaceholderImage({ name = 'Place', category = 'default', city = '', country = '' }) {
  const normalizedCategory = normalizeCategory(category);
  const palette = categoryPalette[normalizedCategory] || categoryPalette.default;
  const subtitle = [city, country].filter(Boolean).join(', ') || normalizedCategory;
  const label = name.length > 28 ? `${name.slice(0, 25)}...` : name;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <rect width="1200" height="800" fill="${palette.bg}" />
      <circle cx="600" cy="260" r="92" fill="${palette.fg}" opacity="0.12" />
      <text x="600" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" fill="${palette.fg}" font-weight="700">${palette.icon}</text>
      <text x="600" y="430" text-anchor="middle" font-family="Arial, sans-serif" font-size="52" fill="${palette.fg}" font-weight="700">${escapeXml(label)}</text>
      <text x="600" y="490" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="${palette.fg}" opacity="0.78">${escapeXml(subtitle)}</text>
      <text x="600" y="660" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="${palette.fg}" opacity="0.6">Representative image</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildQueryVariants(name = '') {
  const variants = new Set();
  const trimmed = String(name || '').trim();
  if (!trimmed) {
    return [];
  }

  variants.add(trimmed);
  variants.add(trimmed.replace(/\b(statue|stupa|dagoba|temple|monastery|complex|shrine)\b/gi, '').replace(/\s+/g, ' ').trim());
  variants.add(trimmed.replace(/\b(the)\b/gi, '').replace(/\s+/g, ' ').trim());

  return [...variants].filter(Boolean);
}

function isLikelyGenericLocality(name = '') {
  const normalized = normalizeText(name);
  return /new town|old town|town center|city center|local area|hotel base|downtown/.test(normalized);
}

function scoreCandidateTitle(title, queryParts) {
  const normalizedTitle = normalizeText(title);
  let score = 0;

  for (const part of queryParts) {
    const normalizedPart = normalizeText(part);
    if (!normalizedPart) continue;

    if (normalizedTitle === normalizedPart) {
      score += 12;
    } else if (normalizedTitle.includes(normalizedPart)) {
      score += 8;
    } else {
      const titleWords = new Set(normalizedTitle.split(' '));
      const partWords = normalizedPart.split(' ');
      const overlap = partWords.filter((word) => titleWords.has(word)).length;
      score += overlap * 2;
    }
  }

  return score;
}

async function fetchWikipediaPageImage(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=original|thumbnail&pithumbsize=1200&titles=${encodeURIComponent(title)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TravelBuddy/1.0 (free place image resolver)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  const page = pages.find((item) => item?.thumbnail?.source || item?.original?.source);
  return page?.original?.source || page?.thumbnail?.source || null;
}

async function fetchWikipediaPageMediaFiles(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=images&imlimit=8&titles=${encodeURIComponent(title)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TravelBuddy/1.0 (free place image resolver)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
  const page = pages.find((item) => Array.isArray(item?.images) && item.images.length > 0);
  return (page?.images || [])
    .map((item) => item?.title)
    .filter((title) => typeof title === 'string' && /\.(jpg|jpeg|png|webp)$/i.test(title));
}

function buildCommonsFilePath(title) {
  if (!title) {
    return null;
  }

  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(title.replace(/^File:/i, ''))}?width=1200`;
}

async function findWikipediaPageMediaImage(title) {
  try {
    const mediaFiles = await fetchWikipediaPageMediaFiles(title);
    const candidate = mediaFiles.find(Boolean);
    if (!candidate) {
      return null;
    }

    return buildCommonsFilePath(candidate);
  } catch (error) {
    return null;
  }
}

async function fetchWikipediaSearchResults(query) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=5&srprop=`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TravelBuddy/1.0 (free place image resolver)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data?.query?.search) ? data.query.search : [];
}

async function fetchWikipediaSummary(query) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TravelBuddy/1.0 (free place image resolver)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function pickThumbnail(summary, pageImage) {
  if (summary?.thumbnail?.source) {
    return summary.thumbnail.source.replace(/\/\d+px-/, '/1200px-');
  }

  return pageImage || null;
}

async function findWikipediaImage({ name, city, country, category }) {
  const normalizedCategory = normalizeCategory(category);
  if (isLikelyGenericLocality(name) || normalizedCategory === 'hotel') {
    return null;
  }

  if (normalizedCategory === 'restaurant' || normalizedCategory === 'cafe') {
    return null;
  }

  const nameVariants = buildQueryVariants(name);
  const queries = nameVariants.flatMap((variant) => (
    [
      [variant, city, country].filter(Boolean).join(', '),
      [variant, city].filter(Boolean).join(', '),
      [variant, country].filter(Boolean).join(', '),
      variant,
    ]
  )).filter(Boolean);
  const queryParts = [name, city, country].filter(Boolean);
  const minScore = normalizedCategory === 'temple' || normalizedCategory === 'attraction' || normalizedCategory === 'museum'
    ? 4
    : 8;

  for (const query of queries) {
    try {
      const summary = await fetchWikipediaSummary(query);
      const pageImage = await fetchWikipediaPageImage(query);
      const mediaImage = pageImage ? null : await findWikipediaPageMediaImage(query);
      const imageUrl = pickThumbnail(summary, pageImage || mediaImage);

      if (imageUrl) {
        return {
          image: imageUrl,
          gallery: [imageUrl],
          imageSource: 'wikipedia',
          isRepresentative: false,
          imageAttribution: summary?.content_urls?.desktop?.page || '',
        };
      }
    } catch (error) {
      // Ignore and try next candidate
    }

    try {
      const searchResults = await fetchWikipediaSearchResults(query);
      const rankedResults = searchResults
        .map((result) => ({
          title: result.title,
          score: scoreCandidateTitle(result.title, queryParts),
        }))
        .sort((left, right) => right.score - left.score);

      for (const result of rankedResults) {
        if (result.score < minScore) {
          continue;
        }

        const summary = await fetchWikipediaSummary(result.title);
        const pageImage = await fetchWikipediaPageImage(result.title);
        const mediaImage = pageImage ? null : await findWikipediaPageMediaImage(result.title);
        const imageUrl = pickThumbnail(summary, pageImage || mediaImage);
        if (imageUrl) {
          return {
            image: imageUrl,
            gallery: [imageUrl],
            imageSource: 'wikipedia-search',
            isRepresentative: false,
            imageAttribution: summary?.content_urls?.desktop?.page || '',
          };
        }
      }
    } catch (error) {
      // Ignore and try next candidate
    }
  }

  return null;
}

export async function resolveFreePlaceImage({ name, category, city, country }) {
  const cacheKey = buildCacheKey({ name, category, city, country });
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const wikipediaImage = await findWikipediaImage({ name, category, city, country });
  if (wikipediaImage) {
    return writeCache(cacheKey, wikipediaImage);
  }

  const fallbackImage = buildPlaceholderImage({ name, category, city, country });
  return writeCache(cacheKey, {
    image: fallbackImage,
    gallery: [fallbackImage],
    imageSource: 'generated-placeholder',
    isRepresentative: true,
    imageAttribution: '',
  });
}
