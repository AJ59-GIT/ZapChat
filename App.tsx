
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { User, AuthState, Chat, Message, Story, Call } from './types';
import { mockApi } from './services/mockBackend';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import CallOverlay from './components/CallOverlay';
import StoryViewer from './components/StoryViewer';

interface AppContextType {
  authState: AuthState;
  setAuthState: React.Dispatch<React.SetStateAction<AuthState>>;
  activeChat: Chat | null;
  setActiveChat: (chat: Chat | null) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  logout: () => void;
  activeCall: Call | null;
  setActiveCall: (call: Call | null) => void;
  viewingStory: Story | null;
  setViewingStory: (story: Story | null) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showProfileModal: boolean;
  setShowProfileModal: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({ user: null, isAuthenticated: false, loading: true });
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    isDarkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    const init = async () => {
      const user = mockApi.getCurrentUser();
      setAuthState({ user, isAuthenticated: !!user, loading: false });
    };
    init();

    const handleProfileUpdate = (updated: User) => {
      setAuthState(prev => ({ ...prev, user: updated }));
    };
    mockApi.on('profile_updated', handleProfileUpdate);
    return () => mockApi.off('profile_updated', handleProfileUpdate);
  }, []);

  const logout = useCallback(() => {
    mockApi.logout();
    setAuthState({ user: null, isAuthenticated: false, loading: false });
    setActiveChat(null);
  }, []);

  if (authState.loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <AppContext.Provider value={{ 
      authState, setAuthState, activeChat, setActiveChat: (c) => { setActiveChat(c); if(c) setSidebarOpen(false); }, 
      isDarkMode, toggleDarkMode: () => setIsDarkMode(!isDarkMode), logout,
      activeCall, setActiveCall, viewingStory, setViewingStory,
      isSidebarOpen, setSidebarOpen, showProfileModal, setShowProfileModal
    }}>
      <div className="h-screen w-full flex overflow-hidden transition-colors duration-200 bg-white dark:bg-slate-950">
        {!authState.isAuthenticated ? <Auth /> : (
          <div className="flex w-full h-full relative">
            <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} transition-transform duration-300 absolute md:relative z-30 h-full w-full md:w-auto`}>
              <Sidebar />
            </div>
            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
              {activeChat ? <ChatWindow chat={activeChat} /> : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-900/50">
                  <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <i className="fa-solid fa-bolt-lightning text-4xl text-blue-600 dark:text-blue-400"></i>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Welcome to ZapChat</h2>
                  <p className="text-slate-500 max-w-sm italic">Select a conversation to start messaging securely.</p>
                </div>
              )}
            </main>
          </div>
        )}
        {activeCall && <CallOverlay call={activeCall} />}
        {viewingStory && <StoryViewer story={viewingStory} />}
        {showProfileModal && <ProfileModal />}
      </div>
    </AppContext.Provider>
  );
};

const ProfileModal = () => {
  const { authState, setShowProfileModal } = useApp();
  const [name, setName] = useState(authState.user?.displayName || '');
  const [status, setStatus] = useState(authState.user?.statusMessage || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await mockApi.updateProfile({ displayName: name, statusMessage: status });
    setSaving(false);
    setShowProfileModal(false);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">Edit Profile</h3>
          <button onClick={() => setShowProfileModal(false)}><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center mb-4">
            <div className="relative group cursor-pointer">
              <img src={authState.user?.avatarUrl} className="w-24 h-24 rounded-full border-4 border-blue-500/20 object-cover" />
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="fa-solid fa-camera text-white text-xl"></i>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">Status Message</label>
            <textarea value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 resize-none" rows={2} />
          </div>
          <button onClick={save} disabled={saving} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
