export function getPageWindow(currentPage, pageCount) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set([1, pageCount]);
  const firstVisible = Math.max(2, currentPage - 1);
  const lastVisible = Math.min(pageCount - 1, currentPage + 1);

  for (let page = firstVisible; page <= lastVisible; page += 1) {
    pages.add(page);
  }

  const orderedPages = [...pages].sort((first, second) => first - second);
  return orderedPages.flatMap((page, index) => {
    if (index > 0 && page - orderedPages[index - 1] > 1) {
      return ["ellipsis", page];
    }
    return [page];
  });
}