
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../App';
import { mockApi } from '../services/mockBackend';
import { Chat, User, Story, ChatType } from '../types';

const Sidebar: React.FC = () => {
  const { authState, activeChat, setActiveChat, logout, toggleDarkMode, isDarkMode, setViewingStory, setShowProfileModal } = useApp();
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'all' | 'groups' | 'channels'>('all');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const fetchData = async () => {
    const [fetchedChats, fetchedUsers, fetchedStories] = await Promise.all([
      mockApi.getChats(),
      mockApi.getUsers(),
      mockApi.getStories()
    ]);
    setChats(fetchedChats);
    setUsers(fetchedUsers);
    setStories(fetchedStories);
  };

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    mockApi.on('message_received', handleUpdate);
    mockApi.on('refresh', handleUpdate);
    return () => {
      mockApi.off('message_received', handleUpdate);
      mockApi.off('refresh', handleUpdate);
    };
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedMembers.length === 0) return;
    await mockApi.createGroup(newGroupName, selectedMembers);
    setNewGroupName('');
    setSelectedMembers([]);
    setShowNewGroup(false);
  };

  const handlePostStory = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        mockApi.postStory(url, 'image');
      }
    };
    input.click();
  };

  const filteredChats = useMemo(() => {
    return chats.filter(chat => {
      const otherUser = users.find(u => chat.members.includes(u.id) && u.id !== authState.user?.id);
      const matchesSearch = (chat.name || otherUser?.displayName || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (view === 'all') return true;
      if (view === 'groups') return chat.type === ChatType.GROUP;
      if (view === 'channels') return chat.type === ChatType.CHANNEL;
      return true;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [chats, users, searchQuery, view, authState.user]);

  return (
    <aside className="w-full md:w-[380px] flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-hidden relative">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div onClick={() => setShowProfileModal(true)} className="relative cursor-pointer group">
            <img src={authState.user?.avatarUrl} className="w-10 h-10 rounded-full border-2 border-blue-500 p-0.5 object-cover" alt="Me" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tighter dark:text-white">ZapChat</h2>
          </div>
        </div>
        <div className="flex gap-1">
           <button onClick={() => setShowNewGroup(true)} className="p-2 text-slate-500 hover:text-blue-500" title="New Group"><i className="fa-solid fa-users-rectangle"></i></button>
           <button onClick={toggleDarkMode} className="p-2 text-slate-500 hover:text-blue-500"><i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i></button>
        </div>
      </div>

      {/* Stories Bar */}
      <div className="p-4 flex gap-4 overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
        <div onClick={handlePostStory} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer">
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-blue-500 transition-colors">
            <i className="fa-solid fa-plus"></i>
          </div>
          <span className="text-[9px] font-bold uppercase text-slate-400">Add</span>
        </div>
        {stories.map(story => {
          const user = users.find(u => u.id === story.userId);
          return (
            <div key={story.id} onClick={() => setViewingStory(story)} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group">
              <div className="w-14 h-14 rounded-full border-2 border-blue-500 p-0.5 transition-all group-hover:rotate-6">
                <img src={user?.avatarUrl} className="w-full h-full rounded-full object-cover" alt="Story" />
              </div>
              <span className="text-[10px] font-bold truncate w-14 text-center">{user?.displayName.split(' ')[0]}</span>
            </div>
          );
        })}
      </div>

      {/* Filters & Search */}
      <div className="px-4 py-3 space-y-3">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input type="text" placeholder="Search chats..." className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all', 'groups', 'channels'].map((tab) => (
            <button key={tab} onClick={() => setView(tab as any)} className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === tab ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.map(chat => {
          const otherUser = users.find(u => chat.members.includes(u.id) && u.id !== authState.user?.id);
          const name = chat.name || otherUser?.displayName || 'Unknown';
          const isActive = activeChat?.id === chat.id;

          return (
            <div key={chat.id} onClick={() => setActiveChat(chat)} onContextMenu={(e) => { e.preventDefault(); mockApi.pinChat(chat.id, !chat.isPinned); }} className={`px-4 py-3 flex items-center gap-3 cursor-pointer border-l-4 transition-all relative ${isActive ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 border-transparent'}`}>
              <div className="relative shrink-0">
                <img src={chat.avatarUrl || otherUser?.avatarUrl} className="w-12 h-12 rounded-full object-cover" alt="Chat" />
                {otherUser?.isOnline && <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h4 className={`font-bold text-sm truncate ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>{name}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{chat.lastMessage ? new Date(chat.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate italic">
                    {chat.lastMessage?.content || 'No messages'}
                  </p>
                  {chat.isPinned && <i className="fa-solid fa-thumbtack text-[10px] text-slate-400 ml-2"></i>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="absolute inset-0 z-40 bg-white dark:bg-slate-900 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 flex items-center gap-4 border-b dark:border-slate-800">
             <button onClick={() => setShowNewGroup(false)} className="p-2"><i className="fa-solid fa-arrow-left"></i></button>
             <h3 className="font-bold">New Group</h3>
          </div>
          <div className="p-4">
             <input type="text" placeholder="Group Name" className="w-full p-3 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 border-none focus:ring-2 focus:ring-blue-500" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
             <p className="text-xs font-bold text-slate-400 uppercase mb-2">Select Members</p>
             <div className="space-y-2">
               {users.filter(u => u.id !== authState.user?.id).map(u => (
                 <div key={u.id} onClick={() => setSelectedMembers(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id])} className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer ${selectedMembers.includes(u.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50'}`}>
                    <img src={u.avatarUrl} className="w-10 h-10 rounded-full" />
                    <span className="flex-1 text-sm">{u.displayName}</span>
                    <input type="checkbox" checked={selectedMembers.includes(u.id)} readOnly className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                 </div>
               ))}
             </div>
          </div>
          <div className="mt-auto p-4 border-t dark:border-slate-800">
             <button onClick={handleCreateGroup} disabled={!newGroupName || selectedMembers.length === 0} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50">Create Group</button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
