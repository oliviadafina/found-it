export function generateHash(activities, lostItem) {
  const base = JSON.stringify({
    activities,
    lostItem
  });

  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    const chr = base.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return `ai-result-${hash}`;
}
