function shuffle(items, random) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function isSpecialTagPreview(item) {
  return /\b(?:decreasing[\s_-]+threats?|planned burns?|boil(?:ing)? water)\b/i.test(
    [item.Subject, item.Name].filter(Boolean).join(" "),
  );
}

export function randomizePreviewWarnings(items, random = Math.random) {
  if (!Array.isArray(items) || items.length < 3) {
    throw new TypeError("Local warning preview must contain at least three items");
  }

  const specialTagPreviews = items.filter(isSpecialTagPreview);
  const warningPreviews = items.filter((item) => !isSpecialTagPreview(item));
  if (specialTagPreviews.length && warningPreviews.length >= 2) {
    const specialIndex = Math.floor(random() * specialTagPreviews.length);
    return shuffle([
      specialTagPreviews[specialIndex],
      ...shuffle(warningPreviews, random).slice(0, 2),
    ], random);
  }
  return shuffle(items, random).slice(0, 3);
}
