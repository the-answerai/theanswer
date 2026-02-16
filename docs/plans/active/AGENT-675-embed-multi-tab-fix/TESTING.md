# AGENT-675: Manual Testing Guide — Embed Multi-Tab localStorage Fix

## Setup

1. Deploy or run locally a chatflow with the embed chatbot enabled
2. Have feedback (thumbs up/down) enabled in the chatbot config
3. Have lead capture enabled if testing lead scenarios
4. Open browser DevTools → Application tab to inspect `sessionStorage` and `localStorage`

---

## Test 1: Multi-Tab Isolation

**Goal:** Messages and feedback in one tab don't overwrite another tab's data.

1. Open the embed chatbot in **Tab A**
2. Send message: "Hello from Tab A"
3. Open the same embed chatbot in **Tab B** (new tab, same URL)
4. Send message: "Hello from Tab B"
5. In **Tab A**, send another message: "Second message Tab A"
6. In **Tab B**, give a thumbs-up to the bot's response

**Expected:**
- Tab A shows only its own messages (Hello from Tab A, Second message Tab A)
- Tab B shows only its own messages (Hello from Tab B)
- The thumbs-up in Tab B is visible in Tab B only
- In DevTools: each tab's `sessionStorage` has its own `{chatflowid}_EXTERNAL` with different `chatHistory` arrays
- `localStorage` contains the most recent write (backup)

---

## Test 2: Page Reload Persistence

**Goal:** Reloading a tab preserves its chat history and ratings (sessionStorage survives reload).

1. Open the chatbot and send a few messages
2. Give a thumbs-up to one bot response
3. Reload the page (F5 or Cmd+R)

**Expected:**
- All messages reappear after reload
- The thumbs-up rating is still shown on the correct message
- In DevTools: `sessionStorage` still has the `{chatflowid}_EXTERNAL` key with correct data

---

## Test 3: Returning User (New Tab After Close)

**Goal:** Closing a tab and opening a new one loads chat history from localStorage backup.

1. Open the chatbot, send messages, give feedback on a response
2. Close the tab entirely
3. Open a **new tab** to the same embed URL

**Expected:**
- Previous chat history loads (from localStorage backup)
- Previous ratings are displayed correctly
- In DevTools: `sessionStorage` is now populated (seeded from localStorage on mount)
- New messages in this tab write to both stores

---

## Test 4: Lead Persistence

**Goal:** Lead data survives tab close and doesn't re-prompt.

1. Open the chatbot with lead capture enabled
2. Fill in lead form (name, email, phone) and submit
3. Verify the success message appears
4. Close the tab
5. Open a new tab to the same embed URL

**Expected:**
- Lead form does NOT appear again — success message is shown instead
- In DevTools: `localStorage` has `lead` object in `{chatflowid}_EXTERNAL`
- `sessionStorage` also has the `lead` object (written on save and seeded on mount)

---

## Test 5: Clear Chat

**Goal:** Clearing chat removes history from both stores but preserves lead in localStorage.

1. Open the chatbot, send a few messages
2. If lead capture is enabled, submit lead info first
3. Click the "Clear" button in the title bar

**Expected:**
- Chat resets to welcome message
- In DevTools: `sessionStorage` key `{chatflowid}_EXTERNAL` is removed entirely
- In DevTools: `localStorage` key `{chatflowid}_EXTERNAL` either:
  - Contains only `{ "lead": {...} }` if lead was saved, OR
  - Is removed entirely if no lead was saved
- Lead form does NOT reappear if it was previously submitted

---

## Test 6: Rating Before First New Message (Seed Verification)

**Goal:** A returning user can rate old messages immediately without sending a new message first.

1. Open the chatbot, send a message, receive a bot response
2. Close the tab
3. Open a new tab to the same URL (chat loads from localStorage)
4. **Without sending any new message**, click thumbs-up on the loaded bot response

**Expected:**
- Rating is saved successfully (thumbs-up appears, color changes)
- No errors in console
- In DevTools: both `sessionStorage` and `localStorage` show the updated rating on that message
- This works because sessionStorage was seeded on mount before any `addChatMessage` call

---

## Test 7: Concurrent Feedback in Multiple Tabs

**Goal:** Giving feedback in two tabs simultaneously doesn't cause cross-contamination.

1. Open **Tab A** and **Tab B** with the chatbot
2. In Tab A: send "Question A" → receive bot response
3. In Tab B: send "Question B" → receive bot response
4. In Tab A: thumbs-up the bot response
5. In Tab B: thumbs-down the bot response
6. Reload both tabs

**Expected:**
- Tab A still shows thumbs-up on its response after reload
- Tab B still shows thumbs-down on its response after reload
- Neither tab's rating leaked into the other

---

## DevTools Quick Reference

To inspect storage during testing:

1. Open DevTools (F12 or Cmd+Option+I)
2. Go to **Application** tab
3. In the left sidebar:
   - **Local Storage** → select origin → look for `{chatflowid}_EXTERNAL`
   - **Session Storage** → select origin → look for `{chatflowid}_EXTERNAL`
4. Click on a key to see its JSON value
5. Compare `chatHistory` arrays between the two stores

**Key things to verify in storage:**
- `sessionStorage` is tab-scoped (different per tab)
- `localStorage` is shared (same across tabs, contains last write)
- Both have `chatId` and `chatHistory`
- `lead` data is present in `localStorage` after lead submission
