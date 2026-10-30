export async function notifyEvent(type: 'SIGNUP' | 'LOGOUT', email: string, details?: any) {
  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, email, details }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
