import React from 'react';

/* A single-weight, 24px outline icon set drawn for this product. Stroke-only so
 * icons inherit text colour and stay legible in both themes. */

export type IconName =
  | 'home' | 'money' | 'gov' | 'wallet' | 'user' | 'bell' | 'chevron' | 'chevron-left'
  | 'arrow-up' | 'arrow-down' | 'plus' | 'minus' | 'send' | 'scan' | 'card' | 'shield'
  | 'lock' | 'unlock' | 'fingerprint' | 'face' | 'check' | 'check-circle' | 'alert'
  | 'info' | 'x' | 'search' | 'settings' | 'globe' | 'moon' | 'sun' | 'doc' | 'folder'
  | 'upload' | 'share' | 'eye' | 'eye-off' | 'car' | 'heart' | 'briefcase' | 'receipt'
  | 'calendar' | 'clock' | 'trending-up' | 'pie' | 'bars' | 'basket' | 'cup' | 'bolt'
  | 'bag' | 'play' | 'swap' | 'dots' | 'key' | 'phone' | 'mail' | 'logout' | 'refresh'
  | 'external' | 'id-card' | 'qr' | 'camera' | 'star' | 'trash' | 'users' | 'activity'
  | 'database' | 'help' | 'flag' | 'building' | 'sparkle' | 'target' | 'download'
  | 'snowflake' | 'ticket' | 'link' | 'filter' | 'grid' | 'inbox' | 'trending-down' | 'pen'
  | 'history' | 'calculator';

const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="M3.5 10.4 12 3.8l8.5 6.6" /><path d="M5.5 9.4V19a1 1 0 0 0 1 1h3.2v-4.6h4.6V20h3.2a1 1 0 0 0 1-1V9.4" /></>,
  money: <><path d="M3.5 7.5h17a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-17a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z" /><circle cx="12" cy="12" r="2.6" /><path d="M6 12h.01M18 12h.01" /></>,
  gov: <><path d="M3.6 9.6 12 4.4l8.4 5.2" /><path d="M5.4 10.4V18M9.8 10.4V18M14.2 10.4V18M18.6 10.4V18" /><path d="M3.4 20.2h17.2" /></>,
  wallet: <><path d="M4 7.6h13.4a2.6 2.6 0 0 1 2.6 2.6v6.2a2.6 2.6 0 0 1-2.6 2.6H6.6A2.6 2.6 0 0 1 4 16.4V7.6Z" /><path d="M4 7.6a2 2 0 0 1 2-2h9.2" /><path d="M16.4 13.2h1.2" /></>,
  user: <><circle cx="12" cy="8.4" r="3.4" /><path d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6" /></>,
  bell: <><path d="M6.5 10.2a5.5 5.5 0 0 1 11 0c0 3.4.9 5 1.8 5.9H4.7c.9-.9 1.8-2.5 1.8-5.9Z" /><path d="M10 19a2.2 2.2 0 0 0 4 0" /></>,
  chevron: <path d="m9.5 5.5 6.4 6.5-6.4 6.5" />,
  'chevron-left': <path d="M14.5 5.5 8.1 12l6.4 6.5" />,
  'arrow-up': <><path d="M12 19V5.5" /><path d="m6.5 11 5.5-5.5L17.5 11" /></>,
  'arrow-down': <><path d="M12 5v13.5" /><path d="m17.5 13-5.5 5.5L6.5 13" /></>,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  minus: <path d="M5.5 12h13" />,
  send: <><path d="M20.5 3.8 3.9 10.2l6.6 2.9 2.9 6.6 7.1-15.9Z" /><path d="m10.5 13.1 4.4-4.4" /></>,
  scan: <><path d="M4 8.4V6a2 2 0 0 1 2-2h2.4M15.6 4H18a2 2 0 0 1 2 2v2.4M20 15.6V18a2 2 0 0 1-2 2h-2.4M8.4 20H6a2 2 0 0 1-2-2v-2.4" /><path d="M4.6 12h14.8" /></>,
  card: <><rect x="2.8" y="5.6" width="18.4" height="12.8" rx="2.4" /><path d="M2.8 10h18.4" /><path d="M6.4 14.6h3.2" /></>,
  shield: <><path d="M12 3.6 5 6.2v5.4c0 4.2 2.9 7.4 7 8.8 4.1-1.4 7-4.6 7-8.8V6.2L12 3.6Z" /><path d="m9.2 12 2 2 3.6-3.8" /></>,
  lock: <><rect x="4.8" y="10.4" width="14.4" height="9.4" rx="2.2" /><path d="M8.2 10.4V8a3.8 3.8 0 0 1 7.6 0v2.4" /></>,
  unlock: <><rect x="4.8" y="10.4" width="14.4" height="9.4" rx="2.2" /><path d="M8.2 10.4V8a3.8 3.8 0 0 1 7.2-1.6" /></>,
  fingerprint: <><path d="M12 4.2c-2.2 0-4.2 1.2-5.3 3" /><path d="M17.4 7.4A6.2 6.2 0 0 1 18.2 11c0 1.6-.3 3.6-1 5.6" /><path d="M8.4 19.4c1-1.9 1.5-4 1.4-6.1" /><path d="M12 8.2A3.6 3.6 0 0 0 8.4 12c0 2.6-.5 5-1.4 7.2" /><path d="M14.6 18.6c.6-1.9 1-4 1-6.6A3.6 3.6 0 0 0 12 8.2" /><path d="M11.8 20.2c.3-.9.6-1.8.8-2.8" /><path d="M4.6 14.4c.3-1.1.4-2.2.4-3.4a7 7 0 0 1 .4-2.3" /></>,
  face: <><rect x="3.8" y="3.8" width="16.4" height="16.4" rx="4.4" /><path d="M9 10.2v1M15 10.2v1" /><path d="M9.4 15.2a3.6 3.6 0 0 0 5.2 0" /></>,
  check: <path d="m5.5 12.6 4.2 4.2 8.8-9.6" />,
  'check-circle': <><circle cx="12" cy="12" r="8.4" /><path d="m8.4 12.2 2.6 2.6 4.6-5" /></>,
  alert: <><path d="M12 4.6 3.4 19.4h17.2L12 4.6Z" /><path d="M12 10v4.2M12 17h.01" /></>,
  info: <><circle cx="12" cy="12" r="8.4" /><path d="M12 11v5.2M12 8h.01" /></>,
  x: <path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6" />,
  search: <><circle cx="10.8" cy="10.8" r="6.2" /><path d="m15.4 15.4 4.2 4.2" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 14.2a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 3.5 13h-.2a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 10 3.5v-.2a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.3.9Z" /></>,
  globe: <><circle cx="12" cy="12" r="8.4" /><path d="M3.6 12h16.8" /><path d="M12 3.6c2.1 2.3 3.2 5.3 3.2 8.4S14.1 18.1 12 20.4c-2.1-2.3-3.2-5.3-3.2-8.4S9.9 5.9 12 3.6Z" /></>,
  moon: <path d="M20 14.4A8.4 8.4 0 0 1 9.6 4 8.4 8.4 0 1 0 20 14.4Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.6v2M12 19.4v2M2.6 12h2M19.4 12h2M5.4 5.4l1.4 1.4M17.2 17.2l1.4 1.4M18.6 5.4l-1.4 1.4M6.8 17.2l-1.4 1.4" /></>,
  doc: <><path d="M6 3.6h7.4L18.4 8.6V20a.8.8 0 0 1-.8.8H6a.8.8 0 0 1-.8-.8V4.4a.8.8 0 0 1 .8-.8Z" /><path d="M13.4 3.6v5h5" /><path d="M8.6 13h6.8M8.6 16.4h4.8" /></>,
  folder: <path d="M3.6 6.4a1 1 0 0 1 1-1h4l2 2.4h8.8a1 1 0 0 1 1 1v8.8a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1V6.4Z" />,
  upload: <><path d="M12 16.4V4.6" /><path d="m7.4 9 4.6-4.4L16.6 9" /><path d="M4.6 15.4v3a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2v-3" /></>,
  download: <><path d="M12 4.6v11.8" /><path d="m7.4 12 4.6 4.4L16.6 12" /><path d="M4.6 15.4v3a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2v-3" /></>,
  share: <><circle cx="17.6" cy="6" r="2.6" /><circle cx="6.4" cy="12" r="2.6" /><circle cx="17.6" cy="18" r="2.6" /><path d="m8.8 10.8 6.4-3.6M8.8 13.2l6.4 3.6" /></>,
  eye: <><path d="M2.6 12S6 6.4 12 6.4 21.4 12 21.4 12 18 17.6 12 17.6 2.6 12 2.6 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
  'eye-off': <><path d="M4 4.4 20 19.6" /><path d="M9.6 9.8A2.8 2.8 0 0 0 12 14.8c.7 0 1.4-.3 1.9-.7" /><path d="M6.6 7.4C4.2 8.9 2.6 12 2.6 12s3.4 5.6 9.4 5.6c1.5 0 2.8-.3 3.9-.9" /><path d="M18.2 15C20.3 13.5 21.4 12 21.4 12S18 6.4 12 6.4c-.6 0-1.2.1-1.7.2" /></>,
  car: <><path d="M4.4 15.6V12l1.8-4.4a1.6 1.6 0 0 1 1.5-1h8.6a1.6 1.6 0 0 1 1.5 1L19.6 12v3.6" /><path d="M4.4 12h15.2" /><path d="M4.4 15.6h15.2v1.8a.8.8 0 0 1-.8.8h-1.6a.8.8 0 0 1-.8-.8v-1M7.6 15.6v1a.8.8 0 0 1-.8.8H5.2a.8.8 0 0 1-.8-.8" /><path d="M7.6 13.8h.01M16.4 13.8h.01" /></>,
  heart: <path d="M12 19.6s-7.4-4.4-7.4-9.2A4 4 0 0 1 12 8.2a4 4 0 0 1 7.4 2.2c0 4.8-7.4 9.2-7.4 9.2Z" />,
  briefcase: <><rect x="3.4" y="7.6" width="17.2" height="11.8" rx="2" /><path d="M8.8 7.6V6a1.6 1.6 0 0 1 1.6-1.6h3.2A1.6 1.6 0 0 1 15.2 6v1.6" /><path d="M3.4 12.6h17.2" /></>,
  receipt: <><path d="M5.6 3.6h12.8v17.2l-2.6-1.6-2.6 1.6-2.6-1.6-2.4 1.6-2.6-1.6V3.6Z" /><path d="M8.8 8.4h6.4M8.8 12.2h6.4" /></>,
  calendar: <><rect x="3.6" y="5.4" width="16.8" height="15" rx="2.2" /><path d="M3.6 10h16.8M8.4 3.6v3.4M15.6 3.6v3.4" /></>,
  clock: <><circle cx="12" cy="12" r="8.4" /><path d="M12 7.4V12l3 1.8" /></>,
  'trending-up': <><path d="m3.6 16.4 5.4-5.4 3.4 3.4 7.8-7.8" /><path d="M15.4 6.6h4.8v4.8" /></>,
  'trending-down': <><path d="m3.6 7.6 5.4 5.4 3.4-3.4 7.8 7.8" /><path d="M15.4 17.4h4.8v-4.8" /></>,
  pie: <><path d="M12 3.6a8.4 8.4 0 1 0 8.4 8.4H12V3.6Z" /><path d="M14.6 3.9A8.4 8.4 0 0 1 20.1 9.4h-5.5V3.9Z" /></>,
  bars: <><path d="M5.4 20V13M12 20V4.6M18.6 20v-9.6" /></>,
  basket: <><path d="M3.4 9.6h17.2l-1.6 9.2a1.6 1.6 0 0 1-1.6 1.4H6.6A1.6 1.6 0 0 1 5 18.8L3.4 9.6Z" /><path d="m8 9.6 2.4-5.4M16 9.6l-2.4-5.4" /></>,
  cup: <><path d="M5.6 8.4h11v6.4a4.4 4.4 0 0 1-4.4 4.4h-2.2a4.4 4.4 0 0 1-4.4-4.4V8.4Z" /><path d="M16.6 10.2h1.6a2.2 2.2 0 0 1 0 4.4h-1.6" /><path d="M8 4v1.8M12 3.4v2.4" /></>,
  bolt: <path d="M13.4 3.4 5.6 13.4h5.2l-.8 7.2 8-10.2h-5.4l.8-7Z" />,
  bag: <><path d="M5.4 7.6h13.2l1 12.2H4.4l1-12.2Z" /><path d="M9 9.4V6.6a3 3 0 0 1 6 0v2.8" /></>,
  play: <><circle cx="12" cy="12" r="8.4" /><path d="m10.2 8.8 5.2 3.2-5.2 3.2V8.8Z" /></>,
  swap: <><path d="M4.6 8.6h12.8" /><path d="m14.4 5.6 3 3-3 3" /><path d="M19.4 15.4H6.6" /><path d="m9.6 12.4-3 3 3 3" /></>,
  dots: <><circle cx="6" cy="12" r="1.4" /><circle cx="12" cy="12" r="1.4" /><circle cx="18" cy="12" r="1.4" /></>,
  key: <><circle cx="8.4" cy="12" r="3.8" /><path d="M12.2 12h8.2l-1.8 2.4L16.8 12" /></>,
  phone: <><rect x="6.6" y="2.8" width="10.8" height="18.4" rx="2.6" /><path d="M10.6 18.4h2.8" /></>,
  mail: <><rect x="3.2" y="5.6" width="17.6" height="12.8" rx="2.2" /><path d="m3.8 7.4 8.2 5.6 8.2-5.6" /></>,
  logout: <><path d="M9.4 4.6H6.6a2 2 0 0 0-2 2v10.8a2 2 0 0 0 2 2h2.8" /><path d="M15.4 8.4 19 12l-3.6 3.6" /><path d="M19 12H9.6" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20.4 4.4v4.4H16" /></>,
  external: <><path d="M13.4 4.6h6v6" /><path d="M19.4 4.6 11 13" /><path d="M18 14.4v3.8a2 2 0 0 1-2 2H6.4a2 2 0 0 1-2-2V8.6a2 2 0 0 1 2-2h3.8" /></>,
  'id-card': <><rect x="2.8" y="5" width="18.4" height="14" rx="2.6" /><circle cx="8.6" cy="10.8" r="2.2" /><path d="M5.2 15.8c.4-1.6 1.7-2.4 3.4-2.4s3 .8 3.4 2.4" /><path d="M14.6 10h3.8M14.6 13.2h3.8" /></>,
  qr: <><rect x="3.6" y="3.6" width="6.4" height="6.4" rx="1.4" /><rect x="14" y="3.6" width="6.4" height="6.4" rx="1.4" /><rect x="3.6" y="14" width="6.4" height="6.4" rx="1.4" /><path d="M14 14h2.6v2.6H14zM17.8 17.8h2.6v2.6h-2.6zM14 20.4h1M20.4 14v1" /></>,
  camera: <><path d="M3.6 8.8a2 2 0 0 1 2-2h1.8l1.4-2.2h6.4l1.4 2.2h1.8a2 2 0 0 1 2 2v8.4a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2V8.8Z" /><circle cx="12" cy="13" r="3.4" /></>,
  star: <path d="m12 4 2.5 5.1 5.6.8-4 3.9 1 5.6-5.1-2.7-5 2.7 1-5.6-4.1-3.9 5.6-.8L12 4Z" />,
  trash: <><path d="M4.8 6.8h14.4" /><path d="M9.4 6.8V5.4a1.4 1.4 0 0 1 1.4-1.4h2.4a1.4 1.4 0 0 1 1.4 1.4v1.4" /><path d="M6.6 6.8 7.4 19a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3l.8-12.2" /></>,
  users: <><circle cx="9.4" cy="8.6" r="3.2" /><path d="M3.4 19.4c.5-3.2 3-5 6-5s5.5 1.8 6 5" /><path d="M15.4 5.8a3.2 3.2 0 0 1 0 6.2M17 14.8c2 .6 3.3 2.3 3.6 4.6" /></>,
  activity: <path d="M3.4 12.4h3.8l2.4-6.6 4 12.4 2.4-5.8h4.6" />,
  database: <><ellipse cx="12" cy="6.4" rx="7.6" ry="2.8" /><path d="M4.4 6.4v11.2c0 1.6 3.4 2.8 7.6 2.8s7.6-1.2 7.6-2.8V6.4" /><path d="M4.4 12c0 1.6 3.4 2.8 7.6 2.8s7.6-1.2 7.6-2.8" /></>,
  help: <><circle cx="12" cy="12" r="8.4" /><path d="M9.8 9.6a2.3 2.3 0 0 1 4.4.8c0 1.6-2.2 2-2.2 3.4" /><path d="M12 17h.01" /></>,
  flag: <><path d="M5.6 20.4V4.4" /><path d="M5.6 5.2h11.6l-2 3.4 2 3.4H5.6" /></>,
  building: <><rect x="4.6" y="3.6" width="14.8" height="16.8" rx="1.8" /><path d="M8.4 8h2M13.6 8h2M8.4 12h2M13.6 12h2M10.4 20.4v-3.8h3.2v3.8" /></>,
  sparkle: <><path d="m12 3.6 1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1-5.1-1.9 5.1-1.9L12 3.6Z" /><path d="M18.4 16.4l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" /></>,
  target: <><circle cx="12" cy="12" r="8.4" /><circle cx="12" cy="12" r="4.6" /><circle cx="12" cy="12" r="1" /></>,
  snowflake: <><path d="M12 3.4v17.2M4.6 7.8l14.8 8.4M19.4 7.8 4.6 16.2" /><path d="m9.4 5.4 2.6 2 2.6-2M9.4 18.6l2.6-2 2.6 2" /></>,
  ticket: <><path d="M4 8.4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.4a2.2 2.2 0 0 0 0 4.4v1.4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.4a2.2 2.2 0 0 0 0-4.4V8.4Z" /><path d="M13.6 6.4v11.2" /></>,
  link: <><path d="M10.4 13.6a3.6 3.6 0 0 0 5.2 0l2.6-2.6a3.7 3.7 0 0 0-5.2-5.2l-1.4 1.4" /><path d="M13.6 10.4a3.6 3.6 0 0 0-5.2 0l-2.6 2.6a3.7 3.7 0 0 0 5.2 5.2l1.4-1.4" /></>,
  filter: <path d="M3.8 5.6h16.4l-6.4 7.4v5.6l-3.6 1.8V13L3.8 5.6Z" />,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.6" /><rect x="13" y="4" width="7" height="7" rx="1.6" /><rect x="4" y="13" width="7" height="7" rx="1.6" /><rect x="13" y="13" width="7" height="7" rx="1.6" /></>,
  inbox: <><path d="M3.6 13.4 6 5.6a1.6 1.6 0 0 1 1.5-1.1h9a1.6 1.6 0 0 1 1.5 1.1l2.4 7.8v4.4a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2v-4.4Z" /><path d="M3.6 13.4h4.6a1 1 0 0 1 1 .8 2.8 2.8 0 0 0 5.6 0 1 1 0 0 1 1-.8h4.6" /></>,
  pen: <><path d="M14.6 4.8 19.2 9.4 8.4 20.2 3.6 20.6l.4-4.8Z" /><path d="M12.6 6.8 17.2 11.4" /></>,
  history: <><path d="M4.4 12a7.6 7.6 0 1 0 2.2-5.4" /><path d="M3.6 4.6v3.6h3.6" /><path d="M12 8v4.4l3 1.8" /></>,
  calculator: <><rect x="5.6" y="3.6" width="12.8" height="16.8" rx="1.8" /><path d="M8 7.2h8" /><path d="M8.2 11h.01M12 11h.01M15.8 11h.01M8.2 14.4h.01M12 14.4h.01M15.8 14.4h.01M8.2 17.8h.01M12 17.8h.01M15.8 17.8h.01" /></>,
};

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.6,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

/** The Nisos mark: the ribbon "N" over the Cyprus outline, on its navy card. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <img
      src="/icons/icon-512.png"
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, borderRadius: size * 0.22, display: 'block', flex: 'none' }}
    />
  );
}

export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <Logo size={size + 10} />
      <span style={{ font: `600 ${size}px/1 var(--font)`, letterSpacing: '-.02em' }}>Nisos</span>
    </span>
  );
}
