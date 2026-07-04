import { useEffect, useRef, useState, useCallback } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Users, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface VideoCallProps {
  roomUrl: string;
  token: string;
  userName: string;
  onLeave: () => void;
}

interface Participant {
  session_id: string;
  user_name: string;
  video: boolean;
  audio: boolean;
  screen: boolean;
  local: boolean;
}

export default function VideoCall({ roomUrl, token, userName, onLeave }: VideoCallProps) {
  const callRef = useRef<DailyCall | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [joined, setJoined] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  const syncParticipants = useCallback((callObj: DailyCall) => {
    const all = callObj.participants();
    const list: Participant[] = Object.values(all).map((p: any) => ({
      session_id: p.session_id,
      user_name: p.user_name || "Guest",
      video: p.video,
      audio: p.audio,
      screen: p.screen,
      local: p.local,
    }));
    setParticipants(list);
  }, []);

  useEffect(() => {
    const callObj = DailyIframe.createCallObject({
      audioSource: true,
      videoSource: false,
    });
    callRef.current = callObj;

    callObj.on("joined-meeting", () => {
      setJoined(true);
      syncParticipants(callObj);
    });
    callObj.on("participant-joined", () => syncParticipants(callObj));
    callObj.on("participant-updated", () => syncParticipants(callObj));
    callObj.on("participant-left", () => syncParticipants(callObj));
    callObj.on("left-meeting", () => {
      onLeave();
    });
    callObj.on("error", (ev: any) => {
      const msg = ev?.errorMsg || "Unknown error";
      if (msg.includes("account-missing-payment-method")) {
        toast.error("Video service requires billing setup. Please contact the administrator.");
      } else {
        toast.error(`Call error: ${msg}`);
      }
      onLeave();
    });
    callObj.on("app-message", (ev: any) => {
      if (ev?.data?.type === "chat") {
        setChatMessages(prev => [...prev, { sender: ev.data.sender, text: ev.data.text }]);
      }
    });

    callObj.join({ url: roomUrl, token, userName });

    return () => {
      callObj.leave().catch(() => {});
      callObj.destroy();
    };
  }, [roomUrl, token, userName]);

  const toggleMic = () => {
    callRef.current?.setLocalAudio(!micOn);
    setMicOn(!micOn);
  };

  const toggleCam = () => {
    callRef.current?.setLocalVideo(!camOn);
    setCamOn(!camOn);
  };

  const toggleScreen = async () => {
    if (screenOn) {
      callRef.current?.stopScreenShare();
      setScreenOn(false);
    } else {
      callRef.current?.startScreenShare();
      setScreenOn(true);
    }
  };

  const leaveMeeting = () => {
    callRef.current?.leave();
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    callRef.current?.sendAppMessage({ type: "chat", sender: userName, text: chatInput.trim() }, "*");
    setChatMessages(prev => [...prev, { sender: "You", text: chatInput.trim() }]);
    setChatInput("");
  };

  // Attach video + audio tracks into per-participant slots
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  useEffect(() => {
    if (!joined || !callRef.current) return;
    const all = callRef.current.participants();
    Object.values(all).forEach((p: any) => {
      const videoEl = videoRefs.current[p.session_id];
      if (videoEl) {
        if (p.videoTrack) {
          const current = videoEl.srcObject as MediaStream | null;
          const currentId = current?.getVideoTracks()[0]?.id;
          if (currentId !== p.videoTrack.id) {
            videoEl.srcObject = new MediaStream([p.videoTrack]);
            videoEl.play().catch(() => {});
          }
        } else if (videoEl.srcObject) {
          videoEl.srcObject = null;
        }
      }
      const audioEl = audioRefs.current[p.session_id];
      if (audioEl && !p.local) {
        if (p.audioTrack) {
          const current = audioEl.srcObject as MediaStream | null;
          const currentId = current?.getAudioTracks()[0]?.id;
          if (currentId !== p.audioTrack.id) {
            audioEl.srcObject = new MediaStream([p.audioTrack]);
            audioEl.play().catch(() => {
              toast.info("Tap anywhere to enable audio", { id: "audio-unlock" });
              const unlock = () => {
                audioEl.play().catch(() => {});
                document.removeEventListener("click", unlock);
              };
              document.addEventListener("click", unlock);
            });
          }
        } else if (audioEl.srcObject) {
          audioEl.srcObject = null;
        }
      }
    });
  }, [joined, participants]);

  const gridCols = participants.length <= 1 ? "grid-cols-1" :
    participants.length <= 4 ? "grid-cols-2" :
    participants.length <= 9 ? "grid-cols-3" : "grid-cols-4";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-b border-white/10">
        <div className="flex items-center gap-2 text-white">
          <Users size={18} />
          <span className="text-sm font-medium">{participants.length} in call</span>
        </div>
        <div className="flex items-center gap-2">
          {!joined && <span className="text-yellow-400 text-sm animate-pulse">Connecting...</span>}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 overflow-hidden p-3 flex">
        <div className={`flex-1 grid ${gridCols} gap-2 auto-rows-fr`} ref={containerRef}>
          {participants.map((p) => (
            <div
              key={p.session_id}
              className="relative bg-muted/20 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden"
            >
              <video
                ref={(el) => { videoRefs.current[p.session_id] = el; }}
                autoPlay
                playsInline
                muted={p.local}
                className={`absolute inset-0 w-full h-full object-cover ${p.video ? "" : "hidden"}`}
              />
              {!p.local && (
                <audio
                  ref={(el) => { audioRefs.current[p.session_id] = el; }}
                  autoPlay
                />
              )}
              {!p.video && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-white">
                    {(p.user_name || "G")[0].toUpperCase()}
                  </div>
                  <span className="text-white/70 text-sm">{p.user_name}</span>
                </div>
              )}
              {/* Name tag */}
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-white text-xs flex items-center gap-1 z-10">
                {!p.audio && <MicOff size={10} className="text-red-400" />}
                {p.local ? "You" : p.user_name}
              </div>
            </div>
          ))}
        </div>

        {/* Chat Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="ml-2 flex flex-col bg-black/60 border border-white/10 rounded-xl overflow-hidden"
            >
              <div className="p-3 border-b border-white/10 text-white text-sm font-medium">Chat</div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.map((m, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-primary font-medium">{m.sender}: </span>
                    <span className="text-white/80">{m.text}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-white/10 flex gap-2">
                <input
                  className="flex-1 bg-white/10 text-white text-sm rounded px-2 py-1.5 outline-none placeholder:text-white/30"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                />
                <Button size="sm" variant="ghost" className="text-white" onClick={sendChat}>Send</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-4 bg-black/80 border-t border-white/10">
        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-14 h-14 ${micOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500/80 text-white hover:bg-red-500"}`}
          onClick={toggleMic}
        >
          {micOn ? <Mic size={22} /> : <MicOff size={22} />}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-14 h-14 ${camOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
          onClick={toggleCam}
        >
          {camOn ? <Video size={22} /> : <VideoOff size={22} />}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-14 h-14 ${screenOn ? "bg-blue-500/80 text-white hover:bg-blue-500" : "bg-white/10 text-white hover:bg-white/20"}`}
          onClick={toggleScreen}
        >
          <Monitor size={22} />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-14 h-14 ${showChat ? "bg-primary/30 text-primary" : "bg-white/10 text-white hover:bg-white/20"}`}
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare size={22} />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="rounded-full w-14 h-14 bg-red-600 text-white hover:bg-red-700"
          onClick={leaveMeeting}
        >
          <PhoneOff size={22} />
        </Button>
      </div>
    </motion.div>
  );
}
