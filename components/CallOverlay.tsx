
import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Call, User } from '../types';
import { mockApi } from '../services/mockBackend';

interface CallOverlayProps {
  call: Call;
}

const CallOverlay: React.FC<CallOverlayProps> = ({ call }) => {
  const { authState, setActiveCall } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState(call.status);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    mockApi.getUsers().then(setUsers);
    
    let interval: any;
    if (status === 'ongoing') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    } else if (status === 'ringing') {
        // Auto answer for demo
        setTimeout(() => setStatus('ongoing'), 3000);
    }

    return () => clearInterval(interval);
  }, [status]);

  const otherUserId = call.participants.find(p => p !== authState.user?.id);
  const otherUser = users.find(u => u.id === otherUserId);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-2xl flex items-center justify-center animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-sm flex flex-col items-center text-white p-8">
        <div className="relative mb-12">
           <img src={otherUser?.avatarUrl} className="w-40 h-40 rounded-full object-cover ring-4 ring-blue-500/50" alt="Caller" />
           {call.type === 'video' && status === 'ongoing' && (
             <div className="absolute -bottom-4 -right-4 w-32 h-44 bg-slate-800 rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl">
                <img src={authState.user?.avatarUrl} className="w-full h-full object-cover grayscale" alt="Self" />
                <div className="absolute bottom-2 left-0 right-0 text-[10px] text-center font-bold">You</div>
             </div>
           )}
        </div>
        
        <h2 className="text-3xl font-black mb-2">{otherUser?.displayName}</h2>
        <div className="flex flex-col items-center">
            <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-xs mb-1">
                {status === 'ringing' ? 'Ringing...' : (call.type === 'video' ? 'Video Call' : 'Voice Call')}
            </p>
            {status === 'ongoing' && <p className="text-slate-400 font-mono text-xl">{formatTime(timer)}</p>}
        </div>

        <div className="mt-24 flex items-center gap-6">
           <button className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
             <i className="fa-solid fa-microphone-slash text-xl"></i>
           </button>
           <button 
             onClick={() => setActiveCall(null)}
             className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-500/30 transition-all hover:scale-110 active:scale-95"
           >
             <i className="fa-solid fa-phone-slash text-3xl"></i>
           </button>
           <button className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
             <i className="fa-solid fa-video-slash text-xl"></i>
           </button>
        </div>

        <div className="mt-12 flex gap-4">
           <button className="px-6 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20">Chat</button>
           <button className="px-6 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/20">Speaker</button>
        </div>
      </div>
    </div>
  );
};

export default CallOverlay;
