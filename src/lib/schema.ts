export type Attachment = { type: 'image'; url: string; alt?: string };
export interface Message {
  id: string;
  sender: string;
  avatarUrl?: string;
  content: string; // raw user text (sanitized before emit)
  timestamp?: string;
  outgoing: boolean; // true = author perspective sender bubble
  attachments?: Attachment[];
}
export interface SkinSettings {
  bubbleOpacity: number; // 0..1
  senderColor: string; // hex
  receiverColor: string; // hex
  fontFamily: string;
  maxWidthPx: number;
  useDarkNeutral: boolean;
  watermark: boolean;
}
export interface SkinProject {
  id: string;
  template: 'ios' | 'android' | 'note' | 'twitter' | 'google';
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
