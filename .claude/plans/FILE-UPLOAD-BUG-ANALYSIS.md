# File Upload Bug Analysis - RAG File Uploads Not Working

**Date:** 2025-10-31
**Issue:** File upload button shows but doesn't allow selecting PDF/document files for RAG
**Root Cause:** Missing `isRAGFileUploadAllowed` detection in client-side code

---

## ✅ Verified: Server-Side Implementation (CORRECT)

### Server Endpoint
**File:** `packages/server/src/routes/chatflows-uploads/index.ts`
**Line 7:** `router.get(['/', '/:id'], chatflowsController.checkIfChatflowIsValidForUploads)`

### Controller
**File:** `packages/server/src/controllers/chatflows/index.ts`
**Lines 26-39:**
```typescript
const checkIfChatflowIsValidForUploads = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (typeof req.params === 'undefined' || !req.params.id) {
            throw new InternalFlowiseError(
                StatusCodes.PRECONDITION_FAILED,
                `Error: chatflowsRouter.checkIfChatflowIsValidForUploads - id not provided!`
            )
        }
        const apiResponse = await chatflowsService.checkIfChatflowIsValidForUploads(req.params.id)
        return res.json(apiResponse)
    } catch (error) {
        next(error)
    }
}
```

### Service
**File:** `packages/server/src/services/chatflows/index.ts`
**Lines 86-96:**
```typescript
const checkIfChatflowIsValidForUploads = async (chatflowId: string): Promise<any> => {
    try {
        const dbResponse = await utilGetUploadsConfig(chatflowId)
        return dbResponse
    } catch (error) {
        throw new InternalFlowiseError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Error: chatflowsService.checkIfChatflowIsValidForUploads - ${getErrorMessage(error)}`
        )
    }
}
```

### Core Detection Logic
**File:** `packages/server/src/utils/getUploadsConfig.ts`

#### RAG File Upload Detection (Lines 54-78):
```typescript
/*
 * Condition for isRAGFileUploadAllowed
 * 1.) vector store with fileUpload = true && connected to a document loader with fileType
 */
const fileUploadSizeAndTypes: IUploadFileSizeAndTypes[] = []
for (const node of nodes) {
    if (node.data.category === 'Vector Stores' && node.data.inputs?.fileUpload) {
        // Get the connected document loader node fileTypes
        const sourceDocumentEdges = edges.filter(
            (edge) => edge.target === node.id && edge.targetHandle === `${node.id}-input-document-Document`
        )
        for (const edge of sourceDocumentEdges) {
            const sourceNode = nodes.find((node) => node.id === edge.source)
            if (!sourceNode) continue
            const fileType = sourceNode.data.inputParams.find((param) => param.type === 'file' && param.fileType)?.fileType
            if (fileType) {
                fileUploadSizeAndTypes.push({
                    fileTypes: fileType.split(', '),  // e.g., ['.pdf', '.txt', '.csv', '.docx']
                    maxUploadSize: 500  // 500MB
                })
                isRAGFileUploadAllowed = true
            }
        }
        break
    }
}
```

#### Return Value (Lines 140-147):
```typescript
return {
    isSpeechToTextEnabled,
    isImageUploadAllowed,
    isRAGFileUploadAllowed,      // ← This flag
    imgUploadSizeAndTypes,        // ← Array of image file types
    fileUploadSizeAndTypes        // ← Array of document file types (PDF, etc.)
}
```

**Example Response:**
```json
{
  "isSpeechToTextEnabled": false,
  "isImageUploadAllowed": true,
  "isRAGFileUploadAllowed": true,
  "imgUploadSizeAndTypes": [
    {
      "fileTypes": ["image/gif", "image/jpeg", "image/png", "image/webp"],
      "maxUploadSize": 5
    }
  ],
  "fileUploadSizeAndTypes": [
    {
      "fileTypes": [".pdf", ".txt", ".csv", ".docx"],
      "maxUploadSize": 500
    }
  ]
}
```

---

## ✅ Verified: Main Branch ChatMessage Implementation (CORRECT)

### API Client
**File:** `packages/ui/src/api/chatflows.js`
**Line 18:**
```javascript
const getAllowChatflowUploads = (id) => client.get(`/chatflows-uploads/${id}`)
```

### ChatMessage Component Usage
**File:** `packages/ui/src/views/chatmessage/ChatMessage.jsx`

**Line 203:** API call setup
```javascript
const getAllowChatFlowUploads = useApi(chatflowsApi.getAllowChatflowUploads)
```

**Lines 1322-1330:** State updates from API response
```javascript
useEffect(() => {
    if (getAllowChatFlowUploads.data) {
        setIsChatFlowAvailableForImageUploads(getAllowChatFlowUploads.data?.isImageUploadAllowed ?? false)
        setIsChatFlowAvailableForRAGFileUploads(getAllowChatFlowUploads.data?.isRAGFileUploadAllowed ?? false)
        setIsChatFlowAvailableForSpeech(getAllowChatFlowUploads.data?.isSpeechToTextEnabled ?? false)
        setImageUploadAllowedTypes(getAllowChatFlowUploads.data?.imgUploadSizeAndTypes.map((allowed) => allowed.fileTypes).join(','))
        setFileUploadAllowedTypes(getAllowChatFlowUploads.data?.fileUploadSizeAndTypes.map((allowed) => allowed.fileTypes).join(','))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [getAllowChatFlowUploads.data])
```

**Lines 2377-2384:** File upload UI rendering
```javascript
{(getAllowChatFlowUploads.data?.isImageUploadAllowed || getAllowChatFlowUploads.data?.isRAGFileUploadAllowed) && (
    <input
        type='file'
        multiple
        accept={[
            ...getAllowChatFlowUploads.data.imgUploadSizeAndTypes,
            ...getAllowChatFlowUploads.data.fileUploadSizeAndTypes
        ].map((upload) => upload.fileTypes).join(',')}
        onChange={onFileChange}
    />
)}
```

**Lines 304-310:** File validation logic
```javascript
} else if (constraints.isRAGFileUploadAllowed) {
    const fileExt = `.${file.name.split('.').pop()}`
    if (fileExt && constraints.fileUploadSizeAndTypes && Array.isArray(constraints.fileUploadSizeAndTypes)) {
        constraints.fileUploadSizeAndTypes.forEach((allowed) => {
            if (allowed.fileTypes && allowed.fileTypes.includes(fileExt) && sizeInMB <= allowed.maxUploadSize) {
                acceptFile = true
            }
        })
    }
}
```

---

## ❌ BUG: Answers UI Implementation (BROKEN)

### Current Implementation
**File:** `packages-answers/ui/src/AnswersContext.tsx`

**Lines 224-228:** Hardcoded constraints (WRONG!)
```typescript
constraints: {
    isSpeechToTextEnabled: false,
    isImageUploadAllowed: false,  // ← ALWAYS FALSE!
    uploadSizeAndTypes: []        // ← ALWAYS EMPTY!
}
```

**Problem:** The constraints are hardcoded when the sidekick object is created, and **never updated** with actual data from the server.

### What's Missing

1. **No API call** to `/api/v1/chatflows-uploads/${sidekickId}`
2. **No state update** when chatflow loads
3. **No `isRAGFileUploadAllowed` field** in constraints interface
4. **No `fileUploadSizeAndTypes` field** in constraints

### Impact on ChatInput

**File:** `packages-answers/ui/src/ChatInput.tsx`

**Lines 693-699:** Button visibility check
```typescript
startAdornment: (constraints?.isImageUploadAllowed || constraints?.isSpeechToTextEnabled) && (
    <Tooltip title='Attach file'>
        <IconButton component='label' sx={{ minWidth: 0 }}>
            <AttachFileIcon />
            <input type='file' accept={getAcceptedFileTypes()} hidden multiple onChange={handleFileUpload} />
        </IconButton>
    </Tooltip>
),
```

✅ **Button shows** because `constraints?.isImageUploadAllowed` might be truthy (from image uploads)

**Lines 202-211:** File type acceptance
```typescript
const getAcceptedFileTypes = () => {
    const acceptedTypes: string[] = []
    if (constraints?.isImageUploadAllowed) {
        acceptedTypes.push('image/*')
    }
    if (constraints?.isSpeechToTextEnabled) {
        acceptedTypes.push('audio/*')
    }
    return acceptedTypes.join(',')  // ← NEVER includes document types!
}
```

❌ **No document types** because there's no check for `isRAGFileUploadAllowed`

**Lines 156-200:** File validation
```typescript
const isFileAllowedForUpload = (file: File) => {
    const fileType = file.type
    const sizeInMB = file.size / 1024 / 1024
    let isAllowed = false
    let error = ''
    const isImageType = fileType.startsWith('image/')
    const isAudioType = fileType.startsWith('audio/')

    if (isAudioType && constraints?.isSpeechToTextEnabled) {
        // ... audio validation
    } else if (isImageType && constraints?.isImageUploadAllowed) {
        // ... image validation
    } else {
        error = `File type not supported: ${file.name}`  // ← PDFs rejected here!
    }

    return isAllowed
}
```

❌ **No RAG file validation** - PDFs/documents are rejected as "not supported"

---

## 🔧 The Fix

### Step 1: Update Sidekick Interface
**File:** `packages-answers/types/src/index.ts`

Add `isRAGFileUploadAllowed` and `fileUploadSizeAndTypes` to the constraints interface:

```typescript
export interface Sidekick extends DB.Sidekick {
    constraints: {
        isSpeechToTextEnabled: boolean
        isImageUploadAllowed: boolean
        isRAGFileUploadAllowed: boolean  // ← ADD THIS
        uploadSizeAndTypes: {
            fileTypes: string[]
            maxUploadSize: number
        }[]
    }
    // ... rest of interface
}

export interface SidekickListItem extends Pick<DB.Sidekick, '...'> {
    constraints: {
        isSpeechToTextEnabled: boolean
        isImageUploadAllowed: boolean
        isRAGFileUploadAllowed: boolean  // ← ADD THIS
        uploadSizeAndTypes: {
            fileTypes: string[]
            maxUploadSize: number
        }[]
    }
    // ... rest of interface
}
```

### Step 2: Fetch Upload Config in AnswersContext
**File:** `packages-answers/ui/src/AnswersContext.tsx`

Add API call to fetch real upload constraints:

```typescript
// Add near line 850, in the useEffect where you check streaming
useEffect(() => {
    if (sidekick?.id) {
        const fetchUploadConstraints = async () => {
            try {
                const baseURL = sessionStorage.getItem('baseURL') || ''
                const response = await fetch(`${baseURL}/api/v1/chatflows-uploads/${sidekick.id}`, {
                    headers: {
                        'x-request-from': 'internal',
                        ...(token ? { Authorization: `Bearer ${token}` } : {})
                    }
                })

                if (response.ok) {
                    const data = await response.json()

                    // Update sidekick constraints with real data
                    setSidekick(prev => prev ? {
                        ...prev,
                        constraints: {
                            isSpeechToTextEnabled: data?.isSpeechToTextEnabled ?? false,
                            isImageUploadAllowed: data?.isImageUploadAllowed ?? false,
                            isRAGFileUploadAllowed: data?.isRAGFileUploadAllowed ?? false,
                            uploadSizeAndTypes: [
                                ...(data?.imgUploadSizeAndTypes || []),
                                ...(data?.fileUploadSizeAndTypes || []).map((item: any) => ({
                                    // Convert .pdf → application/pdf mime types
                                    fileTypes: item.fileTypes.map((ext: string) => {
                                        const mimeTypes: Record<string, string> = {
                                            '.pdf': 'application/pdf',
                                            '.txt': 'text/plain',
                                            '.csv': 'text/csv',
                                            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                                            '.doc': 'application/msword'
                                        }
                                        return mimeTypes[ext] || ext
                                    }),
                                    maxUploadSize: item.maxUploadSize
                                }))
                            ]
                        }
                    } : prev)
                }
            } catch (error) {
                console.error('Failed to fetch upload constraints:', error)
            }
        }

        fetchUploadConstraints()
    }
}, [sidekick?.id, token])
```

### Step 3: Update ChatInput File Type Detection
**File:** `packages-answers/ui/src/ChatInput.tsx`

Update `getAcceptedFileTypes()` function (lines 202-211):

```typescript
const getAcceptedFileTypes = () => {
    const acceptedTypes: string[] = []
    if (constraints?.isImageUploadAllowed) {
        acceptedTypes.push('image/*')
    }
    if (constraints?.isSpeechToTextEnabled) {
        acceptedTypes.push('audio/*')
    }
    if (constraints?.isRAGFileUploadAllowed) {
        // Add specific document types from uploadSizeAndTypes
        const docTypes = constraints.uploadSizeAndTypes
            ?.filter(item => !item.fileTypes.some(ft => ft.startsWith('image/') || ft.startsWith('audio/')))
            .flatMap(item => item.fileTypes) || []
        acceptedTypes.push(...docTypes)
    }
    return acceptedTypes.join(',')
}
```

### Step 4: Update File Validation Logic
**File:** `packages-answers/ui/src/ChatInput.tsx`

Update `isFileAllowedForUpload()` function (lines 156-200):

```typescript
const isFileAllowedForUpload = (file: File) => {
    const fileType = file.type
    const sizeInMB = file.size / 1024 / 1024
    let isAllowed = false
    let error = ''
    const isImageType = fileType.startsWith('image/')
    const isAudioType = fileType.startsWith('audio/')

    if (isAudioType && constraints?.isSpeechToTextEnabled) {
        // ... existing audio validation
    } else if (isImageType && constraints?.isImageUploadAllowed) {
        // ... existing image validation
    } else if (constraints?.isRAGFileUploadAllowed) {
        // NEW: RAG file validation
        let found = false
        constraints?.uploadSizeAndTypes?.forEach((allowed) => {
            // Check if fileType matches and size is within limit
            if (allowed.fileTypes.includes(fileType) && sizeInMB <= allowed.maxUploadSize) {
                found = true
            } else if (allowed.fileTypes.includes(fileType) && sizeInMB > allowed.maxUploadSize) {
                error = `File too large (max ${allowed.maxUploadSize}MB): ${file.name}`
            }
        })
        if (!found && !error) {
            error = `File type not supported: ${file.name}`
        } else if (found) {
            isAllowed = true
        }
    } else {
        error = `File type not supported: ${file.name}`
    }

    if (!isAllowed && error) {
        setErrorMessage(error)
    }
    return isAllowed
}
```

### Step 5: Update Button Visibility Check
**File:** `packages-answers/ui/src/ChatInput.tsx`

Update line 693 to include RAG uploads:

```typescript
startAdornment: (constraints?.isImageUploadAllowed || constraints?.isSpeechToTextEnabled || constraints?.isRAGFileUploadAllowed) && (
    <Tooltip title='Attach file'>
        <IconButton component='label' sx={{ minWidth: 0 }}>
            <AttachFileIcon />
            <input type='file' accept={getAcceptedFileTypes()} hidden multiple onChange={handleFileUpload} />
        </IconButton>
    </Tooltip>
),
```

---

## Testing Plan

1. **Create a RAG chatflow** with:
   - Vector store with `fileUpload: true`
   - PDF document loader connected to it

2. **Open chat UI** and verify:
   - Upload button appears
   - Clicking button allows selecting PDFs
   - PDF uploads are accepted and sent to server

3. **Test file validation**:
   - Try uploading allowed file (PDF) → should work
   - Try uploading disallowed file (MP4) → should show error
   - Try uploading oversized file → should show size error

4. **Test mixed uploads**:
   - Chatflow with both image uploads AND file uploads
   - Verify both types work correctly

---

## Summary

**Root Cause:** Answers UI never calls `/api/v1/chatflows-uploads/{id}` to get actual upload configuration

**Fix:** Add API call + update constraints with real server data

**Effort:** ~2-3 hours (4 file changes)

**Priority:** HIGH (blocks RAG file upload feature entirely)

---

**End of Analysis**
