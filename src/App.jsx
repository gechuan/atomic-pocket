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
  writeBatch 
} from 'firebase/firestore';
import { 
  Plus, Check, MessageSquare, BarChart2, Home, X, 
  Flame, Zap, ArrowRight, Trash2, 
  RefreshCw, TrendingUp, Calendar
} from 'lucide-react';

// --- Firebase Configuration ---
// 修复说明：
// 1. 在 Vercel/本地部署时，直接使用对象 { key: "value" }，不要用 JSON.parse()。
// 2. 我已根据你提供的错误日志填入了 apiKey 和 projectId。
// 3. 请确保补充完整 appId 和 messagingSenderId（从 Firebase 控制台 -> Project Settings 复制）。
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {
      apiKey: "AIzaSyC1hLNCbyMyT7sgPWB1IqSVIxa7ZTfaoHc", // 已填入
      authDomain: "atom-1ec5f.firebaseapp.com",         // 已填入
      projectId: "atom-1ec5f",                           // 已填入
      storageBucket: "atom-1ec5f.appspot.com",           // 通常是 项目ID.appspot.com
      messagingSenderId: "1058629885484", // 需补充
      appId: "1:1058629885484:web:7cd730bb5ee711f11b3b89"                         // 需补充
    };

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 兼容环境 ID
const appId = typeof __app_id !== 'undefined' ? __app_id : 'atomic-pocket-prod';

// --- Utility Functions ---
const getDayKey = (date) => date.toISOString().split('T')[0];
const getLastNDays = (n) => {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(getDayKey(d));
  }
  return dates;
};

// --- Components ---

// 1. Navigation Bar (Glassmorphism Updated)
const NavBar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Today' },
    { id: 'coach', icon: MessageSquare, label: 'Coach' },
    { id: 'stats', icon: BarChart2, label: 'Progress' },
  ];

  return (
    <div className="fixed bottom-6 left-6 right-6 h-16 bg-[#1A1A1A]/90 backdrop-blur-xl border border-white/10 rounded-full flex justify-around items-center z-50 shadow-2xl shadow-black/50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 ${
              isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {isActive && (
              <span className="absolute inset-0 bg-white/10 rounded-full blur-md animate-pulse" />
            )}
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
          </button>
        );
      })}
    </div>
  );
};

// 2. Add Habit Modal (Refined UI)
const AddHabitModal = ({ isOpen, onClose, userId }) => {
  const [step, setStep] = useState(1);
  const [habitName, setHabitName] = useState('');
  const [cue, setCue] = useState('');
  const [identity, setIdentity] = useState('');

  // Reset on open
  useEffect(() => {
    if (isOpen) {
        setStep(1); setHabitName(''); setCue(''); setIdentity('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!habitName.trim() || !userId) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'users', userId, 'habits'), {
        name: habitName,
        cue: cue,
        identity: identity,
        createdAt: serverTimestamp(),
        streak: 0,
        completions: {}, 
        color: ['#F97316', '#3B82F6', '#8B5CF6', '#10B981'][Math.floor(Math.random() * 4)] // Random accent color
      });
      onClose();
    } catch (error) {
      console.error("Error adding habit:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="bg-[#121212] w-full max-w-md rounded-[32px] border border-white/10 overflow-hidden shadow-2xl ring-1 ring-white/5 animate-in slide-in-from-bottom-10 fade-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Design Habit</h2>
            <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors">
              <X size={20} />
            </button>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">The Goal</label>
                <input
                  type="text"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g., Read 10 pages"
                  className="w-full bg-transparent text-3xl font-bold text-white placeholder-zinc-700 focus:outline-none border-b border-zinc-800 pb-2 focus:border-orange-500 transition-colors"
                  autoFocus
                />
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!habitName.trim()}
                className="w-full bg-white text-black font-bold py-4 rounded-2xl text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
               <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 block">Habit Stacking</label>
                <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-zinc-400">After I...</span>
                    </div>
                    <input
                        type="text"
                        value={cue}
                        onChange={(e) => setCue(e.target.value)}
                        placeholder="pour my coffee"
                        className="w-full bg-transparent text-xl font-medium text-white placeholder-zinc-700 focus:outline-none"
                    />
                    <div className="h-px bg-zinc-800 w-full" />
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-zinc-400">I will...</span>
                    </div>
                    <p className="text-xl font-medium text-white">{habitName}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setStep(1)} className="py-4 rounded-2xl text-zinc-400 font-medium hover:bg-zinc-900">Back</button>
                <button onClick={() => setStep(3)} className="bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-200">Next</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
               <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Identity Shift</label>
                <p className="text-zinc-400 mb-4 text-sm">Who do you wish to become?</p>
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="e.g., A Reader"
                  className="w-full bg-transparent text-3xl font-bold text-blue-500 placeholder-zinc-800 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] transition-all"
              >
                Create Habit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 3. Habit Item (High Fidelity)
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
    
    // Simple streak calc for UI update
    const streak = Object.keys(newCompletions).length; 

    await updateDoc(habitRef, { completions: newCompletions, streak });
  };

  const deleteHabit = async (e) => {
    e.stopPropagation();
    if(confirm('Archive this habit?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', userId, 'habits', habit.id));
    }
  }

  return (
    <div className="group relative mb-4">
        {/* Glow Effect behind active habits */}
        {isCompleted && (
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl rounded-3xl -z-10 transition-all duration-700" />
        )}
        
        <div 
            onClick={toggleCompletion}
            className={`
                relative overflow-hidden rounded-[24px] p-5 border transition-all duration-300 cursor-pointer select-none
                ${isCompleted 
                    ? 'bg-[#121212] border-green-500/30' 
                    : 'bg-[#121212] border-white/5 hover:border-white/10 hover:bg-[#181818]'}
            `}
        >
            <div className="flex items-center justify-between z-10 relative">
                <div className="flex-1 pr-4">
                    <div className="flex items-center space-x-3 mb-1">
                        <h3 className={`font-bold text-lg transition-colors ${isCompleted ? 'text-zinc-400' : 'text-white'}`}>
                            {habit.name}
                        </h3>
                         {/* Streak Badge */}
                         {habit.streak > 0 && (
                            <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${isCompleted ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                <Flame size={10} fill="currentColor" />
                                <span>{habit.streak} DAY</span>
                            </div>
                        )}
                    </div>
                    {habit.cue && (
                        <p className="text-sm text-zinc-500 flex items-center gap-1">
                            <ArrowRight size={12} className="text-zinc-600"/> {habit.cue}
                        </p>
                    )}
                </div>

                <div className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500
                    ${isCompleted 
                        ? 'bg-green-500 border-green-500 text-black rotate-0 scale-100' 
                        : 'bg-transparent border-zinc-800 text-transparent rotate-180 scale-90 group-hover:border-zinc-600'}
                `}>
                    <Check size={20} strokeWidth={4} />
                </div>
            </div>

            {/* Subtle Progress Bar Background */}
            <div 
                className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000 ease-out" 
                style={{ width: isCompleted ? '100%' : '0%', opacity: 0.5 }}
            />
            
            {/* Delete Option (Desktop Hover / Mobile corner tap) */}
             <button 
                onClick={deleteHabit} 
                className="absolute top-0 right-0 p-4 text-zinc-800 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
                <Trash2 size={16} />
            </button>
        </div>
    </div>
  );
};

// 4. Stats View (Real Data Visualization)
const StatsView = ({ habits, userId }) => {
  const last28Days = useMemo(() => getLastNDays(28).reverse(), []);
  
  // Calculate Graph Points
  const graphData = useMemo(() => {
    const days = getLastNDays(14).reverse();
    return days.map(date => {
        if (habits.length === 0) return 0;
        const completedCount = habits.filter(h => h.completions && h.completions[date]).length;
        return (completedCount / habits.length) * 100;
    });
  }, [habits]);

  // Generate SVG Path for the graph
  const getPath = (data) => {
    if (data.length === 0) return "";
    const width = 100; 
    const height = 50; 
    const stepX = width / (data.length - 1);
    
    let path = `M 0 ${height - (data[0] / 100 * height)}`;
    data.forEach((val, i) => {
        if (i === 0) return;
        const x = i * stepX;
        const y = height - (val / 100 * height);
        // Bezier curve
        const prevX = (i - 1) * stepX;
        const prevY = height - (data[i - 1] / 100 * height);
        const cp1x = prevX + (stepX / 2);
        const cp1y = prevY;
        const cp2x = x - (stepX / 2);
        const cp2y = y;
        path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y}`;
    });
    return path;
  };

  const totalCompletions = habits.reduce((acc, h) => acc + Object.keys(h.completions || {}).length, 0);
  const bestHabit = habits.sort((a,b) => (b.streak||0) - (a.streak||0))[0];

  // Demo Data Generator
  const generateDemoData = async () => {
    if (!userId) return;
    const batch = writeBatch(db);
    const demoHabits = [
        { name: "Morning Meditation", cue: "Make bed", identity: "Mindful Person", color: "#F97316" },
        { name: "Read 10 Pages", cue: "Dinner", identity: "Reader", color: "#3B82F6" },
        { name: "No Sugar", cue: "Afternoon slump", identity: "Healthy Eater", color: "#10B981" }
    ];
    
    const dates = getLastNDays(28); 

    demoHabits.forEach(habit => {
        const newRef = doc(collection(db, 'artifacts', appId, 'users', userId, 'habits'));
        const completions = {};
        let currentStreak = 0;
        
        dates.forEach(d => {
            if (Math.random() > 0.4) { 
                completions[d] = true;
                currentStreak++;
            } else {
                currentStreak = 0;
            }
        });

        batch.set(newRef, {
            ...habit,
            createdAt: serverTimestamp(),
            completions,
            streak: currentStreak
        });
    });

    await batch.commit();
  };

  return (
    <div className="px-6 py-8 pb-32 space-y-8 overflow-y-auto h-full bg-[#0A0A0A]">
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">Progress</h1>
            <p className="text-zinc-500 text-sm">Visualize your compound interest.</p>
        </div>
        <button onClick={generateDemoData} className="text-xs flex items-center gap-1 text-zinc-600 hover:text-white border border-zinc-800 rounded-full px-3 py-1 bg-zinc-900/50">
            <RefreshCw size={10} /> Demo Data
        </button>
      </div>

      {/* Main Metric Card */}
      <div className="bg-zinc-900/50 rounded-[32px] p-6 border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none group-hover:bg-orange-500/20 transition-all duration-1000"></div>
        
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Consistency Score</p>
                    <div className="text-5xl font-bold text-white tracking-tighter">
                        {Math.floor(graphData.reduce((a,b)=>a+b, 0) / (graphData.length||1))}%
                    </div>
                </div>
                <div className="bg-orange-500/10 p-2 rounded-full text-orange-500">
                    <TrendingUp size={24} />
                </div>
            </div>

            {/* SVG Chart */}
            <div className="h-24 w-full relative">
                <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="gradientStroke" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ea580c" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#facc15" stopOpacity="1" />
                        </linearGradient>
                    </defs>
                    <path 
                        d={getPath(graphData)} 
                        fill="none" 
                        stroke="url(#gradientStroke)" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        className="drop-shadow-lg"
                    />
                </svg>
                 <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-mono">
                    <span>14 Days Ago</span>
                    <span>Today</span>
                </div>
            </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="bg-zinc-900/50 rounded-[32px] p-6 border border-white/5">
         <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-white flex items-center gap-2">
                <Calendar size={16} className="text-zinc-500"/> 28-Day Overview
             </h3>
         </div>
         {habits.length === 0 ? (
             <div className="text-center py-8 text-zinc-600 text-sm">No data to display yet.</div>
         ) : (
            <div className="grid grid-cols-7 gap-3">
                {last28Days.map((dateStr, i) => {
                    const dayCompletions = habits.filter(h => h.completions && h.completions[dateStr]).length;
                    const intensity = Math.min(dayCompletions / habits.length, 1);
                    
                    let bgClass = 'bg-zinc-800/50';
                    if (intensity > 0) bgClass = 'bg-orange-900/40 text-orange-700';
                    if (intensity > 0.3) bgClass = 'bg-orange-700/60 text-orange-400';
                    if (intensity > 0.6) bgClass = 'bg-orange-600 text-orange-200';
                    if (intensity > 0.9) bgClass = 'bg-orange-500 text-white shadow-lg shadow-orange-500/30';

                    return (
                        <div 
                            key={dateStr} 
                            className={`
                                aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold transition-all hover:scale-110
                                ${bgClass}
                            `}
                        >
                            {intensity > 0.6 && <Check size={10} strokeWidth={4} />}
                        </div>
                    )
                })}
            </div>
         )}
      </div>

       <div className="bg-zinc-900/50 rounded-[32px] p-6 border border-white/5 flex items-center justify-between">
            <div>
                 <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Total Reps</p>
                 <p className="text-3xl font-bold text-white">{totalCompletions}</p>
            </div>
            <div className="h-12 w-px bg-zinc-800"></div>
            <div>
                 <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Best Streak</p>
                 <p className="text-3xl font-bold text-white">{bestHabit ? bestHabit.streak : 0}</p>
            </div>
       </div>
    </div>
  );
};

// 5. Coach View (Chat UI Polish)
const CoachView = ({ userId }) => {
    const [messages, setMessages] = useState([
        { id: 'intro', text: "Hey. I'm based on James Clear's Atomic Habits. What's preventing you from sticking to your routine today?", sender: 'ai', timestamp: new Date() }
      ]);
      const [input, setInput] = useState('');
      const scrollRef = useRef(null);
    
      useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, [messages]);
    
      const handleSend = async () => {
        if (!input.trim()) return;
        const userMsg = { id: Date.now().toString(), text: input, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setTimeout(() => {
          const aiResponse = generateAIResponse(userMsg.text);
          setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiResponse, sender: 'ai', timestamp: new Date() }]);
        }, 800);
      };
    
      const generateAIResponse = (text) => {
        const lower = text.toLowerCase();
        if (lower.includes('tired') || lower.includes('hard')) return "Reduce the friction. Make it so easy you can't say no. Can you do just 2 minutes of it?";
        if (lower.includes('missed') || lower.includes('forgot')) return "Never miss twice. If you miss one day, try to get back on track immediately. The first mistake is a mistake, the second is the start of a new habit.";
        return "Focus on your system, not the goal. You do not rise to the level of your goals. You fall to the level of your systems.";
      };
    
      return (
        <div className="flex flex-col h-full bg-[#0A0A0A] pb-24 pt-6">
          <div className="px-6 mb-4 border-b border-white/5 pb-4">
            <h1 className="text-2xl font-bold text-white mb-1">Atomic Coach</h1>
            <div className="text-zinc-500 text-xs flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> Online</div>
          </div>
    
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                    msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-zinc-800 text-zinc-200 rounded-bl-sm border border-white/5'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
    
          <div className="p-4 bg-black/80 backdrop-blur-md border-t border-white/10 mt-auto fixed bottom-[80px] w-full left-0 z-40">
            <div className="flex items-center space-x-2 bg-zinc-900 p-2 rounded-full border border-white/10 focus-within:border-zinc-700 transition-colors max-w-lg mx-auto">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask for advice..."
                className="flex-1 bg-transparent text-white px-4 py-2 focus:outline-none placeholder-zinc-600"
              />
              <button onClick={handleSend} disabled={!input.trim()} className="bg-white w-10 h-10 rounded-full text-black flex items-center justify-center hover:bg-zinc-200 transition-colors disabled:opacity-50">
                <ArrowRight size={18} />
              </button>
            </div>
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
  const [todayStr, setTodayStr] = useState(getDayKey(new Date()));

  useEffect(() => {
    // Auth Initialization Logic (Auto-detect environment)
    const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'habits'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        setHabits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-6">
             <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center animate-bounce">
                    <Zap size={32} className="text-orange-500" fill="currentColor"/>
                </div>
                <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full -z-10"></div>
             </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-orange-500 selection:text-white pb-safe overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[100px] rounded-full mix-blend-screen"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-900/10 blur-[100px] rounded-full mix-blend-screen"></div>
      </div>

      <main className="h-screen overflow-hidden relative z-10">
        {activeTab === 'home' && (
          <div className="h-full flex flex-col pt-8 pb-32 px-6 relative">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-white">
                        Habit<span className="text-orange-500">.</span>
                    </h1>
                    <p className="text-zinc-500 text-sm font-medium mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shadow-lg">
                     <span className="text-sm font-bold text-zinc-400">ME</span>
                </div>
            </div>

            {/* Quote Card */}
            {habits.length > 0 && (
                <div className="bg-gradient-to-r from-zinc-900 to-[#111] p-6 rounded-[32px] mb-8 border border-white/5 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-lg font-serif text-zinc-300 leading-relaxed italic">"You do not rise to the level of your goals. You fall to the level of your systems."</p>
                        <p className="text-xs text-orange-500 font-bold mt-3 uppercase tracking-wider">— James Clear</p>
                    </div>
                </div>
            )}

            {/* Habits List */}
            <div className="flex-1 overflow-y-auto scrollbar-hide -mx-6 px-6 pb-20">
                {habits.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-0 animate-in fade-in duration-1000 slide-in-from-bottom-5">
                        <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                            <Plus size={32} className="text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Build your first system</h3>
                        <p className="text-zinc-500 max-w-[250px] leading-relaxed">Small changes, remarkable results. Start with one atomic habit today.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-end mb-4 px-1">
                            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Today's Stack</h2>
                            <div className="h-1 flex-1 mx-4 bg-zinc-900 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-orange-500 transition-all duration-1000" 
                                    style={{ width: `${(habits.filter(h => h.completions && h.completions[todayStr]).length / habits.length) * 100}%`}} 
                                />
                            </div>
                            <span className="text-xs font-mono text-zinc-600">
                                {Math.round((habits.filter(h => h.completions && h.completions[todayStr]).length / habits.length) * 100)}%
                            </span>
                        </div>
                        {habits.map(habit => (
                            <HabitItem key={habit.id} habit={habit} userId={user.uid} todayStr={todayStr} />
                        ))}
                    </>
                )}
            </div>

            {/* FAB */}
            <button
                onClick={() => setIsAddModalOpen(true)}
                className="absolute bottom-28 right-6 w-16 h-16 bg-white text-black rounded-[24px] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all z-50 group"
            >
                <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>
        )}

        {activeTab === 'coach' && <CoachView userId={user.uid} />}
        {activeTab === 'stats' && <StatsView habits={habits} userId={user.uid} />}
      </main>

      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} />
      <AddHabitModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} userId={user.uid} />
    </div>
  );
}
