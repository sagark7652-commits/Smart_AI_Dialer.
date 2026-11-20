import React, { useState, useEffect } from "react";
import {
  X,
  Phone,
  PhoneCall,
  ShieldCheck,
  Bot,
  Workflow,
  Radio,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Server,
  Layers,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export interface VirtualNumberRecord {
  id: string;
  phoneNumber: string;
  friendlyName: string;
  provider: "tata_smartflo" | "twilio" | "exotel" | "custom_sip";
  status: "active" | "inactive" | "pending_validation" | "error";
  type: "inbound" | "outbound" | "bidirectional";
  capabilities: Array<"voice" | "sms" | "recording" | "realtime_streaming">;
  assignedAgentId: string;
  inboundRouting: {
    routeType: "ai_agent" | "ivr" | "human_queue" | "forward";
    ivrFlowId?: string;
    forwardNumber?: string;
    greetingMessage?: string;
    voiceLanguage?: string;
    recordCalls: boolean;
    businessHoursOnly?: boolean;
  };
  providerConfig?: {
    accountSid?: string;
    apiKey?: string;
    apiToken?: string;
    sipTrunk?: string;
    subaccount?: string;
    region?: string;
  };
  webhookUrl: string;
  isDefaultOutbound: boolean;
  stats?: {
    totalCalls: number;
    inboundCalls: number;
    outboundCalls: number;
    lastCallAt?: string;
    activeChannels: number;
  };
  validation?: {
    status: "verified" | "unverified" | "failed";
    lastValidatedAt?: string;
    carrierName?: string;
    latencyMs?: number;
    message?: string;
  };
}

interface AddEditVirtualNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingNumber?: VirtualNumberRecord | null;
}

const PROVIDER_OPTIONS = [
  {
    id: "tata_smartflo",
    name: "Tata Smartflo",
    badge: "Enterprise SIP",
    color: "from-blue-600/20 to-indigo-600/20 border-blue-500/40 text-blue-400",
    description: "Direct Indian GSM cellular gateway with NVIDIA Riva Speech Pipeline & Nemotron LLM.",
    tag: "Recommended for India",
  },
  {
    id: "twilio",
    name: "Twilio Voice",
    badge: "Global PSTN",
    color: "from-rose-600/20 to-red-600/20 border-rose-500/40 text-rose-400",
    description: "Programmable international DID numbers with WebRTC media streaming and SMS support.",
    tag: "Global Toll-Free",
  },
  {
    id: "exotel",
    name: "Exotel India",
    badge: "Virtual Telephony",
    color: "from-amber-600/20 to-orange-600/20 border-amber-500/40 text-amber-400",
    description: "India virtual landline & mobile numbers with Flow Applets & IVR gather webhooks.",
    tag: "Domestic Cloud IVR",
  },
  {
    id: "custom_sip",
    name: "Custom SIP / PBX",
    badge: "BYOC Trunk",
    color: "from-emerald-600/20 to-teal-600/20 border-emerald-500/40 text-emerald-400",
    description: "Bring Your Own Carrier (BYOC) - Asterisk, FreePBX, Cisco CUCM, or local GSM gateway.",
    tag: "On-Prem / Private",
  },
];

const AGENT_PRESETS = [
  {
    id: "agent_aarogya_dental",
    name: "Priya · Aarogya Dental Care",
    desc: "Appointments, dental doctor consultations, and clinic hours in Hindi / Marathi / English.",
    defaultGreeting:
      "Namaste! Welcome to Aarogya Dental Care. Main Priya bol rahi hoon, bataiye main aapki kya help kar sakti hoon?",
    lang: "hi",
  },
  {
    id: "agent_tata_banking_01",
    name: "Aarti · Tata Banking Specialist",
    desc: "Loan inquiries, EMI schedules, repayment links, and verified customer verification.",
    defaultGreeting:
      "Namaste! Welcome to CallForge Banking Services on a recorded line. How can I help you today?",
    lang: "hi-IN",
  },
  {
    id: "ivr_workflow",
    name: "Interactive IVR Multi-level Flow",
    desc: "Touch-tone DTMF menu routing callers to automated agents or live specialist teams.",
    defaultGreeting: "Welcome to CallForge Interactive IVR. Please listen carefully to the menu options.",
    lang: "en-IN",
  },
];

export const AddEditVirtualNumberModal: React.FC<AddEditVirtualNumberModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingNumber,
}) => {
  const [provider, setProvider] = useState<"tata_smartflo" | "twilio" | "exotel" | "custom_sip">("tata_smartflo");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [friendlyName, setFriendlyName] = useState("");
  const [type, setType] = useState<"inbound" | "outbound" | "bidirectional">("bidirectional");
  const [assignedAgentId, setAssignedAgentId] = useState("agent_aarogya_dental");
  const [routeType, setRouteType] = useState<"ai_agent" | "ivr" | "human_queue" | "forward">("ai_agent");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [voiceLanguage, setVoiceLanguage] = useState("hi");
  const [forwardNumber, setForwardNumber] = useState("");
  const [recordCalls, setRecordCalls] = useState(true);
  const [businessHoursOnly, setBusinessHoursOnly] = useState(false);
  const [isDefaultOutbound, setIsDefaultOutbound] = useState(false);
  const [useSystemConfig, setUseSystemConfig] = useState(true);
  const [customSipTrunk, setCustomSipTrunk] = useState("");
  const [customApiKey, setCustomApiKey] = useState("");
  const [customAccountSid, setCustomAccountSid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingNumber) {
      setProvider(editingNumber.provider);
      setPhoneNumber(editingNumber.phoneNumber);
      setFriendlyName(editingNumber.friendlyName);
      setType(editingNumber.type);
      setAssignedAgentId(editingNumber.assignedAgentId);
      setRouteType(editingNumber.inboundRouting?.routeType || "ai_agent");
      setGreetingMessage(editingNumber.inboundRouting?.greetingMessage || "");
      setVoiceLanguage(editingNumber.inboundRouting?.voiceLanguage || "hi");
      setForwardNumber(editingNumber.inboundRouting?.forwardNumber || "");
      setRecordCalls(editingNumber.inboundRouting?.recordCalls ?? true);
      setBusinessHoursOnly(editingNumber.inboundRouting?.businessHoursOnly ?? false);
      setIsDefaultOutbound(editingNumber.isDefaultOutbound);
      setCustomSipTrunk(editingNumber.providerConfig?.sipTrunk || "");
      setCustomApiKey(editingNumber.providerConfig?.apiKey || "");
      setCustomAccountSid(editingNumber.providerConfig?.accountSid || "");
      setUseSystemConfig(!editingNumber.providerConfig?.apiKey && !editingNumber.providerConfig?.accountSid);
    } else {
      // Defaults for new number
      setProvider("tata_smartflo");
      setPhoneNumber("+91 ");
      setFriendlyName("");
      setType("bidirectional");
      setAssignedAgentId("agent_aarogya_dental");
      setRouteType("ai_agent");
      setGreetingMessage(
        "Namaste! Welcome to Aarogya Dental Care. Main Priya bol rahi hoon, bataiye main aapki kya help kar sakti hoon?"
      );
      setVoiceLanguage("hi");
      setForwardNumber("");
      setRecordCalls(true);
      setBusinessHoursOnly(false);
      setIsDefaultOutbound(false);
      setUseSystemConfig(true);
      setCustomSipTrunk("sip.tatasmartflo.com:5060");
      setCustomApiKey("");
      setCustomAccountSid("");
    }
  }, [editingNumber, isOpen]);

  // When changing agent preset, auto-fill default greeting and language
  const handleAgentChange = (agentId: string) => {
    setAssignedAgentId(agentId);
    const preset = AGENT_PRESETS.find((p) => p.id === agentId);
    if (preset) {
      setGreetingMessage(preset.defaultGreeting);
      setVoiceLanguage(preset.lang);
      if (agentId === "ivr_workflow") {
        setRouteType("ivr");
      } else {
        setRouteType("ai_agent");
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim() || phoneNumber.trim() === "+91") {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!friendlyName.trim()) {
      toast.error("Please provide a friendly label for this number");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        phoneNumber: phoneNumber.trim(),
        friendlyName: friendlyName.trim(),
        provider,
        type,
        assignedAgentId,
        inboundRouting: {
          routeType,
          greetingMessage,
          voiceLanguage,
          forwardNumber,
          recordCalls,
          businessHoursOnly,
        },
        providerConfig: useSystemConfig
          ? {}
          : {
              sipTrunk: customSipTrunk,
              apiKey: customApiKey,
              accountSid: customAccountSid,
            },
        isDefaultOutbound,
        capabilities: ["voice", "recording", "realtime_streaming"],
      };

      const url = editingNumber
        ? `/api/calling/virtual-numbers/${editingNumber.id}`
        : "/api/calling/virtual-numbers";
      const method = editingNumber ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to save virtual number");
        return;
      }

      toast.success(
        editingNumber
          ? `Virtual number ${data.number?.phoneNumber || phoneNumber} updated!`
          : `Virtual number ${data.number?.phoneNumber || phoneNumber} provisioned successfully!`
      );
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error("Network error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                {editingNumber ? "Configure Virtual Number" : "Add New Virtual Phone Number"}
              </h2>
              <p className="text-xs text-zinc-400">
                Bind telecom carrier DIDs with autonomous AI agents and inbound/outbound routing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>1. Telephony Service Provider</span>
              <span className="text-[11px] text-zinc-500">Configurable & Interchangeable</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PROVIDER_OPTIONS.map((opt) => {
                const isSelected = provider === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setProvider(opt.id as any)}
                    className={`p-3 rounded-xl border text-left transition relative cursor-pointer ${
                      isSelected
                        ? "bg-zinc-900 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30"
                        : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-zinc-100">{opt.name}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">{opt.description}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                        <Sparkles size={11} />
                        {opt.tag}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Number Details */}
          <div className="space-y-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Phone size={13} className="text-emerald-400" />
              <span>2. Virtual Number Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Virtual Phone Number (E.164 Format) *
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+912266001234 or +18005550199"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 font-mono text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Must include country code (e.g. +91 for India, +1 for US/CA)
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Friendly Label / Purpose *
                </label>
                <input
                  type="text"
                  value={friendlyName}
                  onChange={(e) => setFriendlyName(e.target.value)}
                  placeholder="e.g. Pune Clinic Inbound (Priya)"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Descriptive tag shown in dashboards and reports
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Call Direction Capability
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="bidirectional">Bidirectional (Inbound + Outbound)</option>
                  <option value="inbound">Inbound Only (Hotline / Helpline)</option>
                  <option value="outbound">Outbound Only (Campaign Caller ID)</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/60 border border-zinc-800 cursor-pointer hover:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={isDefaultOutbound}
                    onChange={(e) => setIsDefaultOutbound(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-zinc-200 block">
                      Default Outbound Caller ID
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Use as default CLI for campaigns and single dials
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Step 3: AI Engine Routing */}
          <div className="space-y-4 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Bot size={13} className="text-emerald-400" />
              <span>3. AI Calling Engine & Agent Assignment</span>
            </h3>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                Assign Conversational AI Agent
              </label>
              <div className="grid grid-cols-1 gap-2">
                {AGENT_PRESETS.map((agent) => {
                  const isSelected = assignedAgentId === agent.id;
                  return (
                    <div
                      key={agent.id}
                      onClick={() => handleAgentChange(agent.id)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition ${
                        isSelected
                          ? "bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/20"
                          : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                          <Bot size={14} className={isSelected ? "text-emerald-400" : "text-zinc-500"} />
                          {agent.name}
                        </span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                            <CheckCircle2 size={12} />
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{agent.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Welcome Audio Greeting Prompt
              </label>
              <textarea
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                placeholder="Spoken by the AI agent when the caller answers..."
              />
              <span className="text-[10px] text-zinc-500 block mt-1">
                Synthesized dynamically via ElevenLabs / OpenAI Neural / NVIDIA Riva Magpie TTS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Primary Voice Language
                </label>
                <select
                  value={voiceLanguage}
                  onChange={(e) => setVoiceLanguage(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="hi">Hindi (हिन्दी / Hinglish)</option>
                  <option value="mr">Marathi (मराठी)</option>
                  <option value="en-IN">Indian English (en-IN)</option>
                  <option value="en">English (US/UK)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Fallback Forwarding Phone (PSTN)
                </label>
                <input
                  type="text"
                  value={forwardNumber}
                  onChange={(e) => setForwardNumber(e.target.value)}
                  placeholder="+919820011222"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 font-mono text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">
                  Reroutes caller if AI transfers or outside working hours
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={recordCalls}
                  onChange={(e) => setRecordCalls(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Auto-Record Calls for Claude QA & Compliance</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={businessHoursOnly}
                  onChange={(e) => setBusinessHoursOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Enforce Business Hours (09:00 - 20:00 IST)</span>
              </label>
            </div>
          </div>

          {/* Step 4: Provider Credential Overrides */}
          <div className="space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Server size={13} className="text-emerald-400" />
                <span>4. Carrier Trunk Credentials</span>
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSystemConfig}
                  onChange={(e) => setUseSystemConfig(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-700 text-emerald-500"
                />
                <span className="text-[11px] text-zinc-400">Use System Carrier Defaults</span>
              </label>
            </div>

            {!useSystemConfig && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                {provider === "tata_smartflo" || provider === "custom_sip" ? (
                  <>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        SIP Trunk Host / Gateway
                      </label>
                      <input
                        type="text"
                        value={customSipTrunk}
                        onChange={(e) => setCustomSipTrunk(e.target.value)}
                        placeholder="sip.tatasmartflo.com:5060"
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Carrier API Key / User
                      </label>
                      <input
                        type="text"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="Key / User"
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-mono"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Account SID
                      </label>
                      <input
                        type="text"
                        value={customAccountSid}
                        onChange={(e) => setCustomAccountSid(e.target.value)}
                        placeholder="AC..."
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        API Token / Secret
                      </label>
                      <input
                        type="password"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-100 font-mono"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4 bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white transition flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>{editingNumber ? "Save Configuration" : "Provision Virtual Number"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
