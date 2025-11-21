import React, { useState } from 'react';
import { SkinProject, Message } from '../lib/schema';
import { uploadImage } from '../lib/imgur';

interface Props { project: SkinProject; onChange: (p: SkinProject) => void; }

export const EditorForm: React.FC<Props> = ({ project, onChange }) => {
  const [uploading, setUploading] = useState<string | null>(null);
  
  function update<K extends keyof SkinProject>(key: K, value: SkinProject[K]) {
    // Auto-adjust colors when switching templates
    if (key === 'template') {
      const newSettings = { ...project.settings };
      if (value === 'android') {
        newSettings.senderColor = '#dcf8c6'; // WhatsApp green
        newSettings.receiverColor = '#ffffff';
      } else if (value === 'note') {
        newSettings.senderColor = '#4a5568'; // Gray for system messages
      } else if (value === 'twitter') {
        newSettings.senderColor = '#1DA1F2'; // Twitter blue
        newSettings.receiverColor = '#f5f8fa';
      } else if (value === 'google') {
        newSettings.senderColor = '#4285F4'; // Google blue
      } else if (value === 'ios') {
        newSettings.senderColor = '#1d9bf0'; // iOS blue
        newSettings.receiverColor = '#ececec';
      }
      onChange({ ...project, [key]: value, settings: newSettings });
      return;
    }
    onChange({ ...project, [key]: value });
  }
  function updateSettings<K extends keyof SkinProject['settings']>(key: K, value: SkinProject['settings'][K]) {
    update('settings', { ...project.settings, [key]: value });
  }
  function updateMsg(id: string, patch: Partial<Message>) {
    const messages = project.messages.map(m => m.id === id ? { ...m, ...patch } : m);
    update('messages', messages);
  }
  function deleteMsg(id: string) {
    update('messages', project.messages.filter(m => m.id !== id));
  }
  function addMessage() {
    const newMsg: Message = {
      id: crypto.randomUUID(), sender: 'New', content: 'Message', outgoing: false
    };
    update('messages', [...project.messages, newMsg]);
  }
  
  async function handleAvatarUpload(msgId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(msgId);
    try {
      const url = await uploadImage(file);
      updateMsg(msgId, { avatarUrl: url });
    } catch (err) {
      alert('Upload failed: ' + (err as Error).message);
    } finally {
      setUploading(null);
    }
  }
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Editor</h2>
      <div>
        <label className="flex flex-col text-sm">
          <span className="font-medium mb-1">Template Style</span>
          <select value={project.template} onChange={e=>update('template', e.target.value as any)} className="border px-2 py-1 rounded">
            <option value="ios">iOS iMessage</option>
            <option value="android">Android/WhatsApp</option>
            <option value="note">Note/System Message</option>
            <option value="twitter">Twitter Post</option>
            <option value="google">Google Search</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <label className="flex flex-col text-sm">Sender Color
          <input type="color" value={project.settings.senderColor} onChange={e=>updateSettings('senderColor', e.target.value)} />
        </label>
        <label className="flex flex-col text-sm">Receiver Color
          <input type="color" value={project.settings.receiverColor} onChange={e=>updateSettings('receiverColor', e.target.value)} />
        </label>
        <label className="flex flex-col text-sm">Bubble Opacity
          <input type="number" min={0} max={1} step={0.05} value={project.settings.bubbleOpacity} onChange={e=>updateSettings('bubbleOpacity', parseFloat(e.target.value))} />
        </label>
        <label className="flex flex-col text-sm">Max Width (px)
          <input type="number" min={280} max={600} value={project.settings.maxWidthPx} onChange={e=>updateSettings('maxWidthPx', parseInt(e.target.value))} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={project.settings.useDarkNeutral} onChange={e=>updateSettings('useDarkNeutral', e.target.checked)} /> Dark Neutral Layer
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={project.settings.watermark} onChange={e=>updateSettings('watermark', e.target.checked)} /> Watermark
        </label>
      </div>
      <div>
        <h3 className="font-medium text-sm mb-2">Messages</h3>
        <div className="space-y-2">
          {project.messages.map(m => (
            <div key={m.id} className="border p-2 rounded text-sm space-y-1 bg-gray-50">
              <div className="flex gap-2">
                <input className="border px-1 flex-1" value={m.sender} onChange={e=>updateMsg(m.id,{sender:e.target.value})} placeholder="Sender name" />
                <label className="flex items-center gap-1"><input type="checkbox" checked={m.outgoing} onChange={e=>updateMsg(m.id,{outgoing:e.target.checked})} /> Outgoing</label>
              </div>
              <textarea className="border w-full px-1" rows={2} value={m.content} onChange={e=>updateMsg(m.id,{content:e.target.value})} placeholder="Message text" />
              <div className="flex gap-2 items-center">
                <input className="border px-1 w-24" placeholder="time" value={m.timestamp||''} onChange={e=>updateMsg(m.id,{timestamp:e.target.value})} />
                <label className="text-xs cursor-pointer px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                  {uploading === m.id ? 'Uploading...' : 'Avatar'}
                  <input type="file" accept="image/*" onChange={(e) => handleAvatarUpload(m.id, e)} className="hidden" disabled={uploading === m.id} />
                </label>
                {m.avatarUrl && <span className="text-xs text-green-600">✓</span>}
                <button type="button" onClick={() => deleteMsg(m.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 ml-auto" title="Delete message">×</button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addMessage} className="mt-2 text-xs px-2 py-1 bg-blue-600 text-white rounded">Add Message</button>
      </div>
    </div>
  );
};
