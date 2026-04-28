import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Languages, 
  History as HistoryIcon, 
  Gem, 
  LogOut, 
  LogIn, 
  ChevronRight,
  Copy,
  Trash2,
  Bookmark,
  BookmarkCheck
} from 'lucide-react';
import { auth, db } from './lib/firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { translateText } from './services/geminiService';
import { cn } from './lib/utils';

// Types
interface TranslationHistory {
  id: string;
  sourceText: string;
  translatedText: string;
  targetLanguage: string;
  timestamp: any;
  isBookmarked: boolean;
}

const LANGUAGES = [
  { code: 'Spanish', name: 'Spanish', flag: '🇪🇸' },
  { code: 'French', name: 'French', flag: '🇫🇷' },
  { code: 'German', name: 'German', flag: '🇩🇪' },
  { code: 'Japanese', name: 'Japanese', flag: '🇯🇵' },
  { code: 'Chinese', name: 'Chinese', flag: '🇨🇳' },
  { code: 'Arabic', name: 'Arabic', flag: '🇸🇦' },
  { code: 'Korean', name: 'Korean', flag: '🇰🇷' },
  { code: 'Italian', name: 'Italian', flag: '🇮🇹' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLang, setTargetLang] = useState('Spanish');
  const [isTranslating, setIsTranslating] = useState(false);
  const [history, setHistory] = useState<TranslationHistory[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Test connection as required by constraints
    const testConn = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (e) {
        console.warn("Firestore connection test (expected fail if no doc exists):", e);
      }
    };
    testConn();

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    const q = query(
      collection(db, 'translations'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeHistory = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TranslationHistory[];
      setHistory(docs);
    }, (error) => {
      console.error("Firestore history fetch error:", error);
    });

    return () => unsubscribeHistory();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const performTranslation = async (text: string) => {
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    setIsTranslating(true);
    try {
      const result = await translateText(text, targetLang);
      setTranslatedText(result.translatedText);
      
      if (user) {
        await addDoc(collection(db, 'translations'), {
          userId: user.uid,
          sourceText: text,
          translatedText: result.translatedText,
          targetLanguage: targetLang,
          timestamp: serverTimestamp(),
          isBookmarked: false
        });
      }
    } catch (error) {
      console.error("Translation failed:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const onTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSourceText(val);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      performTranslation(val);
    }, 1000);
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'translations', id));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden relative selection:bg-gold/30 selection:text-gold">
      {/* Atmospheric Background Filters */}
      <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-deep-purple/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-gold/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
      
      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 border-b border-white/5 glass">
        <div className="flex items-center gap-3">
          <Gem className="w-8 h-8 text-gold animate-pulse" />
          <h1 className="text-xl font-serif tracking-widest uppercase">
            International Jewelry Box
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-xs uppercase tracking-widest text-white/50">{user.displayName}</span>
              <button 
                onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/70"
              >
                <HistoryIcon className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs uppercase tracking-tighter hover:text-gold transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="flex items-center gap-2 p-2 px-6 rounded-full border border-gold/30 hover:bg-gold/10 transition-all text-xs uppercase tracking-widest"
            >
              <LogIn className="w-4 h-4" /> Guest Access
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 h-[calc(100vh-120px)]">
        
        {/* Input Area */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-semibold">Source Text</label>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">Auto Detect Enabled</span>
            </div>
            <div className="relative group">
              <textarea 
                value={sourceText}
                onChange={onTextChange}
                placeholder="Deposit text to be refined..."
                className={cn(
                  "w-full h-80 bg-white/[0.02] border border-white/10 rounded-2xl p-8 focus:outline-none focus:ring-1 focus:ring-gold/30",
                  "text-2xl font-serif leading-relaxed placeholder:text-white/10 transition-all",
                  "resize-none overflow-y-auto"
                )}
              />
              <div className="absolute top-4 right-4 text-white/10 group-hover:text-gold/20 transition-colors">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setTargetLang(lang.code);
                  if (sourceText) performTranslation(sourceText);
                }}
                className={cn(
                  "p-3 px-5 rounded-full border border-white/5 transition-all text-xs flex items-center gap-2 hover:border-gold/30",
                  targetLang === lang.code ? "bg-gold/10 border-gold/50 text-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]" : "bg-white/5 text-white/50"
                )}
              >
                <span>{lang.flag}</span>
                <span className="uppercase tracking-widest">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Output Area */}
        <div className="relative">
          <div className="space-y-4 h-full">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-semibold">Refined Jewel</label>
              {isTranslating && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold"
                >
                  <div className="w-1 h-1 bg-gold rounded-full animate-ping" />
                  Processing...
                </motion.div>
              )}
            </div>
            
            <div className="relative h-80 glass rounded-3xl p-8 flex flex-col justify-between overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={translatedText || 'empty'}
                  initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.02, filter: 'blur(10px)' }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="flex-grow"
                >
                  <p className={cn(
                    "text-2xl font-serif italic leading-relaxed text-gold/90",
                    !translatedText && "text-white/5 italic"
                  )}>
                    {translatedText || "The translation will appear as a polished gem here..."}
                  </p>
                </motion.div>
              </AnimatePresence>

              {translatedText && (
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
                  <button 
                    onClick={() => copyToClipboard(translatedText)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-gold"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-gold">
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Decorative Gem Icon Background */}
              <div className="absolute -bottom-10 -right-10 opacity-[0.03] select-none pointer-events-none">
                <Gem className="w-64 h-64" />
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-6 mt-12 text-[10px] uppercase tracking-[0.2em]">
               <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl space-y-4">
                  <div className="text-gold/60 flex items-center gap-2">
                    <Languages className="w-4 h-4" /> Semantic Accuracy
                  </div>
                  <p className="text-white/40 normal-case leading-relaxed font-sans">
                    Leveraging advanced neural patterns to preserve the ontological essence of your communication.
                  </p>
               </div>
               <div className="p-8 border border-white/5 bg-white/[0.01] rounded-2xl space-y-4">
                  <div className="text-gold/60 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> AI Refinement
                  </div>
                  <p className="text-white/40 normal-case leading-relaxed font-sans">
                    Each translation is processed through multiple refinement layers for stylistic panache.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* History Sidebar */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-[450px] h-full bg-[#050505] border-l border-white/10 z-[100] shadow-2xl p-12 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="space-y-1">
                  <h2 className="text-2xl font-serif tracking-widest uppercase">Vault</h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30">Your collected translation gems</p>
                </div>
                <button 
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                {history.length === 0 ? (
                  <div className="text-center py-20 text-white/20 uppercase tracking-widest text-xs">
                    The vault is currently empty
                  </div>
                ) : (
                  history.map((item) => (
                    <div 
                      key={item.id} 
                      className="group p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-gold/30 transition-all space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-gold/60">{item.targetLanguage}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => deleteHistoryItem(item.id)} className="p-1 hover:text-red-400">
                             <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-white/40 line-clamp-2">{item.sourceText}</p>
                      <p className="text-lg font-serif italic text-gold/80">{item.translatedText}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Floating Gem Decorations */}
      <FloatingGems />
    </div>
  );
}

function FloatingGems() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {[...Array(6)].map((_, i) => (
        <motion.div
           key={i}
           initial={{ 
             x: Math.random() * window.innerWidth, 
             y: Math.random() * window.innerHeight,
             opacity: 0 
           }}
           animate={{ 
             x: [null, Math.random() * window.innerWidth, Math.random() * window.innerWidth],
             y: [null, Math.random() * window.innerHeight, Math.random() * window.innerHeight],
             opacity: [0.05, 0.15, 0.05],
             rotate: [0, 180, 360]
           }}
           transition={{ 
             duration: 20 + Math.random() * 20, 
             repeat: Infinity, 
             ease: "linear" 
           }}
           className="absolute text-gold/20"
        >
          {i % 2 === 0 ? <Gem className="w-8 h-8" /> : <Sparkles className="w-12 h-12" />}
        </motion.div>
      ))}
    </div>
  );
}
