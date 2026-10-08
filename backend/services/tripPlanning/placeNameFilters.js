export function isPlaceholderPlace(value = '') {
  return /(signature highlight|food stop|scenic moment|culture highlight|cultural core|local dining area|sunset viewpoint|secondary museum or viewpoint|local market detour|highlight$| stop$)/i.test(
    String(value).trim()
  );
}

export function isGenericPlaceName(value = '') {
  return /(local dinner|local dining|dinner|lunch|breakfast|food experience|food tasting|nearby restaurant|restaurant nearby|city center|town center|old town|downtown|waterfront|neighbou?rhood|market area|shopping area|hotel area|scenic area|cultural area|local area)/i.test(
    String(value).trim()
  );
}
