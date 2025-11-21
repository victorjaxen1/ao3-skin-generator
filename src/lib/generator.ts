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

function msgHTML(msg: Message, template: string): string {
  const sanitized = sanitizeText(msg.content);
  const avatar = msg.avatarUrl ? `<img src="${msg.avatarUrl}" alt="${msg.sender} avatar" class="avatar" />` : '';
  const who = `<dt class="sender">${msg.sender}</dt>`;
  const bubble = `<dd class="bubble ${msg.outgoing ? 'out' : 'in'}">${sanitized}${msg.timestamp ? `<span class="time">${msg.timestamp}</span>`: ''}</dd>`;
  const atts = (msg.attachments||[]).map(a => `<dd class="attach"><span class="visually-hidden">Image:</span><img src="${a.url}" alt="${a.alt||''}" class="attach-img"/></dd>`).join('');
  
  if (template === 'note') {
    // Note template: no avatar, centered
    return `<div class="row"><dl class="msg">${who}${bubble}${atts}</dl></div>`;
  }
  
  if (template === 'twitter') {
    // Twitter template: avatar, username, handle, content, timestamp
    const handle = `<span class="handle">@${msg.sender.toLowerCase().replace(/\s+/g, '')}</span>`;
    return `<div class="row">${avatar}<dl class="msg"><dt class="sender">${msg.sender} ${handle}</dt>${bubble}${atts}</dl></div>`;
  }
  
  if (template === 'google') {
    // Google search: just display as search result (simplified)
    return `<div class="row"><span class="search-term">${sanitized}</span></div>`;
  }
  
  // iOS/Android: show avatar and normal layout
  return `<div class="row">${avatar}<dl class="msg">${who}${bubble}${atts}</dl></div>`;
}

export function buildHTML(project: SkinProject): string {
  if (project.template === 'google') {
    // Google Search special layout
    const searchTerm = project.messages[0]?.content || 'search query';
    const body = `<p class="logo"><span class="blue">G</span><span class="red">o</span><span class="yellow">o</span><span class="blue">g</span><span class="green">l</span><span class="red">e</span></p><p class="search-bar"><span>${searchTerm}</span></p>`;
    const watermark = project.settings.watermark ? `<div class="wm">(Created with AO3SkinGen)</div>` : '';
    return `<div class="chat">${body}${watermark}</div>`;
  }
  
  const body = project.messages.map(m => msgHTML(m, project.template)).join('');
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
#workskin dd.bubble.out{background:${senderBg};color:#fff;border-bottom-right-radius:4px;}
#workskin dd.bubble.out::after{content:"";position:absolute;right:-5px;bottom:0;width:10px;height:10px;background:${senderBg};border-bottom-left-radius:16px 14px;}
#workskin dd.bubble.in{background:${recvBg};border-bottom-left-radius:4px;}
#workskin dd.bubble.in::after{content:"";position:absolute;left:-5px;bottom:0;width:10px;height:10px;background:${recvBg};border-bottom-right-radius:16px 14px;}
#workskin dd.bubble .time{display:block;font-size:9px;opacity:0.6;margin-top:4px;}
#workskin dd.attach{margin-top:4px;}
#workskin img.attach-img{max-width:200px;border-radius:8px;display:block;}
#workskin .wm{margin-top:12px;font-size:10px;opacity:0.5;text-align:center;}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}

function buildAndroidCSS(s: any, senderBg: string, recvBg: string, neutralBg: string, maxWidth: number): string {
  return `#workskin .chat{width:80%;max-width:${maxWidth}px;margin:0 auto;display:flex;flex-direction:column;font-family:${s.fontFamily};background:rgba(230,235,230,0.2);padding:12px;border-radius:8px;}
#workskin .row{display:flex;gap:8px;margin:8px 0;align-items:flex-start;flex-wrap:wrap;}
#workskin img.avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;}
#workskin dl.msg{margin:0;display:flex;flex-direction:column;flex:1;}
#workskin dt.sender{font-size:12px;color:rgba(100,100,100,0.8);margin:0 0 3px 8px;font-weight:600;}
#workskin dd{margin:0;}
#workskin dd.bubble{position:relative;max-width:85%;padding:8px 12px;border-radius:8px;line-height:1.4;word-wrap:break-word;background:${neutralBg};color:inherit;box-shadow:0 1px 2px rgba(0,0,0,0.1);}
#workskin dd.bubble.out{background:${senderBg};color:#000;border-radius:8px 8px 2px 8px;margin-left:auto;}
#workskin dd.bubble.in{background:${recvBg};border-radius:8px 8px 8px 2px;}
#workskin dd.bubble .time{display:inline;font-size:10px;opacity:0.5;margin-left:8px;float:right;}
#workskin dd.attach{margin-top:4px;}
#workskin img.attach-img{max-width:200px;border-radius:8px;display:block;}
#workskin .wm{margin-top:12px;font-size:10px;opacity:0.5;text-align:center;}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}

function buildNoteCSS(s: any, senderBg: string, maxWidth: number): string {
  return `#workskin .chat{width:80%;max-width:${maxWidth}px;margin:20px auto;display:flex;flex-direction:column;font-family:${s.fontFamily};}
#workskin .row{display:flex;justify-content:center;margin:12px 0;width:100%;}
#workskin dl.msg{margin:0;display:flex;flex-direction:column;align-items:center;max-width:100%;}
#workskin dt.sender{font-size:11px;color:rgba(255,255,255,0.5);margin:0 0 4px 0;font-weight:600;}
#workskin dd{margin:0;max-width:100%;}
#workskin dd.bubble{background:${senderBg};color:#fff;padding:10px 16px;border-radius:12px;line-height:1.4;text-align:center;max-width:100%;word-wrap:break-word;word-break:break-word;border:1px solid rgba(255,255,255,0.1);box-sizing:border-box;}
#workskin dd.bubble .time{display:block;font-size:9px;opacity:0.6;margin-top:6px;}
#workskin .wm{margin-top:16px;font-size:10px;opacity:0.5;text-align:center;}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}

function buildTwitterCSS(s: any, senderBg: string, maxWidth: number): string {
  return `#workskin .chat{max-width:${maxWidth}px;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;display:table;margin:auto;}
#workskin .row{overflow:hidden;background:#fff;border:0.05em solid #ddd;border-radius:0.3em;min-width:100%;position:relative;padding:1em;margin:0 0 1em 0;}
#workskin img.avatar{width:40px;height:auto;float:left;margin:0 0.3em 0.3em 0;border-radius:20px;}
#workskin dl.msg{margin:0;display:flex;flex-direction:column;}
#workskin dt.sender{position:relative;top:-0.2em;font-size:18px;font-weight:bold;}
#workskin dt.sender .handle{position:relative;top:-0.5em;font-size:16px;font-weight:300;color:#697882;}
#workskin dd{margin:0;}
#workskin dd.bubble{width:100%;display:inline-block;margin-bottom:0.5em;word-wrap:break-word;}
#workskin dd.bubble .time{display:inline-block;font-size:14px;width:100%;font-weight:300;color:#697882;padding:0.5em 0 0 0;}
#workskin .link{text-decoration:none;color:#2C7BB8;}
#workskin .wm{margin-top:12px;font-size:10px;opacity:0.5;text-align:center;}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}

function buildGoogleCSS(maxWidth: number): string {
  return `#workskin .chat{min-width:200px;max-width:80%;margin:auto;}
#workskin .logo{text-align:center;margin:0;font-weight:bold;font-size:x-large;font-family:"Lato","Verdana",sans-serif;}
#workskin .logo .blue{color:#4285F4;}
#workskin .logo .red{color:#DB4437;}
#workskin .logo .yellow{color:#F4B400;}
#workskin .logo .green{color:#0F9D58;}
#workskin .search-bar{margin-top:5px;margin-bottom:0;}
#workskin .search-bar span{position:relative;display:block;margin:0;padding:5px;border:1px solid #aaa;}
#workskin .search-stats{margin:0;color:#999;font-size:smaller;padding-top:5px;}
#workskin .wm{margin-top:12px;font-size:10px;opacity:0.5;text-align:center;}`;
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
    case 'twitter':
      return buildTwitterCSS(s, senderBg, maxWidth);
    case 'google':
      return buildGoogleCSS(maxWidth);
    case 'ios':
    default:
      return buildIOSCSS(s, senderBg, recvBg, neutralBg, maxWidth);
  }
}
