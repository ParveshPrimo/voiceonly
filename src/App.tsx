import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Daily, { DailyCall } from "@daily-co/daily-js";
import { Phone, PhoneOff, Mic, MicOff, Activity } from "lucide-react";

type PersonaState = "idle" | "listening" | "speaking" | "thinking";
type CallStatus = "idle" | "linking" | "calling" | "active" | "ended";

export default function App() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [personaState, setPersonaState] = useState<PersonaState>("idle");
  const [userIsSpeaking, setUserIsSpeaking] = useState(false);
  const [time, setTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callRef = useRef<DailyCall | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // --- LOCAL MIC ANALYSIS (For User Speaking UI) ---
  const startLocalAudioAnalysis = async (stream: MediaStream) => {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudio = () => {
      if (!analyserRef.current) return;
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;

      // If volume is above threshold, user is speaking
      setUserIsSpeaking(average > 15);
      requestAnimationFrame(checkAudio);
    };
    checkAudio();
  };

  const startCall = async () => {
    setStatus("linking");
    try {
      const response = await fetch("https://tavusapi.com/v2/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_TAVUS_API_KEY,
        },
        body: JSON.stringify({
          persona_id: import.meta.env.VITE_PERSONA_ID,
          audio_only: true,
          properties: { max_call_duration: 3600 },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Failed");

      const call = Daily.createCallObject({
        audioSource: true,
        videoSource: false,
      });
      callRef.current = call;

      // --- TAVUS EVENT LISTENER ---
      call.on("app-message", (msg) => {
        // Tavus sends the state of the persona through app-messages
        if (msg.data?.event_type === "conversation.persona-state") {
          setPersonaState(msg.data.properties.state);
        }
      });

      call.on("joined-meeting", () => {
        setStatus("active");
        startTimer();
        // Start analyzing local mic for user UI
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then(startLocalAudioAnalysis);
      });

      call.on("track-started", (event) => {
        if (event.participant?.local || event.track.kind !== "audio") return;
        const audioEl = document.createElement("audio");
        audioEl.srcObject = new MediaStream([event.track]);
        audioEl.autoplay = true;
        audioEl.id = `audio-${event.participant.session_id}`;
        document.body.appendChild(audioEl);
      });

      await call.join({ url: data.conversation_url });
    } catch (err: any) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const endCall = () => {
    callRef.current?.leave();
    callRef.current?.destroy();
    if (audioContextRef.current) audioContextRef.current.close();
    document.querySelectorAll("audio").forEach((el) => el.remove());
    setStatus("idle");
    setPersonaState("idle");
    setTime(0);
  };

  const toggleMute = () => {
    const next = !isMuted;
    callRef.current?.setLocalAudio(!next);
    setIsMuted(next);
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => setTime((prev) => prev + 1), 1000);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="relative min-h-screen bg-[#060608] text-white flex flex-col items-center justify-between p-12 overflow-hidden font-sans">
      {/* HEADER */}
      <div className="w-full flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${status === "active" ? "bg-green-500 animate-pulse" : "bg-white/20"}`}
          />
          <span className="text-[10px] uppercase tracking-widest opacity-40">
            System: {status}
          </span>
        </div>
        <div className="text-xl font-light tracking-[0.2em] italic uppercase">
          
        </div>
        <div className="font-mono opacity-40">{formatTime(time)}</div>
      </div>

      {/* MAIN VISUALIZER AREA */}
      <div className="relative flex flex-col items-center justify-center flex-grow w-full">
        <AnimatePresence mode="wait">
          {status === "idle" ? (
            <motion.button
              key="start"
              whileHover={{ scale: 1.05 }}
              onClick={startCall}
              className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)]"
            >
              <Phone size={32} className="text-black" />
            </motion.button>
          ) : (
            <div className="relative flex items-center justify-center">
              {/* USER SPEAKING LAYER (Blue Aura) */}
              <motion.div
                animate={{
                  scale: userIsSpeaking ? [1, 1.4, 1.2] : 1,
                  opacity: userIsSpeaking ? [0.2, 0.5, 0.3] : 0,
                }}
                transition={{
                  duration: 0.4,
                  repeat: userIsSpeaking ? Infinity : 0,
                }}
                className="absolute w-80 h-80 rounded-full bg-blue-500/20 blur-3xl"
              />

              {/* REPLICA SPEAKING LAYER (Green Waveform) */}
              <motion.div
                animate={{
                  scale: personaState === "speaking" ? [1, 1.1, 1] : 1,
                  rotate: personaState === "speaking" ? [0, 90, 180, 270] : 0,
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className={`absolute w-64 h-64 border-2 rounded-[40%] transition-colors duration-500 ${
                  personaState === "speaking"
                    ? "border-green-400 opacity-60"
                    : "border-white/10 opacity-20"
                }`}
              />

              {/* CENTRAL CORE ORB */}
              <motion.div
                animate={{
                  backgroundColor:
                    personaState === "speaking" ? "#22c55e" : "#ffffff",
                  scale: personaState === "thinking" ? [1, 0.9, 1] : 1,
                  boxShadow:
                    personaState === "speaking"
                      ? "0 0 40px #22c55e"
                      : "0 0 20px rgba(255,255,255,0.1)",
                }}
                className="relative w-32 h-32 rounded-full z-10 flex items-center justify-center transition-colors duration-500"
              >
                {personaState === "speaking" ? (
                  <Activity size={32} className="text-black" />
                ) : personaState === "thinking" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full" />
                  </motion.div>
                ) : (
                  <div className="w-1 h-1 bg-black rounded-full" />
                )}
              </motion.div>

              {/* LABEL */}
              <div className="absolute -bottom-24 text-center">
                <p className="text-[10px] uppercase tracking-[0.5em] font-bold opacity-30 mb-2">
                  {personaState === "speaking"
                    ? "Nova Speaking"
                    : userIsSpeaking
                      ? "You are Speaking"
                      : "Listening"}
                </p>
                <div className="flex gap-1 justify-center items-end h-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: personaState === "speaking" ? [4, 16, 4] : 4,
                      }}
                      transition={{ repeat: Infinity, delay: i * 0.1 }}
                      className="w-1 bg-white/20 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* FOOTER CONTROLS */}
      {status === "active" && (
        <div className="bg-[#121214] border border-white/10 p-4 px-10 rounded-full flex items-center gap-12 shadow-2xl z-20">
          <button
            onClick={toggleMute}
            className={`transition-colors ${isMuted ? "text-red-500" : "text-white/40 hover:text-white"}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={endCall}
            className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-all rotate-[135deg]"
          >
            <Phone size={24} fill="currentColor" />
          </button>

          <div className="text-white/20">
            <Activity size={24} />
          </div>
        </div>
      )}
    </div>
  );
}
