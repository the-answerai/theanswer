#!/usr/bin/env node

/**
 * Post-generation script to fix the Data Engine API sidebar ordering
 * This ensures endpoints are grouped by resource and ordered by CRUD operations
 */

const fs = require('fs')
const path = require('path')

const sidebarPath = path.join(__dirname, '../docs/api/data-engine/sidebar.ts')

// Define the correct sidebar structure
const correctSidebar = `import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "api/data-engine/data-engine-api",
    },
    {
      type: "category",
      label: "Domains",
      items: [
        {
          type: "doc",
          id: "api/data-engine/create-domain",
          label: "Create a new domain",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/data-engine/list-domains",
          label: "List all domains",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/get-domain-by-id",
          label: "Get domain by ID",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/update-domain",
          label: "Update domain",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/data-engine/delete-domain",
          label: "Delete domain",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "URLs",
      items: [
        {
          type: "doc",
          id: "api/data-engine/create-url",
          label: "Create a new URL",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/data-engine/list-urls",
          label: "List all URLs",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/get-url-by-id",
          label: "Get URL by ID",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/update-url",
          label: "Update URL",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/data-engine/delete-url",
          label: "Delete URL",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Calls",
      items: [
        {
          type: "doc",
          id: "api/data-engine/create-call",
          label: "Create a new call",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/data-engine/list-calls",
          label: "List all calls",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/get-call-by-id",
          label: "Get call by ID",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/update-call",
          label: "Update call",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/data-engine/delete-call",
          label: "Delete call",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Tags",
      items: [
        {
          type: "doc",
          id: "api/data-engine/create-tag",
          label: "Create a new tag",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/data-engine/list-tags",
          label: "List all tags",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/get-tag-by-id",
          label: "Get tag by ID",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/get-tag-hierarchy",
          label: "Get tag hierarchy",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/update-tag",
          label: "Update tag",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/data-engine/delete-tag",
          label: "Delete tag",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Documents",
      items: [
        {
          type: "doc",
          id: "api/data-engine/create-document",
          label: "Create a new document",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/data-engine/list-documents",
          label: "List all documents",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/get-document-by-id",
          label: "Get document by ID",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/search-documents",
          label: "Search documents",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/data-engine/update-document",
          label: "Update document",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/data-engine/delete-document",
          label: "Delete document",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Tickets",
      items: [
        {
          type: "doc",
          id: "api/data-engine/create-ticket",
          label: "Create a new ticket",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/data-engine/list-tickets",
          label: "List all tickets",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/get-ticket-by-id",
          label: "Get ticket by ID",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/update-ticket",
          label: "Update ticket",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/data-engine/delete-ticket",
          label: "Delete ticket",
          className: "api-method delete",
        },
      ],
    },
    {
      type: "category",
      label: "Chats",
      items: [
        {
          type: "doc",
          id: "api/data-engine/create-chat",
          label: "Create a new chat",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "api/data-engine/list-chats",
          label: "List all chats",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/get-chat-by-id",
          label: "Get chat by ID",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "api/data-engine/update-chat",
          label: "Update chat",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "api/data-engine/delete-chat",
          label: "Delete chat",
          className: "api-method delete",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
`

try {
    // Write the corrected sidebar file
    fs.writeFileSync(sidebarPath, correctSidebar, 'utf8')
    console.log('✅ Fixed Data Engine API sidebar ordering')
} catch (error) {
    console.error('❌ Error fixing sidebar:', error.message)
    process.exit(1)
}
