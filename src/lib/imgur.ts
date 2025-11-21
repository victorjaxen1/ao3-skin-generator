// Placeholder Imgur upload (anonymous). Replace with real implementation once Client ID provided.
// NOTE: Requires NEXT_PUBLIC_IMGUR_CLIENT_ID in .env.local

export async function uploadToImgur(file: File): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_IMGUR_CLIENT_ID;
  if (!clientId) throw new Error('Imgur Client ID missing');
  const form = new FormData();
  form.append('image', file);
  const res = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: { Authorization: `Client-ID ${clientId}` },
    body: form
  });
  if (!res.ok) throw new Error('Imgur upload failed');
  const data = await res.json();
  return data?.data?.link;
}
