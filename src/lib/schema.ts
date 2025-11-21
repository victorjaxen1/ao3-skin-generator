export type Attachment = { type: 'image'; url: string; alt?: string };
export interface Message {
  id: string;
  sender: string;
  avatarUrl?: string;
  content: string; // raw user text (sanitized before emit)
  timestamp?: string;
  outgoing: boolean; // true = author perspective sender bubble
  attachments?: Attachment[];
  roleColor?: string; // Discord role/name color
  // Chat-specific enhancements
  status?: 'sending' | 'sent' | 'delivered' | 'read'; // message delivery status
  reaction?: string; // emoji reaction to this message
}
export interface SkinSettings {
  bubbleOpacity: number; // 0..1
  senderColor: string; // hex
  receiverColor: string; // hex
  fontFamily: string;
  maxWidthPx: number;
  useDarkNeutral: boolean;
  watermark: boolean;
  // Twitter specific settings
  twitterHandle?: string;
  twitterVerified?: boolean;
  twitterLikes?: number;
  twitterRetweets?: number;
  twitterReplies?: number;
  twitterContextLinkText?: string;
  twitterShowMetrics?: boolean;
  twitterTimestamp?: string; // full date/time line (e.g., "3:09 PM · 5 May 2014")
  // Quote Tweet (embedded) optional block
  twitterQuoteEnabled?: boolean;
  twitterQuoteAvatar?: string;
  twitterQuoteName?: string;
  twitterQuoteHandle?: string;
  twitterQuoteVerified?: boolean;
  twitterQuoteText?: string;
  twitterQuoteImage?: string;
  // Google specific settings
  googleQuery?: string; // the main search query
  googleSuggestions?: string[]; // autocomplete dropdown suggestions
  googleShowStats?: boolean; // toggle to show result statistics
  googleResultsCount?: string; // e.g. "About 24,040,000,000 results"
  googleResultsTime?: string; // e.g. "0.56 seconds"
  googleShowDidYouMean?: boolean; // toggle for correction
  googleDidYouMean?: string; // correction term (Captain Jack Sparrow)
  googleEngineVariant?: 'google' | 'google-old' | 'naver';
  // Note specific settings
  noteStyle?: 'system' | 'document' | 'letter' | 'simple'; // different note types
  noteAlignment?: 'center' | 'left' | 'right';
  // Instagram specific
  instagramUsername?: string; // direct username field (not override)
  instagramAvatarUrl?: string; // dedicated avatar for post
  instagramImageUrl?: string; // main post image
  instagramCaption?: string; // post caption text
  instagramLocation?: string; // location tag (e.g., "Paris, France")
  instagramShowLikes?: boolean; // toggle to show likes
  instagramLikes?: number;
  instagramShowComments?: boolean; // toggle to show comment count
  instagramCommentsCount?: number;
  instagramTimestamp?: string; // natural language: "2 hours ago", "May 5"
  // Discord specific
  discordChannelName?: string;
  discordServerName?: string; // new: server context
  discordShowHeader?: boolean;
  discordDarkMode?: boolean;
  discordRolePresets?: Array<{name: string; color: string}>; // new: save common roles
  // iOS/Android chat enhancements
  iosMode?: 'imessage' | 'sms'; // Toggle between Blue and Green
  chatContactName?: string; // "Conversation with..." header
  chatShowTyping?: boolean; // show typing indicator
  chatTypingName?: string; // who is typing
  iosShowDelivered?: boolean; // iOS "Delivered" indicator
  iosShowHeader?: boolean; // "To: Contact" header
  androidShowStatus?: boolean; // "Online" / "Last seen"
  androidStatusText?: string; // custom status text
  androidCheckmarks?: boolean; // show ✓✓ checkmarks
}
export interface SkinProject {
  id: string;
  template: 'ios' | 'android' | 'note' | 'twitter' | 'google' | 'instagram' | 'discord';
  settings: SkinSettings;
  messages: Message[];
}

export const defaultProject = (): SkinProject => ({
  id: crypto.randomUUID(),
  template: 'ios',
  settings: {
    bubbleOpacity: 0.9,
    senderColor: '#1d9bf0',
    receiverColor: '#ececec',
    fontFamily: 'Arial, Helvetica, sans-serif',
    maxWidthPx: 400,
    useDarkNeutral: true,
    watermark: true,
    twitterHandle: '',
    twitterVerified: false,
    twitterLikes: 0,
    twitterRetweets: 0,
    twitterReplies: 0,
    twitterContextLinkText: 'People are talking about this',
    twitterShowMetrics: true,
    twitterTimestamp: '',
    twitterQuoteEnabled: false,
    twitterQuoteAvatar: '',
    twitterQuoteName: '',
    twitterQuoteHandle: '',
    twitterQuoteVerified: false,
    twitterQuoteText: '',
    twitterQuoteImage: '',
    googleQuery: '',
    googleSuggestions: [],
    googleShowStats: false,
    googleResultsCount: '',
    googleResultsTime: '',
    googleShowDidYouMean: false,
    googleDidYouMean: '',
    googleEngineVariant: 'google',
    noteStyle: 'system',
    noteAlignment: 'center',
    instagramUsername: '',
    instagramAvatarUrl: '',
    instagramImageUrl: '',
    instagramCaption: '',
    instagramLocation: '',
    instagramShowLikes: false,
    instagramLikes: 0,
    instagramShowComments: false,
    instagramCommentsCount: 0,
    instagramTimestamp: '',
    discordChannelName: 'general',
    discordServerName: '',
    discordShowHeader: true,
    discordDarkMode: true,
    discordRolePresets: [
      { name: 'Admin', color: '#ED4245' },
      { name: 'Moderator', color: '#5865F2' },
      { name: 'Member', color: '#B9BBBE' }
    ],
    chatContactName: '',
    chatShowTyping: false,
    chatTypingName: '',
    iosShowDelivered: false,
    iosShowHeader: false,
    androidShowStatus: false,
    androidStatusText: 'Online',
    androidCheckmarks: true,
  },
  messages: [
    {
      id: crypto.randomUUID(),
      sender: 'You',
      content: 'Where are you? i dont know but i know you are an idiot and i will mess you up if you dont keep quite',
      outgoing: true,
      timestamp: '10:15'
    },
    {
      id: crypto.randomUUID(),
      sender: 'Alice',
      content: 'On my way. lets see what you can actually do dickhead!!',
      outgoing: false,
      timestamp: '10:15'
    }
  ],
});
