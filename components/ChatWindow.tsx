
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../App';
import { mockApi } from '../services/mockBackend';
import { Chat, Message, User, MessageType } from '../types';

const ChatWindow: React.FC<{ chat: Chat }> = ({ chat }) => {
  const { authState, setActiveCall, setSidebarOpen } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const load = async () => {
    const [allMsgs, allUsers] = await Promise.all([mockApi.getMessages(chat.id), mockApi.getUsers()]);
    setMessages(allMsgs);
    setUsers(allUsers);
  };

  useEffect(() => {
    load();
    const handleMsg = (m: Message) => { if (m.chatId === chat.id) setMessages(p => [...p, m]); };
    const handleUpd = (m: Message) => { if (m.chatId === chat.id) setMessages(p => p.map(msg => msg.id === m.id ? m : msg)); };
    const handleTyping = (d: any) => { if (d.chatId === chat.id) setIsTyping(d.isTyping ? d.userId : null); };
    
    mockApi.on('message_received', handleMsg);
    mockApi.on('message_updated', handleUpd);
    mockApi.on('typing', handleTyping);
    mockApi.on('refresh', load);
    return () => {
      mockApi.off('message_received', handleMsg);
      mockApi.off('message_updated', handleUpd);
      mockApi.off('typing', handleTyping);
      mockApi.off('refresh', load);
    };
  }, [chat.id]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const handleSend = async (text: string = inputText, type: MessageType = MessageType.TEXT) => {
    if (!text.trim() && type === MessageType.TEXT) return;
    await mockApi.sendMessage(chat.id, text, type, replyingTo?.id);
    setInputText('');
    setReplyingTo(null);
  };

  const handleFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const url = URL.createObjectURL(file);
        handleSend(url, file.type.startsWith('image') ? MessageType.IMAGE : MessageType.FILE);
      }
    };
    input.click();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        handleSend(url, MessageType.VOICE);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setIsRecording(true);
    } catch (err) { console.error("Mic error", err); }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  // Fix: useMemo is now imported from react
  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    return messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [messages, searchQuery]);

  const otherUser = users.find(u => chat.members.includes(u.id) && u.id !== authState.user?.id);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-slate-500 hover:text-blue-500"><i className="fa-solid fa-arrow-left"></i></button>
          <img src={chat.avatarUrl || otherUser?.avatarUrl} className="w-10 h-10 rounded-full object-cover" alt="Chat" />
          <div className="min-w-0">
            <h3 className="font-black text-sm truncate">{chat.name || otherUser?.displayName}</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">
              {isTyping ? <span className="text-blue-500 animate-pulse">Typing...</span> : (otherUser?.isOnline ? 'Online' : 'Offline')}
            </p>
          </div>
        </div>
        
        {showSearch && (
          <div className="flex-1 max-w-xs mx-4 animate-in slide-in-from-right duration-200">
            <input type="text" placeholder="Search in chat..." className="w-full bg-slate-100 dark:bg-slate-800 border-none py-1.5 px-3 rounded-lg text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} autoFocus />
          </div>
        )}

        <div className="flex gap-1 shrink-0">
           <button onClick={() => setShowSearch(!showSearch)} className={`p-2.5 ${showSearch ? 'text-blue-500' : 'text-slate-500'}`}><i className="fa-solid fa-magnifying-glass"></i></button>
           <button onClick={() => setActiveCall({ id: 'n', participants: [authState.user!.id, otherUser!.id], type: 'video', status: 'ringing', startTime: '' })} className="p-2.5 text-slate-500 hover:text-blue-500"><i className="fa-solid fa-video"></i></button>
           <button className="p-2.5 text-slate-500 hover:text-blue-500"><i className="fa-solid fa-circle-info"></i></button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.map((m, idx) => {
          const isMe = m.senderId === authState.user?.id;
          if (m.isDeleted) return <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}><div className="bg-slate-200 dark:bg-slate-800 text-[10px] px-3 py-1 rounded-full italic opacity-50">Deleted</div></div>;
          
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
              <div className={`max-w-[85%] sm:max-w-[70%] group relative`}>
                <div className={`relative p-3 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none'}`}>
                  {m.messageType === MessageType.IMAGE ? (
                    <img src={m.content} className="max-w-full rounded-lg mb-1" />
                  ) : m.messageType === MessageType.VOICE ? (
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <button className="text-white"><i className="fa-solid fa-play"></i></button>
                      <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden"><div className="w-1/3 h-full bg-white"></div></div>
                      <i className="fa-solid fa-microphone text-[10px]"></i>
                    </div>
                  ) : (
                    <span>{m.content}</span>
                  )}
                  
                  <div className="flex justify-end text-[9px] mt-1 opacity-70">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-end gap-2 max-w-6xl mx-auto">
          {isRecording ? (
            <div className="flex-1 bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl flex items-center justify-between animate-pulse">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                 <span className="text-sm font-bold text-red-600">Recording Voice...</span>
               </div>
               <button onClick={stopRecording} className="text-red-600 font-bold px-4 py-1 hover:bg-red-100 rounded-lg">STOP</button>
            </div>
          ) : (
            <>
              <button onClick={handleFile} className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-500 hover:text-blue-500 transition-all"><i className="fa-solid fa-paperclip"></i></button>
              <div className="flex-1 relative group">
                 <textarea value={inputText} onChange={(e) => { setInputText(e.target.value); mockApi.emit('typing', {chatId: chat.id, userId: authState.user?.id, isTyping: e.target.value.length > 0}); }} placeholder="Message..." className="w-full bg-slate-100 dark:bg-slate-800 rounded-2xl py-3.5 px-4 pr-12 text-sm focus:ring-2 focus:ring-blue-600 border-none resize-none" rows={1} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} />
              </div>
              {inputText.trim() ? (
                <button onClick={() => handleSend()} className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg transition-all active:scale-95"><i className="fa-solid fa-paper-plane"></i></button>
              ) : (
                <button onClick={startRecording} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition-all active:scale-95"><i className="fa-solid fa-microphone"></i></button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
