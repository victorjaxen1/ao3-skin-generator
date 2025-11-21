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

function applyBoldMarkup(raw: string): string {
  return raw.replace(/\*([^*]+)\*/g, '<b>$1</b>');
}

function msgHTML(msg: Message, template: string, project: SkinProject): string {
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
    // Advanced tweet: optional quote tweet embed
    const handle = (project.settings.twitterHandle && project.settings.twitterHandle.trim().length>0)
      ? `@${project.settings.twitterHandle.replace(/^@/, '')}`
      : `@${msg.sender.toLowerCase().replace(/\s+/g, '')}`;
    const verified = project.settings.twitterVerified ? `<span class="verified" aria-label="Verified">✔</span>` : '';
    const timestampLine = project.settings.twitterTimestamp || (msg.timestamp ? msg.timestamp : '');
    const metrics = project.settings.twitterShowMetrics ? `<div class="metrics">${project.settings.twitterReplies ? `<span class="metric replies" title="Replies">↩ ${project.settings.twitterReplies}</span>`:''}${project.settings.twitterRetweets ? `<span class="metric retweets" title="Retweets">🔁 ${project.settings.twitterRetweets}</span>`:''}${project.settings.twitterLikes ? `<span class="metric likes" title="Likes">❤ ${project.settings.twitterLikes}</span>`:''}</div>` : '';
    const contextLink = project.settings.twitterContextLinkText ? `<div class="context">${sanitizeText(project.settings.twitterContextLinkText)}</div>` : '';
    let quote = '';
    if (project.settings.twitterQuoteEnabled) {
      const qAvatar = project.settings.twitterQuoteAvatar ? `<img src="${project.settings.twitterQuoteAvatar}" alt="Quote avatar" class="quote-avatar" />` : '';
      const qHandle = project.settings.twitterQuoteHandle ? `@${project.settings.twitterQuoteHandle.replace(/^@/, '')}` : '';
      const qVerified = project.settings.twitterQuoteVerified ? `<span class="quote-verified" aria-label="Verified">✔</span>` : '';
      const qText = sanitizeText(project.settings.twitterQuoteText || '');
      const qImage = project.settings.twitterQuoteImage ? `<img src="${project.settings.twitterQuoteImage}" alt="Quote image" class="quote-image" />` : '';
      quote = `<div class="quote"><div class="quote-head">${qAvatar}<span class="quote-name">${sanitizeText(project.settings.twitterQuoteName||'')}</span>${qVerified}<span class="quote-handle">${qHandle}</span></div><div class="quote-body">${qText}${qImage}</div></div>`;
    }
    return `<div class="tweet">${avatar}<div class="head"><span class="name">${msg.sender}</span>${verified}<span class="handle">${handle}</span><span class="bird" aria-hidden="true">🐦</span></div><div class="body">${sanitized}${quote}</div>${timestampLine ? `<div class="time-line">${timestampLine}</div>`:''}${metrics}${contextLink}</div>`;
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
    // Google / variant search layout
    const engine = project.settings.googleEngineVariant || 'google';
    const logoClass = engine === 'google' ? 'logo sans' : engine === 'google-old' ? 'logo old' : 'logo naver';
    const searchTerm = (project.settings.googleQuery && project.settings.googleQuery.trim().length>0)
      ? sanitizeText(project.settings.googleQuery)
      : sanitizeText(project.messages[0]?.content || 'search query');
    const suggestions = (project.settings.googleSuggestions||[]).map(line => {
      const withBold = applyBoldMarkup(line);
      return `<div class="suggest-item">${sanitizeText(withBold)}</div>`;
    }).join('');
    const dropdown = suggestions.length ? `<div class="suggest-box">${suggestions}</div>` : '';
    const stats = (project.settings.googleResultsCount || project.settings.googleResultsTime) ? `<p class="search-stats">${sanitizeText(`${project.settings.googleResultsCount||''}${project.settings.googleResultsCount&&project.settings.googleResultsTime? ' ' : ''}${project.settings.googleResultsTime ? '('+project.settings.googleResultsTime+')':''}`)}</p>` : '';
    const dym = project.settings.googleDidYouMean ? `<p class="search-dym"><span class="search-dym1">Did you mean: </span><span class="search-dym2">${sanitizeText(project.settings.googleDidYouMean)}</span></p>` : '';
    const body = `<p class="${logoClass}">${engine==='naver'
      ? `<span class="naver-green">NAVER</span>`
      : engine==='google-old'
        ? `<span class="blue">G</span><span class="red">o</span><span class="yellow">o</span><span class="blue">g</span><span class="green">l</span><span class="red">e</span>`
        : `<span class="blue">G</span><span class="red">o</span><span class="yellow">o</span><span class="blue">g</span><span class="green">l</span><span class="red">e</span>`}
      </p><div class="search-wrap"><p class="search-bar"><span>${searchTerm}</span></p>${dropdown}${stats}${dym}</div>`;
    const watermark = project.settings.watermark ? `<div class="wm">(Created with AO3SkinGen)</div>` : '';
    return `<div class="chat">${body}${watermark}</div>`;
  }
  
  if (project.template === 'twitter') {
    // Each message becomes its own tweet for flexibility
    const tweets = project.messages.map(m => msgHTML(m, 'twitter', project)).join('');
    const watermark = project.settings.watermark ? `<div class="wm">(Created with AO3SkinGen)</div>` : '';
    return `<div class="chat tweets">${tweets}${watermark}</div>`;
  }

  if (project.template === 'instagram') {
    // For Instagram we treat first message as caption, use attachment or override image
    const m = project.messages[0];
    const captionUser = (project.settings.instagramUsernameOverride && project.settings.instagramUsernameOverride.trim().length>0)
      ? project.settings.instagramUsernameOverride
      : (m?.sender || 'user');
    const captionText = m ? sanitizeText(m.content) : 'Caption text';
    const imgOverride = project.settings.instagramImageUrl && project.settings.instagramImageUrl.trim().length>0 ? project.settings.instagramImageUrl : '';
    const attachImg = !imgOverride && m?.attachments && m.attachments[0]?.url ? m.attachments[0].url : '';
    const imageTag = (imgOverride || attachImg) ? `<img class="instImage" src="${imgOverride || attachImg}" alt="Post image" />` : '';
    const avatarTag = m?.avatarUrl ? `<img class="instAvatar" src="${m.avatarUrl}" alt="${captionUser} avatar" />` : '';
    const likesLine = project.settings.instagramLikes && project.settings.instagramLikes > 0 ? `<span class="likes"><b>${project.settings.instagramLikes}</b> likes</span>` : '';
    const commentsLink = project.settings.instagramShowCommentsLink && project.settings.instagramCommentsCount && project.settings.instagramCommentsCount > 0 ? `<span class="comments-link">View all ${project.settings.instagramCommentsCount} comments</span>` : '';
    const ts = project.settings.instagramTimestamp ? `<span class="instTimestamp">${sanitizeText(project.settings.instagramTimestamp)}</span>` : '';
    const body = `<div class="inst"><p class="instBody">${avatarTag}<span class="instUser">${sanitizeText(captionUser)}</span>${imageTag}<span class="instText">${likesLine}<br/><b>${sanitizeText(captionUser)}</b> ${captionText}</span>${commentsLink}${ts}</p></div>`;
    const watermark = project.settings.watermark ? `<div class="wm">(Created with AO3SkinGen)</div>` : '';
    return `<div class="chat">${body}${watermark}</div>`;
  }

  if (project.template === 'discord') {
    const s = project.settings;
    const header = s.discordShowHeader ? `<div class="dc-header"><span class="dc-hash">#</span><span class="dc-channel">${sanitizeText(s.discordChannelName||'general')}</span></div>` : '';
    const lines = project.messages.map(m => {
      const avatar = m.avatarUrl ? `<img class="dc-avatar" src="${m.avatarUrl}" alt="${sanitizeText(m.sender)} avatar" />` : `<span class="dc-avatar placeholder"></span>`;
      const nameColor = m.roleColor || '#ffffff';
      const time = m.timestamp ? `<span class="dc-time">${sanitizeText(m.timestamp)}</span>` : '';
      const content = sanitizeText(m.content);
      return `<div class="dc-line">${avatar}<div class="dc-msg"><div class="dc-meta"><span class="dc-name" style="color:${nameColor}">${sanitizeText(m.sender)}</span>${time}</div><div class="dc-text">${content}</div></div></div>`;
    }).join('');
    const watermark = project.settings.watermark ? `<div class="wm">(Created with AO3SkinGen)</div>` : '';
    return `<div class="chat dc-wrap">${header}${lines}${watermark}</div>`;
  }

  const body = project.messages.map(m => msgHTML(m, project.template, project)).join('');
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
  return `#workskin .chat{max-width:${maxWidth}px;font-family:\"Helvetica Neue\",Helvetica,Arial,sans-serif;margin:auto;}
#workskin .tweets .tweet{background:#fff;border:1px solid #ddd;border-radius:4px;padding:12px;margin:0 0 12px 0;position:relative;}
#workskin .tweet img.avatar{width:48px;height:48px;border-radius:24px;float:left;margin:0 12px 0 0;object-fit:cover;}
#workskin .tweet .head{display:flex;align-items:center;gap:6px;font-size:15px;font-weight:700;line-height:1;}
#workskin .tweet .name{font-weight:700;}
#workskin .tweet .verified{position:relative;bottom:2px;display:inline-block;font-weight:normal;text-align:center;font-size:10px;width:15px;height:15px;background-color:${s.senderColor};color:#fff;border-radius:50%;}
#workskin .tweet .handle{color:#697882;font-weight:400;}
#workskin .tweet .bird{margin-left:auto;color:${s.senderColor};}
#workskin .tweet .body{clear:both;margin-top:8px;font-size:15px;line-height:1.35;word-wrap:break-word;}
#workskin .tweet .time-line{margin-top:8px;font-size:13px;color:#697882;border-top:1px solid #eee;padding-top:8px;}
#workskin .tweet .metrics{display:flex;gap:16px;margin-top:8px;font-size:13px;color:#697882;border-top:1px solid #eee;padding-top:8px;}
#workskin .tweet .metric{display:inline-flex;align-items:center;gap:4px;}
#workskin .tweet .metric.likes{color:#cc2431;}
#workskin .tweet .context{margin-top:8px;font-size:13px;color:${s.senderColor};}
#workskin .tweet .quote{border:.05em solid #dddddd;border-radius:.3em;padding:8px;margin-top:8px;}
#workskin .tweet .quote-head{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600;}
#workskin .tweet .quote-avatar{width:24px;height:24px;border-radius:12px;object-fit:cover;}
#workskin .tweet .quote-verified{position:relative;bottom:2px;display:inline-block;font-weight:normal;text-align:center;font-size:9px;width:12px;height:12px;background-color:${s.senderColor};color:#fff;border-radius:50%;}
#workskin .tweet .quote-handle{color:#697882;font-weight:400;font-size:12px;}
#workskin .tweet .quote-body{margin-top:6px;font-size:13px;line-height:1.3;}
#workskin .tweet .quote-image{width:100%;height:auto;border-radius:.3em;margin-top:6px;}
#workskin .tweets .wm{margin-top:12px;font-size:10px;opacity:0.5;text-align:center;}
#workskin .link{text-decoration:none;color:#2C7BB8;}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}

function buildGoogleCSS(maxWidth: number): string {
  return `#workskin .chat{min-width:200px;max-width:${maxWidth}px;margin:auto;font-family:Arial,Helvetica,sans-serif;}
#workskin .logo{text-align:center;margin:0;font-weight:bold;font-size:32px;font-family:\"Lato\",\"Verdana\",sans-serif;}
#workskin .logo.old{font-family:\"Cardo\",\"Garamond\",serif;}
#workskin .logo.naver{font-family:\"Maven Pro\",Verdana,sans-serif;}
#workskin .naver-green{color:#2DB400;}
#workskin .blue{color:#4285F4;}#workskin .red{color:#DB4437;}#workskin .yellow{color:#F4B400;}#workskin .green{color:#0F9D58;}
#workskin .search-wrap{margin-top:12px;}
#workskin .search-bar{margin:0;}
#workskin .search-bar span{display:block;padding:10px 14px;border:1px solid #aaa;border-radius:24px;font-size:16px;}
#workskin .suggest-box{border:1px solid #aaa;border-top:none;border-radius:0 0 24px 24px;overflow:hidden;margin-top:-8px;}
#workskin .suggest-item{padding:6px 16px;font-size:15px;line-height:1.2;}
#workskin .suggest-item:nth-child(odd){background:#fafafa;}
#workskin .suggest-item b,#workskin .suggest-item strong{font-weight:600;}
#workskin .search-stats{margin:4px 0 0 0;color:#999;font-size:12px;padding-top:5px;}
#workskin .search-dym{margin:4px 0 0 0;font-size:12px;padding-top:5px;}
#workskin .search-dym1{color:#de5246;}
#workskin .search-dym2{color:#0645AD;font-weight:600;font-style:italic;}
#workskin .wm{margin-top:24px;font-size:10px;opacity:0.5;text-align:center;}`;
}

function buildInstagramCSS(maxWidth: number): string {
  return `#workskin .chat{max-width:${maxWidth}px;margin:auto;font-family:\"Helvetica Neue\",Helvetica,Arial,sans-serif;}
#workskin .inst{max-width:300px;display:table;margin:auto;}
#workskin .instBody{overflow:hidden;background:#fff;border:.1em solid #ddd;border-radius:.3em;min-width:100%;position:relative;padding:.7em;margin-left:-1em;}
#workskin .instAvatar{width:30px;height:auto;float:left;margin:0 .3em .5em -.1em;border:.1em solid #ddd;border-radius:50%;}
#workskin .instUser{color:#343436;position:relative;top:.1em;font-size:16px;font-weight:bold;}
#workskin .instImage{width:111%;height:auto;margin:0 -1em 0 -1em;}
#workskin .instText{display:inline-block;font-size:14px;border-top:1px solid #ADADAD;margin:.4em 0 .2em 0;padding:.4em 0 .2em 0;}
#workskin .likes{font-size:14px;}
#workskin .instTimestamp{display:inline-block;width:100%;color:#ADADAD;text-transform:uppercase;font-size:12px;margin-top:.4em;}
#workskin .comments-link{display:inline-block;width:100%;color:#ADADAD;font-size:14px;margin-top:.2em;}
#workskin .wm{margin-top:12px;font-size:10px;opacity:0.5;text-align:center;}`;
}

function buildDiscordCSS(maxWidth: number, dark: boolean): string {
  const bg = dark ? '#2B2D31' : '#FFFFFF';
  const text = dark ? '#DBDEE1' : '#2E3338';
  const meta = dark ? '#949BA4' : '#5865F2';
  return `#workskin .chat.dc-wrap{max-width:${maxWidth}px;margin:auto;font-family:Arial,Helvetica,sans-serif;background:${bg};padding:12px 0;border-radius:6px;}
#workskin .dc-header{font-size:14px;font-weight:600;padding:0 16px 8px 16px;color:${text};border-bottom:1px solid ${dark?'#1f2124':'#e3e5e8'};margin-bottom:8px;}
#workskin .dc-header .dc-hash{color:${meta};margin-right:4px;}
#workskin .dc-line{display:flex;padding:4px 16px 4px 16px;align-items:flex-start;gap:12px;}
#workskin .dc-avatar{width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;}
#workskin .dc-avatar.placeholder{width:40px;height:40px;border-radius:50%;background:#5865F2;display:inline-block;}
#workskin .dc-msg{flex:1;min-width:0;}
#workskin .dc-meta{display:flex;align-items:center;gap:8px;line-height:1;}
#workskin .dc-name{font-weight:600;font-size:14px;}
#workskin .dc-time{font-size:12px;color:${meta};}
#workskin .dc-text{font-size:14px;color:${text};line-height:1.25;word-wrap:break-word;white-space:pre-wrap;margin-top:2px;}
#workskin .wm{margin:8px 16px 0 16px;font-size:10px;opacity:0.5;color:${meta};text-align:right;}`;
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
    case 'instagram':
      return buildInstagramCSS(maxWidth);
    case 'discord':
      return buildDiscordCSS(maxWidth, project.settings.discordDarkMode !== false);
    case 'ios':
    default:
      return buildIOSCSS(s, senderBg, recvBg, neutralBg, maxWidth);
  }
}
