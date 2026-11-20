import React, { useState, useEffect, useMemo } from "react";
import {
  PhoneCall,
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Activity,
  Bot,
  Workflow,
  Sparkles,
  Server,
  Star,
  Copy,
  Trash2,
  Edit3,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Radio,
  Clock,
  Layers,
  ArrowUpRight,
  Headphones,
  Sliders,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { AddEditVirtualNumberModal, VirtualNumberRecord } from "./AddEditVirtualNumberModal";
import { ValidateNumberModal } from "./ValidateNumberModal";
import { InboundSimulatorModal } from "./InboundSimulatorModal";

export const VirtualNumberManagement: React.FC = () => {
  const [numbers, setNumbers] = useState<VirtualNumberRecord[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    active: number;
    inboundOnly: number;
    outboundOnly: number;
    bidirectional: number;
    defaultOutboundPhone: string | null;
    totalCallsHandled: number;
  }>({
    total: 0,
    active: 0,
    inboundOnly: 0,
    outboundOnly: 0,
    bidirectional: 0,
    defaultOutboundPhone: null,
    totalCallsHandled: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingNumber, setEditingNumber] = useState<VirtualNumberRecord | null>(null);
  const [validatingNumber, setValidatingNumber] = useState<VirtualNumberRecord | null>(null);
  const [simulatingNumber, setSimulatingNumber] = useState<VirtualNumberRecord | null>(null);

  const fetchNumbers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/calling/virtual-numbers");
      const data = await res.json();
      if (data.success) {
        setNumbers(data.numbers || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      }
    } catch {
      toast.error("Failed to load virtual numbers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

  // Filtered numbers
  const filteredNumbers = useMemo(() => {
    return numbers.filter((n) => {
      const matchesSearch =
        n.phoneNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.friendlyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.provider.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProvider = selectedProvider === "all" || n.provider === selectedProvider;
      const matchesStatus = selectedStatus === "all" || n.status === selectedStatus;

      return matchesSearch && matchesProvider && matchesStatus;
    });
  }, [numbers, searchQuery, selectedProvider, selectedStatus]);

  // Handle status toggle (Activate / Deactivate)
  const handleToggleStatus = async (number: VirtualNumberRecord) => {
    const nextStatus = number.status === "active" ? "inactive" : "active";
    try {
      const res = await fetch(`/api/calling/virtual-numbers/${number.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(
          `Number ${number.phoneNumber} is now ${nextStatus === "active" ? "Active" : "Inactive"}`
        );
        fetchNumbers();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Network error toggling status");
    }
  };

  // Handle set as default outbound
  const handleSetDefault = async (number: VirtualNumberRecord) => {
    try {
      const res = await fetch(`/api/calling/virtual-numbers/${number.id}/set-default`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${number.phoneNumber} is now the default Outbound Caller ID!`);
        fetchNumbers();
      } else {
        toast.error(data.error || "Failed to set default outbound");
      }
    } catch {
      toast.error("Network error updating default number");
    }
  };

  // Handle delete
  const handleDelete = async (number: VirtualNumberRecord) => {
    if (!confirm(`Are you sure you want to remove virtual number ${number.phoneNumber}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/calling/virtual-numbers/${number.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Virtual number ${number.phoneNumber} deleted`);
        fetchNumbers();
      } else {
        toast.error(data.error || "Failed to delete number");
      }
    } catch {
      toast.error("Network error deleting number");
    }
  };

  // Copy webhook URL helper
  const handleCopyWebhook = (number: VirtualNumberRecord) => {
    const origin = window.location.origin;
    const fullUrl = `${origin}${number.webhookUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(number.id);
    toast.success("Webhook URL copied to clipboard!", { description: fullUrl });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getProviderBadge = (provider: string) => {
    switch (provider) {
      case "tata_smartflo":
        return {
          label: "Tata Smartflo",
          className: "bg-blue-500/10 border-blue-500/30 text-blue-400",
        };
      case "twilio":
        return {
          label: "Twilio Voice",
          className: "bg-rose-500/10 border-rose-500/30 text-rose-400",
        };
      case "exotel":
        return {
          label: "Exotel India",
          className: "bg-amber-500/10 border-amber-500/30 text-amber-400",
        };
      case "custom_sip":
      default:
        return {
          label: "Custom SIP / PBX",
          className: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <PhoneCall size={18} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Virtual Number Management
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-semibold">
              Live Telecom DIDs
            </span>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl">
            Add, configure, validate, activate, and route multi-provider virtual phone numbers (Tata
            Smartflo, Twilio, Exotel, Custom SIP) directly to autonomous AI agents with zero carrier lock-in.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={fetchNumbers}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition"
            title="Refresh Numbers"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingNumber(null);
              setIsAddEditOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-lg shadow-emerald-950/40"
          >
            <Plus size={15} />
            <span>Add Virtual Number</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total DIDs</span>
            <Phone size={15} className="text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-zinc-100">{summary.total}</span>
            <span className="text-[11px] text-zinc-400">Configured</span>
          </div>
          <span className="text-[10px] text-zinc-500 block">
            {summary.bidirectional} bidirectional · {summary.inboundOnly} inbound
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Active Trunks</span>
            <Radio size={15} className="text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{summary.active}</span>
            <span className="text-[11px] text-emerald-400/80 font-medium">Ready</span>
          </div>
          <span className="text-[10px] text-zinc-500 block">
            {summary.total - summary.active} standby / inactive
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Default Outbound CLI</span>
            <Star size={15} className="text-amber-400" />
          </div>
          <p className="text-sm font-bold font-mono text-zinc-200 truncate mt-1">
            {summary.defaultOutboundPhone || "+91 22 6600 1234"}
          </p>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={11} />
            TRAI CLI Validated
          </span>
        </div>

        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-1.5 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Calls Handled</span>
            <Activity size={15} className="text-blue-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-400">
              {summary.totalCallsHandled}
            </span>
            <span className="text-[11px] text-zinc-400">Sessions</span>
          </div>
          <span className="text-[10px] text-zinc-500 block">Routed to Priya & AI Voice Stack</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search phone number, label, or carrier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Providers</option>
            <option value="tata_smartflo">Tata Smartflo</option>
            <option value="twilio">Twilio Voice</option>
            <option value="exotel">Exotel India</option>
            <option value="custom_sip">Custom SIP</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div className="text-[11px] text-zinc-400">
          Showing <span className="font-bold text-zinc-200">{filteredNumbers.length}</span> of{" "}
          <span className="font-bold text-zinc-200">{numbers.length}</span> virtual numbers
        </div>
      </div>

      {/* Numbers List Table / Cards */}
      {filteredNumbers.length === 0 ? (
        <div className="p-12 rounded-2xl border border-zinc-800 bg-zinc-950/60 text-center space-y-3">
          <Phone className="h-10 w-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-200">No Virtual Numbers Found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {searchQuery
              ? "No virtual phone numbers match your search filter."
              : "Provision your first virtual number or trunk connection to start routing AI calls."}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingNumber(null);
              setIsAddEditOpen(true);
            }}
            className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Virtual Number</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredNumbers.map((num) => {
            const providerBadge = getProviderBadge(num.provider);
            const isPriya =
              num.assignedAgentId === "agent_aarogya_dental" ||
              num.friendlyName.toLowerCase().includes("dental");

            return (
              <div
                key={num.id}
                className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 hover:border-zinc-700/80 transition-all shadow-sm space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Phone, Label, Provider */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        num.status === "active"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400"
                      }`}
                    >
                      <PhoneCall size={18} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-base font-bold text-zinc-100">
                          {num.phoneNumber}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${providerBadge.className}`}
                        >
                          {providerBadge.label}
                        </span>

                        {num.isDefaultOutbound && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                            <Star size={10} className="fill-amber-400" />
                            Default Outbound CLI
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
                            num.status === "active"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-zinc-800 border-zinc-700 text-zinc-400"
                          }`}
                        >
                          {num.status}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-zinc-300">{num.friendlyName}</p>
                    </div>
                  </div>

                  {/* Right: Toggle Switch & Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Active/Inactive Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(num)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                        num.status === "active"
                          ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40"
                          : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:bg-zinc-800"
                      }`}
                      title={num.status === "active" ? "Click to deactivate" : "Click to activate"}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          num.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                        }`}
                      />
                      <span>{num.status === "active" ? "Active" : "Deactivated"}</span>
                    </button>

                    {/* Validate Number Button */}
                    <button
                      type="button"
                      onClick={() => setValidatingNumber(num)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                      title="Run live diagnostic probe"
                    >
                      <Activity size={13} className="text-blue-400" />
                      <span>Diagnostics</span>
                    </button>

                    {/* Inbound Simulator Button */}
                    <button
                      type="button"
                      onClick={() => setSimulatingNumber(num)}
                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                      title="Test inbound call loop"
                    >
                      <PhoneIncoming size={13} className="text-emerald-400" />
                      <span>Test Call</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNumber(num);
                        setIsAddEditOpen(true);
                      }}
                      className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition"
                      title="Edit configuration"
                    >
                      <Edit3 size={14} />
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(num)}
                      className="p-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/40 border border-zinc-700 hover:border-rose-700/50 text-zinc-400 hover:text-rose-400 transition"
                      title="Delete number"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Grid of Routing Details, Assigned AI Agent & Webhook */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-zinc-900">
                  {/* Assigned Agent */}
                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
                      Target AI Agent & Flow
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Bot size={12} />
                      </div>
                      <span className="font-semibold text-zinc-200 truncate">
                        {isPriya ? "Priya · Aarogya Dental" : "Aarti · Tata Banking"}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      Lang: {num.inboundRouting?.voiceLanguage || "hi"} · Auto-Record:{" "}
                      {num.inboundRouting?.recordCalls ? "Yes" : "No"}
                    </span>
                  </div>

                  {/* Trunk & Health Status */}
                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
                      Carrier Trunk Health
                    </span>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      <span className="font-medium text-emerald-400">
                        {num.validation?.status === "verified" ? "Trunk Verified" : "Verification Ready"}
                      </span>
                      {num.validation?.latencyMs && (
                        <span className="font-mono text-[10px] text-zinc-400">
                          ({num.validation.latencyMs}ms)
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 block truncate">
                      {num.validation?.carrierName || "Direct Carrier Connected"}
                    </span>
                  </div>

                  {/* Webhook & Quick Actions */}
                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block">
                        Carrier Inbound Webhook
                      </span>
                      <p className="font-mono text-[10px] text-zinc-300 truncate">
                        {num.webhookUrl}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopyWebhook(num)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
                      >
                        {copiedId === num.id ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedId === num.id ? "Copied!" : "Copy URL"}</span>
                      </button>

                      {!num.isDefaultOutbound && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(num)}
                          className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium ml-auto cursor-pointer"
                        >
                          <Star size={11} />
                          <span>Make Default CLI</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AddEditVirtualNumberModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSaved={fetchNumbers}
        editingNumber={editingNumber}
      />

      {/* Diagnostics Modal */}
      <ValidateNumberModal
        isOpen={Boolean(validatingNumber)}
        onClose={() => setValidatingNumber(null)}
        number={validatingNumber}
        onValidated={fetchNumbers}
      />

      {/* Inbound Simulator Modal */}
      <InboundSimulatorModal
        isOpen={Boolean(simulatingNumber)}
        onClose={() => setSimulatingNumber(null)}
        number={simulatingNumber}
      />
    </div>
  );
};
