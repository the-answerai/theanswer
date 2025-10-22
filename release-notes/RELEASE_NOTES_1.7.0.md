# Release 1.7.0 - AI Video Creation & Enhanced User Experience

**Release Date:** October 17, 2025  
**Release Branch:** `release/1.7.0`

---

## 🎉 What's New

### 🎥 Sora & Veo Video Generator Integration

A completely new video generation feature has been added to TheAnswer, enabling users to create AI-generated videos using OpenAI's Sora and Google's Veo models.

**Key Features:**
- **Multi-Provider Support**: Choose between OpenAI Sora and Google Veo models
- **Flexible Aspect Ratios**: Support for landscape, portrait, and square formats
- **Video Duration Control**: Generate videos from 5 to 10+ seconds
- **Reference Image Support**: Upload and crop reference images to guide video generation
- **Prompt Enhancement Wizard**: AI-powered prompt enhancement with customizable parameters including:
  - Camera angles and movements
  - Visual style and mood
  - Scene details and subject characteristics
  - Lighting and tone preferences
- **Generation History**: Track and manage all your video generation attempts
- **Job Polling**: Real-time status updates with automatic polling
- **Video Remix**: Iterate on existing generations with new prompts
- **Export & Save**: Download videos and save favorites to your library

**How to Use:**
1. Navigate to **Sidekick Studio > Video Creator** in the main navigation
2. Enter your video prompt or use the Prompt Enhancer Wizard for better results
3. Select your preferred provider (OpenAI or Google)
4. Configure generation parameters:
   - Aspect ratio (16:9, 9:16, or 1:1)
   - Video duration (5-10+ seconds)
   - Optional: Upload a reference image
   - Optional: Add negative prompts
5. Click "Generate Video" and monitor progress
6. Once complete, download or save to your library

**API Endpoints:**
- `POST /api/v1/video-generator/generate` - Start a new video generation
- `GET /api/v1/video-generator/job/:jobId` - Get job status
- `POST /api/v1/video-generator/save` - Save a video to library
- `GET /api/v1/video-generator/saved` - List saved videos
- `DELETE /api/v1/video-generator/saved/:id` - Delete saved video

**Billing Integration:**
Video generation usage is tracked and billed based on:
- Model provider (OpenAI/Google)
- Video duration
- Resolution/aspect ratio

---

### 🎨 Gamma Presentation Tool Integration

A new Gamma tool has been added, allowing AI agents to create beautiful presentations directly from conversational prompts.

**Features:**
- **Full Gamma API Integration**: Create presentations, documents, and webpages
- **Comprehensive Configuration Options**:
  - Text mode (outline, bullets, paragraph, freestyle)
  - Theme selection (100+ professional themes)
  - Card count and splitting preferences
  - Text tone, audience, and language customization
  - Image generation with style preferences
  - Card dimensions (standard, vertical, horizontal)
  - Sharing and access controls
- **Poll Until Complete**: Automatic polling for generation completion
- **Configurable Options**: Allow agents to dynamically adjust parameters
- **Export Formats**: Export as PDF, PPT, or Markdown

**How to Use:**
1. Add the **Gamma** tool to your chatflow or agent
2. Configure your Gamma API credentials in the Credentials panel
3. Set default preferences for:
   - Theme name
   - Number of cards
   - Text tone and audience
   - Image model and style
4. Enable "Ask User" options to let the AI determine these dynamically
5. Use in prompts like: "Create a 10-slide presentation about climate change with a professional tone"

**Credential Setup:**
1. Go to Credentials panel
2. Add new credential → Select "Gamma API"
3. Enter your Gamma API key from [gamma.app/api](https://gamma.app/api)

---

### ✨ Enhanced Credentials Modal Experience

Significant improvements to the credentials management interface for a smoother user experience.

**Improvements:**
- **Smart Auto-Selection**: Automatically selects existing compatible credentials when available
- **Better Visual Feedback**: Enhanced icons and status indicators for Assistant and Sidekick cards
- **User Preference Memory**: Remembers your preference to auto-select credentials
- **Improved Modal Flow**: Better organization and clearer credential selection process
- **Enhanced Error Handling**: More informative error messages when credentials are missing or invalid

**How to Use:**
1. When setting up a new flow or tool requiring credentials:
   - If you have compatible credentials, they'll be auto-selected
   - You can still choose different credentials from the dropdown
2. The system will remember your preference for future setups
3. Visual indicators show which credentials are currently in use
4. Missing credentials are now more clearly highlighted with actionable prompts

---

### 🎨 Corporate Style & Branding Updates

Major visual refresh across documentation and landing pages with a more professional, icon-based design system.

**Changes:**
- Replaced emoji-based UI elements with professional Lucide React icons
- Updated all landing pages (Agents, Apps, Chat, Browser Sidekick, etc.)
- Enhanced visual consistency across documentation
- Improved readability and accessibility
- Modernized component styling throughout

**Affected Pages:**
- Home page
- Agents page
- Apps page
- Browser Sidekick
- Chat interface
- Creator portal
- JLINC Partnership
- Getting Started
- Webinar pages

---

## 🐛 Bug Fixes

### Critical Fixes

#### S3 Storage Architecture Refinement
**Impact:** Medium - Improves reliability and simplifies codebase

**What Was Fixed:**
- Limited S3 storage usage to version management operations only
- Removed S3 draft lookup from primary chatflow retrieval
- Eliminated race conditions between S3 and database
- Simplified `getChatflowById` signature by removing `useDraft` parameter

**Technical Details:**
- S3 is now exclusively used for:
  - Version listing
  - Version retrieval
  - Version rollback operations
- All active chatflow operations now use database as single source of truth
- Removed `useDraft` parameter from API endpoints
- Updated controller calls to consistently use database

**Why This Matters:**
Previously, the system would check both S3 and database for draft states, creating potential inconsistencies. This change ensures:
- More predictable behavior
- Better performance (fewer S3 calls)
- Reduced complexity
- Clearer separation of concerns

**Files Changed:**
- `packages/server/src/controllers/chatflows/index.ts`
- `packages/server/src/services/chatflows/index.ts`

---

#### Database Rollback Operation Fix
**Impact:** High - Prevents data loss during version rollback

**What Was Fixed:**
- Fixed flowData not updating in database during rollback operations
- Ensured rollback operations properly sync between S3 versions and database

**Technical Details:**
- Added database update step during version rollback
- Ensures `flowData` field is properly updated when rolling back to previous version
- Maintains consistency between version storage and active chatflow state

**Why This Matters:**
Previously, rolling back to a previous version would update references but not the actual flow data, causing confusion and potential data loss.

---

### Code Quality Improvements

#### ESLint Compliance
**Impact:** Low - Code quality and maintainability

**What Was Fixed:**
- Fixed linting errors across multiple files
- Improved code consistency
- Updated ESLint configuration for better coverage
- Resolved React hook dependencies warnings
- Fixed prototype pollution vulnerability (Code Scanning Alert #202)

**Files Changed:**
- Multiple files across `packages/docs`, `packages-answers/ui`, and `packages/components`
- Added `.eslintignore` patterns for better control
- Updated workflow configurations

---

## 🔧 Technical Improvements

### Dependency Updates
- Added `replicate` package for AI model integrations
- Updated various package versions for security and compatibility
- Added new video generation dependencies

### API Architecture
- New video generator service layer with LangFuse tracking
- Enhanced error handling in video generation pipeline
- Improved billing event tracking for video usage

### Database Schema
- No schema changes in this release (backwards compatible)

---

## ⚠️ Breaking Changes

### S3 Storage API Changes (Minor)

**Affected API:**
- `getChatflowById(id, useDraft)` → `getChatflowById(id)`

**Migration Guide:**
If you were using the `useDraft` parameter in custom integrations:

**Before:**
```javascript
const chatflow = await getChatflowById(chatflowId, true)  // Get draft from S3
```

**After:**
```javascript
const chatflow = await getChatflowById(chatflowId)  // Always uses database
```

**Impact Assessment:**
- **Internal API only** - Does not affect external integrations
- Most users won't need to make any changes
- If you have custom server modifications that call this function, update your calls

---

## 📦 Installation & Upgrade

### For New Installations:
```bash
git clone <repository>
cd theanswer
git checkout release/1.7.0
pnpm install
pnpm build
```

### For Existing Installations:
```bash
git fetch origin
git checkout release/1.7.0
pnpm install  # Install new dependencies
pnpm build    # Rebuild all packages
```

### Environment Variables:
No new environment variables are required for this release.

**Optional for Video Generation:**
- `OPENAI_API_KEY` - For Sora video generation
- `GOOGLE_API_KEY` - For Veo video generation

**Optional for Gamma Integration:**
- Users must provide their own Gamma API keys via the credentials panel

---

## 🧪 Testing Recommendations

After upgrading, please test:

1. **Video Generation**:
   - Try generating a video with OpenAI Sora
   - Try generating a video with Google Veo
   - Test the prompt enhancement wizard
   - Verify video save/download functionality

2. **Gamma Integration**:
   - Add Gamma credentials
   - Create a presentation via AI agent
   - Test different theme and format options

3. **Credentials Flow**:
   - Set up a new chatflow with tools requiring credentials
   - Verify auto-selection works
   - Check that existing credentials remain functional

4. **Chatflow Operations**:
   - Load existing chatflows
   - Save changes to chatflows
   - Test version rollback functionality
   - Verify drafts save correctly

5. **General Stability**:
   - Run existing agents and workflows
   - Check that all integrations still work
   - Verify billing events are tracked correctly

---

## 📊 Statistics

- **Total Commits:** 20
- **Files Changed:** 85+
- **Lines Added:** ~5,000+
- **Lines Removed:** ~500+
- **New Features:** 3 major features
- **Bug Fixes:** 3 critical fixes
- **Contributors:** 3

---

## 🙏 Credits

Special thanks to our contributors:
- **Brad Taylor** (CEO) - Video generation architecture
- **Max Techera** (CTO) - S3 storage refactoring
- **Diego Costa** - Credentials UX improvements
- **Answer Team** - Testing and code review

---

## 📚 Documentation Updates

New documentation has been added for:
- Video Creator user guide
- Gamma tool integration guide
- Credentials management best practices
- API reference updates

Visit our [documentation](https://docs.answeragent.ai) for detailed guides.

---

## 🐛 Known Issues

None reported at release time.

If you encounter any issues, please report them on our [GitHub Issues](https://github.com/the-answerai/theanswer/issues) page.

---

## 🔜 Coming Soon

Features planned for upcoming releases:
- Additional video model integrations
- Batch video generation
- Video editing capabilities
- Enhanced presentation customization
- More AI tool integrations

---

## 📞 Support

For questions or issues:
- **Documentation:** https://docs.answeragent.ai
- **Discord:** https://discord.gg/X54ywt8pzj
- **GitHub Issues:** https://github.com/the-answerai/theanswer/issues
- **Email:** support@answeragent.ai

---

**Full Changelog:** [`staging...release/1.7.0`](https://github.com/the-answerai/theanswer/compare/staging...release/1.7.0)

