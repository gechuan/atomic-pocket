import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  onSnapshot, 
  serverTimestamp, 
  orderBy, 
  setDoc,
  getDoc
} from 'firebase/firestore';
import { 
  Plus, 
  Check, 
  MessageSquare, 
  BarChart2, 
  Home, 
  X, 
  ChevronRight, 
  Flame, 
  Zap,
  Calendar as CalendarIcon,
  TrendingUp,
  User,
  Settings,
  ArrowRight
} from 'lucide-react';

// --- Firebase Configuration & Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyC1hLNCbyMyT7sgPWB1IqSVIxa7ZTfaoHc",
  authDomain: "atom-1ec5f.firebaseapp.com",
  projectId: "atom-1ec5f",
  storageBucket: "atom-1ec5f.firebasestorage.app",
  messagingSenderId: "1058629885484",
  appId: "1:1058629885484:web:7cd730bb5ee711f11b3b89"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "atomic-pocket-v1";

// --- Components ---

// 1. Navigation Bar
const NavBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: '今天' },
    { id: 'coach', icon: MessageSquare, label: '教练' },
    { id: 'stats', icon: BarChart2, label: '进度' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 px-6 py-4 flex justify-between items-center z-50 safe-area-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center space-y-1 transition-colors duration-200 ${
              isActive ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// 2. Add Habit Modal (Habit Stacking)
const AddHabitModal = ({ isOpen, onClose, userId }) => {
  const [step, setStep] = useState(1);
  const [habitName, setHabitName] = useState('');
  const [cue, setCue] = useState('');
  const [identity, setIdentity] = useState('');
  
  const resetForm = () => {
    setHabitName('');
    setCue('');
    setIdentity('');
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!habitName.trim() || !userId) return;

    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'habits'), {
        name: habitName,
        cue: cue,
        identity: identity,
        createdAt: serverTimestamp(),
        streak: 0,
        completions: {}, // Map of date strings to boolean
        archived: false
      });
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error adding habit:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="bg-zinc-900 w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">建立新习惯</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X size={24} />
            </button>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-400">第一定律：让它显而易见</label>
              <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                <p className="text-gray-500 text-sm mb-2">我想养成什么习惯？</p>
                <input
                  type="text"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="例如：阅读10页书"
                  className="w-full bg-transparent text-white text-lg placeholder-gray-600 focus:outline-none"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!habitName.trim()}
                className="w-full bg-white text-black font-bold py-3 rounded-xl disabled:opacity-50 hover:bg-gray-200 transition-colors"
              >
                下一步
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-400">习惯堆叠 (Habit Stacking)</label>
              <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-orange-500 font-bold">当</span>
                  <input
                    type="text"
                    value={cue}
                    onChange={(e) => setCue(e.target.value)}
                    placeholder="例如：我倒好咖啡"
                    className="flex-1 bg-transparent text-white border-b border-gray-700 focus:border-orange-500 focus:outline-none py-1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-orange-500 font-bold">之后，我会</span>
                  <span className="flex-1 text-white border-b border-transparent py-1">{habitName || '...'}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">将新习惯与当前的习惯绑定，成功率提高 3 倍。</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  返回
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  下一步
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-400">基于身份的习惯</label>
              <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                <p className="text-gray-500 text-sm mb-2">我想成为什么样的人？</p>
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="例如：一个爱读书的人"
                  className="w-full bg-transparent text-white text-lg placeholder-gray-600 focus:outline-none"
                />
              </div>
              <p className="text-xs text-gray-500">真正的行为改变是身份的改变。</p>
              <div className="flex space-x-3">
                 <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-zinc-800 text-white font-bold py-3 rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  返回
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-colors"
                >
                  开始养成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. Habit Item Component
const HabitItem = ({ habit, userId, todayStr }) => {
  const isCompleted = habit.completions && habit.completions[todayStr];
  
  const toggleCompletion = async () => {
    if (!userId) return;
    
    const habitRef = doc(db, 'artifacts', appId, 'users', userId, 'habits', habit.id);
    const newCompletions = { ...habit.completions };
    
    if (isCompleted) {
      delete newCompletions[todayStr];
    } else {
      newCompletions[todayStr] = true;
    }

    // Calculate streak (Simplified logic for demo)
    // A robust streak calculation would traverse backwards from today
    let currentStreak = 0;
    const sortedDates = Object.keys(newCompletions).sort().reverse();
    // Very basic streak check - consecutive days logic would go here
    currentStreak = Object.keys(newCompletions).length; 

    await updateDoc(habitRef, {
      completions: newCompletions,
      streak: currentStreak
    });
  };

  const deleteHabit = async (e) => {
    e.stopPropagation();
    if(confirm('确定要放弃这个习惯吗？')) {
        const habitRef = doc(db, 'artifacts', appId, 'users', userId, 'habits', habit.id);
        await deleteDoc(habitRef);
    }
  }

  return (
    <div className="group relative bg-zinc-900 border border-white/5 rounded-2xl p-4 mb-3 active:scale-[0.98] transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={`font-semibold text-lg ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
              {habit.name}
            </h3>
            {habit.streak > 0 && (
              <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-orange-500/10 rounded text-orange-500 text-xs font-bold">
                <Flame size={10} fill="currentColor" />
                <span>{habit.streak}</span>
              </div>
            )}
          </div>
          {habit.cue && (
            <p className="text-xs text-gray-500">
              <span className="text-zinc-600">触发:</span> {habit.cue}
            </p>
          )}
        </div>

        <button
          onClick={toggleCompletion}
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            isCompleted
              ? 'bg-green-500 border-green-500 text-black'
              : 'bg-transparent border-zinc-700 text-transparent hover:border-zinc-500'
          }`}
        >
          <Check size={16} strokeWidth={4} />
        </button>
      </div>
      
      {/* Delete button only visible on hover (desktop) or strict press areas (mobile) - simplified here */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={deleteHabit} className="p-1 text-zinc-700 hover:text-red-500">
              <X size={12} />
          </button>
      </div>
    </div>
  );
};

// 4. Coach View (Chat)
const CoachView = ({ userId }) => {
  const [messages, setMessages] = useState([
    { id: 'intro', text: "你好，我是你的 AI 教练。我基于詹姆斯·克利尔的《原子习惯》设计。今天感觉怎么样？有没有哪个习惯让你觉得难以坚持？", sender: 'ai', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate AI thinking
    setTimeout(() => {
      const aiResponse = generateAIResponse(userMsg.text);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      }]);
    }, 1000);
  };

  const generateAIResponse = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('难') || lower.includes('累') || lower.includes('放弃')) {
      return "这是正常的。记住“两分钟规则”：当开始一个新习惯时，它所花的时间不应超过两分钟。试着把你的习惯缩小到只需要做两分钟，比如“穿上跑鞋”而不是“跑3公里”。";
    }
    if (lower.includes('忘') || lower.includes('不记得')) {
      return "这就是为什么我们需要第一定律：让它显而易见。试着通过“习惯堆叠”来解决——把新习惯绑定在这一天中你肯定会做的动作之后。";
    }
    if (lower.includes('无聊') || lower.includes('没动力')) {
      return "当动力枯竭时，习惯能够支撑你继续前行。金发姑娘准则告诉我们，当我们从事难度恰好在能力边缘的任务时，人类体验到的动力达到顶峰。你的习惯是否太简单了？还是太难了？";
    }
    if (lower.includes('谢谢')) {
      return "不客气。哪怕只有 1% 的进步，日积月累也会产生巨大的变化。保持这种势头。";
    }
    return "很有趣的观点。关注你的体系，而不是目标。你不需要仅仅想着结果，而是要成为能够达成结果的那种人。";
  };

  return (
    <div className="flex flex-col h-full pb-20 pt-6">
      <div className="px-6 mb-4">
        <h1 className="text-3xl font-bold text-white mb-1">AI Life Coach</h1>
        <p className="text-zinc-500 text-sm">基于《原子习惯》原则</p>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-zinc-800 text-zinc-200 rounded-bl-none border border-white/5'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-black/90 border-t border-white/10 mt-auto">
        <div className="flex items-center space-x-2 bg-zinc-900 p-2 rounded-full border border-white/10 focus-within:border-orange-500/50 transition-colors">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="问问 James..."
            className="flex-1 bg-transparent text-white px-4 py-1 focus:outline-none placeholder-zinc-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="bg-blue-600 p-2.5 rounded-full text-white disabled:opacity-50 hover:bg-blue-500"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// 5. Stats View
const StatsView = ({ habits }) => {
  // Calculate aggregate stats
  const totalHabits = habits.length;
  const totalCompletions = habits.reduce((acc, h) => acc + Object.keys(h.completions || {}).length, 0);
  
  // Get current streak across all habits
  const activeStreaks = habits.filter(h => h.streak > 0).length;

  // Mock calculation for "Habit Strength" (0-100)
  const strength = Math.min(100, Math.floor((totalCompletions / (totalHabits * 7 || 1)) * 100));

  return (
    <div className="px-6 py-8 pb-24 space-y-8 overflow-y-auto h-full">
      <div>
        <h1 className="text-3xl font-bold text-white mb-1">每日追踪</h1>
        <p className="text-zinc-500 text-sm">可视化你的复利效应</p>
      </div>

      {/* Main Metric Card */}
      <div className="bg-zinc-900 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="flex justify-between items-start mb-6">
            <div>
                <p className="text-zinc-500 text-sm font-medium mb-1">习惯强度</p>
                <div className="text-4xl font-bold text-white flex items-end">
                    {strength}
                    <span className="text-lg text-zinc-600 font-normal ml-1">/100</span>
                </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${strength > 50 ? 'bg-green-500/20 text-green-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                {strength > 50 ? 'Stable' : 'Building'}
            </div>
        </div>
        
        {/* Simple Progress Bar */}
        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 transition-all duration-1000" style={{ width: `${strength}%` }}></div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center space-x-2 text-blue-500 mb-2">
                <Zap size={20} />
                <span className="font-bold text-xs uppercase tracking-wider">总完成</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalCompletions}</p>
          </div>
          
           <div className="bg-zinc-900 rounded-2xl p-5 border border-white/5">
            <div className="flex items-center space-x-2 text-orange-500 mb-2">
                <Flame size={20} />
                <span className="font-bold text-xs uppercase tracking-wider">活跃连击</span>
            </div>
            <p className="text-2xl font-bold text-white">{activeStreaks}</p>
          </div>
      </div>

      {/* Calendar Heatmap Placeholder - Visual only for demo */}
      <div className="bg-zinc-900 rounded-3xl p-6 border border-white/5">
         <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-white">21 天挑战</h3>
             <span className="text-xs text-zinc-500">Momentum</span>
         </div>
         <div className="grid grid-cols-7 gap-3">
             {Array.from({ length: 28 }).map((_, i) => {
                 const isCompleted = i < (totalCompletions % 28);
                 const isToday = i === 20; // Mock "today"
                 return (
                     <div 
                        key={i} 
                        className={`
                            aspect-square rounded-full flex items-center justify-center text-xs font-medium
                            ${isCompleted ? 'bg-orange-500 text-black' : 'bg-zinc-800 text-zinc-600'}
                            ${isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}
                        `}
                     >
                        {isCompleted && <Check size={10} strokeWidth={4} />}
                     </div>
                 )
             })}
         </div>
         <p className="mt-6 text-center text-sm text-zinc-500">
             “每一次你执行一个习惯，你都在为那个你想成为的人投下一票。”
         </p>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function AtomicApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [habits, setHabits] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [todayStr, setTodayStr] = useState(new Date().toISOString().split('T')[0]);

  // Auth Initialization
  useEffect(() => {
    const initAuth = async () => {
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Auth Failed", error);
        }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Habits
  useEffect(() => {
    if (!user) return;
    
    const q = query(
      collection(db, 'artifacts', appId, 'users', user.uid, 'habits'), 
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const habitsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHabits(habitsData);
      },
      (error) => {
        console.error("Error fetching habits:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Loading State
  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-zinc-500 animate-pulse">Loading Atomic Pocket...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-orange-500 selection:text-white pb-safe">
      
      {/* Main Content Area */}
      <main className="h-screen overflow-hidden relative">
        {activeTab === 'home' && (
          <div className="h-full flex flex-col pt-6 pb-20 px-6 relative">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-1">
                        <span className="text-orange-500">Atomic</span> Habits
                    </h1>
                    <p className="text-zinc-400 text-sm">
                        {new Date().toLocaleDateString('zh-CN', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                    <User size={18} className="text-zinc-400" />
                </div>
            </div>

            {/* Quick Stats or Quote */}
            <div className="bg-zinc-900/50 rounded-2xl p-4 mb-6 border border-white/5">
                <p className="text-sm text-zinc-300 italic">“我们重复做的事情造就了我们。因此，优秀不是一种行为，而是一种习惯。”</p>
                <p className="text-xs text-zinc-500 mt-2 text-right">— 亚里士多德 (James Clear 引用)</p>
            </div>

            {/* Habits List */}
            <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">今日任务</h2>
                    <span className="text-xs text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-white/5">
                        {habits.filter(h => h.completions && h.completions[todayStr]).length}/{habits.length}
                    </span>
                </div>

                {habits.length === 0 ? (
                    <div className="text-center py-12 px-4 border border-dashed border-zinc-800 rounded-2xl">
                        <div className="bg-zinc-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
                            <Plus size={32} />
                        </div>
                        <p className="text-zinc-400 mb-2">还没有习惯</p>
                        <p className="text-xs text-zinc-600">从小事开始。点击下方按钮添加你的第一个原子习惯。</p>
                    </div>
                ) : (
                    habits.map(habit => (
                        <HabitItem 
                            key={habit.id} 
                            habit={habit} 
                            userId={user.uid} 
                            todayStr={todayStr} 
                        />
                    ))
                )}
            </div>

            {/* Floating Action Button */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="absolute bottom-24 right-6 w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:scale-105 transition-all z-50"
            >
                <Plus size={28} />
            </button>
          </div>
        )}

        {activeTab === 'coach' && <CoachView userId={user.uid} />}
        
        {activeTab === 'stats' && <StatsView habits={habits} />}
      </main>

      {/* Global Components */}
      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <AddHabitModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        userId={user.uid} 
      />
    </div>
  );
}
