---
globs:
  - packages/components/nodes/**
  - packages/components/credentials/**
---

# Flowise Components Rules

These rules apply when working with files in `packages/components/nodes/` and `packages/components/credentials/`.

## TheAnswer Tag Requirement

**All TheAnswer components MUST include `tags: ['AAI']`**

```typescript
class YourComponent_Category implements INode {
    label: string = 'Your Component Name'
    name: string = 'yourComponentName'
    version: number = 1.0
    type: string = 'YourComponent'
    category: string = 'Category Name'

    // REQUIRED for TheAnswer components
    tags: string[] = ['AAI']

    // ... rest of component
}
```

## INode Interface Requirements

Every component must implement the `INode` interface with these fields:

```typescript
import { INode, INodeData, INodeParams, ICommonObject } from '../../../src/Interface'

class ComponentName_Category implements INode {
    // REQUIRED: Display information
    label: string = 'Component Display Name'
    name: string = 'componentName'              // Unique identifier (camelCase)
    version: number = 1.0                       // Semantic versioning
    type: string = 'ComponentType'              // Type name
    icon: string = 'icon.svg'                   // Icon filename
    category: string = 'Category'               // Grouping category
    description: string = 'What it does'
    baseClasses: string[] = [this.type]

    // REQUIRED for TheAnswer
    tags: string[] = ['AAI']

    // REQUIRED: Input parameters
    inputs: INodeParams[] = []

    // REQUIRED: Initialization method
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        // Implementation
    }
}

module.exports = { nodeClass: ComponentName_Category }
```

## Naming Convention

**Class Name Pattern:** `{ComponentName}_{Category}`

```typescript
// Examples
class ChatOpenAI_ChatModels implements INode { }
class VectorStoreRetriever_Retrievers implements INode { }
class Calculator_Tools implements INode { }
```

## Credential Integration

If your component needs API credentials:

**Step 1:** Create credential in `credentials/`

```typescript
// credentials/YourApiCredential.credential.ts
import { INodeParams, INodeCredential } from '../src/Interface'

class YourApiCredential implements INodeCredential {
    label: string = 'Your API'
    name: string = 'yourApiCredential'
    version: number = 1.0
    description: string = 'API credentials for Your Service'

    inputs: INodeParams[] = [
        {
            label: 'API Key',
            name: 'apiKey',
            type: 'password',
            placeholder: 'your-api-key'
        }
    ]
}

module.exports = { credClass: YourApiCredential }
```

**Step 2:** Reference in component

```typescript
credential?: INodeParams = {
    label: 'Connect Credential',
    name: 'credential',
    type: 'credential',
    credentialNames: ['yourApiCredential']  // Must match credential name
}
```

**Step 3:** Access in init()

```typescript
const credentialData = await getCredentialData(nodeData.credential ?? '', options)
const apiKey = getCredentialParam('apiKey', credentialData, nodeData)
```

## Input Parameter Types

```typescript
type: 'string'             // Text input
type: 'number'             // Numeric input
type: 'password'           // Masked input
type: 'boolean'            // Checkbox
type: 'options'            // Dropdown select
type: 'json'               // JSON editor
type: 'code'               // Code editor
type: 'file'               // File upload
type: 'BaseLanguageModel'  // Model selector
type: 'VectorStore'        // Vector store selector
```

## Building and Testing

After creating or modifying components:

```bash
# Build components
pnpm --filter flowise-components build

# Test in Flowise UI
# Component should appear under specified category
```

## Common Issues

**Component not appearing:**
- Check `module.exports = { nodeClass: YourComponent }`
- Verify file is in correct category folder
- Rebuild: `pnpm --filter flowise-components build`

**Credential not working:**
- Ensure credential exports `{ credClass: YourCredential }`
- Verify `credentialNames` matches credential name exactly

## Checklist

Before committing component changes:

- [ ] Implements `INode` interface correctly
- [ ] Includes `tags: ['AAI']` for TheAnswer components
- [ ] Clear `label` and `description`
- [ ] Proper `baseClasses` defined
- [ ] Credential integration (if external API needed)
- [ ] Error handling in `init()` method
- [ ] Tested in Flowise UI after build
- [ ] Follows naming convention: `{Name}_{Category}`
