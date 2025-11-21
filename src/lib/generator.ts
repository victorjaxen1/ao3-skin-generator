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

function buildIOSCSS(s: any, senderBg: string, recvBg: string, neutralBg: string, maxWidth: number): string {
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

function buildAndroidCSS(s: any, senderBg: string, recvBg: string, neutralBg: string, maxWidth: number): string {
  return `#workskin .chat{width:80%;max-width:${maxWidth}px;margin:0 auto;display:flex;flex-direction:column;font-family:${s.fontFamily};background:rgba(230,240,230,0.3);padding:12px;border-radius:8px;}
#workskin .row{display:flex;gap:8px;margin:8px 0;align-items:flex-end;flex-wrap:wrap;}
#workskin img.avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;}
#workskin dl.msg{margin:0;display:flex;flex-direction:column;}
#workskin dt.sender{font-size:11px;color:rgba(0,0,0,0.5);margin:0 4px 2px 4px;font-weight:600;}
#workskin dd{margin:0;}
#workskin dd.bubble{position:relative;max-width:75%;padding:8px 12px;border-radius:8px;line-height:1.4;word-wrap:break-word;background:${neutralBg};color:inherit;box-shadow:0 1px 2px rgba(0,0,0,0.1);}
#workskin dd.bubble.out{background:${senderBg};color:#000;border-radius:8px 8px 0 8px;}
#workskin dd.bubble.in{background:${recvBg};border-radius:8px 8px 8px 0;}
#workskin dd.bubble .time{display:block;font-size:10px;opacity:0.5;margin-top:4px;text-align:right;}
#workskin dd.attach{margin-top:4px;}
#workskin img.attach-img{max-width:200px;border-radius:8px;display:block;}
#workskin .wm{margin-top:12px;font-size:10px;opacity:0.5;text-align:center;}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}

function buildNoteCSS(s: any, senderBg: string, maxWidth: number): string {
  return `#workskin .chat{width:80%;max-width:${maxWidth}px;margin:20px auto;display:flex;flex-direction:column;font-family:${s.fontFamily};}
#workskin .row{display:flex;justify-content:center;margin:12px 0;}
#workskin dl.msg{margin:0;display:flex;flex-direction:column;align-items:center;}
#workskin dt.sender{font-size:11px;color:rgba(255,255,255,0.5);margin:0 0 4px 0;font-weight:600;}
#workskin dd{margin:0;}
#workskin dd.bubble{background:${senderBg};color:#fff;padding:10px 16px;border-radius:12px;line-height:1.4;text-align:center;max-width:90%;word-wrap:break-word;border:1px solid rgba(255,255,255,0.1);}
#workskin dd.bubble .time{display:block;font-size:9px;opacity:0.6;margin-top:6px;}
#workskin .wm{margin-top:16px;font-size:10px;opacity:0.5;text-align:center;}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}

export function buildCSS(project: SkinProject): string {
  const s = project.settings;
  const senderBg = hexToRgba(s.senderColor, s.bubbleOpacity);
  const recvBg = hexToRgba(s.receiverColor, s.bubbleOpacity);
  const neutralBg = s.useDarkNeutral ? 'rgba(255,255,255,0.08)' : 'transparent';
  const maxWidth = s.maxWidthPx;
  
  switch(project.template) {
    case 'android':
      return buildAndroidCSS(s, senderBg, recvBg, neutralBg, maxWidth);
    case 'note':
      return buildNoteCSS(s, senderBg, maxWidth);
    case 'ios':
    default:
      return buildIOSCSS(s, senderBg, recvBg, neutralBg, maxWidth);
  }
}
