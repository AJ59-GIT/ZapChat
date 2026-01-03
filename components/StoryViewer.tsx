
import React, { useState, useEffect } from 'react';
import { useApp } from '../App';
import { Story, User } from '../types';
import { mockApi } from '../services/mockBackend';

interface StoryViewerProps {
  story: Story;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ story }) => {
  const { setViewingStory } = useApp();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    mockApi.getUsers().then(users => {
      setUser(users.find(u => u.id === story.userId) || null);
    });

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          setViewingStory(null);
          return 100;
        }
        return p + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [story, setViewingStory]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
      <div className="w-full h-full max-w-lg relative bg-slate-900 overflow-hidden">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30 m-2 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-100" style={{ width: `${progress}%` }} />
        </div>

        {/* User Info */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30">
          <div className="flex items-center gap-3">
             <img src={user?.avatarUrl} className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="User" />
             <div>
                <h4 className="text-white font-bold text-sm shadow-black drop-shadow-md">{user?.displayName}</h4>
                <p className="text-white/70 text-[10px] shadow-black drop-shadow-md">{new Date(story.createdAt).toLocaleTimeString()}</p>
             </div>
          </div>
          <button onClick={() => setViewingStory(null)} className="p-2 text-white bg-black/20 rounded-full backdrop-blur-md">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <img src={story.contentUrl} className="w-full h-full object-cover" alt="Story content" />

        {/* Footer Reply */}
        <div className="absolute bottom-8 left-4 right-4 z-30">
           <div className="flex items-center gap-3 bg-white/10 backdrop-blur-xl p-2 rounded-full border border-white/10">
              <input 
                type="text" 
                placeholder="Reply to story..." 
                className="flex-1 bg-transparent border-none text-white text-sm px-4 focus:ring-0 placeholder:text-white/40"
              />
              <button className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                <i className="fa-solid fa-paper-plane text-xs"></i>
              </button>
           </div>
        </div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 pointer-events-none" />
      </div>
    </div>
  );
};

export default StoryViewer;
