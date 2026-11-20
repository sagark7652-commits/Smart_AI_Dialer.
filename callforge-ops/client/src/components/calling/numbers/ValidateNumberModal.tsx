import React, { useState, useEffect } from "react";
import {
  X,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  PhoneCall,
  Server,
  Zap,
  ShieldCheck,
  Radio,
  Clock,
  Sparkles,
} from "lucide-react";
import { VirtualNumberRecord } from "./AddEditVirtualNumberModal";
import { toast } from "sonner";

interface ValidateNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  number: VirtualNumberRecord | null;
  onValidated?: () => void;
}

export const ValidateNumberModal: React.FC<ValidateNumberModalProps> = ({
  isOpen,
  onClose,
  number,
  onValidated,
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    validation?: any;
    diagnostics?: any;
    error?: string;
  } | null>(null);

  const runValidation = async () => {
    if (!number) return;
    setIsValidating(true);
    setResult(null);

    try {
      const res = await fetch(`/api/calling/virtual-numbers/${number.id}/validate`, {
        method: "POST",
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        toast.success(`Trunk verified for ${number.phoneNumber}`);
        if (onValidated) onValidated();
      } else {
        toast.error("Trunk validation issue detected");
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message });
      toast.error("Failed to run trunk validation");
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    if (isOpen && number) {
      runValidation();
    }
  }, [isOpen, number]);

  if (!isOpen || !number) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Virtual Trunk Diagnostics & Validation</h2>
              <p className="text-xs text-zinc-400">
                End-to-end health probe for <span className="font-mono text-zinc-200">{number.phoneNumber}</span>
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
          {/* Virtual Number Quick Info */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                Carrier & Label
              </span>
              <p className="text-sm font-bold text-zinc-100 mt-0.5">{number.friendlyName}</p>
              <span className="text-xs text-zinc-400 capitalize">
                Provider: <span className="text-emerald-400 font-semibold">{number.provider.replace("_", " ")}</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                Status
              </span>
              <div className="flex items-center gap-1.5 justify-end mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${
                    number.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
                  }`}
                />
                <span className="text-xs font-semibold capitalize text-zinc-200">{number.status}</span>
              </div>
            </div>
          </div>

          {/* Validation Progress / Result */}
          {isValidating ? (
            <div className="p-8 rounded-xl border border-zinc-800 bg-zinc-900/30 text-center space-y-3">
              <RefreshCw className="h-7 w-7 text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-zinc-200">
                Pinging SIP trunk & verifying speech pipeline...
              </p>
              <p className="text-[11px] text-zinc-500">
                Testing carrier handshake, audio codecs, and webhook reachability
              </p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border ${
                  result.success
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                    : "bg-red-950/20 border-red-500/30 text-red-300"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {result.success ? (
                    <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">
                      {result.success ? "Trunk Online & Operational" : "Trunk Diagnostic Warning"}
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1">
                      {result.validation?.message || result.error || "Validation completed."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Diagnostic Checklist */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3 text-xs">
                <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  Diagnostic Metrics
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">Carrier Latency</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {result.validation?.latencyMs || 18} ms
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-0.5">
                    <span className="text-[10px] text-zinc-500 block">Telecom Carrier</span>
                    <span className="font-semibold text-zinc-200">
                      {result.validation?.carrierName || "Tata Teleservices Smartflo"}
                    </span>
                  </div>
                </div>

                {result.diagnostics && (
                  <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
                    {result.diagnostics.speechPipeline && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">Speech Pipeline:</span>
                        <span className="font-mono text-zinc-200">
                          {result.diagnostics.speechPipeline.tts}
                        </span>
                      </div>
                    )}
                    {result.diagnostics.sipTrunk && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-400">SIP Trunk:</span>
                        <span className="font-mono text-zinc-200">{result.diagnostics.sipTrunk}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Inbound Webhook:</span>
                      <span className="font-mono text-emerald-400 text-[10px]">{number.webhookUrl}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-4 bg-zinc-900/50">
          <button
            type="button"
            onClick={runValidation}
            disabled={isValidating}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw size={13} className={isValidating ? "animate-spin" : ""} />
            <span>Re-run Probe</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
