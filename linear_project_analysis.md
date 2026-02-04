# Linear Project Analysis & Restructuring Plan

**Date:** January 24, 2026
**Sprint Start:** Monday, January 27, 2026
**Planning Horizon:** 4 weeks (through February 21, 2026)

---

## Current State Summary

### Open Issues: 119 Total
| Status | Count |
|--------|-------|
| Backlog | 103 |
| Todo | 6 |
| In Review | 3 |
| QA / Staging | 1 |

### Priority Distribution
| Priority | Count | % |
|----------|-------|---|
| Low | 81 | 68% |
| Medium | 18 | 15% |
| High | 8 | 7% |
| Urgent | 2 | 2% |
| No Priority | 10 | 8% |

### Estimate Distribution
| Size | Count | Points | Total Points |
|------|-------|--------|--------------|
| XS | 7 | 1 | 7 |
| S | 33 | 2 | 66 |
| M | 38 | 3 | 114 |
| L | 9 | 5 | 45 |
| No Estimate | 26 | - | TBD |
| **Total** | **87 est** | - | **232 pts** |

### Current Project Assignments
| Project | Issues | Status |
|---------|--------|--------|
| No Project | 61 | - |
| AnswerAgent — Build-in-Public System | 40 | Stale |
| WOW Pilot | 5 | Stale |
| Studio Release 1.8.0 | 3 | Stale |
| QA Playwright | 1 | Stale |
| Kumello Pilot | 1 | Active |
| Other | 8 | Mixed |

---

## Projects to SUNSET (Archive)

These projects are outdated and should be archived:

1. **AnswerAgent — Build-in-Public System** - Target date Nov 2025, past due
2. **Engine Release 1.0** - Target date Dec 2025, past due
3. **AnswerAgent Chief Sidekick** - Target date Dec 2025, past due
4. **Studio Release 1.8.0** - Target date Nov 2025, past due
5. **Studio Release 1.7.0** - Target date Nov 2025, past due
6. **Webinar Marketing Campaign** - Completed
7. **QA Playwright** - Target date Oct 2025, past due
8. **Personalized OAuth New/Existing User Experience** - Target date Oct 2025, past due
9. **WOW Pilot** - Target date Dec 2025, needs review
10. **Fiddler Integration** - Already marked Completed

---

## PROPOSED NEW PROJECTS

### Project 1: IAS v2.0 Production Deployment
**Priority:** Urgent
**Timeline:** Week 1-2 (Jan 27 - Feb 7)
**Target Date:** February 7, 2026

**Description:** Deploy the latest AnswerAgent v2.0 to IAS production environment. Includes all critical bug fixes and stability improvements required for production readiness.

**Issues to Include:**
- AGENT-639 (QA/Staging) - Fix queryVectorStore filtering - M
- AGENT-149 (Urgent) - Agent flow templates marketplace bug - M
- AGENT-567 (Urgent) - Langfuse token calculation - M
- AGENT-583 (High) - API key 500 error - S
- AGENT-76 (High) - Canvas not updating after credential save - S
- AGENT-660 (High) - Session timeout error on org switch - S
- AGENT-661 (High) - Draft message loss on ArrowDown - S

**Estimated Effort:** 17 points (~4-5 days focused work)

---

### Project 2: Critical Bug Fixes
**Priority:** High
**Timeline:** Week 1-2 (Jan 27 - Feb 7)
**Target Date:** February 7, 2026

**Description:** Address high-impact bugs affecting core user experience and workflow stability.

**Issues to Include:**
- AGENT-653 (High) - Sidekick freezes on voice note - M
- AGENT-570 (High) - BIP Content retrieval not working - S
- AGENT-607 (High) - Complete Langfuse Comparison Analysis - S
- AGENT-582 (Medium) - Chat selector not switching chatflows - S
- AGENT-466 (Medium) - Version Rollback not working - S
- AGENT-657 (Medium) - Broken Slack MCP doc link - XS
- AGENT-654 (Medium) - Marketplace back button hidden - XS

**Estimated Effort:** 14 points (~3-4 days)

---

### Project 3: Studio UX Improvements
**Priority:** Medium
**Timeline:** Week 2-3 (Feb 3 - Feb 14)
**Target Date:** February 14, 2026

**Description:** Improve the AnswerAgent Studio user experience with usability enhancements and UI fixes.

**Issues to Include:**
- AGENT-566 (Medium) - Fiddler Guardrails UI improvements - M
- AGENT-464 (Medium) - Version History CTA in Agentflow/Chatflow - S
- AGENT-463 (Medium) - Export versions without rollback - S
- AGENT-465 (Medium) - Loading icon for version history - XS
- AGENT-608 (Medium) - Display workspace in app drawer - XS
- AGENT-599 (Medium) - User menu UX improvements - S
- AGENT-656 (Low) - Organization Template Sharing UI - M
- AGENT-655 (Low) - Auto-prompt for outdated nodes - M

**Estimated Effort:** 17 points (~4-5 days)

---

### Project 4: Engine & Integration Enhancements
**Priority:** Medium
**Timeline:** Week 3-4 (Feb 10 - Feb 21)
**Target Date:** February 21, 2026

**Description:** Improve AnswerEngine capabilities and third-party integrations.

**Issues to Include:**
- AGENT-303 (Medium) - JIRA MCP maxResults parameter - S
- AGENT-305 (Medium) - JIRA MCP custom fields - S
- AGENT-304 (Medium) - Tool Nodes actions copy feature - S
- AGENT-651 (Low) - PDF Loader original_url metadata - M
- AGENT-564 (Low) - Integration docs with deep links - M
- AGENT-555 (Low) - Sanity MCP Server integration - M
- AGENT-147 (Low) - Guardrails for Document Store sync - M
- AGENT-652 (Medium) - Document-store API docs fix - S

**Estimated Effort:** 20 points (~5 days)

---

### Project 5: Sidekick & Extensions
**Priority:** Low
**Timeline:** Week 4+ (Feb 17 onwards)
**Target Date:** February 28, 2026

**Description:** Enhance Chrome extension and Sidekick functionality.

**Issues to Include:**
- AGENT-556 (Low) - Agentflow web content in Sidekick - M
- AGENT-649 (Medium) - Document browser extension variables - S
- AGENT-648 (Low) - Add "Add to Sidekick" button - M
- AGENT-647 (Low) - Quick-switch to Chief Sidekick - S
- AGENT-645 (Low) - AI-generated feedback suggestions - M
- AGENT-644 (Low) - Chrome extension install button - M
- AGENT-143 (Medium) - Links open in new tab - XS
- AGENT-123 (Low) - Debug info for Chrome extension - S

**Estimated Effort:** 19 points (~5 days)

---

### Project 6: Documentation & QA
**Priority:** Low
**Timeline:** Ongoing
**Target Date:** Rolling

**Description:** Maintain documentation and expand test coverage.

**Issues to Include:**
- AGENT-659 (Medium) - YouTube MCP Server docs - S
- AGENT-32 (In Review) - Tests for don't show again - S
- AGENT-66 (In Review) - Stabilize Modal E2E Tests - M
- AGENT-67 (Low) - E2E test CLI commands - S
- AGENT-31 (In Review) - Migrate LastRev Services - S
- AGENT-600 (Low) - Verify Datasets/Evaluators docs - L
- AGENT-604-606 (Low) - Evaluation documentation suite - M each

**Estimated Effort:** 22 points (~5-6 days)

---

### Project 7: Kumello Go-Live (Keep Existing)
**Priority:** Medium
**Timeline:** Week 2-3
**Target Date:** February 14, 2026

**Description:** Complete Kumello billing and go-live requirements.

**Issues to Include:**
- AGENT-50 (High) - Kumello Billing - M

**Estimated Effort:** 3 points

---

## 4-Week Sprint Timeline

### Week 1: Jan 27-31 (Focus: IAS Deployment & Critical Bugs)
| Project | Points | Target |
|---------|--------|--------|
| IAS v2.0 Production Deployment | 10 | 50% |
| Critical Bug Fixes | 7 | 50% |
| **Total** | **17** | |

### Week 2: Feb 3-7 (Focus: Finish IAS, Continue Bugs, Start Studio)
| Project | Points | Target |
|---------|--------|--------|
| IAS v2.0 Production Deployment | 7 | Complete |
| Critical Bug Fixes | 7 | Complete |
| Studio UX Improvements | 6 | 35% |
| **Total** | **20** | |

### Week 3: Feb 10-14 (Focus: Studio UX, Start Engine)
| Project | Points | Target |
|---------|--------|--------|
| Studio UX Improvements | 11 | Complete |
| Engine & Integrations | 10 | 50% |
| Kumello Go-Live | 3 | Complete |
| **Total** | **24** | |

### Week 4: Feb 17-21 (Focus: Engine, Start Sidekick)
| Project | Points | Target |
|---------|--------|--------|
| Engine & Integrations | 10 | Complete |
| Sidekick & Extensions | 10 | 50% |
| **Total** | **20** | |

---

## Summary

| Project | Points | Start | End |
|---------|--------|-------|-----|
| IAS v2.0 Production Deployment | 17 | Jan 27 | Feb 7 |
| Critical Bug Fixes | 14 | Jan 27 | Feb 7 |
| Studio UX Improvements | 17 | Feb 3 | Feb 14 |
| Engine & Integrations | 20 | Feb 10 | Feb 21 |
| Sidekick & Extensions | 19 | Feb 17 | Feb 28 |
| Kumello Go-Live | 3 | Feb 3 | Feb 14 |
| Documentation & QA | 22 | Ongoing | Rolling |
| **Total Planned** | **112** | | |

**Remaining Issues:** ~7 issues without estimates + lower priority items (~20 issues) to be addressed in future sprints.

---

## Next Steps

1. **Archive/sunset old projects** (list above)
2. **Create 6 new projects** in Linear with the structure above
3. **Move issues** to appropriate new projects
4. **Update the "IAS" project** that already exists with deployment focus
5. **Set up weekly sprints** (Week 2026-W05 already exists)
