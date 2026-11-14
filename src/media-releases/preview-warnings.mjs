export function randomizePreviewWarnings(items, random = Math.random) {
  if (!Array.isArray(items) || items.length < 3) {
    throw new TypeError("Local warning preview must contain at least three items");
  }

  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled.slice(0, 3);
}
