import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Users, MessageSquare, Hand, MicVocal, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VideoCallProps {
  roomUrl: string;
  token: string;
  userName: string;
  onLeave: () => void;
  groupId?: string;
  userId?: string;
  groupName?: string;
  isModerator?: boolean;
}


interface Participant {
  session_id: string;
  user_name: string;
  video: boolean;
  audio: boolean;
  screen: boolean;
  local: boolean;
}

function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function VideoCall({ roomUrl, token, userName, onLeave, groupId, userId, groupName, isModerator = false }: VideoCallProps) {
  const participationIdRef = useRef<string | null>(null);
  const joinedAtRef = useRef<number | null>(null);

  const callRef = useRef<DailyCall | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(false);
  const [screenOn, setScreenOn] = useState(false);
  const [joined, setJoined] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPeople, setShowPeople] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Coordination state — kept in-call, no schema changes needed.
  const [raisedHands, setRaisedHands] = useState<Record<string, number>>({});
  const [modMuted, setModMuted] = useState<Record<string, boolean>>({});
  const [myHandRaised, setMyHandRaised] = useState(false);
  const myHandRaisedRef = useRef(false);
  const localSessionIdRef = useRef<string | null>(null);

  // Live meeting timer, anchored to the stored session start so refresh/reconnect is accurate.
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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
    const local = list.find((p) => p.local);
    if (local) localSessionIdRef.current = local.session_id;
    setParticipants(list);
  }, []);

  useEffect(() => {
    const callObj = DailyIframe.createCallObject({
      audioSource: true,
      videoSource: false,
      // High-quality audio: use browser AEC/NS/AGC + Daily's music-mode-friendly
      // stereo/high-bitrate Opus so voices come through crisp, not crackly.
      dailyConfig: {
        useDevicePreferenceCookies: true,
        micAudioMode: "speech",
        audioBitrate: 64000,
      } as any,
    });

    // Best-in-class capture constraints for the mic (Opus + browser DSP).
    try {
      (callObj as any).setAudioSource?.({
        deviceId: undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        channelCount: 1,
        sampleRate: 48000,
        sampleSize: 16,
      });
    } catch {}

    // Prefer high-quality Opus send settings (stereo-capable, 32kbps floor).
    try {
      (callObj as any).updateSendSettings?.({
        audio: {
          channelCount: 1,
          maxBitrate: 64000,
        },
      });
    } catch {}
    callRef.current = callObj;

    // Adaptive send quality — start balanced, react to network quality.
    const applySendPreset = (preset: "bandwidth-optimized" | "default-video" | "bandwidth-and-quality-balanced") => {
      try {
        callObj.updateSendSettings({ video: preset as any });
      } catch {}
    };

    callObj.on("joined-meeting", async () => {
      setJoined(true);
      syncParticipants(callObj);
      applySendPreset("bandwidth-and-quality-balanced");
      if (groupId && userId) {
        joinedAtRef.current = Date.now();
        try {
          const { data } = await supabase.from("group_call_participations").insert({
            group_id: groupId,
            user_id: userId,
            participant_name: userName,
          }).select("id").single();
          if (data) participationIdRef.current = data.id;
        } catch {}

        // Anchor the meeting timer to the earliest still-active join for this group.
        try {
          const { data: firstJoin } = await supabase
            .from("group_call_participations")
            .select("joined_at")
            .eq("group_id", groupId)
            .is("left_at", null)
            .order("joined_at", { ascending: true })
            .limit(1)
            .maybeSingle();
          if (firstJoin?.joined_at) setSessionStart(new Date(firstJoin.joined_at).getTime());
          else setSessionStart(Date.now());
        } catch {
          setSessionStart(Date.now());
        }
      } else {
        setSessionStart(Date.now());
      }
    });

    callObj.on("participant-joined", () => {
      syncParticipants(callObj);
      // Re-announce our own hand so late joiners see the correct state.
      if (myHandRaisedRef.current) {
        try {
          callObj.sendAppMessage({ type: "hand", raised: true, at: Date.now(), session_id: localSessionIdRef.current }, "*");
        } catch {}
      }
    });
    callObj.on("participant-updated", () => syncParticipants(callObj));
    callObj.on("participant-left", (ev: any) => {
      const sid = ev?.participant?.session_id;
      if (sid) {
        setRaisedHands((prev) => {
          const next = { ...prev };
          delete next[sid];
          return next;
        });
        setModMuted((prev) => {
          const next = { ...prev };
          delete next[sid];
          return next;
        });
      }
      syncParticipants(callObj);
    });
    callObj.on("left-meeting", () => {
      onLeave();
    });
    // React to changing network conditions in real time.
    callObj.on("network-quality-change", (ev: any) => {
      const threshold = ev?.threshold; // "good" | "low" | "very-low"
      if (threshold === "very-low") {
        applySendPreset("bandwidth-optimized");
      } else if (threshold === "low") {
        applySendPreset("bandwidth-and-quality-balanced");
      } else {
        applySendPreset("default-video");
      }
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
      const d = ev?.data;
      if (!d) return;
      if (d.type === "chat") {
        setChatMessages(prev => [...prev, { sender: d.sender, text: d.text }]);
        return;
      }
      const sid = d.session_id || ev.fromId;
      if (d.type === "hand") {
        setRaisedHands((prev) => {
          const next = { ...prev };
          if (d.raised) next[sid] = d.at || Date.now();
          else delete next[sid];
          return next;
        });
        return;
      }
      if (d.type === "lower-hand" && d.target === localSessionIdRef.current) {
        myHandRaisedRef.current = false;
        setMyHandRaised(false);
        setRaisedHands((prev) => {
          const next = { ...prev };
          delete next[localSessionIdRef.current!];
          return next;
        });
        try {
          callObj.sendAppMessage({ type: "hand", raised: false, session_id: localSessionIdRef.current }, "*");
        } catch {}
        toast.info("A moderator lowered your hand");
        return;
      }
      if (d.type === "mod-mute") {
        const targets: string[] = d.targets || [];
        setModMuted((prev) => {
          const next = { ...prev };
          targets.forEach((t) => { next[t] = true; });
          return next;
        });
        if (targets.includes(localSessionIdRef.current || "")) {
          setMicOn(false);
          toast.info("You were muted by a moderator. You can unmute yourself when invited.");
        }
      }
    });

    callObj.join({ url: roomUrl, token, userName });

    return () => {
      const pid = participationIdRef.current;
      const startedAt = joinedAtRef.current;
      if (pid && startedAt) {
        const durationSec = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
        supabase.from("group_call_participations")
          .update({ left_at: new Date().toISOString(), duration_seconds: durationSec })
          .eq("id", pid)
          .then(() => {});
      }
      callObj.leave().catch(() => {});
      callObj.destroy();
    };
  }, [roomUrl, token, userName, groupId, userId]);


  const toggleMic = () => {
    const next = !micOn;
    callRef.current?.setLocalAudio(next);
    setMicOn(next);
    if (next && localSessionIdRef.current) {
      // Self-unmute clears the "muted by moderator" label for this participant.
      setModMuted((prev) => {
        const n = { ...prev };
        delete n[localSessionIdRef.current!];
        return n;
      });
    }
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

  const toggleHand = () => {
    const sid = localSessionIdRef.current;
    if (!sid) return;
    const raised = !myHandRaised;
    myHandRaisedRef.current = raised;
    setMyHandRaised(raised);
    setRaisedHands((prev) => {
      const next = { ...prev };
      if (raised) next[sid] = Date.now();
      else delete next[sid];
      return next;
    });
    try {
      callRef.current?.sendAppMessage({ type: "hand", raised, at: Date.now(), session_id: sid }, "*");
    } catch {}
  };

  // Moderator: force-mute. Browsers do not allow forcing another person's mic back ON,
  // so we never pretend to — the participant must unmute themselves.
  const muteParticipant = (sessionId: string) => {
    try {
      callRef.current?.updateParticipant(sessionId, { setAudio: false });
      callRef.current?.sendAppMessage({ type: "mod-mute", targets: [sessionId] }, "*");
      setModMuted((prev) => ({ ...prev, [sessionId]: true }));
    } catch {
      toast.error("Could not mute this participant");
    }
  };

  const muteAll = () => {
    const targets = participants.filter((p) => !p.local).map((p) => p.session_id);
    if (!targets.length) return;
    try {
      targets.forEach((sid) => callRef.current?.updateParticipant(sid, { setAudio: false }));
      callRef.current?.sendAppMessage({ type: "mod-mute", targets }, "*");
      setModMuted((prev) => {
        const next = { ...prev };
        targets.forEach((t) => { next[t] = true; });
        return next;
      });
      toast.success("All participants muted");
    } catch {
      toast.error("Could not mute all participants");
    }
  };

  const lowerHandFor = (sessionId: string) => {
    if (sessionId === localSessionIdRef.current) {
      toggleHand();
      return;
    }
    try {
      callRef.current?.sendAppMessage({ type: "lower-hand", target: sessionId }, "*");
    } catch {}
    setRaisedHands((prev) => {
      const next = { ...prev };
      delete next[sessionId];
      return next;
    });
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

  // Hands first, in the order they were raised.
  const orderedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      const ha = raisedHands[a.session_id];
      const hb = raisedHands[b.session_id];
      if (ha && hb) return ha - hb;
      if (ha) return -1;
      if (hb) return 1;
      return 0;
    });
  }, [participants, raisedHands]);

  const handCount = Object.keys(raisedHands).length;
  const elapsed = sessionStart ? formatElapsed(now - sessionStart) : "00:00:00";

  const micLabel = (p: Participant) => {
    if (modMuted[p.session_id]) return "Muted by moderator";
    return p.audio ? "Mic On" : "Muted";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-3 sm:px-4 py-3 bg-card/80 border-b border-border">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-serif font-semibold text-foreground leading-tight">Prayer Room</h2>
          {groupName && (
            <p className="text-xs sm:text-sm text-accent truncate">{groupName}</p>
          )}
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-green-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              LIVE
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">{elapsed}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isModerator && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-accent border border-accent/30 rounded-full px-2 py-0.5">
              <ShieldCheck size={12} /> Moderator
            </span>
          )}
          {handCount > 0 && (
            <button
              onClick={() => setShowPeople(true)}
              className="inline-flex items-center gap-1 text-xs text-accent border border-accent/30 rounded-full px-2 py-0.5"
            >
              <Hand size={12} /> {handCount}
            </button>
          )}
          <button
            onClick={() => setShowPeople((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Users size={16} />
            <span>{participants.length}</span>
          </button>
          {!joined && <span className="text-accent text-xs animate-pulse">Connecting…</span>}
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 overflow-hidden p-2 sm:p-3 flex">
        <div className={`flex-1 grid ${gridCols} gap-2 auto-rows-fr min-w-0`} ref={containerRef}>
          {participants.map((p) => (
            <div
              key={p.session_id}
              className="relative bg-muted/20 rounded-xl border border-border flex items-center justify-center overflow-hidden"
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
                <div className="flex flex-col items-center gap-2 px-2 text-center">
                  <div className="w-16 h-16 rounded-full bg-accent/15 flex items-center justify-center text-2xl font-bold text-foreground">
                    {(p.user_name || "G")[0].toUpperCase()}
                  </div>
                  <span className="text-muted-foreground text-sm">{p.user_name}</span>
                  {groupName && <span className="text-[11px] text-muted-foreground/70">{groupName}</span>}
                </div>
              )}
              {raisedHands[p.session_id] && (
                <div className="absolute top-2 right-2 bg-accent text-accent-foreground rounded-full p-1.5 z-10">
                  <Hand size={12} />
                </div>
              )}
              {/* Name tag */}
              <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-0.5 rounded text-foreground text-xs flex items-center gap-1 z-10">
                {!p.audio && <MicOff size={10} className="text-destructive" />}
                {p.local ? "You" : p.user_name}
              </div>
            </div>
          ))}
        </div>

        {/* Participants Panel */}
        <AnimatePresence>
          {showPeople && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="ml-2 flex flex-col bg-card/70 border border-border rounded-xl overflow-hidden shrink-0"
            >
              <div className="p-3 border-b border-border text-foreground text-sm font-medium flex items-center justify-between">
                <span>Participants</span>
                {isModerator && (
                  <button onClick={muteAll} className="text-xs text-accent hover:underline">Mute All</button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {orderedParticipants.map((p) => (
                  <div key={p.session_id} className="rounded-lg px-2.5 py-2 hover:bg-muted/30">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">{p.local ? `${p.user_name} (You)` : p.user_name}</p>
                        {groupName && <p className="text-[11px] text-muted-foreground truncate">{groupName}</p>}
                        <p className="text-[11px] mt-0.5 flex items-center gap-2">
                          <span className={p.audio ? "text-green-500" : "text-muted-foreground"}>
                            {micLabel(p)}
                          </span>
                          {raisedHands[p.session_id] && (
                            <span className="text-accent inline-flex items-center gap-1"><Hand size={10} /> Hand Raised</span>
                          )}
                        </p>
                      </div>
                      {isModerator && !p.local && (
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {p.audio && (
                            <button onClick={() => muteParticipant(p.session_id)} className="text-[11px] text-muted-foreground hover:text-destructive">
                              Mute
                            </button>
                          )}
                          {raisedHands[p.session_id] && (
                            <button onClick={() => lowerHandFor(p.session_id)} className="text-[11px] text-muted-foreground hover:text-accent">
                              Lower Hand
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {isModerator && (
                <p className="p-2 text-[11px] text-muted-foreground border-t border-border leading-snug">
                  You can mute a participant, but only they can turn their own microphone back on.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Panel */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="ml-2 flex flex-col bg-card/70 border border-border rounded-xl overflow-hidden shrink-0"
            >
              <div className="p-3 border-b border-border text-foreground text-sm font-medium">Chat</div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {chatMessages.map((m, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-accent font-medium">{m.sender}: </span>
                    <span className="text-foreground/80">{m.text}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 border-t border-border flex gap-2">
                <input
                  className="flex-1 bg-muted/40 text-foreground text-sm rounded px-2 py-1.5 outline-none placeholder:text-muted-foreground"
                  placeholder="Type a message..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                />
                <Button size="sm" variant="ghost" onClick={sendChat}>Send</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3 py-3 sm:py-4 bg-card/80 border-t border-border">
        <Button
          variant="ghost"
          size="lg"
          title={micOn ? "Mute microphone" : "Unmute microphone"}
          className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 ${micOn ? "bg-muted/40 text-foreground hover:bg-muted/60" : "bg-destructive/80 text-destructive-foreground hover:bg-destructive"}`}
          onClick={toggleMic}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          title={myHandRaised ? "Lower hand" : "Raise hand"}
          className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 ${myHandRaised ? "bg-accent text-accent-foreground hover:opacity-90" : "bg-muted/40 text-foreground hover:bg-muted/60"}`}
          onClick={toggleHand}
        >
          <Hand size={20} />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 ${camOn ? "bg-muted/40 text-foreground hover:bg-muted/60" : "bg-muted/20 text-muted-foreground hover:bg-muted/40"}`}
          onClick={toggleCam}
        >
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 ${screenOn ? "bg-accent/30 text-accent" : "bg-muted/40 text-foreground hover:bg-muted/60"}`}
          onClick={toggleScreen}
        >
          <Monitor size={20} />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 ${showPeople ? "bg-accent/30 text-accent" : "bg-muted/40 text-foreground hover:bg-muted/60"}`}
          onClick={() => setShowPeople(!showPeople)}
        >
          <Users size={20} />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className={`rounded-full w-12 h-12 sm:w-14 sm:h-14 ${showChat ? "bg-accent/30 text-accent" : "bg-muted/40 text-foreground hover:bg-muted/60"}`}
          onClick={() => setShowChat(!showChat)}
        >
          <MessageSquare size={20} />
        </Button>
        {isModerator && (
          <Button
            variant="ghost"
            size="lg"
            title="Mute all participants"
            className="rounded-full h-12 sm:h-14 px-4 bg-muted/40 text-foreground hover:bg-muted/60 gap-2"
            onClick={muteAll}
          >
            <MicVocal size={18} />
            <span className="text-xs font-medium">Mute All</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="lg"
          className="rounded-full w-12 h-12 sm:w-14 sm:h-14 bg-destructive text-destructive-foreground hover:bg-destructive/90"
          onClick={leaveMeeting}
        >
          <PhoneOff size={20} />
        </Button>
      </div>
    </motion.div>
  );
}
