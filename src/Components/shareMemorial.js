export function getMemorialShareUrl(slug) {
  if (typeof window === 'undefined') {
    return `#/Eulogies/${slug}`;
  }

  return `${window.location.origin}${window.location.pathname}${window.location.search}#/Eulogies/${slug}`;
}

export async function shareMemorial(memorial) {
  const url = getMemorialShareUrl(memorial.slug);
  const shareData = {
    title: `${memorial.full_name} memorial`,
    text: `Remembering ${memorial.full_name}`,
    url,
  };

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share(shareData);
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') {
        return 'idle';
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return 'copied';
  }

  if (typeof window !== 'undefined') {
    window.prompt('Copy this memorial link:', url);
  }

  return 'manual';
}
