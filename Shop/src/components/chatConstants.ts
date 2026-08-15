export function formatMessageTime(timestamp: string | number): string {
  if (timestamp === undefined || timestamp === null || timestamp === '') return '';
  const numeric = typeof timestamp === 'number' ? timestamp : Number(timestamp);
  const date = !isNaN(numeric) ? new Date(numeric) : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const INVITE_LINK = 'https://shopaffair.app/invite--3cd46a74-c43d-45b4-8f21';