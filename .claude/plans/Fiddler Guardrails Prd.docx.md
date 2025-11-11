# PRD: Fiddler Guardrails Integration in AnswerAgent Prediction Endpoints (Conversation Starter)

## Overview

We propose integrating **Fiddler Guardrails** directly into AnswerAgent’s **Prediction execution path** (/prediction/{id} endpoint). This ensures that all LLM inputs and outputs are automatically checked for safety and injection attempts (with optional compliance features in future phases).

This PRD is based on our research into Fiddler Guardrails and represents a **proposed approach to kick off discussions with Integral Ad Science**. It is not a final requirements lock — instead, it is meant to confirm priorities, clarify needs, and align scope.

---

## Goals

* **Prediction endpoint enforcement only**: Apply guardrails exclusively on the /prediction/{id} endpoints (non-streaming and streaming).

* **Environment-driven activation**: Enabled via env vars (FIDDLER\_API\_KEY, thresholds, block behavior).

* **Two layers of protection**:

  1. *Pre-input moderation* (user prompt).

  2. *Post-output moderation* (LLM result).

---

## Scope

### In-Scope

* Integration in packages/server/src/controllers/predictions/index.ts for /prediction/{id} execution (covers streaming and non-streaming).

* Support both **blocking** and **non-blocking** (metadata only) modes.

* Configurable thresholds for safety scores.

* Safe fallback on API errors (pass-through \+ error flag).

### Out-of-Scope

* Per-flow guardrail nodes in UI.

* New dashboards, analytics, or observability features inside AnswerAgent (Integral Ad Science already uses Fiddler for monitoring).

* Real-time mid-token moderation (due to streaming constraints).

---

## Requirements

### Functional

1. **Pre-check:** Run Fiddler safety API on **user input**; block if above threshold.

2. **Post-check:** Run Fiddler safety API on **LLM output**; block or pass-through.

3. **Streaming:** Buffer output; run checks; replay or block before sending.

4. **Configuration:**

   * FIDDLER\_API\_KEY (required)

   * FIDDLER\_ENDPOINT (default: https://api.fiddler.ai)

   * FIDDLER\_PRE\_SAFETY\_THRESHOLD (default 0.1)

   * FIDDLER\_POST\_SAFETY\_THRESHOLD (default 0.1)

   * FIDDLER\_ENFORCE\_BLOCK (true/false)

   * FIDDLER\_BLOCK\_MSG (string fallback)

### Non-Functional

* Latency overhead: \<250ms average (subject to Fiddler API performance).

* No disruption if Fiddler API fails.

* Full backwards compatibility when no env vars are set.

---

## Feature Options (Phased Packages)

### Phase 1 – **Minimal Viable Guardrails (Must-Have)**

* Safety checks on **input** and **output** via Fiddler Guardrails.

* Blocking behavior \+ fallback message (via env).

* Error-tolerant design: pass-through with error flag if Fiddler API fails.

* Env-driven thresholds & toggles.

### Phase 2 – **Compliance Enhancements (Optional)**

* Faithfulness check on output (if RAG context provided).

* PII / Sensitive Information detection with masking/blocking.

* Configurable fallback per violation type (mask, block, warn).

* Streaming optimization (reduce buffering lag).

### Phase 3 – **Enterprise Options (Future)**

* On-prem / VPC deployment support if required by IAS.

* Multilingual guardrail tuning.

---

## Deliverables

* **Middleware wrapper** in Prediction handler for pre/post guardrails.

* **Config documentation** (.env examples).

* **Test coverage** for pass-through, block, API error, and streaming scenarios.

* **Stakeholder demo**: simple toxic prompt → blocked, safe prompt → normal.

---

## Risks & Mitigations

* **Latency impact**: Depends on Fiddler API response times; mitigate with keep-alive and retries.

* **Streaming lag**: Document buffering trade-off; env toggle to force non-streaming if required.

* **Quota limits**: Call out in docs (Fiddler free tier).

---

## Timeline

**Week 1–2**:  
\- Implement Phase 1 (input/output safety checks).  
\- Add env config \+ defaults.

**Week 3**:  
\- Streaming buffer logic.  
\- Unit & integration tests.

**Week 4**:  
\- Stakeholder demo, feedback, and refinements.  
\- Merge \+ release (Phase 1 complete).

**Phase 2+**: Post-release roadmap, depending on adoption & priorities.

---

## Discussion Points for Complete scoping

* Which guardrail checks are **must-have** for Phase 1 from your perspective (safety only, or also PII)?

* Is **faithfulness (hallucination control)** important in the short term, or acceptable as Phase 2?

* Should fallback behavior on Fiddler API errors default to **block** or **allow**?

* How critical is **on-prem/VPC deployment** in your environment (now vs future)?

---

✅ **Decision required from stakeholders:**  
\- Confirm Phase 1 as initial delivery scope.  
\- Align on whether Faithfulness \+ PII detection (Phase 2\) is a near-term requirement.  
\- Approve 4-week delivery plan for Phase 1\.  
\- Review appetite for Phase 2+ features in 2025 roadmap.  
\- Provide feedback on discussion points above to refine requirements.

# Outcomes from call on 10/10/2025

### Key decisions & alignments

* **Proceed with Phase 1 now.** Implement Fiddler guardrails for **input/output safety scoring** with blocking behavior, fallback messaging, error tolerance, and per-flow toggles. Feasibility confirmed by Last Rev/AnswerAgent.

* **Phase 2 (tentative):** Add **faithfulness/hallucination** controls and **LLM observability** (dashboards/alerts; can publish prompts/responses to Fiddler). Final scope to be confirmed.

* **PII guardrail now available.** Newly released by Fiddler; may be included pending compliance/security approval.

* **Connectivity/security posture:** Use existing **AWS PrivateLink** to Fiddler environment; same secured endpoint will expose guardrails. On-prem means private cloud (AWS/Azure/GCP) and is supported.

* **Ownership split:**

  * Last Rev/AnswerAgent owns product changes and integration.  
  * IAS security must approve data flow and console access before provisioning.  
  * Fiddler will support endpoints, docs, and optional observability/evals.

### Open questions to resolve (inputs needed for Phase 1\)

* **Blocking strategy & failover:** What to do if Fiddler is unavailable? Always block vs degrade gracefully? Messaging?

* **Config granularity:** Global vs per-chatflow thresholds/toggles (e.g., stricter external bot vs looser internal bot).

* **Compliance must-haves:** Minimal Viable Guardrails (MVG) list; whether **faithfulness** is required **before** broad release.

* **Data policy:** Exactly what request/response data may be sent to Fiddler (for guardrails and for observability).

### Action items

* **Aakash Relan (IAS)**

  * Create **security review ticket** for Fiddler guardrails & console access; loop in **Chris Jones / Barry’s team**.  
  * Create **assist/provisioning ticket** and link it to the security ticket (unblock upon approval).  
  * Share the guardrails phases doc link into the thread (for full team access).  
  * Align with **Jessica** on MVG; confirm whether hallucination/faithfulness is Phase 1 or 2\.

* **Jessica Simpson (Compliance)**

  * Define MVG policy (safety categories, thresholds, PII stance).  
  * Confirm with **Kevin** expectations for hallucination/faithfulness before rollout.

* **Security (Chris Jones / Barry’s team)**

  * Review/approve data flow and console access over **PrivateLink**; clarify any restrictions on data visibility.

* **Ops/Corp IT (Joseph Boyer Jr / Joe Ahmad)**

  * After security approval, **provision Fiddler access** for IAS emails (e.g., **Adam, Max**): Okta group \+ Fiddler user creation.

* **Last Rev / AnswerAgent (Brad Taylor, Max Techera, Adam Harris)**

  * Start **Phase 1 integration** to Fiddler guardrail APIs (safety; optionally PII if approved).  
  * Define **fallback behavior**, **error tolerance**, **blocking thresholds**, and **per-flow config**.  
  * Produce **list of required checks** aligned to MVG.  
  * Validate connectivity to IAS Fiddler endpoint via PrivateLink.  
  * **Return an action plan & timeline update by next Tuesday**, Nov 4, 2025\.

* **Fiddler (Taha Siddiqui, Danny Brock)**

  * Ensure guardrail endpoints are enabled in IAS environment; share latest API docs & PII label whitelisting guidance.  
  * Be available for a **quick demo** of observability/evals when Phase 2 is scoped.

### Tentative timeline

* **Phase 1 delivery target:** \~4 weeks (subject to prioritization and security approval).  
* **Checkpoint:** **Action plan update due Tue, Nov 4, 2025** (next weekly meeting).

### Risks & dependencies

* **Security approval** gating access/provisioning.  
* **Clarity on MVG and per-flow policies** (to avoid rework).  
* **Resource prioritization** on AnswerAgent product updates.

