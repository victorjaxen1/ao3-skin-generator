// Cloudinary unsigned upload (no API key needed for uploads!)
// Uses a preset that allows anonymous uploads

export async function uploadImage(file: File): Promise<string> {
  // Cloudinary free tier: demo account with unsigned preset
  // You can create your own at: https://cloudinary.com/console
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'docs_upload_example_us_preset';
  
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset);
  
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: form
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Image upload failed: ${error}`);
  }
  
  const data = await res.json();
  return data.secure_url;
}
