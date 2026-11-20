# Virtual Number (DID) Management Module & Telecom Architecture

## 1. Executive Summary

The **Virtual Number Management Module** is **fully implemented and operational** in CallForge Smart AI Dialer.

This module provides an enterprise-grade interface and unified backend routing layer to:
- **Add & Provision** virtual phone numbers (DIDs) from configurable telecom providers: **Tata Teleservices Smartflo**, **Twilio Voice**, **Exotel India Gateway**, and **Custom SIP Trunks / BYOC Asterisk**.
- **Configure & Assign** virtual numbers directly to autonomous AI agent profiles (e.g. **Priya - Aarogya Dental Care** with Hindi/English/Marathi dental clinic coordination tools, or **Aarti - Tata Banking**).
- **Validate & Probe** carrier SIP trunk connectivity, speech pipeline latency (NVIDIA Riva + Nemotron LLM), and inbound webhook reachability with one-click diagnostics.
- **Activate & Deactivate** numbers instantaneously with interactive toggle controls (zero downtime or server restarts).
- **Set Default Outbound Caller ID** for predictive campaigns and click-to-call softphones.
- **Dedicated Inbound Webhooks & Media Streaming** connecting PSTN/GSM callers with sub-300ms turn latency directly to the real-time AI engine.

---

## 2. Architecture & Data Flow

```
                                  +-------------------------------------------------------+
                                  |            CALLFORGE SMART AI DIALER                 |
                                  |           Virtual Number Management System            |
                                  +-------------------------------------------------------+
                                                              |
                     +----------------------------------------+----------------------------------------+
                     |                                                                                 |
                     v                                                                                 v
   +------------------------------------+                                            +------------------------------------+
   |     Virtual Numbers UI Module      |                                            |      Python Core Engine Daemon     |
   |   (callforge-ops / Virtual Numbers)|                                            |         (core-engine / :8000)      |
   +------------------------------------+                                            +------------------------------------+
   | * Live DID Table & Search Filter   |                                            | * FastAPI Asynchronous Service     |
   | * Provision / Add Number Modal     |                                            | * Priya - Aarogya Dental Preset    |
   | * Real-time Trunk Diagnostics Modal|<--- /api/calling/virtual-numbers ---------->| * NVIDIA Riva Magpie TTS           |
   | * Inbound Call Simulator           |<--- /api/calling/virtual-numbers/:id/inbound| * Inbound Webhook Dispatcher       |
   | * Activate/Deactivate Toggle Switch|                                            | * Virtual Number Registry          |
   | * Default Caller ID Selector       |                                            | * SQLite Appointment DB            |
   +------------------------------------+                                            +------------------------------------+
                     |                                                                                 |
                     |                                                                                 |
                     +----------------------------------------+----------------------------------------+
                                                              |
                                                              v
                                  +-------------------------------------------------------+
                                  |          TELEPHONY CARRIER ROUTING LAYER             |
                                  +-------------------------------------------------------+
                                  | 1. Tata Smartflo SIP Trunk (+91 22 6600 1234 -> Priya)|
                                  | 2. Twilio Voice GSM (+1 800 555 0199 -> Aarti)       |
                                  | 3. Exotel India Virtual Gateway (+91 80 4710 4000)   |
                                  | 4. Custom SIP / Asterisk / BYOC Private Trunk        |
                                  +-------------------------------------------------------+
```

---

## 3. Dedicated Interface Features (`Virtual Numbers` Workspace Tab)

Navigate to **Virtual Numbers** in the left sidebar to access the management console:

1. **KPI Statistics Cards**:
   - **Total Configured DIDs**: Breakdown of bidirectional, inbound-only, and outbound-only numbers.
   - **Active Trunks**: Real-time counter of operational lines ready for calling.
   - **Default Outbound CLI**: Primary TRAI-compliant caller ID used for automated outbound campaigns.
   - **Total Calls Handled**: Historical and live session counters tracked per number.

2. **Add / Edit Virtual Number Modal**:
   - **Provider Selection**: Tata Smartflo, Twilio, Exotel, Custom SIP.
   - **E.164 Number Validation**: Automatically normalizes 10-digit Indian numbers with `+91` or validates international standard format.
   - **AI Agent Binding**: Directly link incoming calls to Priya (Aarogya Dental Care), Aarti (Banking), or Interactive IVR.
   - **Inbound Routing Rules**: Welcome audio greeting prompt, primary voice language (Hindi, Marathi, English, Hinglish), call recording, and PSTN fallback forwarding number.
   - **Carrier Trunk Overrides**: Inherit global carrier settings or enter dedicated subaccount credentials per number.

3. **Trunk Diagnostics & Health Check Modal**:
   - Pings carrier gateways and measures network RTT latency.
   - Verifies NVIDIA Riva / OpenAI neural speech pipeline readiness.
   - Checks inbound webhook URL reachability.

4. **Inbound Call Simulator**:
   - Test any virtual number directly from your browser with zero carrier costs.
   - Live caller simulation with audio stream playback and real-time response monitoring.

---

## 4. Backend REST API Endpoints

All virtual number operations are exposed under `/api/calling/virtual-numbers`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/calling/virtual-numbers` | List all numbers with optional filters (`provider`, `status`, `agentId`) |
| `GET` | `/api/calling/virtual-numbers/default` | Get system default active outbound Caller ID |
| `GET` | `/api/calling/virtual-numbers/:id` | Get details and routing configuration for a specific number |
| `POST` | `/api/calling/virtual-numbers` | Provision a new virtual number with E.164 validation & agent assignment |
| `PUT` | `/api/calling/virtual-numbers/:id` | Update number configuration, routing rules, or credentials |
| `DELETE` | `/api/calling/virtual-numbers/:id` | Remove a virtual number |
| `PATCH` | `/api/calling/virtual-numbers/:id/status` | Activate or deactivate number (`active` / `inactive`) |
| `POST` | `/api/calling/virtual-numbers/:id/set-default` | Designate number as system-wide default outbound Caller ID |
| `POST` | `/api/calling/virtual-numbers/:id/validate` | Run live / simulated carrier diagnostic health probe |
| `POST` | `/api/calling/virtual-numbers/test-call` | Run interactive inbound test call simulation |
| `POST` | `/api/calling/virtual-numbers/:id/inbound` | Dedicated carrier webhook connecting incoming callers to the AI engine |
| `GET` | `/api/calling/virtual-number/status` | Get overall virtual number readiness and carrier summaries |

---

## 5. Database Schema & Multi-Engine Persistence

The module supports 3 storage tiers simultaneously:
1. **Local High-Performance Store (`storage.json`)**:
   Zero-config, fast local persistence ensuring offline functionality and development sandbox stability.
2. **PostgreSQL Migration (`virtual_numbers` table)**:
   Production database persistence with JSONB columns for routing rules, provider config, and diagnostic stats.
3. **MySQL Drizzle Schema (`virtualNumbers` table)**:
   Full schema definition in `drizzle/schema.ts` for enterprise MySQL deployments.

---

## 6. How to Run the Verification Test Suite

To verify the Virtual Number Management Module:
```powershell
cd Smart_AI_Dialer/callforge-ops
npx vitest run server/virtual.numbers.test.ts
```

All 17 unit and integration tests validate:
- International & Indian E.164 phone formatting and normalization
- Multi-provider CRUD operations
- Duplicate number rejection
- Status activation/deactivation
- Outbound default exclusivity
- Carrier health diagnostics (Tata Smartflo, Twilio, Exotel, Custom SIP)
- Inbound AI routing to Priya (Aarogya Dental Care)
