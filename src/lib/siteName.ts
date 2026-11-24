export function siteName(url: string): string {
  try {
    return new URL(url).hostname.replace(/^(www|in|careers)\./, '');
  } catch {
    return 'the company site';
  }
}
