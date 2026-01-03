
import { User, Chat, Message, MessageType, ChatType, Story, Call } from '../types';

const STORAGE_KEYS = {
  USERS: 'zapchat_users',
  CHATS: 'zapchat_chats',
  MESSAGES: 'zapchat_messages',
  CURRENT_USER: 'zapchat_current_user',
  STORIES: 'zapchat_stories',
  BLOCKED: 'zapchat_blocked_users'
};

const MOCK_USERS: User[] = [
  { id: 'u1', username: 'alex_dev', displayName: 'Alex Rivers', email: 'alex@example.com', avatarUrl: 'https://picsum.photos/id/64/200/200', statusMessage: 'Building the future.', isOnline: true, lastSeen: new Date().toISOString(), isPremium: true },
  { id: 'u2', username: 'sarah_m', displayName: 'Sarah Miller', email: 'sarah@example.com', avatarUrl: 'https://picsum.photos/id/65/200/200', statusMessage: 'At the gym 🏋️‍♀️', isOnline: false, lastSeen: new Date(Date.now() - 3600000).toISOString() },
  { id: 'u3', username: 'jason_k', displayName: 'Jason Knight', email: 'jason@example.com', avatarUrl: 'https://picsum.photos/id/66/200/200', statusMessage: 'Available', isOnline: true, lastSeen: new Date().toISOString() },
  { id: 'u4', username: 'zap_news', displayName: 'ZapChat News', email: 'news@zapchat.com', avatarUrl: 'https://picsum.photos/id/60/200/200', statusMessage: 'Official Channel', isOnline: true, lastSeen: new Date().toISOString() }
];

class MockBackend {
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.init();
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.MESSAGES || e.key === STORAGE_KEYS.CHATS || e.key === STORAGE_KEYS.STORIES) {
        this.emit('refresh', null);
      }
    });
  }

  private init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
    if (!localStorage.getItem(STORAGE_KEYS.CHATS)) {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify([
        { id: 'c1', type: ChatType.DIRECT, members: ['u1', 'u2'], createdBy: 'system', unreadCount: 0, isPinned: false },
        { id: 'c2', type: ChatType.CHANNEL, name: 'ZapChat Official', members: ['u1', 'u2', 'u3', 'u4'], createdBy: 'u4', unreadCount: 5, avatarUrl: 'https://picsum.photos/id/60/200/200', isPinned: false }
      ]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BLOCKED)) localStorage.setItem(STORAGE_KEYS.BLOCKED, JSON.stringify([]));
  }

  async login(email: string): Promise<User> {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const user = users.find((u: User) => u.email === email);
    if (!user) throw new Error('User not found');
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  }

  // Fix: Add logout method to MockBackend
  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Fix: Add updateProfile method to MockBackend
  async updateProfile(data: Partial<User>) {
    const user = this.getCurrentUser();
    if (!user) return;
    const updatedUser = { ...user, ...data };
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const idx = users.findIndex((u: User) => u.id === user.id);
    if (idx !== -1) {
      users[idx] = updatedUser;
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      this.emit('profile_updated', updatedUser);
      this.emit('refresh', null);
    }
  }

  async createGroup(name: string, memberIds: string[]) {
    const user = this.getCurrentUser();
    if (!user) return;
    const chats = await this.getChats();
    const newGroup: Chat = {
      id: Math.random().toString(36).substr(2, 9),
      type: ChatType.GROUP,
      name,
      members: [user.id, ...memberIds],
      createdBy: user.id,
      unreadCount: 0,
      avatarUrl: `https://picsum.photos/seed/${name}/200/200`
    };
    chats.push(newGroup);
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    this.emit('refresh', null);
    return newGroup;
  }

  async pinChat(chatId: string, pinned: boolean) {
    const chats = await this.getChats();
    const idx = chats.findIndex(c => c.id === chatId);
    if (idx !== -1) {
      chats[idx].isPinned = pinned;
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
      this.emit('refresh', null);
    }
  }

  async postStory(contentUrl: string, type: 'image' | 'video') {
    const user = this.getCurrentUser();
    if (!user) return;
    const stories = await this.getStories();
    const newStory: Story = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      contentUrl,
      type,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      viewers: []
    };
    stories.push(newStory);
    localStorage.setItem(STORAGE_KEYS.STORIES, JSON.stringify(stories));
    this.emit('refresh', null);
  }

  async sendMessage(chatId: string, content: string, type: MessageType = MessageType.TEXT, replyToId?: string): Promise<Message> {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Unauthorized');
    const msg: Message = { id: Math.random().toString(36).substr(2, 9), chatId, senderId: user.id, content, messageType: type, isEdited: false, createdAt: new Date().toISOString(), reactions: {}, replyToId };
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    all.push(msg);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(all));
    this.updateChatLastMessage(chatId, msg);
    this.emit('message_received', msg);
    return msg;
  }

  private updateChatLastMessage(chatId: string, msg: Message) {
    const chats = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]');
    const idx = chats.findIndex((c: Chat) => c.id === chatId);
    if (idx !== -1) {
      chats[idx].lastMessage = msg;
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    }
  }

  async getChats(): Promise<Chat[]> { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHATS) || '[]'); }
  async getMessages(chatId: string): Promise<Message[]> { return (JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]')).filter((m: Message) => m.chatId === chatId); }
  async getUsers(): Promise<User[]> { return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'); }
  async getStories(): Promise<Story[]> { 
    const stories = JSON.parse(localStorage.getItem(STORAGE_KEYS.STORIES) || '[]');
    return stories.filter((s: Story) => new Date(s.expiresAt) > new Date());
  }

  on(event: string, callback: Function) {
    const evs = this.listeners.get(event) || [];
    evs.push(callback);
    this.listeners.set(event, evs);
  }
  off(event: string, callback: Function) {
    const evs = this.listeners.get(event) || [];
    this.listeners.set(event, evs.filter(l => l !== callback));
  }
  emit(event: string, data: any) { (this.listeners.get(event) || []).forEach(l => l(data)); }
}

export const mockApi = new MockBackend();
