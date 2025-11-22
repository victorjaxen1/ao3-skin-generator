import { SkinProject, Message } from './schema';
import { sanitizeText } from './sanitize';
import { PLATFORM_ASSETS, FALLBACK_TEXT } from './platformAssets';

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

function highlightHashtags(text: string): string {
  return text.replace(/(#\w+)/g, '<span class="hashtag">$1</span>');
}

function msgHTML(msg: Message, template: string, project: SkinProject): string {
  const sanitized = sanitizeText(msg.content);
  const avatar = msg.avatarUrl ? `<img src="${msg.avatarUrl}" alt="${msg.sender} avatar" class="avatar" />` : '';
  const who = `<dt class="sender">${msg.sender}</dt>`;
  
  // Build checkmark HTML for WhatsApp (will be added inside bubble)
  let checkmarkHTML = '';
  if (template === 'android' && msg.outgoing && project.settings.androidCheckmarks) {
    let checkImg = '';
    if (msg.status === 'sending') checkImg = PLATFORM_ASSETS.whatsapp.checkmarkSending;
    else if (msg.status === 'sent') checkImg = PLATFORM_ASSETS.whatsapp.checkmarkSent;
    else if (msg.status === 'delivered') checkImg = PLATFORM_ASSETS.whatsapp.checkmarkDelivered;
    else if (msg.status === 'read') checkImg = PLATFORM_ASSETS.whatsapp.checkmarkRead;
    
    if (checkImg) {
      checkmarkHTML = `<img src="${checkImg}" alt="${msg.status}" class="check-icon" />`;
    }
  }

  // Build the message bubble
  let bubble = `<dd class="bubble ${msg.outgoing?'out':'in'}">${sanitized}`;
  if ((template === 'ios' || template === 'android') && (msg.timestamp || checkmarkHTML)) {
    bubble += `<span class="time">${msg.timestamp||''}${checkmarkHTML}</span>`;
  }
  
  // Add reaction if present (iOS/Android)
  if ((template === 'ios' || template === 'android') && msg.reaction) {
    bubble += `<span class="reaction">${msg.reaction}</span>`;
  }
  
  bubble += `</dd>`;
  
  // Add status indicators
  let statusIndicator = '';
  if (template === 'ios' && msg.outgoing && project.settings.iosShowDelivered && msg.status === 'delivered') {
    statusIndicator = `<dd class="status-indicator">Delivered</dd>`;
  }
  
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
    const verified = project.settings.twitterVerified ? `<img src="${PLATFORM_ASSETS.twitter.verifiedBadge}" alt="Verified" class="verified-badge" />` : '';
    const timestampLine = project.settings.twitterTimestamp || (msg.timestamp ? msg.timestamp : '');
    const metrics = project.settings.twitterShowMetrics ? `<div class="metrics">${project.settings.twitterReplies ? `<span class="metric replies" title="Replies"><img src="${PLATFORM_ASSETS.twitter.replyIcon}" alt="Replies" class="metric-icon" /> ${project.settings.twitterReplies}</span>`:''}${project.settings.twitterRetweets ? `<span class="metric retweets" title="Retweets"><img src="${PLATFORM_ASSETS.twitter.retweetIcon}" alt="Retweets" class="metric-icon" /> ${project.settings.twitterRetweets}</span>`:''}${project.settings.twitterLikes ? `<span class="metric likes" title="Likes"><img src="${PLATFORM_ASSETS.twitter.likeIcon}" alt="Likes" class="metric-icon" /> ${project.settings.twitterLikes}</span>`:''}</div>` : '';
    const contextLink = project.settings.twitterContextLinkText ? `<div class="context">${sanitizeText(project.settings.twitterContextLinkText)}</div>` : '';
    let quote = '';
    if (project.settings.twitterQuoteEnabled) {
      const qAvatar = project.settings.twitterQuoteAvatar ? `<img src="${project.settings.twitterQuoteAvatar}" alt="Quote avatar" class="quote-avatar" />` : '';
      const qHandle = project.settings.twitterQuoteHandle ? `@${project.settings.twitterQuoteHandle.replace(/^@/, '')}` : '';
      const qVerified = project.settings.twitterQuoteVerified ? `<img src="${PLATFORM_ASSETS.twitter.verifiedBadge}" alt="Verified" class="quote-verified-badge" />` : '';
      const qText = sanitizeText(project.settings.twitterQuoteText || '');
      const qImage = project.settings.twitterQuoteImage ? `<img src="${project.settings.twitterQuoteImage}" alt="Quote image" class="quote-image" />` : '';
      quote = `<div class="quote"><div class="quote-head">${qAvatar}<span class="quote-name">${sanitizeText(project.settings.twitterQuoteName||'')}</span>${qVerified}<span class="quote-handle">${qHandle}</span></div><div class="quote-body">${highlightHashtags(qText)}${qImage}</div></div>`;
    }
    const bodyWithHashtags = highlightHashtags(sanitized);
    return `<div class="tweet">${avatar}<div class="head"><span class="name">${msg.sender}</span>${verified}<span class="handle">${handle}</span><img src="${PLATFORM_ASSETS.twitter.logo}" alt="Twitter" class="twitter-logo" /></div><div class="body">${bodyWithHashtags}${quote}</div>${timestampLine ? `<div class="time-line">${timestampLine}</div>`:''}${metrics}${contextLink}</div>`;
  }
  
  if (template === 'google') {
    // Google search: just display as search result (simplified)
    return `<div class="row"><span class="search-term">${sanitized}</span></div>`;
  }
  
  // iOS/Android: show avatar and normal layout
  const rowClass = msg.outgoing ? 'row out' : 'row in';
  return `<div class="${rowClass}">${avatar}<dl class="msg">${who}${bubble}${statusIndicator}${atts}</dl></div>`;
}

export function buildHTML(project: SkinProject): string {
  // iOS and Android templates with enhanced features
  if (project.template === 'ios' || project.template === 'android') {
    const s = project.settings;
    const isIOS = project.template === 'ios';
    
    // Contact header
    const contactHeader = s.chatContactName 
      ? `<div class="chat-header">${isIOS && s.iosShowHeader ? `<span class="to-label">To: </span>` : ''}<span class="contact-name">${sanitizeText(s.chatContactName)}</span>${!isIOS && s.androidShowStatus ? `<span class="status">${sanitizeText(s.androidStatusText||'Online')}</span>` : ''}</div>`
      : '';
    
    // Messages
    const body = project.messages.map(m => msgHTML(m, project.template, project)).join('');
    
    // Typing indicator
    const typing = s.chatShowTyping 
      ? `<div class="row typing"><div class="typing-bubble"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>${s.chatTypingName ? `<span class="typing-label">${sanitizeText(s.chatTypingName)}</span>` : ''}</div>`
      : '';
    
    const watermark = project.settings.watermark ? `<div class="wm">(Created with AO3SkinGen)</div>` : '';
    return `<div class="chat">${contactHeader}${body}${typing}${watermark}</div>`;
  }
  
  if (project.template === 'google') {
    // Google search layout with dedicated query field
    const s = project.settings;
    const engine = s.googleEngineVariant || 'google';
    const logoClass = engine === 'google' ? 'logo sans' : engine === 'google-old' ? 'logo old' : 'logo naver';
    const searchTerm = sanitizeText(s.googleQuery || 'search query');
    
    // Build suggestions
    const suggestions = (s.googleSuggestions||[]).filter(line=>line.trim().length>0).map(line => {
      const withBold = applyBoldMarkup(line);
      return `<div class="suggest-item">${sanitizeText(withBold)}</div>`;
    }).join('');
    
    // Build unified search component (bar + dropdown as one)
    const searchComponent = suggestions.length 
      ? `<div class="search-container"><div class="search-bar">${searchTerm}</div><div class="suggest-box">${suggestions}</div></div>`
      : `<div class="search-bar-solo">${searchTerm}</div>`;
    
    // Result statistics (only if enabled)
    const stats = s.googleShowStats && (s.googleResultsCount || s.googleResultsTime)
      ? `<p class="search-stats">${sanitizeText(`${s.googleResultsCount||''}${s.googleResultsCount&&s.googleResultsTime? ' ' : ''}${s.googleResultsTime ? '('+s.googleResultsTime+')':''}`)}</p>`
      : '';
    
    // Did you mean correction (only if enabled)
    const dym = s.googleShowDidYouMean && s.googleDidYouMean
      ? `<p class="search-dym"><span class="search-dym1">Did you mean: </span><span class="search-dym2">${sanitizeText(s.googleDidYouMean)}</span></p>`
      : '';
    
    // Build logo
    const logoHtml = engine === 'naver'
      ? `<span class="naver-green">NAVER</span>`
      : engine === 'google-old'
        ? `<span class="blue">G</span><span class="red">o</span><span class="yellow">o</span><span class="blue">g</span><span class="green">l</span><span class="red">e</span>`
        : `<span class="blue">G</span><span class="red">o</span><span class="yellow">o</span><span class="blue">g</span><span class="green">l</span><span class="red">e</span>`;
    
    const body = `<p class="${logoClass}">${logoHtml}</p><div class="search-wrap">${searchComponent}${stats}${dym}</div>`;
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
    // Instagram uses dedicated settings fields, not messages array
    const s = project.settings;
    const username = s.instagramUsername || 'user';
    const caption = sanitizeText(s.instagramCaption || '');
    const imageTag = s.instagramImageUrl ? `<img class="instImage" src="${s.instagramImageUrl}" alt="Post image" />` : '';
    const avatarTag = s.instagramAvatarUrl ? `<img class="instAvatar" src="${s.instagramAvatarUrl}" alt="${username} avatar" />` : '';
    const location = s.instagramLocation ? `<span class="instLocation"><img src="${PLATFORM_ASSETS.instagram.locationPin}" alt="Location" class="location-icon" /> ${sanitizeText(s.instagramLocation)}</span>` : '';
    const likesLine = s.instagramShowLikes && s.instagramLikes ? `<span class="likes"><b>${s.instagramLikes.toLocaleString()}</b> likes</span>` : '';
    const commentsLink = s.instagramShowComments && s.instagramCommentsCount ? `<span class="comments-link">View all ${s.instagramCommentsCount} comments</span>` : '';
    const ts = s.instagramTimestamp ? `<span class="instTimestamp">${sanitizeText(s.instagramTimestamp)}</span>` : '';
    
    const body = `<div class="inst">
      <div class="instHeader">${avatarTag}<span class="instUser">${sanitizeText(username)}</span>${location}</div>
      ${imageTag}
      <div class="instContent">
        ${likesLine ? `<div class="instLikes">${likesLine}</div>` : ''}
        <div class="instCaption"><b>${sanitizeText(username)}</b> ${caption}</div>
        ${commentsLink ? `<div class="instComments">${commentsLink}</div>` : ''}
        ${ts ? `<div class="instTime">${ts}</div>` : ''}
      </div>
    </div>`;
    const watermark = project.settings.watermark ? `<div class="wm">(Created with AO3SkinGen)</div>` : '';
    return `<div class="chat">${body}${watermark}</div>`;
  }

  if (project.template === 'discord') {
    const s = project.settings;
    const channelName = sanitizeText(s.discordChannelName || 'general');
    const serverName = s.discordServerName ? sanitizeText(s.discordServerName) : '';
    const header = s.discordShowHeader 
      ? `<div class="dc-header">${serverName ? `<span class="dc-server">${serverName}</span>` : ''}<span class="dc-hash">#</span><span class="dc-channel">${channelName}</span></div>` 
      : '';
    const lines = project.messages.map(m => {
      const avatar = m.avatarUrl ? `<img class="dc-avatar" src="${m.avatarUrl}" alt="${sanitizeText(m.sender)} avatar" />` : `<span class="dc-avatar placeholder"></span>`;
      const nameColor = m.roleColor || (s.discordDarkMode !== false ? '#B9BBBE' : '#2E3338');
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
  return `#workskin .chat{width:80%;max-width:${maxWidth}px;margin:0 auto;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;padding:12px 8px;}
#workskin .chat-header{text-align:center;font-size:12px;color:rgba(235,235,245,0.6);padding:10px 0 6px 0;margin-bottom:4px;font-weight:400;letter-spacing:0.3px;}
#workskin .chat-header .to-label{opacity:0.75;}
#workskin .chat-header .contact-name{font-weight:600;color:rgba(235,235,245,0.85);}
#workskin .row{display:flex;gap:6px;margin:2px 0;align-items:flex-end;flex-wrap:wrap;}
#workskin .row.out{justify-content:flex-end;}
#workskin .row.in{justify-content:flex-start;}
#workskin img.avatar{width:28px;height:28px;border-radius:50%;object-fit:cover;flex-shrink:0;}
#workskin dl.msg{margin:0;display:flex;flex-direction:column;gap:1px;}
#workskin dt.sender{font-size:11px;color:rgba(235,235,245,0.5);margin:6px 0 2px 36px;font-weight:500;}
#workskin dd{margin:0;}
#workskin dd.bubble{position:relative;max-width:70%;padding:8px 12px;border-radius:18px;line-height:1.35;word-wrap:break-word;font-size:15px;}
#workskin dd.bubble.out{background:${senderBg};color:#fff;border-bottom-right-radius:4px;}
#workskin dd.bubble.out::after{content:'';position:absolute;right:-4px;bottom:0;width:14px;height:14px;background:${senderBg};clip-path:polygon(0 0,100% 100%,0 100%);border-bottom-left-radius:18px;}
#workskin dd.bubble.in{background:${recvBg};color:#000;border-bottom-left-radius:4px;}
#workskin dd.bubble.in::after{content:'';position:absolute;left:-4px;bottom:0;width:14px;height:14px;background:${recvBg};clip-path:polygon(100% 0,100% 100%,0 100%);border-bottom-right-radius:18px;}
#workskin dd.bubble .time{display:block;font-size:11px;color:rgba(255,255,255,0.65);margin-top:6px;font-weight:400;}
#workskin dd.bubble .reaction{position:absolute;bottom:-10px;right:8px;background:rgba(44,44,46,0.95);border:1.5px solid rgba(255,255,255,0.1);border-radius:14px;padding:3px 8px;font-size:16px;box-shadow:0 2px 8px rgba(0,0,0,0.3);backdrop-filter:blur(10px);}
#workskin dd.status-indicator{font-size:10px;color:rgba(235,235,245,0.45);text-align:right;margin:2px 10px 0 0;font-weight:400;}
#workskin dd.attach{margin-top:2px;}
#workskin img.attach-img{max-width:220px;border-radius:12px;display:block;}
#workskin .row.typing{align-items:center;gap:6px;}
#workskin .typing-bubble{background:${recvBg};padding:10px 14px;border-radius:18px;display:flex;gap:4px;align-items:center;border-bottom-left-radius:4px;}
#workskin .typing-bubble .dot{width:8px;height:8px;background:rgba(235,235,245,0.6);border-radius:50%;animation:typing 1.4s infinite;}
#workskin .typing-bubble .dot:nth-child(2){animation-delay:0.2s;}
#workskin .typing-bubble .dot:nth-child(3){animation-delay:0.4s;}
@keyframes typing{0%,60%,100%{opacity:0.3;transform:translateY(0);}30%{opacity:1;transform:translateY(-4px);}}
#workskin .typing-label{font-size:11px;color:rgba(235,235,245,0.5);font-weight:400;}
#workskin .wm{margin-top:16px;font-size:10px;opacity:0.4;text-align:center;color:rgba(235,235,245,0.6);}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}

function buildAndroidCSS(s: any, senderBg: string, recvBg: string, neutralBg: string, maxWidth: number): string {
  return `#workskin .chat{width:90%;max-width:${maxWidth}px;min-width:200px;margin:0 auto;display:flex;flex-direction:column;font-family:${s.fontFamily};background:rgba(230,235,230,0.2);padding:12px;border-radius:8px;box-sizing:border-box;}
#workskin .chat-header{padding:8px 12px;border-bottom:1px solid rgba(0,0,0,0.1);margin-bottom:12px;}
#workskin .chat-header .contact-name{font-size:16px;font-weight:600;color:rgba(0,0,0,0.87);display:block;}
#workskin .chat-header .status{font-size:12px;color:rgba(0,0,0,0.54);display:block;margin-top:2px;}
#workskin .row{display:flex;gap:8px;margin:8px 0;align-items:flex-start;flex-wrap:wrap;}
#workskin .row.out{justify-content:flex-end;}
#workskin .row.in{justify-content:flex-start;}
#workskin img.avatar{width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;}
#workskin dl.msg{margin:0;display:flex;flex-direction:column;flex:1;}
#workskin dt.sender{font-size:12px;color:rgba(100,100,100,0.8);margin:0 0 3px 8px;font-weight:600;}
#workskin dd{margin:0;}
#workskin dd.bubble{position:relative;max-width:85%;padding:8px 12px;border-radius:8px;line-height:1.4;word-wrap:break-word;background:${neutralBg};color:inherit;box-shadow:0 1px 2px rgba(0,0,0,0.1);}
#workskin dd.bubble.out{background:${senderBg};color:#000;border-radius:8px 8px 2px 8px;margin-left:auto;}
#workskin dd.bubble.in{background:${recvBg};border-radius:8px 8px 8px 2px;}
#workskin dd.bubble .time{display:inline;font-size:10px;opacity:0.5;margin-left:8px;float:right;}
#workskin dd.bubble .time .check-icon{height:12px;width:auto;vertical-align:middle;margin-left:4px;}
#workskin dd.bubble .reaction{position:absolute;bottom:-8px;right:0;background:#fff;border:1px solid #ddd;border-radius:12px;padding:2px 6px;font-size:14px;box-shadow:0 2px 4px rgba(0,0,0,0.1);}
#workskin dd.attach{margin-top:4px;}
#workskin img.attach-img{max-width:200px;border-radius:8px;display:block;}
#workskin .row.typing{align-items:center;gap:6px;}
#workskin .typing-bubble{background:${recvBg};padding:10px 14px;border-radius:8px;display:flex;gap:4px;align-items:center;box-shadow:0 1px 2px rgba(0,0,0,0.1);}
#workskin .typing-bubble .dot{width:8px;height:8px;background:rgba(0,0,0,0.4);border-radius:50%;animation:typing 1.4s infinite;}
#workskin .typing-bubble .dot:nth-child(2){animation-delay:0.2s;}
#workskin .typing-bubble .dot:nth-child(3){animation-delay:0.4s;}
@keyframes typing{0%,60%,100%{opacity:0.3;}30%{opacity:1;}}
#workskin .typing-label{font-size:11px;color:rgba(0,0,0,0.6);}
#workskin .wm{margin-top:12px;font-size:10px;opacity:0.5;text-align:center;}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}

function buildNoteCSS(s: any, senderBg: string, maxWidth: number): string {
  const style = s.noteStyle || 'system';
  const align = s.noteAlignment || 'center';
  const justifyContent = align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end';
  const textAlign = align;
  
  // Different styles get different visual treatments
  const styleCss = style === 'system'
    ? `text-transform:uppercase;letter-spacing:1px;font-weight:700;border:2px solid rgba(255,255,255,0.3);`
    : style === 'document'
    ? `text-transform:uppercase;letter-spacing:0.5px;font-weight:600;border-top:2px solid rgba(255,255,255,0.4);border-bottom:2px solid rgba(255,255,255,0.4);padding:12px 20px;`
    : style === 'letter'
    ? `font-family:Georgia,serif;font-style:italic;border-left:3px solid rgba(255,255,255,0.5);padding-left:16px;`
    : `font-weight:400;border:1px solid rgba(255,255,255,0.2);`;
  
  return `#workskin .chat{width:90%;max-width:${maxWidth}px;min-width:200px;margin:20px auto;display:flex;flex-direction:column;font-family:${s.fontFamily};box-sizing:border-box;}
#workskin .row{display:flex;justify-content:${justifyContent};margin:12px 0;width:100%;box-sizing:border-box;}
#workskin dl.msg{margin:0;display:flex;flex-direction:column;align-items:${align === 'center' ? 'center' : align === 'left' ? 'flex-start' : 'flex-end'};max-width:100%;box-sizing:border-box;}
#workskin dt.sender{font-size:11px;color:rgba(255,255,255,0.6);margin:0 0 6px 0;font-weight:600;${textAlign === 'center' ? '' : 'text-align:'+textAlign+';'}}
#workskin dd{margin:0;max-width:100%;box-sizing:border-box;}
#workskin dd.bubble{background:${senderBg};color:#fff;padding:10px 16px;border-radius:8px;line-height:1.4;text-align:${textAlign};max-width:100%;word-wrap:break-word;word-break:break-word;box-sizing:border-box;${styleCss}}
#workskin dd.bubble .time{display:block;font-size:9px;opacity:0.6;margin-top:6px;}
#workskin .wm{margin-top:16px;font-size:10px;opacity:0.5;text-align:center;}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}

function buildTwitterCSS(s: any, senderBg: string, maxWidth: number): string {
  return `#workskin .chat{width:90%;max-width:${maxWidth}px;min-width:200px;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;margin:0 auto;box-sizing:border-box;}
#workskin .tweets .tweet{background:#fff;border:1px solid #eff3f4;border-radius:16px;padding:12px 16px;margin:0 0 12px 0;position:relative;box-sizing:border-box;transition:background-color 0.2s;}
#workskin .tweets .tweet:hover{background:#f7f9f9;}
#workskin .tweet img.avatar{width:40px;height:40px;border-radius:50%;float:left;margin:0 12px 0 0;object-fit:cover;}
#workskin .tweet .head{display:flex;align-items:center;gap:4px;font-size:15px;line-height:20px;margin-bottom:2px;}
#workskin .tweet .name{font-weight:700;color:#0f1419;}
#workskin .tweet .verified-badge{width:18px;height:18px;display:inline-block;vertical-align:middle;margin-left:2px;}
#workskin .tweet .handle{color:#536471;font-weight:400;font-size:15px;}
#workskin .tweet .handle:before{content:'·';margin:0 4px;}
#workskin .tweet .twitter-logo{width:18px;height:18px;margin-left:auto;opacity:0.6;}
#workskin .tweet .body{clear:both;margin-top:4px;font-size:15px;line-height:20px;color:#0f1419;word-wrap:break-word;}
#workskin .tweet .body .hashtag{color:#1d9bf0;font-weight:400;}
#workskin .tweet .time-line{margin-top:12px;font-size:15px;color:#536471;padding-bottom:12px;border-bottom:1px solid #eff3f4;}
#workskin .tweet .metrics{display:flex;gap:20px;margin-top:12px;padding-top:12px;font-size:14px;color:#536471;border-top:1px solid #eff3f4;}
#workskin .tweet .metric{display:inline-flex;align-items:center;gap:4px;cursor:pointer;transition:color 0.2s;}
#workskin .tweet .metric-icon{width:18px;height:18px;vertical-align:middle;opacity:0.6;}
#workskin .tweet .metric.replies:hover{color:#1d9bf0;}
#workskin .tweet .metric.retweets:hover{color:#00ba7c;}
#workskin .tweet .metric.likes:hover{color:#f91880;}
#workskin .tweet .context{margin-top:12px;font-size:13px;color:#536471;padding:12px;background:#f7f9f9;border-radius:8px;}
#workskin .tweet .quote{border:1px solid #eff3f4;border-radius:12px;padding:12px;margin-top:12px;transition:background-color 0.2s;}
#workskin .tweet .quote:hover{background:#f7f9f9;}
#workskin .tweet .quote-head{display:flex;align-items:center;gap:4px;font-size:14px;line-height:16px;margin-bottom:4px;}
#workskin .tweet .quote-avatar{width:20px;height:20px;border-radius:50%;object-fit:cover;}
#workskin .tweet .quote-verified-badge{width:16px;height:16px;display:inline-block;vertical-align:middle;margin-left:2px;}
#workskin .tweet .quote-handle{color:#536471;font-weight:400;font-size:14px;}
#workskin .tweet .quote-body{margin-top:4px;font-size:15px;line-height:20px;color:#0f1419;}
#workskin .tweet .quote-image{width:100%;height:auto;border-radius:12px;margin-top:12px;border:1px solid #eff3f4;}
#workskin .tweets .wm{margin-top:12px;font-size:10px;opacity:0.5;text-align:center;}
#workskin .link{text-decoration:none;color:#1d9bf0;}
#workskin .visually-hidden{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;}`;
}

function buildGoogleCSS(maxWidth: number): string {
  return `#workskin .chat{width:90%;min-width:200px;max-width:${maxWidth}px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;box-sizing:border-box;padding:20px 0;}
#workskin .logo{text-align:center;margin:0 0 24px 0;font-weight:400;font-size:48px;font-family:"Product Sans",Arial,sans-serif;line-height:1;letter-spacing:-0.5px;}
#workskin .logo.old{font-family:"Cardo","Garamond",serif;}
#workskin .logo.naver{font-family:"Maven Pro",Verdana,sans-serif;}
#workskin .naver-green{color:#2DB400;}
#workskin .blue{color:#4285F4;}#workskin .red{color:#EA4335;}#workskin .yellow{color:#FBBC04;}#workskin .green{color:#34A853;}
#workskin .search-wrap{margin-top:20px;max-width:584px;margin-left:auto;margin-right:auto;}
#workskin .search-container{background:#fff;border:1px solid #dfe1e5;border-radius:24px;box-shadow:0 1px 6px rgba(32,33,36,0.28);overflow:hidden;}
#workskin .search-container .search-bar{padding:13px 20px;font-size:16px;color:#202124;line-height:1.5;border-bottom:1px solid #e8eaed;}
#workskin .search-bar-solo{background:#fff;border:1px solid #dfe1e5;border-radius:24px;padding:13px 20px;font-size:16px;color:#202124;line-height:1.5;box-shadow:0 1px 6px rgba(32,33,36,0.28);}
#workskin .suggest-box{padding:8px 0;}
#workskin .suggest-item{padding:8px 16px;font-size:14px;line-height:1.5;color:#202124;}
#workskin .suggest-item:hover{background:#f8f9fa;}
#workskin .suggest-item b,#workskin .suggest-item strong{font-weight:700;color:#202124;}
#workskin .search-stats{margin:16px 0 0 12px;color:#70757a;font-size:14px;}
#workskin .search-dym{margin:12px 0 0 12px;font-size:14px;line-height:1.5;}
#workskin .search-dym1{color:#70757a;}
#workskin .search-dym2{color:#1a0dab;font-weight:400;text-decoration:none;cursor:pointer;}
#workskin .search-dym2:hover{text-decoration:underline;}
#workskin .wm{margin-top:24px;font-size:10px;opacity:0.5;text-align:center;}`;
}

function buildInstagramCSS(maxWidth: number): string {
  return `#workskin .chat{width:90%;max-width:${maxWidth}px;min-width:200px;margin:0 auto;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;box-sizing:border-box;}
#workskin .inst{max-width:400px;background:#fff;border:1px solid #dbdbdb;border-radius:8px;overflow:hidden;margin:0 auto;box-sizing:border-box;}
#workskin .instHeader{display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid #efefef;}
#workskin .instAvatar{width:32px;height:32px;border-radius:50%;object-fit:cover;}
#workskin .instUser{font-size:14px;font-weight:600;color:#262626;}
#workskin .instLocation{font-size:12px;color:#737373;margin-left:auto;}
#workskin .instLocation .location-icon{width:12px;height:12px;vertical-align:middle;margin-right:2px;}
#workskin .instImage{width:100%;display:block;background:#fafafa;}
#workskin .instContent{padding:12px 16px;}
#workskin .instLikes{font-size:14px;font-weight:600;color:#262626;margin-bottom:8px;}
#workskin .instCaption{font-size:14px;color:#262626;line-height:1.4;margin-bottom:4px;}
#workskin .instCaption b{font-weight:600;}
#workskin .instComments{font-size:14px;color:#737373;margin-top:4px;margin-bottom:4px;}
#workskin .instTime{font-size:10px;color:#737373;text-transform:uppercase;letter-spacing:0.2px;margin-top:8px;padding-top:8px;border-top:1px solid #efefef;}
#workskin .wm{margin-top:12px;font-size:10px;opacity:0.5;text-align:center;}`;
}

function buildDiscordCSS(maxWidth: number, dark: boolean): string {
  const bg = dark ? '#2B2D31' : '#FFFFFF';
  const text = dark ? '#DBDEE1' : '#2E3338';
  const meta = dark ? '#949BA4' : '#5865F2';
  const serverText = dark ? '#949BA4' : '#737373';
  return `#workskin .chat.dc-wrap{width:90%;max-width:${maxWidth}px;min-width:200px;margin:0 auto;font-family:Arial,Helvetica,sans-serif;background:${bg};padding:12px 0;border-radius:6px;box-sizing:border-box;}
#workskin .dc-header{font-size:14px;font-weight:600;padding:0 16px 8px 16px;color:${text};border-bottom:1px solid ${dark?'#1f2124':'#e3e5e8'};margin-bottom:8px;}
#workskin .dc-header .dc-server{color:${serverText};font-size:12px;margin-right:8px;font-weight:400;}
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
  
  // iOS Mode Override
  let senderColor = s.senderColor;
  let receiverColor = s.receiverColor;
  let bubbleOpacity = s.bubbleOpacity;
  
  if (project.template === 'ios') {
    if (s.iosMode === 'sms') {
      senderColor = '#34C759'; // Green
      receiverColor = '#E9E9EB';
      bubbleOpacity = 1.0;
    } else {
      // Default to iMessage Blue
      senderColor = '#007AFF';
      receiverColor = '#E9E9EB';
      bubbleOpacity = 1.0;
    }
  }

  const senderBg = hexToRgba(senderColor, bubbleOpacity);
  const recvBg = hexToRgba(receiverColor, bubbleOpacity);
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
