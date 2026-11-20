import React, { useState } from "react";
import {
  X,
  PhoneIncoming,
  PhoneOff,
  Bot,
  Volume2,
  Sparkles,
  CheckCircle2,
  Radio,
  Play,
  RotateCw,
} from "lucide-react";
import { VirtualNumberRecord } from "./AddEditVirtualNumberModal";
import { toast } from "sonner";

interface InboundSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  number: VirtualNumberRecord | null;
}

export const InboundSimulatorModal: React.FC<InboundSimulatorModalProps> = ({
  isOpen,
  onClose,
  number,
}) => {
  const [callerPhone, setCallerPhone] = useState("+91 98200 11222");
  const [callerName, setCallerName] = useState("Rahul Mehta");
  const [isCalling, setIsCalling] = useState(false);
  const [callSession, setCallSession] = useState<{
    callId: string;
    assignedAgent: any;
    greetingPrompt: string;
    status: "ringing" | "connected" | "ended";
  } | null>(null);

  if (!isOpen || !number) return null;

  const handleStartSimulatedCall = async () => {
    setIsCalling(true);
    setCallSession({
      callId: `sim_${Date.now()}`,
      assignedAgent: {
        name:
          number.assignedAgentId === "agent_aarogya_dental"
            ? "Priya · Aarogya Dental Care"
            : "Aarti · CallForge Banking",
      },
      greetingPrompt:
        number.inboundRouting?.greetingMessage ||
        "Namaste! Welcome to CallForge AI Assistant. Connecting your call now.",
      status: "ringing",
    });

    try {
      const res = await fetch("/api/calling/virtual-numbers/test-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: number.id,
          callerPhone,
          callerName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Switch to connected after brief ring
        setTimeout(() => {
          setCallSession((prev) => (prev ? { ...prev, status: "connected" } : null));
          toast.success("Inbound call connected to AI agent!");
        }, 1200);
      } else {
        toast.error(data.error || "Simulated call failed");
        setCallSession(null);
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
      setCallSession(null);
    } finally {
      setIsCalling(false);
    }
  };

  const handleHangup = () => {
    if (callSession) {
      setCallSession({ ...callSession, status: "ended" });
      setTimeout(() => {
        setCallSession(null);
      }, 1000);
      toast.info("Call ended cleanly");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <PhoneIncoming className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Inbound Call Flow Simulator</h2>
              <p className="text-xs text-zinc-400">
                Simulate a customer dialing into <span className="font-mono text-zinc-200">{number.phoneNumber}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!callSession ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                  Simulated Customer Profile
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Customer Phone</label>
                    <input
                      type="text"
                      value={callerPhone}
                      onChange={(e) => setCallerPhone(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 font-mono text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={callerName}
                      onChange={(e) => setCallerName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Target Virtual DID:</span>
                  <span className="font-mono font-bold text-zinc-200">{number.phoneNumber}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Telephony Carrier:</span>
                  <span className="capitalize text-emerald-400 font-semibold">{number.provider.replace("_", " ")}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Assigned Agent:</span>
                  <span className="font-semibold text-zinc-200">
                    {number.assignedAgentId === "agent_aarogya_dental"
                      ? "Priya (Aarogya Dental Care)"
                      : "Aarti (Banking Specialist)"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStartSimulatedCall}
                disabled={isCalling}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
              >
                <PhoneIncoming size={15} />
                <span>Simulate Inbound Call Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 text-center space-y-3">
                <div className="relative inline-block">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                    <Bot size={28} />
                  </div>
                  {callSession.status === "connected" && (
                    <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-zinc-950 animate-ping" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-zinc-100">{callSession.assignedAgent.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        callSession.status === "ringing" ? "bg-amber-400 animate-ping" : "bg-emerald-400"
                      }`}
                    />
                    <span className="text-xs font-medium text-zinc-300 capitalize">
                      {callSession.status === "ringing" ? "Ringing Virtual Trunk..." : "Live Inbound Conversation"}
                    </span>
                  </div>
                </div>

                {callSession.status === "connected" && (
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 text-left space-y-1.5 mt-3 animate-in fade-in">
                    <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Volume2 size={12} />
                      AI Speech Stream:
                    </span>
                    <p className="text-xs text-zinc-200 italic leading-relaxed">
                      "{callSession.greetingPrompt}"
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleHangup}
                  className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-950/50"
                >
                  <PhoneOff size={14} />
                  <span>Hang Up Call</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
