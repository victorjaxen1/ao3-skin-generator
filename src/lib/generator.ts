import { SkinProject, Message } from './schema';
import { sanitizeText } from './sanitize';

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#','');
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function msgHTML(msg: Message): string {
  const sanitized = sanitizeText(msg.content);
  const avatar = msg.avatarUrl ? `<img src="${msg.avatarUrl}" alt="${msg.sender} avatar" class="avatar" />` : '';
  const who = `<dt class="sender">${msg.sender}</dt>`;
  const bubble = `<dd class="bubble ${msg.outgoing ? 'out' : 'in'}">${sanitized}${msg.timestamp ? `<span class="time">${msg.timestamp}</span>`: ''}</dd>`;
  const atts = (msg.attachments||[]).map(a => `<dd class="attach"><span class="visually-hidden">Image:</span><img src="${a.url}" alt="${a.alt||''}" class="attach-img"/></dd>`).join('');
  return `<div class="row">${avatar}<dl class="msg">${who}${bubble}${atts}</dl></div>`;
}

export function buildHTML(project: SkinProject): string {
  const body = project.messages.map(m => msgHTML(m)).join('');
  const watermark = project.settings.watermark ? `<div class="wm">(Created with AO3SkinGen)</div>` : '';
  return `<div class="chat">${body}${watermark}</div>`;
}

export function buildCSS(project: SkinProject): string {
  const s = project.settings;
  const senderBg = hexToRgba(s.senderColor, s.bubbleOpacity);
  const recvBg = hexToRgba(s.receiverColor, s.bubbleOpacity);
  const neutralBg = s.useDarkNeutral ? 'rgba(255,255,255,0.08)' : 'transparent';
  const maxWidth = s.maxWidthPx;
  return `#workskin .chat{width:80%;max-width:${maxWidth}px;margin:0 auto;display:flex;flex-direction:column;font-family:${s.fontFamily};}
#workskin .row{display:flex;gap:8px;margin:6px 0;align-items:flex-end;flex-wrap:wrap;}
#workskin img.avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;}
#workskin dl.msg{margin:0;display:flex;flex-direction:column;}
#workskin dt.sender{font-size:10px;color:rgba(255,255,255,0.6);margin:0 4px 2px 4px;}
#workskin dd{margin:0;}
#workskin dd.bubble{position:relative;max-width:75%;padding:6px 10px;border-radius:16px;line-height:1.3;word-wrap:break-word;background:${neutralBg};color:inherit;}
#workskin dd.bubble.out{background:${senderBg};color:#fff;}
#workskin dd.bubble.in{background:${recvBg};}
#workskin dd.bubble .time{display:block;font-size:9px;opacity:0.6;margin-top:4px;}
#workskin dd.attach{margin-top:4px;}
#workskin img.attach-img{max-width:200px;border-radius:8px;display:block;}
#workskin .wm{margin-top:12px;font-size:10px;opacity:0.5;text-align:center;}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}
