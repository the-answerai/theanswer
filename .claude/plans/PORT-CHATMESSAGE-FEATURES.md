# Port ChatMessage Features from Main Branch

**Analysis Date:** 2025-10-31
**Source:** `origin/main:packages/ui/src/views/chatmessage/ChatMessage.jsx` (3165 lines)
**Target:** `packages-answers/ui/src/Message/Message.tsx` (1190 lines)
**Status:** Draft Plan

---

## Executive Summary

Main branch ChatMessage.jsx is **2.66x larger** (3165 vs 1190 lines) and contains several production-ready features missing from our current implementation. This analysis identifies all feature gaps and provides a phased porting plan.

**Key Finding:** We're AHEAD in some areas (tool/usageMetadata events) but BEHIND in critical features (calledTools display, TTS, SafeHTML).

---

## Feature Gap Analysis

### ✅ **Features We Have That Main Doesn't**

| Feature | Location | Status |
|---------|----------|--------|
| `tool` event handler | AnswersContext.tsx:733 | ✅ We added in ANS-65 |
| `usageMetadata` event handler | AnswersContext.tsx:730 | ✅ We added in ANS-65 |
| ArtifactRenderer component | Message/ArtifactRenderer.tsx | ✅ We created |
| AgentExecutedDataCard (enhanced) | Message/AgentExecutedDataCard.tsx | ✅ We ported from Flowise |
| NodeExecutionDetails modal | Message/NodeExecutionDetails.tsx | ✅ We created |
| AGENTFLOW_ICONS constants | constants/agentflow.ts | ✅ We created |

### ❌ **Critical Missing Features**

#### 1. **Progressive Tool Display (calledTools)**
- **Location (main)**: Lines 2480-2520
- **Status**: ❌ NOT implemented
- **Description**: Shows tools with spinner while executing, replaces with final results
- **Visual**: Blue chips with CircularProgress → Gray chips with IconTool
- **Priority**: **HIGH** (User requested this feature)
- **Dependencies**: None (events already captured in AnswersContext)
- **Effort**: Small (~2-3 hours)

**Implementation Details:**
```jsx
// Main branch approach (lines 2480-2520)
{message.calledTools && (
    <div>
        {message.calledTools.map((tool, index) => (
            <Chip
                key={`called-${index}`}
                label={tool.tool}
                icon={<CircularProgress size={15} color='primary' />}
                sx={{
                    borderColor: 'primary.main',
                    color: 'primary.main',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    opacity: 0.9
                }}
            />
        ))}
    </div>
)}
```

**Smart Replacement Logic (lines 690-710):**
```javascript
const updateLastMessageUsedTools = (usedTools) => {
    // When usedTools arrive, remove matching calledTools
    const remainingCalledTools = lastMessage.calledTools.filter(
        (calledTool) => !usedTools.some((usedTool) => usedTool.tool === calledTool.tool)
    )
    allMessages[allMessages.length - 1].calledTools =
        remainingCalledTools.length > 0 ? remainingCalledTools : undefined
}
```

---

#### 2. **Text-to-Speech (TTS) Support**
- **Location (main)**: Lines 259-275 (state), 1125-1134 (events), 1642-1691 (controls), 2801 (UI)
- **Status**: ❌ NOT implemented
- **Description**: Audio playback for AI responses with streaming support
- **Events**: `tts_start`, `tts_data`, `tts_end`, `tts_abort`
- **Priority**: **MEDIUM** (Nice-to-have, not requested)
- **Dependencies**: ttsApi, audio playback infrastructure
- **Effort**: Large (~2-3 days)

**State Management:**
```javascript
// Lines 259-275
const [ttsAudio, setTtsAudio] = useState({})
const [isChatFlowAvailableForSpeech, setIsChatFlowAvailableForSpeech] = useState(false)
const [ttsStreamingState, setTtsStreamingState] = useState({
    isStreaming: false,
    chunks: [],
    abortController: null,
    audio: null,
    messageId: null,
    currentTime: 0,
    duration: 0
})
const ttsTimeoutRef = useRef(null)
```

**UI Controls (line 2801):**
```jsx
<IconButton onClick={() => handleTTS(messageId)}>
    <IconVolume size={20} />
</IconButton>
```

**API Integration:**
```javascript
// Line 1672
await ttsApi.abortTTS({ chatflowId, chatId, chatMessageId: messageId })
```

---

#### 3. **SafeHTML Component (XSS Protection)**
- **Location (main)**: Line 53 (import), 2242 (usage)
- **Status**: ❌ NOT implemented
- **Description**: Secure HTML rendering to prevent XSS attacks
- **Current Risk**: ⚠️ We use `dangerouslySetInnerHTML` in ArtifactRenderer.tsx:67
- **Priority**: **CRITICAL** (Security vulnerability)
- **Dependencies**: SafeHTML component from `@/ui-component/safe/SafeHTML`
- **Effort**: Small (~1-2 hours to port component + update usage)

**Current Vulnerable Code:**
```tsx
// ArtifactRenderer.tsx:67 (VULNERABLE!)
if (artifact.type === 'html') {
    return <div dangerouslySetInnerHTML={{ __html: artifact.data }}></div>
}
```

**Should Be:**
```jsx
// Main branch approach (line 2242)
if (item.type === 'html') {
    return <SafeHTML html={item.data} />
}
```

---

#### 4. **cleanupCalledTools Function**
- **Location (main)**: Lines 722-735
- **Status**: ❌ NOT implemented
- **Description**: Removes orphaned calledTools when stream ends without matching usedTools
- **Priority**: **HIGH** (Prevents UI bugs)
- **Dependencies**: calledTools display
- **Effort**: Trivial (~30 minutes)

**Implementation:**
```javascript
const cleanupCalledTools = () => {
    setMessages((prevMessages) => {
        let allMessages = [...cloneDeep(prevMessages)]
        const lastMessage = allMessages[allMessages.length - 1]
        if (lastMessage?.calledTools?.length > 0) {
            const hasUsedTools = lastMessage.usedTools?.length > 0
            if (!hasUsedTools) {
                allMessages[allMessages.length - 1].calledTools = undefined
            }
        }
        return allMessages
    })
}
```

---

#### 5. **AgentReasoningCard Component**
- **Location (main)**: Line 57 (import), 2451-2467 (usage)
- **Status**: ⚠️ Partially implemented (we have inline accordion)
- **Description**: Dedicated component for agent reasoning with consistent styling
- **Priority**: **LOW** (We have working alternative)
- **Dependencies**: AgentReasoningCard component
- **Effort**: Medium (~4-6 hours to port and integrate)

**Main Branch Approach:**
```jsx
{message.agentReasoning.map((agent, index) => (
    <AgentReasoningCard
        key={index}
        agent={agent}
        index={index}
        customization={customization}
        chatflowid={chatflowid}
        onSourceDialogClick={onSourceDialogClick}
        renderArtifacts={renderArtifacts}
        agentReasoningArtifacts={agentReasoningArtifacts}
        getAgentIcon={getAgentIcon}
    />
))}
```

**Our Approach:**
- Inline accordion with custom styling (Message.tsx:352-580)
- Works well, but less modular

---

#### 6. **Artifact Rendering Pattern Difference**
- **Location (main)**: Lines 2180-2260 (renderArtifacts function)
- **Status**: ⚠️ Different approach (we use ArtifactRenderer component)
- **Description**: Function-based vs component-based artifact rendering
- **Priority**: **LOW** (Our approach is actually better)
- **Assessment**: ✅ **Keep our implementation** (more modular)

---

### 🔄 **Event Handler Comparison**

| Event | Main Branch | Current (Answers) | Notes |
|-------|-------------|-------------------|-------|
| start | ✅ | ✅ | Identical |
| token | ✅ | ✅ | Identical |
| sourceDocuments | ✅ | ✅ | Identical |
| usedTools | ✅ | ✅ | Main has smart replacement logic |
| **calledTools** | ✅ | ✅ | Main DISPLAYS it, we only capture |
| fileAnnotations | ✅ | ✅ | Identical |
| agentReasoning | ✅ | ✅ | Identical |
| agentFlowEvent | ✅ | ✅ | Identical |
| agentFlowExecutedData | ✅ | ✅ | Identical |
| artifacts | ✅ | ✅ | Identical |
| action | ✅ | ✅ | Identical |
| nextAgent | ✅ | ✅ | Identical |
| nextAgentFlow | ✅ | ✅ | Identical |
| metadata | ✅ | ✅ | Identical |
| error | ✅ | ✅ | Identical |
| abort | ✅ | ✅ | Identical |
| end | ✅ | ✅ | Identical |
| **tts_start** | ✅ | ❌ | Missing TTS support |
| **tts_data** | ✅ | ❌ | Missing TTS support |
| **tts_end** | ✅ | ❌ | Missing TTS support |
| **tts_abort** | ✅ | ❌ | Missing TTS support |
| **tool** | ❌ | ✅ | We're ahead! (ANS-65) |
| **usageMetadata** | ❌ | ✅ | We're ahead! (ANS-65) |

---

## Implementation Plan

### **Phase 1: Critical Security & UX (Immediate)** 🚨

**Estimated Time:** 1 day

#### 1.1 Port SafeHTML Component
- **Why First:** Fixes XSS vulnerability in ArtifactRenderer
- **Files:**
  - Create: `packages-answers/ui/src/components/SafeHTML.tsx`
  - Modify: `Message/ArtifactRenderer.tsx` (replace dangerouslySetInnerHTML)
- **Testing:**
  - Test with malicious HTML artifacts
  - Verify legitimate HTML still renders

#### 1.2 Implement calledTools Display
- **Why First:** User explicitly requested progressive tool display
- **Files:**
  - Modify: `Message/Message.tsx` (add calledTools rendering before usedTools)
  - Modify: `AnswersContext.tsx` (add smart replacement logic to updateLastMessageUsedTools)
  - Modify: `AnswersContext.tsx` (add cleanupCalledTools function)
- **Visual Spec:**
  - calledTools: Blue border, CircularProgress icon, 90% opacity
  - usedTools: Gray border, IconTool icon, 100% opacity
  - Progressive replacement: Remove calledTool when matching usedTool arrives
- **Testing:**
  - Test with ToolAgent chatflows
  - Test with Multi-Agent Supervisor (multiple tools)
  - Verify cleanup on stream end

---

### **Phase 2: TTS Support (Optional - Medium Priority)** 🔊

**Estimated Time:** 2-3 days

**Decision Point:** Confirm with user if TTS is needed before starting

#### 2.1 Port TTS Infrastructure
- **Files:**
  - Check if `ttsApi` exists in packages-answers
  - Port if missing from `packages/api/tts.js`

#### 2.2 Add TTS State Management
- **Files:**
  - Modify: `AnswersContext.tsx`
  - Add state: `ttsAudio`, `isChatFlowAvailableForSpeech`, `ttsStreamingState`, `ttsTimeoutRef`
  - Add handlers: `handleTTS`, `stopTTS`, `abortTTS`

#### 2.3 Add TTS Event Handlers
- **Files:**
  - Modify: `AnswersContext.tsx` (add cases for tts_start, tts_data, tts_end, tts_abort)

#### 2.4 Add TTS UI Controls
- **Files:**
  - Modify: `Message/Message.tsx` (add IconVolume button near feedback buttons)
  - Add audio playback visualization

---

### **Phase 3: Component Refactoring (Low Priority)** 🔧

**Estimated Time:** 1-2 days

**Decision Point:** Only if we want to match Flowise Studio architecture exactly

#### 3.1 Extract AgentReasoningCard Component (Optional)
- **Rationale:** Main uses dedicated component, we use inline accordion
- **Assessment:** Our approach works fine, refactor only if needed for consistency
- **Files:**
  - Create: `Message/AgentReasoningCard.tsx`
  - Modify: `Message/Message.tsx` (replace inline accordion)

---

## Testing Plan

### Unit Tests
- [ ] SafeHTML sanitizes XSS attempts
- [ ] calledTools → usedTools replacement logic
- [ ] Orphaned calledTools cleanup
- [ ] TTS audio playback (if implemented)

### Integration Tests
- [ ] Test with ToolAgent chatflow (single tool)
- [ ] Test with Multi-Agent Supervisor (multiple tools)
- [ ] Test with AgentflowV2 (complex workflows)
- [ ] Test tool errors (ensure error state displays)
- [ ] Test HTML artifacts (ensure SafeHTML works)

### Manual Testing
- [ ] Visual verification of progressive tool display
- [ ] Test on mobile/tablet (responsive)
- [ ] Test with real chatflows in staging

---

## Risk Assessment

### High Risk
- **SafeHTML migration**: Could break existing HTML artifact rendering
  - **Mitigation**: Test thoroughly with various HTML content

### Medium Risk
- **calledTools display**: Could cause UI flicker or performance issues
  - **Mitigation**: Use proper React keys, test with many tools

### Low Risk
- **TTS support**: Isolated feature, won't affect existing functionality
  - **Mitigation**: Feature flag for gradual rollout

---

## Recommendation

**Immediate Action (Phase 1):**
1. ✅ Port SafeHTML component (1-2 hours) - **CRITICAL SECURITY FIX**
2. ✅ Implement calledTools display (2-3 hours) - **USER REQUESTED**
3. ✅ Add cleanupCalledTools function (30 min) - **PREVENTS BUGS**

**Total Phase 1 Effort:** ~1 day

**Defer for now:**
- Phase 2 (TTS) - Wait for user confirmation
- Phase 3 (Refactoring) - Not needed, our approach is fine

**Next Steps:**
1. Get user approval on this plan
2. Implement Phase 1 immediately
3. Test thoroughly
4. Decide on Phase 2 based on requirements

---

## Open Questions

1. **TTS Priority:** Do we need text-to-speech support? (Not requested by user)
2. **AgentReasoningCard:** Should we refactor to match Flowise exactly? (Our approach works)
3. **Testing Strategy:** Do we have existing test infrastructure for chat UI?
4. **Deployment:** Should we feature-flag calledTools display for gradual rollout?

---

## Appendix: Code Snippets

### A. SafeHTML Component (Main Branch)

**Location:** `packages/ui/src/ui-component/safe/SafeHTML.tsx` (assumed)

Need to check main branch for this component implementation.

### B. calledTools Smart Replacement

```javascript
// Main branch: packages/ui/src/views/chatmessage/ChatMessage.jsx:690-710
const updateLastMessageUsedTools = (usedTools) => {
    setMessages((prevMessages) => {
        let allMessages = [...cloneDeep(prevMessages)]
        if (allMessages[allMessages.length - 1].type === 'userMessage') return allMessages

        // When usedTools are received, check if there are matching calledTools to replace
        const lastMessage = allMessages[allMessages.length - 1]
        if (lastMessage.calledTools && lastMessage.calledTools.length > 0) {
            // Remove calledTools that have been replaced by usedTools
            const remainingCalledTools = lastMessage.calledTools.filter(
                (calledTool) => !usedTools.some((usedTool) => usedTool.tool === calledTool.tool)
            )

            allMessages[allMessages.length - 1].calledTools =
                remainingCalledTools.length > 0 ? remainingCalledTools : undefined
        }

        allMessages[allMessages.length - 1].usedTools = usedTools
        return allMessages
    })
}
```

### C. TTS State Structure

```typescript
interface TTSStreamingState {
    isStreaming: boolean
    chunks: Uint8Array[]
    abortController: AbortController | null
    audio: HTMLAudioElement | null
    messageId: string | null
    currentTime: number
    duration: number
}
```

---

**End of Analysis**
