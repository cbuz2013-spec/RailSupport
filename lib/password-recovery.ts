// Shared navigation helper: recovery may return to a rail/room invite on this site only.
export function recoveryReturnTo(value: string | undefined | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\r\n]/.test(value)) return '/';
  try {
    const url = new URL(value, 'https://rail.invalid');
    if (url.origin !== 'https://rail.invalid' || url.pathname !== '/') return '/';
    const query = new URLSearchParams();
    for (const key of ['invite', 'view', 'room', 'joinRoom', 'profile']) {
      const item = url.searchParams.get(key);
      if (item && item.length <= 200) query.set(key, item);
    }
    return query.size ? '/?' + query.toString() : '/';
  } catch { return '/'; }
}
