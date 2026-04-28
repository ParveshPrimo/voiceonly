import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Mic, MicOff, Maximize2, ExternalLink, Shield, Info, Activity } from 'lucide-react';

interface ConversationData {
  conversation_id: string;
  conversation_url: string;
}

type CallStatus = 'idle' | 'linking' | 'calling' | 'active' | 'ended';

export default function App() {
  const [status, setStatus] = useState<CallStatus>('idle');
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'error' | 'success'}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    setLogs(prev => [...prev, { msg, type }]);
    console.log(`[Nova Log] ${msg}`);
    if (type === 'error') setIsConsoleOpen(true);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const startCall = async () => {
    setStatus('linking');
    setError(null);
    setLogs([]);
    setIsConsoleOpen(true);
    
    addLog('System initialization sequence started...', 'info');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog('Generating ephemeral session keys (AES-256)...', 'info');
      
      await new Promise(resolve => setTimeout(resolve, 600));
      addLog('Initiating secure bridge to Tavus cloud cluster...', 'info');
      
      const maxRetries = 3;
      let attempt = 0;
      let lastError: any = null;
      let resData: any = null;

      while (attempt < maxRetries) {
      try {
        attempt++;
        if (attempt > 1) {
          addLog(`Retry attempt ${attempt}/${maxRetries}...`, 'info');
          // Exponential backoff: 1s, 2s...
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        }

        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            custom_greeting: "Hey, I'm Nova. Great to connect with you. What can I help you with today?"
          }),
        });

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          addLog(`Server responded with status: ${response.status}`, 'success');
          resData = data;
          break; // Success!
        } else if (response.status >= 500 || data.isTimeout) {
          // It's a server error or timeout, we can retry
          const rawError = data.error;
          const errorMessage = typeof rawError === 'object' ? (rawError.message || JSON.stringify(rawError)) : rawError;
          
          addLog(`Transient server error (${response.status}): ${errorMessage || 'Handshake failed.'}`, 'error');
          if (attempt < maxRetries) {
            addLog(`The system is likely provisioning a replica. Retrying...`, 'info');
          }
          continue;
        } else {
          // Client error (4xx), don't retry
          const rawError = data.error;
          const errorMessage = typeof rawError === 'object' ? (rawError.message || JSON.stringify(rawError)) : rawError;
          
          addLog(`Terminal error (${response.status}): ${errorMessage}`, 'error');
          throw new Error(errorMessage || `Terminal error ${response.status}`);
        }
      } catch (err: any) {
        lastError = err;
        addLog(`Connection attempt ${attempt} failed: ${err.message}`, 'error');
        if (attempt >= maxRetries) throw err;
      }
    }

    if (!resData) {
      throw lastError || new Error('Maximum connection attempts reached.');
    }

    const data: ConversationData = resData;
      addLog('Persona identity verified: ' + data.conversation_id, 'success');
      addLog('Encryption tunnel established.', 'success');
      
      setConversation(data);
      setStatus('calling');
      
      addLog('Calibrating neural presence filters...', 'info');
      setTimeout(() => {
        addLog('Presence stream synchronized.', 'success');
        addLog('System ready. Voice link active.', 'success');
        setStatus('active');
        startTimer();
      }, 2500);

    } catch (err: any) {
      addLog(`FATAL ERROR: ${err.message}`, 'error');
      setError(err.message);
      setStatus('idle');
    }
  };

  const endCall = () => {
    setStatus('ended');
    stopTimer();
    setTimeout(() => {
      setStatus('idle');
      setConversation(null);
      setTime(0);
    }, 2000);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative min-h-screen bg-[#08080A] text-white flex flex-col items-center justify-between p-12 overflow-hidden font-sans select-none">
      <div className="atmosphere" />

      {/* System Console Sidebar */}
      <AnimatePresence>
        {isConsoleOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed left-0 lg:left-6 top-0 lg:top-1/2 lg:-translate-y-1/2 w-full lg:w-80 h-full lg:h-auto max-h-[80vh] z-[100] p-4 pointer-events-none"
          >
            <div className="bg-[#0A0A0C]/95 border border-white/10 rounded-2xl p-5 backdrop-blur-xl pointer-events-auto shadow-2xl flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-blue-400" />
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 text-white">System Diagnostics</span>
                </div>
                <button 
                  onClick={() => setIsConsoleOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-md transition-colors text-white/40 flex items-center gap-1 group"
                >
                  <span className="text-[8px] uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Close</span>
                  <PhoneOff size={14} className="rotate-0" />
                </button>
              </div>
              
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto space-y-3 font-mono text-[11px] custom-scrollbar pr-2"
              >
                {logs.length === 0 ? (
                  <div className="text-white/10 italic flex flex-col items-center justify-center py-10 gap-2">
                    <Activity size={24} className="opacity-10" />
                    <span>System Standby</span>
                  </div>
                ) : (
                  logs.map((log, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex flex-col gap-1 border-l-2 pl-3 py-1 ${
                        log.type === 'error' ? 'border-red-500 text-red-100 bg-red-500/5' : 
                        log.type === 'success' ? 'border-green-500 text-green-100 bg-green-500/5' : 'border-blue-500/20 text-blue-100/70'
                      }`}
                    >
                      <span className="opacity-30 text-[8px] font-bold uppercase text-white/50">
                        {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className={`flex-1 leading-relaxed break-words ${
                        log.type === 'error' ? 'text-red-300' : 
                        log.type === 'success' ? 'text-green-300' : 'text-blue-100/70'
                      }`}>
                        {log.msg}
                      </span>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-3">
                {status !== 'idle' && (
                  <button 
                    onClick={endCall}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-[10px] uppercase tracking-[0.1em] font-bold transition-all border border-red-500/20 flex items-center justify-center gap-2"
                  >
                    <PhoneOff size={12} />
                    End Connection
                  </button>
                )}
                <div className="flex justify-between items-center text-[8px] uppercase tracking-widest text-white/20 font-bold">
                  <span>Kernel: v2.4.0</span>
                  <span>Uptime: {formatTime(time)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Branding */}
      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-center opacity-30 z-10 hidden md:flex">
        <div className="rotate-[90deg] whitespace-nowrap text-[10px] tracking-[0.5em] uppercase font-mono">Encryption: AES-256</div>
      </div>

      {/* Top Navigation / Status */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          <span className="uppercase tracking-[0.3em] text-[10px] font-semibold opacity-60">
            {status === 'active' ? 'Live Connection' : 'System Standby'}
          </span>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-light tracking-[0.2em] italic font-serif uppercase">Nova</h1>
        </div>
        <div className="text-right">
          <span className="font-mono text-sm opacity-60">{formatTime(time)}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative flex flex-col items-center justify-center flex-grow z-10"
          >
            {/* Central Presence Orb */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <motion.div 
                animate={{ scale: [1, 1.05, 1], opacity: [0.05, 0.1, 0.05] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute w-full h-full rounded-full border border-white"
              />
              <motion.div 
                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute w-[80%] h-[80%] rounded-full border border-white"
              />
              <motion.div 
                whileHover={{ scale: 1.05 }}
                onClick={startCall}
                className="w-32 h-32 bg-white/5 rounded-full orb-glow flex items-center justify-center cursor-pointer group"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-2xl group-active:scale-95 transition-transform">
                  <Phone size={24} className="text-black" />
                </div>
              </motion.div>
            </div>

            <div className="mt-16 text-center max-w-lg">
              <h2 className="text-3xl font-light leading-relaxed text-blue-50/90 font-serif italic mb-4">
                Hey, I’m Nova.
              </h2>
              <p className="text-white/40 uppercase tracking-[0.3em] text-[10px] font-semibold">
                Tap the orb to begin call
              </p>
              {error && <p className="mt-4 text-red-500/60 text-xs font-mono">{error}</p>}
            </div>
          </motion.div>
        )}

        {(status === 'linking' || status === 'calling') && (
          <motion.div
            key="calling"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center flex-grow z-10"
          >
            <div className="relative w-32 h-32 mb-8">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                  className="absolute inset-0 rounded-full border border-white/20"
                />
              ))}
              <div className="absolute inset-0 rounded-full bg-white flex items-center justify-center">
                <Activity size={32} className="text-black animate-pulse" />
              </div>
            </div>
            <p className="text-xs tracking-[0.4em] uppercase opacity-40 animate-pulse font-semibold">
              Establishing link
            </p>
          </motion.div>
        )}

        {status === 'active' && conversation && (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-20 flex flex-col bg-black"
          >
            <div className="flex-1 relative">
              <iframe 
                src={conversation.conversation_url}
                allow="microphone; autoplay; display-capture; fullscreen"
                className="w-full h-full border-none opacity-80"
                title="Nova Live Session"
              />
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#08080A]/80 via-transparent to-[#08080A]/80" />
            </div>

            {/* In-Call Header Overlay */}
            <div className="absolute top-12 inset-x-12 flex justify-between items-center z-30">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="uppercase tracking-[0.3em] text-[10px] font-semibold opacity-60">Connected</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-sm opacity-60 text-blue-100">{formatTime(time)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Panel (Visible or overlay) */}
      <div className="w-full flex flex-col items-center space-y-8 z-30 pointer-events-none">
        {/* Voice Visualizer Wave */}
        <AnimatePresence>
          {status === 'active' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-end h-8 opacity-40"
            >
              {[0.4, 0.7, 0.9, 0.5, 0.8, 1, 0.6, 0.9, 0.4].map((scale, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [scale * 8, scale * 32, scale * 8] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  className="visualizer-bar"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass-panel rounded-full px-8 py-4 flex items-center space-x-12 pointer-events-auto shadow-2xl">
          <button 
            onClick={() => setIsConsoleOpen(!isConsoleOpen)}
            className={`p-3 transition-colors ${isConsoleOpen ? 'text-blue-400' : 'text-white/40 hover:text-white'}`}
            title="Toggle System Logs"
          >
            <Activity size={22} />
          </button>
          
          <button 
            onClick={status === 'active' ? endCall : (status === 'idle' ? startCall : undefined)}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-lg
              ${status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-white hover:bg-white/90 text-black'}
            `}
          >
            {status === 'active' ? (
              <Phone size={28} className="rotate-[135deg]" fill="currentColor" />
            ) : (
              <Phone size={28} fill="currentColor" />
            )}
          </button>

          <button className="p-3 text-white/40 hover:text-white transition-colors">
            <Info size={22} />
          </button>
        </div>
        
        <div className="pb-4">
          <span className="text-[9px] uppercase tracking-[0.4em] opacity-30 font-bold">
            Powered by Tavus Presence API
          </span>
        </div>
      </div>
    </div>
  );
}
