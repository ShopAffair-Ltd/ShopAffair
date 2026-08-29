const normalize = (raw: string): string[] =>
  raw
    .toUpperCase()
    .replace(/['’]/g, '')
    .replace(/[^A-Z\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0);

export const namesLikelyMatch = (nameA: string, nameB: string): boolean => {
  const tokensA = normalize(nameA);
  const tokensB = normalize(nameB);

  if (tokensA.length === 0 || tokensB.length === 0) {
    return false;
  }

  const setB = new Set(tokensB);
  const sharedTokens = tokensA.filter((token) => setB.has(token));

  const minTokenCount = Math.min(tokensA.length, tokensB.length);
  const requiredMatches = minTokenCount <= 1 ? 1 : 2;

  return sharedTokens.length >= requiredMatches;
};