
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  FILE = 'file',
  VOICE = 'voice',
  LOCATION = 'location',
  POLL = 'poll',
  STICKER = 'sticker'
}

export enum ChatType {
  DIRECT = 'direct',
  GROUP = 'group',
  CHANNEL = 'channel'
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  statusMessage?: string;
  isOnline: boolean;
  lastSeen: string;
  isPremium?: boolean;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  fileUrl?: string;
  fileName?: string;
  replyToId?: string;
  isEdited: boolean;
  isDeleted?: boolean;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  reactions: Record<string, string[]>; 
  metadata?: any;
}

export interface Chat {
  id: string;
  type: ChatType;
  name?: string;
  avatarUrl?: string;
  members: string[]; 
  createdBy: string;
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  isArchived?: boolean;
  folderId?: string;
}

export interface Story {
  id: string;
  userId: string;
  contentUrl: string;
  type: 'image' | 'video';
  createdAt: string;
  expiresAt: string;
  viewers: string[];
}

export interface Call {
  id: string;
  participants: string[];
  type: 'voice' | 'video';
  status: 'ongoing' | 'ended' | 'ringing';
  startTime: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}
