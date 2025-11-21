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
        // Auto-generate handle from first message sender if not set
        if (!newSettings.twitterHandle && project.messages.length > 0) {
          const firstSender = project.messages[0].sender;
          newSettings.twitterHandle = firstSender.toLowerCase().replace(/\s+/g, '');
        }
        // Default timestamp format if not set
        if (!newSettings.twitterTimestamp) {
          newSettings.twitterTimestamp = '';
        }
      } else if (value === 'google') {
        newSettings.senderColor = '#4285F4'; // Google blue
        // Auto-populate query from first message if available
        if (!newSettings.googleQuery && project.messages.length > 0) {
          newSettings.googleQuery = project.messages[0].content;
        }
        // Default placeholder if nothing set
        if (!newSettings.googleQuery) {
          newSettings.googleQuery = '';
        }
      } else if (value === 'instagram') {
        newSettings.senderColor = '#E1306C'; // Instagram magenta
        newSettings.receiverColor = '#FDFDFD';
        // Auto-populate username from first message if not set
        if (!newSettings.instagramUsername && project.messages.length > 0) {
          newSettings.instagramUsername = project.messages[0].sender.toLowerCase().replace(/\s+/g, '');
        }
        // Auto-populate caption from first message content if not set
        if (!newSettings.instagramCaption && project.messages.length > 0) {
          newSettings.instagramCaption = project.messages[0].content;
        }
        // Set sensible defaults
        if (!newSettings.instagramTimestamp) {
          newSettings.instagramTimestamp = '2 hours ago';
        }
      } else if (value === 'ios') {
        newSettings.senderColor = '#1d9bf0'; // iOS blue
        newSettings.receiverColor = '#ececec';
      }
      else if (value === 'discord') {
        newSettings.discordChannelName = project.settings.discordChannelName || 'general';
        newSettings.discordShowHeader = project.settings.discordShowHeader !== false;
        newSettings.discordDarkMode = project.settings.discordDarkMode !== false;
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

  async function handleInstagramImageUpload(type: 'avatar' | 'image', e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const uploadId = `instagram-${type}`;
    setUploading(uploadId);
    try {
      const url = await uploadImage(file);
      if (type === 'avatar') {
        updateSettings('instagramAvatarUrl', url);
      } else {
        updateSettings('instagramImageUrl', url);
      }
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
            <option value="instagram">Instagram Post</option>
            <option value="discord">Discord Chat</option>
          </select>
        </label>
      </div>
      {/* Template-specific settings */}
      {project.template === 'twitter' ? (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-sm">Accent Color (Blue)
            <input type="color" value={project.settings.senderColor} onChange={e=>updateSettings('senderColor', e.target.value)} />
          </label>
          <label className="flex flex-col text-sm">Max Width (px)
            <input type="number" min={280} max={600} value={project.settings.maxWidthPx} onChange={e=>updateSettings('maxWidthPx', parseInt(e.target.value))} />
          </label>
          <label className="flex items-center gap-2 text-sm col-span-2">
            <input type="checkbox" checked={project.settings.watermark} onChange={e=>updateSettings('watermark', e.target.checked)} /> Watermark
          </label>
        </div>
      ) : project.template === 'google' ? (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-sm">Max Width (px)
            <input type="number" min={280} max={600} value={project.settings.maxWidthPx} onChange={e=>updateSettings('maxWidthPx', parseInt(e.target.value))} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={project.settings.watermark} onChange={e=>updateSettings('watermark', e.target.checked)} /> Watermark
          </label>
        </div>
      ) : project.template === 'instagram' ? (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-sm">Max Width (px)
            <input type="number" min={280} max={600} value={project.settings.maxWidthPx} onChange={e=>updateSettings('maxWidthPx', parseInt(e.target.value))} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={project.settings.watermark} onChange={e=>updateSettings('watermark', e.target.checked)} /> Watermark
          </label>
        </div>
      ) : project.template === 'note' ? (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-sm">Note Color
            <input type="color" value={project.settings.senderColor} onChange={e=>updateSettings('senderColor', e.target.value)} />
          </label>
          <label className="flex flex-col text-sm">Note Style
            <select value={project.settings.noteStyle||'system'} onChange={e=>updateSettings('noteStyle', e.target.value as any)} className="border px-2 py-1 rounded">
              <option value="system">System Alert</option>
              <option value="document">Document/Classified</option>
              <option value="letter">Letter/Memo</option>
              <option value="simple">Simple Note</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">Alignment
            <select value={project.settings.noteAlignment||'center'} onChange={e=>updateSettings('noteAlignment', e.target.value as any)} className="border px-2 py-1 rounded">
              <option value="center">Center</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">Max Width (px)
            <input type="number" min={280} max={600} value={project.settings.maxWidthPx} onChange={e=>updateSettings('maxWidthPx', parseInt(e.target.value))} />
          </label>
          <label className="flex items-center gap-2 text-sm col-span-2">
            <input type="checkbox" checked={project.settings.watermark} onChange={e=>updateSettings('watermark', e.target.checked)} /> Watermark
          </label>
        </div>
      ) : project.template === 'discord' ? (
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-sm">Max Width (px)
            <input type="number" min={280} max={600} value={project.settings.maxWidthPx} onChange={e=>updateSettings('maxWidthPx', parseInt(e.target.value))} />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={project.settings.watermark} onChange={e=>updateSettings('watermark', e.target.checked)} /> Watermark
          </label>
        </div>
      ) : (
        /* iOS/Android chat templates - keep all bubble controls */
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
      )}
      {project.template === 'note' && (
        <div className="border rounded p-3 space-y-2 bg-gradient-to-br from-gray-50 to-slate-100">
          <h3 className="text-sm font-semibold text-gray-700">📝 Note Tips</h3>
          <div className="text-xs space-y-2 text-gray-600">
            <p><b>System Alert:</b> Formal notifications (e.g., "SYSTEM WARNING: Unauthorized access")</p>
            <p><b>Document:</b> Official docs (e.g., "CLASSIFIED - SHIELD PERSONNEL ONLY")</p>
            <p><b>Letter:</b> Personal notes or memos (e.g., "To: Staff | From: Director")</p>
            <p><b>Simple:</b> Plain text notes (e.g., "Meet me at midnight")</p>
            <p className="text-[10px] italic mt-2 bg-white/50 p-2 rounded">
              💡 Use the "Label" field below for sender/header (e.g., "SYSTEM", "Admin", "Note"). Leave "Outgoing" unchecked for notes.
            </p>
          </div>
        </div>
      )}
      
      {/* iOS-specific options */}
      {project.template === 'ios' && (
        <div className="border rounded p-4 space-y-3 bg-gradient-to-br from-blue-50 to-gray-100">
          <h3 className="text-sm font-semibold text-blue-900">💬 iMessage Options</h3>
          
          <label className="flex flex-col text-xs">
            <span className="font-medium mb-1 text-gray-700">Contact Name</span>
            <input 
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400" 
              value={project.settings.chatContactName||''} 
              onChange={e=>updateSettings('chatContactName', e.target.value)} 
              placeholder="John Doe" 
            />
            <span className="text-[10px] text-gray-500 mt-1">Shows in conversation header</span>
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <input 
                type="checkbox" 
                checked={project.settings.iosShowHeader||false} 
                onChange={e=>updateSettings('iosShowHeader', e.target.checked)} 
              />
              <span>Show "To: [Contact]" header</span>
            </label>
            
            <label className="flex items-center gap-2 text-xs">
              <input 
                type="checkbox" 
                checked={project.settings.iosShowDelivered||false} 
                onChange={e=>updateSettings('iosShowDelivered', e.target.checked)} 
              />
              <span>Show "Delivered" indicator</span>
            </label>

            <label className="flex items-center gap-2 text-xs">
              <input 
                type="checkbox" 
                checked={project.settings.chatShowTyping||false} 
                onChange={e=>updateSettings('chatShowTyping', e.target.checked)} 
              />
              <span>Show typing indicator ("...")</span>
            </label>
            
            {project.settings.chatShowTyping && (
              <input 
                className="border border-gray-300 px-2 py-1 rounded ml-6 w-full text-xs" 
                value={project.settings.chatTypingName||''} 
                onChange={e=>updateSettings('chatTypingName', e.target.value)} 
                placeholder="Who is typing?"
              />
            )}
          </div>

          <p className="text-[10px] text-gray-600 italic bg-white/50 p-2 rounded mt-3">
            💡 Tip: Use message reactions (below) to add tapback hearts ❤️, thumbs up 👍, etc.
          </p>
        </div>
      )}

      {/* Android-specific options */}
      {project.template === 'android' && (
        <div className="border rounded p-4 space-y-3 bg-gradient-to-br from-green-50 to-gray-100">
          <h3 className="text-sm font-semibold text-green-900">💬 WhatsApp/Android Options</h3>
          
          <label className="flex flex-col text-xs">
            <span className="font-medium mb-1 text-gray-700">Contact Name</span>
            <input 
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-green-400" 
              value={project.settings.chatContactName||''} 
              onChange={e=>updateSettings('chatContactName', e.target.value)} 
              placeholder="John Doe" 
            />
            <span className="text-[10px] text-gray-500 mt-1">Shows in conversation header</span>
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <input 
                type="checkbox" 
                checked={project.settings.androidCheckmarks!==false} 
                onChange={e=>updateSettings('androidCheckmarks', e.target.checked)} 
              />
              <span>Show checkmarks (✓ sent, ✓✓ read)</span>
            </label>

            <label className="flex items-center gap-2 text-xs">
              <input 
                type="checkbox" 
                checked={project.settings.androidShowStatus||false} 
                onChange={e=>updateSettings('androidShowStatus', e.target.checked)} 
              />
              <span>Show contact status</span>
            </label>
            
            {project.settings.androidShowStatus && (
              <input 
                className="border border-gray-300 px-2 py-1 rounded ml-6 w-full text-xs" 
                value={project.settings.androidStatusText||''} 
                onChange={e=>updateSettings('androidStatusText', e.target.value)} 
                placeholder="Online / Last seen today at 2:34 PM"
              />
            )}

            <label className="flex items-center gap-2 text-xs">
              <input 
                type="checkbox" 
                checked={project.settings.chatShowTyping||false} 
                onChange={e=>updateSettings('chatShowTyping', e.target.checked)} 
              />
              <span>Show typing indicator</span>
            </label>
            
            {project.settings.chatShowTyping && (
              <input 
                className="border border-gray-300 px-2 py-1 rounded ml-6 w-full text-xs" 
                value={project.settings.chatTypingName||''} 
                onChange={e=>updateSettings('chatTypingName', e.target.value)} 
                placeholder="Contact is typing..."
              />
            )}
          </div>

          <p className="text-[10px] text-gray-600 italic bg-white/50 p-2 rounded mt-3">
            💡 Tip: You can add emoji reactions (❤️, 😂, 👍) to individual messages below
          </p>
        </div>
      )}
      
      {project.template === 'twitter' && (
        <div className="border rounded p-3 space-y-3 bg-white/50">
          <h3 className="text-sm font-medium">Tweet Details</h3>
          
          {/* Profile & Verification */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <label className="flex flex-col">Twitter Handle
              <input className="border px-2 py-1 rounded" value={project.settings.twitterHandle||''} onChange={e=>updateSettings('twitterHandle', e.target.value)} placeholder="@username (auto-generated)" />
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={project.settings.twitterVerified||false} onChange={e=>updateSettings('twitterVerified', e.target.checked)} />
              <span>Verified Account</span>
            </label>
          </div>

          {/* Timestamp */}
          <label className="flex flex-col text-xs">
            <span className="font-medium mb-1">Timestamp</span>
            <input className="border px-2 py-1 rounded" value={project.settings.twitterTimestamp||''} onChange={e=>updateSettings('twitterTimestamp', e.target.value)} placeholder="3:09 PM · May 5, 2014" />
          </label>

          {/* Engagement Metrics */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={project.settings.twitterShowMetrics||false} onChange={e=>updateSettings('twitterShowMetrics', e.target.checked)} />
              <span className="font-medium">Show Engagement Metrics</span>
            </label>
            {project.settings.twitterShowMetrics && (
              <div className="grid grid-cols-3 gap-2 pl-6">
                <label className="flex flex-col text-xs">
                  <span>Replies</span>
                  <input type="number" className="border px-2 py-1 rounded" value={project.settings.twitterReplies||0} onChange={e=>updateSettings('twitterReplies', parseInt(e.target.value)||0)} />
                </label>
                <label className="flex flex-col text-xs">
                  <span>Retweets</span>
                  <input type="number" className="border px-2 py-1 rounded" value={project.settings.twitterRetweets||0} onChange={e=>updateSettings('twitterRetweets', parseInt(e.target.value)||0)} />
                </label>
                <label className="flex flex-col text-xs">
                  <span>Likes</span>
                  <input type="number" className="border px-2 py-1 rounded" value={project.settings.twitterLikes||0} onChange={e=>updateSettings('twitterLikes', parseInt(e.target.value)||0)} />
                </label>
              </div>
            )}
          </div>

          {/* Context Link */}
          <label className="flex flex-col text-xs">
            <span className="font-medium mb-1">Context Link Text (optional)</span>
            <input className="border px-2 py-1 rounded" value={project.settings.twitterContextLinkText||''} onChange={e=>updateSettings('twitterContextLinkText', e.target.value)} placeholder="192 people are talking about this" />
          </label>

          {/* Quote Tweet Section */}
          <div className="border-t pt-3 mt-3">
            <label className="flex items-center gap-2 text-xs mb-3">
              <input type="checkbox" checked={project.settings.twitterQuoteEnabled||false} onChange={e=>updateSettings('twitterQuoteEnabled', e.target.checked)} />
              <span className="font-medium">Embed Quote Tweet</span>
            </label>
            
            {project.settings.twitterQuoteEnabled && (
              <div className="space-y-2 pl-6 bg-gray-50 p-3 rounded">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex flex-col">
                    <span>Display Name</span>
                    <input className="border px-2 py-1 rounded" value={project.settings.twitterQuoteName||''} onChange={e=>updateSettings('twitterQuoteName', e.target.value)} placeholder="John Doe" />
                  </label>
                  <label className="flex flex-col">
                    <span>Handle</span>
                    <input className="border px-2 py-1 rounded" value={project.settings.twitterQuoteHandle||''} onChange={e=>updateSettings('twitterQuoteHandle', e.target.value)} placeholder="@johndoe" />
                  </label>
                  <label className="flex items-center gap-2 col-span-2">
                    <input type="checkbox" checked={project.settings.twitterQuoteVerified||false} onChange={e=>updateSettings('twitterQuoteVerified', e.target.checked)} />
                    <span>Verified</span>
                  </label>
                </div>
                <label className="flex flex-col text-xs">
                  <span>Quote Tweet Text</span>
                  <textarea rows={2} className="border px-2 py-1 rounded" value={project.settings.twitterQuoteText||''} onChange={e=>updateSettings('twitterQuoteText', e.target.value)} placeholder="Original tweet content..." />
                </label>
                <label className="flex flex-col text-xs">
                  <span>Avatar URL</span>
                  <input className="border px-2 py-1 rounded" value={project.settings.twitterQuoteAvatar||''} onChange={e=>updateSettings('twitterQuoteAvatar', e.target.value)} placeholder="https://..." />
                </label>
                <label className="flex flex-col text-xs">
                  <span>Image URL (optional)</span>
                  <input className="border px-2 py-1 rounded" value={project.settings.twitterQuoteImage||''} onChange={e=>updateSettings('twitterQuoteImage', e.target.value)} placeholder="https://..." />
                </label>
              </div>
            )}
          </div>

          <p className="text-[10px] text-gray-600 italic">💡 Tip: Main tweet content comes from the message text below. Each message creates a separate tweet.</p>
        </div>
      )}
      {project.template === 'google' && (
        <div className="border rounded p-4 space-y-4 bg-gradient-to-br from-blue-50 to-yellow-50">
          <h3 className="text-sm font-semibold text-blue-900">🔍 Google Search Creator</h3>
          
          {/* Main Search Query */}
          <label className="flex flex-col text-xs">
            <span className="font-medium mb-1 text-gray-700">Search Query</span>
            <input 
              className="border border-gray-300 px-4 py-3 rounded-full text-base focus:ring-2 focus:ring-blue-400 focus:border-transparent" 
              value={project.settings.googleQuery||''} 
              onChange={e=>updateSettings('googleQuery', e.target.value)} 
              placeholder="who is the current green lantern" 
            />
            <span className="text-[10px] text-gray-500 mt-1">This is what appears in the search bar</span>
          </label>

          {/* Engine Variant */}
          <label className="flex flex-col text-xs">
            <span className="font-medium mb-1 text-gray-700">Search Engine Style</span>
            <select 
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400" 
              value={project.settings.googleEngineVariant||'google'} 
              onChange={e=>updateSettings('googleEngineVariant', e.target.value as any)}
            >
              <option value="google">Google (Modern)</option>
              <option value="google-old">Google (Classic Serif)</option>
              <option value="naver">Naver (Korean)</option>
            </select>
          </label>

          {/* Autocomplete Suggestions */}
          <div className="space-y-2">
            <label className="flex flex-col text-xs">
              <span className="font-medium mb-1 text-gray-700">Autocomplete Suggestions (optional)</span>
              <textarea 
                rows={4} 
                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none font-mono text-sm" 
                value={(project.settings.googleSuggestions||[]).join('\n')} 
                onChange={e=>updateSettings('googleSuggestions', e.target.value.split(/\r?\n/).filter(l=>l.trim().length>0))} 
                placeholder="who is the current green lantern&#10;who is the current queen of genovia&#10;who is the current doctor who"
              />
              <span className="text-[10px] text-gray-500 mt-1">
                💡 One per line. Use *asterisks* to <b>bold</b> matching parts: "who is the *current* green lantern"
              </span>
            </label>
            
            {/* Visual preview of suggestions */}
            {project.settings.googleSuggestions && project.settings.googleSuggestions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-2 text-xs">
                <div className="text-gray-500 mb-1 font-medium">Preview:</div>
                {project.settings.googleSuggestions.slice(0, 3).map((sug, i) => (
                  <div key={i} className="py-1 px-2 hover:bg-gray-50 rounded">
                    {sug.replace(/\*/g, '')}
                  </div>
                ))}
                {project.settings.googleSuggestions.length > 3 && (
                  <div className="text-gray-400 text-[10px] mt-1">+ {project.settings.googleSuggestions.length - 3} more</div>
                )}
              </div>
            )}
          </div>

          {/* Result Statistics Section */}
          <div className="border-t border-gray-200 pt-3 space-y-3">
            <label className="flex items-center gap-2 text-xs">
              <input 
                type="checkbox" 
                checked={project.settings.googleShowStats||false} 
                onChange={e=>updateSettings('googleShowStats', e.target.checked)} 
                className="rounded"
              />
              <span className="font-medium text-gray-700">Show result statistics</span>
            </label>
            
            {project.settings.googleShowStats && (
              <div className="grid grid-cols-2 gap-3 pl-6">
                <label className="flex flex-col text-xs">
                  <span className="text-gray-600">Results Count</span>
                  <input 
                    className="border border-gray-300 px-2 py-1 rounded" 
                    value={project.settings.googleResultsCount||''} 
                    onChange={e=>updateSettings('googleResultsCount', e.target.value)} 
                    placeholder="About 24,040,000,000 results" 
                  />
                </label>
                <label className="flex flex-col text-xs">
                  <span className="text-gray-600">Search Time</span>
                  <input 
                    className="border border-gray-300 px-2 py-1 rounded" 
                    value={project.settings.googleResultsTime||''} 
                    onChange={e=>updateSettings('googleResultsTime', e.target.value)} 
                    placeholder="0.56 seconds" 
                  />
                </label>
              </div>
            )}
          </div>

          {/* Did You Mean Section */}
          <div className="border-t border-gray-200 pt-3 space-y-3">
            <label className="flex items-center gap-2 text-xs">
              <input 
                type="checkbox" 
                checked={project.settings.googleShowDidYouMean||false} 
                onChange={e=>updateSettings('googleShowDidYouMean', e.target.checked)} 
                className="rounded"
              />
              <span className="font-medium text-gray-700">Show "Did you mean" correction</span>
            </label>
            
            {project.settings.googleShowDidYouMean && (
              <label className="flex flex-col text-xs pl-6">
                <span className="text-gray-600 mb-1">Suggested correction</span>
                <input 
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400" 
                  value={project.settings.googleDidYouMean||''} 
                  onChange={e=>updateSettings('googleDidYouMean', e.target.value)} 
                  placeholder="Captain Jack Sparrow" 
                />
                <span className="text-[10px] text-gray-500 mt-1">
                  If user searches "Captian Jack Sparow", suggest "Captain Jack Sparrow"
                </span>
              </label>
            )}
          </div>

          {/* Settings */}
          <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-3">
            <label className="flex flex-col text-xs">
              <span className="font-medium mb-1 text-gray-700">Max Width</span>
              <input 
                type="number" 
                min={280} 
                max={600} 
                className="border border-gray-300 px-2 py-1 rounded" 
                value={project.settings.maxWidthPx} 
                onChange={e=>updateSettings('maxWidthPx', parseInt(e.target.value))} 
              />
            </label>
            <label className="flex items-center gap-2 text-xs pt-5">
              <input 
                type="checkbox" 
                checked={project.settings.watermark} 
                onChange={e=>updateSettings('watermark', e.target.checked)} 
              />
              <span>Watermark</span>
            </label>
          </div>

          <p className="text-[10px] text-gray-600 italic bg-white/50 p-2 rounded">
            💡 Tip: This creates a Google search interface. No need to use the Messages section below.
          </p>
        </div>
      )}
      {project.template === 'instagram' && (
        <div className="border rounded p-4 space-y-4 bg-gradient-to-br from-purple-50 to-pink-50">
          <h3 className="text-sm font-semibold text-purple-900">📸 Instagram Post Creator</h3>
          
          {/* Profile Section */}
          <div className="space-y-3">
            <label className="flex flex-col text-xs">
              <span className="font-medium mb-1 text-gray-700">Username</span>
              <input 
                className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent" 
                value={project.settings.instagramUsername||''} 
                onChange={e=>updateSettings('instagramUsername', e.target.value)} 
                placeholder="username" 
              />
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col text-xs">
                <span className="font-medium mb-1 text-gray-700">Profile Picture</span>
                <label className="cursor-pointer px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition">
                  {uploading === 'instagram-avatar' ? '⏳ Uploading...' : project.settings.instagramAvatarUrl ? '✓ Uploaded' : '📤 Upload Avatar'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleInstagramImageUpload('avatar', e)} 
                    className="hidden" 
                    disabled={uploading === 'instagram-avatar'} 
                  />
                </label>
              </label>
              
              <label className="flex flex-col text-xs">
                <span className="font-medium mb-1 text-gray-700">Post Image</span>
                <label className="cursor-pointer px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-center transition">
                  {uploading === 'instagram-image' ? '⏳ Uploading...' : project.settings.instagramImageUrl ? '✓ Uploaded' : '📤 Upload Image'}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => handleInstagramImageUpload('image', e)} 
                    className="hidden" 
                    disabled={uploading === 'instagram-image'} 
                  />
                </label>
              </label>
            </div>
            
            {/* Direct URL inputs as fallback */}
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Or paste image URLs directly</summary>
              <div className="mt-2 space-y-2 pl-2">
                <input 
                  className="border border-gray-300 px-2 py-1 rounded w-full text-xs" 
                  value={project.settings.instagramAvatarUrl||''} 
                  onChange={e=>updateSettings('instagramAvatarUrl', e.target.value)} 
                  placeholder="Profile picture URL" 
                />
                <input 
                  className="border border-gray-300 px-2 py-1 rounded w-full text-xs" 
                  value={project.settings.instagramImageUrl||''} 
                  onChange={e=>updateSettings('instagramImageUrl', e.target.value)} 
                  placeholder="Post image URL" 
                />
              </div>
            </details>
          </div>

          {/* Caption */}
          <label className="flex flex-col text-xs">
            <span className="font-medium mb-1 text-gray-700">Caption</span>
            <textarea 
              rows={3} 
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent resize-none" 
              value={project.settings.instagramCaption||''} 
              onChange={e=>updateSettings('instagramCaption', e.target.value)} 
              placeholder="Write your caption here... ✨"
            />
          </label>

          {/* Location */}
          <label className="flex flex-col text-xs">
            <span className="font-medium mb-1 text-gray-700">📍 Location (optional)</span>
            <input 
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent" 
              value={project.settings.instagramLocation||''} 
              onChange={e=>updateSettings('instagramLocation', e.target.value)} 
              placeholder="Paris, France" 
            />
          </label>

          {/* Engagement Section - Collapsible */}
          <div className="border-t border-gray-200 pt-3 space-y-3">
            <h4 className="text-xs font-medium text-gray-700">⚡ Engagement (optional)</h4>
            
            <div className="space-y-2 pl-3">
              <label className="flex items-center gap-2 text-xs">
                <input 
                  type="checkbox" 
                  checked={project.settings.instagramShowLikes||false} 
                  onChange={e=>updateSettings('instagramShowLikes', e.target.checked)} 
                  className="rounded"
                />
                <span>Show likes</span>
                {project.settings.instagramShowLikes && (
                  <input 
                    type="number" 
                    className="border border-gray-300 px-2 py-1 rounded w-24 ml-2" 
                    value={project.settings.instagramLikes||0} 
                    onChange={e=>updateSettings('instagramLikes', parseInt(e.target.value)||0)} 
                    min={0}
                  />
                )}
              </label>
              
              <label className="flex items-center gap-2 text-xs">
                <input 
                  type="checkbox" 
                  checked={project.settings.instagramShowComments||false} 
                  onChange={e=>updateSettings('instagramShowComments', e.target.checked)} 
                  className="rounded"
                />
                <span>Show "View all X comments"</span>
                {project.settings.instagramShowComments && (
                  <input 
                    type="number" 
                    className="border border-gray-300 px-2 py-1 rounded w-24 ml-2" 
                    value={project.settings.instagramCommentsCount||0} 
                    onChange={e=>updateSettings('instagramCommentsCount', parseInt(e.target.value)||0)} 
                    min={0}
                  />
                )}
              </label>
            </div>
          </div>

          {/* Timestamp */}
          <label className="flex flex-col text-xs">
            <span className="font-medium mb-1 text-gray-700">🕐 Posted</span>
            <input 
              className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent" 
              value={project.settings.instagramTimestamp||''} 
              onChange={e=>updateSettings('instagramTimestamp', e.target.value)} 
              placeholder="2 hours ago" 
            />
            <span className="text-[10px] text-gray-500 mt-1">Use natural language: "2 hours ago", "May 5", "Just now"</span>
          </label>

          {/* Settings */}
          <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-3">
            <label className="flex flex-col text-xs">
              <span className="font-medium mb-1 text-gray-700">Max Width</span>
              <input 
                type="number" 
                min={280} 
                max={600} 
                className="border border-gray-300 px-2 py-1 rounded" 
                value={project.settings.maxWidthPx} 
                onChange={e=>updateSettings('maxWidthPx', parseInt(e.target.value))} 
              />
            </label>
            <label className="flex items-center gap-2 text-xs pt-5">
              <input 
                type="checkbox" 
                checked={project.settings.watermark} 
                onChange={e=>updateSettings('watermark', e.target.checked)} 
              />
              <span>Watermark</span>
            </label>
          </div>

          <p className="text-[10px] text-gray-600 italic bg-white/50 p-2 rounded">
            💡 Tip: This creates a single Instagram post. No need to use the Messages section below for Instagram.
          </p>
        </div>
      )}
      {project.template === 'discord' && (
        <div className="border rounded p-4 space-y-4 bg-gradient-to-br from-indigo-50 to-slate-100">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-indigo-900">💬 Discord Chat Creator</h3>
            <label className="flex items-center gap-2 text-xs px-3 py-1 rounded-full" style={{
              background: project.settings.discordDarkMode !== false ? '#2B2D31' : '#FFFFFF',
              color: project.settings.discordDarkMode !== false ? '#DBDEE1' : '#2E3338',
              border: '1px solid ' + (project.settings.discordDarkMode !== false ? '#1f2124' : '#e3e5e8')
            }}>
              <input 
                type="checkbox" 
                checked={project.settings.discordDarkMode!==false} 
                onChange={e=>updateSettings('discordDarkMode', e.target.checked)} 
              />
              <span className="font-medium">{project.settings.discordDarkMode !== false ? '🌙 Dark' : '☀️ Light'} Mode</span>
            </label>
          </div>
          
          {/* Server & Channel Context */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col text-xs">
                <span className="font-medium mb-1 text-gray-700">Server Name (optional)</span>
                <input 
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400" 
                  value={project.settings.discordServerName||''} 
                  onChange={e=>updateSettings('discordServerName', e.target.value)} 
                  placeholder="My Cool Server" 
                />
              </label>
              <label className="flex flex-col text-xs">
                <span className="font-medium mb-1 text-gray-700">Channel Name</span>
                <input 
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-indigo-400" 
                  value={project.settings.discordChannelName||''} 
                  onChange={e=>updateSettings('discordChannelName', e.target.value)} 
                  placeholder="general" 
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input 
                type="checkbox" 
                checked={project.settings.discordShowHeader!==false} 
                onChange={e=>updateSettings('discordShowHeader', e.target.checked)} 
              />
              <span>Show channel header</span>
            </label>
          </div>

          {/* Role Color Presets */}
          <div className="border-t border-gray-200 pt-3 space-y-2">
            <h4 className="text-xs font-medium text-gray-700">🎨 Role Color Presets</h4>
            <p className="text-[10px] text-gray-600">Quick-assign these colors when adding messages below</p>
            <div className="space-y-1">
              {(project.settings.discordRolePresets || []).map((preset, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <input 
                    type="color" 
                    value={preset.color} 
                    onChange={e => {
                      const newPresets = [...(project.settings.discordRolePresets || [])];
                      newPresets[idx].color = e.target.value;
                      updateSettings('discordRolePresets', newPresets);
                    }}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input 
                    className="border border-gray-300 px-2 py-1 rounded flex-1" 
                    value={preset.name} 
                    onChange={e => {
                      const newPresets = [...(project.settings.discordRolePresets || [])];
                      newPresets[idx].name = e.target.value;
                      updateSettings('discordRolePresets', newPresets);
                    }}
                    placeholder="Role name"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      const newPresets = (project.settings.discordRolePresets || []).filter((_, i) => i !== idx);
                      updateSettings('discordRolePresets', newPresets);
                    }}
                    className="text-red-500 hover:text-red-700 px-2"
                    title="Remove preset"
                  >×</button>
                </div>
              ))}
              <button 
                type="button"
                onClick={() => {
                  const newPresets = [...(project.settings.discordRolePresets || []), { name: 'New Role', color: '#99AAB5' }];
                  updateSettings('discordRolePresets', newPresets);
                }}
                className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
              >+ Add Role Preset</button>
            </div>
          </div>

          {/* Settings */}
          <div className="border-t border-gray-200 pt-3 grid grid-cols-2 gap-3">
            <label className="flex flex-col text-xs">
              <span className="font-medium mb-1 text-gray-700">Max Width</span>
              <input 
                type="number" 
                min={280} 
                max={800} 
                className="border border-gray-300 px-2 py-1 rounded" 
                value={project.settings.maxWidthPx} 
                onChange={e=>updateSettings('maxWidthPx', parseInt(e.target.value))} 
              />
            </label>
            <label className="flex items-center gap-2 text-xs pt-5">
              <input 
                type="checkbox" 
                checked={project.settings.watermark} 
                onChange={e=>updateSettings('watermark', e.target.checked)} 
              />
              <span>Watermark</span>
            </label>
          </div>

          <p className="text-[10px] text-gray-600 italic bg-white/50 p-2 rounded">
            💡 Tip: Each message below can use role colors. Click a preset color or use custom. Avatars work best at 40×40px.
          </p>
        </div>
      )}
      
      {/* Messages section - hide for Instagram and Google since they don't use it */}
      {project.template !== 'instagram' && project.template !== 'google' && (
        <div>
          <h3 className="font-medium text-sm mb-2">{project.template === 'note' ? 'Notes' : 'Messages'}</h3>
          {project.template === 'note' && (
            <p className="text-xs text-gray-600 mb-2 italic">Each entry below becomes a separate note block</p>
          )}
          <div className="space-y-2">
            {project.messages.map(m => (
              <div key={m.id} className="border p-2 rounded text-sm space-y-1 bg-gray-50">
                {project.template === 'note' ? (
                  /* Simplified note interface */
                  <>
                    <input className="border px-2 py-1 w-full rounded" value={m.sender} onChange={e=>updateMsg(m.id,{sender:e.target.value})} placeholder="Label (e.g., SYSTEM, Admin, Note)" />
                    <textarea className="border w-full px-2 py-1 rounded" rows={3} value={m.content} onChange={e=>updateMsg(m.id,{content:e.target.value})} placeholder="Note content..." />
                    <div className="flex gap-2 items-center justify-end">
                      <button type="button" onClick={() => deleteMsg(m.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600" title="Delete note">×</button>
                    </div>
                  </>
                ) : (
                  /* Full chat message interface */
                  <>
                    <div className="flex gap-2">
                      <input className="border px-1 flex-1" value={m.sender} onChange={e=>updateMsg(m.id,{sender:e.target.value})} placeholder="Sender name" />
                      <label className="flex items-center gap-1"><input type="checkbox" checked={m.outgoing} onChange={e=>updateMsg(m.id,{outgoing:e.target.checked})} /> Outgoing</label>
                    </div>
                    {project.template === 'discord' && (
                      <div className="space-y-2">
                        <div className="flex gap-2 items-center flex-wrap">
                          <label className="flex items-center gap-1 text-xs">
                            <span>Role Color:</span>
                            <input 
                              type="color" 
                              value={m.roleColor||'#5865F2'} 
                              onChange={e=>updateMsg(m.id,{roleColor:e.target.value})} 
                              className="w-8 h-8 rounded cursor-pointer"
                            />
                          </label>
                          {/* Quick role presets */}
                          {(project.settings.discordRolePresets || []).length > 0 && (
                            <div className="flex gap-1 items-center">
                              <span className="text-[10px] text-gray-500">Quick:</span>
                              {(project.settings.discordRolePresets || []).map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => updateMsg(m.id, {roleColor: preset.color})}
                                  className="text-[10px] px-2 py-1 rounded border hover:border-gray-400 transition"
                                  style={{
                                    background: preset.color,
                                    color: '#fff',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                  }}
                                  title={`Set to ${preset.name}`}
                                >
                                  {preset.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <textarea className="border w-full px-1" rows={2} value={m.content} onChange={e=>updateMsg(m.id,{content:e.target.value})} placeholder="Message text" />
                    
                    {/* Chat enhancements for iOS/Android */}
                    {(project.template === 'ios' || project.template === 'android') && (
                      <div className="flex gap-2 items-center text-xs bg-gray-100 p-2 rounded">
                        <label className="flex items-center gap-1">
                          <span className="text-gray-600">Status:</span>
                          <select 
                            className="border px-1 py-0.5 rounded text-xs" 
                            value={m.status||'sent'} 
                            onChange={e=>updateMsg(m.id,{status:e.target.value as any})}
                          >
                            <option value="sending">Sending...</option>
                            <option value="sent">Sent</option>
                            <option value="delivered">Delivered</option>
                            <option value="read">Read</option>
                          </select>
                        </label>
                        <label className="flex items-center gap-1">
                          <span className="text-gray-600">Reaction:</span>
                          <input 
                            className="border px-2 py-0.5 rounded text-xs w-16" 
                            value={m.reaction||''} 
                            onChange={e=>updateMsg(m.id,{reaction:e.target.value})} 
                            placeholder="❤️ 👍"
                            maxLength={2}
                          />
                        </label>
                      </div>
                    )}
                    
                    <div className="flex gap-2 items-center">
                      <input className="border px-1 w-24" placeholder="time" value={m.timestamp||''} onChange={e=>updateMsg(m.id,{timestamp:e.target.value})} />
                      <label className="text-xs cursor-pointer px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                        {uploading === m.id ? 'Uploading...' : 'Avatar'}
                        <input type="file" accept="image/*" onChange={(e) => handleAvatarUpload(m.id, e)} className="hidden" disabled={uploading === m.id} />
                      </label>
                      {m.avatarUrl && <span className="text-xs text-green-600">✓</span>}
                      <button type="button" onClick={() => deleteMsg(m.id)} className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 ml-auto" title="Delete message">×</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addMessage} className="mt-2 text-xs px-2 py-1 bg-blue-600 text-white rounded">Add {project.template === 'note' ? 'Note' : 'Message'}</button>
        </div>
      )}
    </div>
  );
};
