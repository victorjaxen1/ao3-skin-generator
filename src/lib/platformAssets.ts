/**
 * Platform Asset URLs
 * Hosted on Cloudinary/imgbb for authentic platform icons and graphics
 * Replace these URLs with your own hosted assets
 */

export const PLATFORM_ASSETS = {
  twitter: {
    verifiedBadge: 'https://i.ibb.co/twitter-verified.png', // Blue checkmark
    logo: 'https://i.ibb.co/twitter-logo.png', // X/Twitter bird
    replyIcon: 'https://i.ibb.co/twitter-reply.png',
    retweetIcon: 'https://i.ibb.co/twitter-retweet.png',
    likeIcon: 'https://i.ibb.co/twitter-like.png',
  },
  instagram: {
    headerGradient: 'https://i.ibb.co/instagram-gradient.png', // Purple-pink gradient
    likeIcon: 'https://i.ibb.co/instagram-heart.png', // Red heart
    commentIcon: 'https://i.ibb.co/instagram-comment.png',
    locationPin: 'https://i.ibb.co/instagram-location.png',
    verifiedBadge: 'https://i.ibb.co/instagram-verified.png', // Blue checkmark
  },
  whatsapp: {
    checkmarkSent: 'https://i.ibb.co/whatsapp-check-grey.png', // Single grey check
    checkmarkDelivered: 'https://i.ibb.co/whatsapp-check-grey-double.png', // Double grey check
    checkmarkRead: 'https://i.ibb.co/whatsapp-check-blue-double.png', // Double blue check
    onlineIcon: 'https://i.ibb.co/whatsapp-online.png', // Green dot
  },
  ios: {
    messageIcon: 'https://i.ibb.co/ios-messages-icon.png', // Messages app icon
    bubbleTailBlue: 'https://i.ibb.co/ios-bubble-tail-blue.png', // Blue tail (PNG with transparency)
    bubbleTailGreen: 'https://i.ibb.co/ios-bubble-tail-green.png', // Green tail
    bubbleTailGrey: 'https://i.ibb.co/ios-bubble-tail-grey.png', // Grey tail
    deliveredIcon: 'https://i.ibb.co/ios-delivered.png',
  },
  discord: {
    logo: 'https://i.ibb.co/discord-logo.png',
    hashtagIcon: 'https://i.ibb.co/discord-hashtag.png',
    onlineStatus: 'https://i.ibb.co/discord-online.png', // Green circle
  },
  google: {
    // Google logo is already text-based CSS, keep as is
  }
};

/**
 * Placeholder/fallback assets if hosted images fail to load
 */
export const FALLBACK_TEXT = {
  twitter: {
    verified: '✓',
    bird: '🐦',
    reply: '↩',
    retweet: '🔁',
    like: '❤',
  },
  instagram: {
    like: '❤',
    comment: '💬',
    location: '📍',
    verified: '✓',
  },
  whatsapp: {
    checkSent: '✓',
    checkDelivered: '✓✓',
    checkRead: '✓✓',
  },
  ios: {
    delivered: 'Delivered',
  },
  discord: {
    hashtag: '#',
  },
};
