import { describe, expect, it } from "vitest";
import { validateE164, virtualNumberService } from "./calling/virtualNumbers";
import { getDefaultCallerId, getTelephonyProvider } from "./calling/provider";
import { persistentStore } from "./storage/persistentStore";

describe("Virtual Number Management Module", () => {
  // ===========================================================================
  // 1. E.164 Phone Number Format & Normalization
  // ===========================================================================
  describe("E.164 Phone Number Validation", () => {
    it("validates compliant E.164 international numbers", () => {
      const resIndia = validateE164("+912266001234");
      expect(resIndia.valid).toBe(true);
      expect(resIndia.normalized).toBe("+912266001234");

      const resUS = validateE164("+18005550199");
      expect(resUS.valid).toBe(true);
      expect(resUS.normalized).toBe("+18005550199");
    });

    it("auto-normalizes 10-digit Indian numbers with +91 prefix", () => {
      const res = validateE164("9820011222");
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe("+919820011222");
    });

    it("strips whitespace, dashes, and parentheses cleanly", () => {
      const res = validateE164("+91 (22) 6600-1234");
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe("+912266001234");
    });

    it("rejects invalid, short, or non-numeric strings", () => {
      const resShort = validateE164("1234");
      expect(resShort.valid).toBe(false);
      expect(resShort.error).toBeDefined();

      const resEmpty = validateE164("");
      expect(resEmpty.valid).toBe(false);
    });
  });

  // ===========================================================================
  // 2. Virtual Numbers CRUD & Configurable Service Providers
  // ===========================================================================
  describe("Virtual Numbers Management Service", () => {
    it("loads default pre-configured virtual numbers", async () => {
      const numbers = await virtualNumberService.listNumbers();
      expect(numbers.length).toBeGreaterThanOrEqual(2);

      const tataNumber = numbers.find((n) => n.provider === "tata_smartflo");
      expect(tataNumber).toBeDefined();
      expect(tataNumber?.phoneNumber).toBe("09513XXXXXXX");
      expect(tataNumber?.assignedAgentId).toBe("agent_aarogya_dental");
      expect(tataNumber?.isDefaultOutbound).toBe(true);

      const twilioNumber = numbers.find((n) => n.provider === "twilio");
      expect(twilioNumber).toBeDefined();
      expect(twilioNumber?.phoneNumber).toBe("+18005550199");
    });

    it("creates a new virtual number with configurable provider and AI agent", async () => {
      const created = await virtualNumberService.createNumber({
        phoneNumber: "+91 80 4455 6677",
        friendlyName: "Bengaluru Sales Hotline",
        provider: "custom_sip",
        type: "bidirectional",
        assignedAgentId: "agent_aarogya_dental",
        inboundRouting: {
          routeType: "ai_agent",
          greetingMessage: "Namaste! Welcome to Bengaluru Dental Clinic. Priya speaking.",
          voiceLanguage: "hi",
          recordCalls: true,
        },
      });

      expect(created.success).toBe(true);
      expect(created.number).toBeDefined();
      expect(created.number?.id).toMatch(/^vn_custom_sip_/);
      expect(created.number?.phoneNumber).toBe("+918044556677");
      expect(created.number?.status).toBe("active");
      expect(created.number?.webhookUrl).toBe(`/api/calling/virtual-numbers/${created.number?.id}/inbound`);
    });

    it("prevents creating duplicate virtual phone numbers", async () => {
      const dup = await virtualNumberService.createNumber({
        phoneNumber: "09513XXXXXXX", // Already registered
        friendlyName: "Duplicate Test",
        provider: "tata_smartflo",
      });

      expect(dup.success).toBe(false);
      expect(dup.error).toContain("already registered");
    });

    it("updates configuration, friendly name, and agent routing", async () => {
      const numbers = await virtualNumberService.listNumbers();
      const target = numbers.find((n) => n.phoneNumber === "+918044556677");
      expect(target).toBeDefined();

      const updated = await virtualNumberService.updateNumber(target!.id, {
        friendlyName: "Bengaluru Priority Care Desk",
        inboundRouting: {
          ...target!.inboundRouting,
          greetingMessage: "Hello! Thank you for calling Bangalore Premier Dental.",
        },
      });

      expect(updated.success).toBe(true);
      expect(updated.number?.friendlyName).toBe("Bengaluru Priority Care Desk");
      expect(updated.number?.inboundRouting.greetingMessage).toContain("Bangalore Premier");
    });

    it("activates and deactivates a virtual number", async () => {
      const numbers = await virtualNumberService.listNumbers();
      const target = numbers.find((n) => n.phoneNumber === "+918044556677");
      expect(target).toBeDefined();

      const deact = await virtualNumberService.setStatus(target!.id, "inactive");
      expect(deact.success).toBe(true);
      expect(deact.number?.status).toBe("inactive");

      const act = await virtualNumberService.setStatus(target!.id, "active");
      expect(act.success).toBe(true);
      expect(act.number?.status).toBe("active");
    });

    it("sets a virtual number as system-wide default outbound Caller ID", async () => {
      const numbers = await virtualNumberService.listNumbers();
      const target = numbers.find((n) => n.phoneNumber === "+918044556677");
      expect(target).toBeDefined();

      const res = await virtualNumberService.setDefaultOutbound(target!.id);
      expect(res.success).toBe(true);
      expect(res.number?.isDefaultOutbound).toBe(true);

      // Verify others are no longer default
      const all = await virtualNumberService.listNumbers();
      const previousTata = all.find((n) => n.phoneNumber === "09513XXXXXXX");
      expect(previousTata?.isDefaultOutbound).toBe(false);

      // Restore Tata as default
      if (previousTata) {
        await virtualNumberService.setDefaultOutbound(previousTata.id);
      }
    });

    it("deletes a virtual number cleanly", async () => {
      const numbers = await virtualNumberService.listNumbers();
      const target = numbers.find((n) => n.phoneNumber === "+918044556677");
      expect(target).toBeDefined();

      const del = await virtualNumberService.deleteNumber(target!.id);
      expect(del.success).toBe(true);

      const verify = await virtualNumberService.getNumberById(target!.id);
      expect(verify).toBeUndefined();
    });
  });

  // ===========================================================================
  // 3. Provider Validation & Diagnostic Health Checks
  // ===========================================================================
  describe("Provider Validation & Diagnostics", () => {
    it("validates Tata Smartflo virtual number with NVIDIA Riva speech pipeline", async () => {
      const numbers = await virtualNumberService.listNumbers();
      const tata = numbers.find((n) => n.provider === "tata_smartflo");
      expect(tata).toBeDefined();

      const val = await virtualNumberService.validateNumber(tata!.id);
      expect(val.success).toBe(true);
      expect(val.validation.status).toBe("verified");
      expect(val.validation.carrierName).toContain("Tata Teleservices Smartflo");
      expect(val.diagnostics?.speechPipeline?.stt).toContain("Nemotron");
    });

    it("validates Twilio virtual number voice streaming readiness", async () => {
      const numbers = await virtualNumberService.listNumbers();
      const twilio = numbers.find((n) => n.provider === "twilio");
      expect(twilio).toBeDefined();

      const val = await virtualNumberService.validateNumber(twilio!.id);
      expect(val.success).toBe(true);
      expect(val.validation.status).toBe("verified");
      expect(val.validation.carrierName).toContain("Twilio");
    });
  });

  // ===========================================================================
  // 4. Inbound AI Routing & Calling Engine Integration
  // ===========================================================================
  describe("AI Calling Engine Connection & Routing", () => {
    it("simulates inbound call and routes to Priya - Aarogya Dental Care", async () => {
      const numbers = await virtualNumberService.listNumbers();
      const dentalNumber = numbers.find((n) => n.assignedAgentId === "agent_aarogya_dental");
      expect(dentalNumber).toBeDefined();

      const sim = await virtualNumberService.simulateInboundCall(
        dentalNumber!.id,
        "+919820011222",
        "Rahul Mehta"
      );

      expect(sim.success).toBe(true);
      expect(sim.callId).toMatch(/^sim_inbound_/);
      expect(sim.assignedAgent.name).toContain("Priya");
      expect(sim.assignedAgent.greeting).toContain("Aarogya Dental Care");
      expect(sim.audioStreamUrl).toContain(dentalNumber!.id);
      expect(sim.audioStreamUrl).toContain("agent_aarogya_dental");
    });

    it("resolves default outbound caller ID from configured virtual numbers", () => {
      const callerId = getDefaultCallerId();
      expect(callerId).toBeDefined();
      expect(callerId).toMatch(/^[\+0-9A-Za-z\s]+$/);
    });

    it("respects active virtual number provider in telephony engine", () => {
      const provider = getTelephonyProvider();
      expect(provider).toBeDefined();
      expect(provider.name).toBe("tata_smartflo");
    });

    it("records call metrics against virtual numbers", () => {
      const tata = persistentStore.getVirtualNumberByPhone("09513XXXXXXX");
      expect(tata).toBeDefined();
      const initialTotal = tata!.stats.totalCalls;

      persistentStore.recordVirtualNumberCall(tata!.id, "inbound");
      const updated = persistentStore.getVirtualNumber(tata!.id);
      expect(updated?.stats.totalCalls).toBe(initialTotal + 1);
      expect(updated?.stats.inboundCalls).toBeGreaterThan(0);
    });
  });
});
