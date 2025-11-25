# SmartSoft Admin Resource System

A **Configuration-Driven Dynamic Resource Management System** for building admin panels. Add new resources with zero code by simply defining a configuration object. The system automatically generates UI components, API integration, filtering, pagination, and CRUD operations.

## Architecture

The system follows a **100% configuration-driven architecture** where all resources are defined in `resourcesConfig.ts`. A single dynamic route handles all resources, and generic components generate the UI from configuration.

```
Configuration → Route Handler → ResourcePage → Hook System → Factory Pattern → API/UI
```

### Key Components

- **Dynamic Route Handler** - Single route (`[resource]`) for all resources
- **Generic Components** - One set of components for all resources
- **Factory Pattern** - API Builder and Filter Factory generate functionality from config
- **Hook System** - Generic hooks handle data fetching, filtering, pagination, CRUD
- **Unified Fields Array** - Define fields once, auto-generate table/form/filters

## Features

- ✅ **Zero-Code Resource Addition** - Add resources via configuration only
- ✅ **Auto-Generated UI** - Tables, forms, filters generated from config
- ✅ **API Builder** - Automatic API function generation from config
- ✅ **Filter Factory** - URL-synced or in-memory filtering
- ✅ **Type-Safe** - Full TypeScript support throughout
- ✅ **Pagination** - Built-in pagination with URL sync
- ✅ **CRUD Operations** - Create, Read, Update, Delete out of the box
- ✅ **URL Synchronization** - Shareable filter URLs with page preservation

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev          # Start development server
npm run dev:clean    # Clean restart (kills processes, clears cache)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Project Structure

```
app/admin/
├── [resource]/page.tsx          # Dynamic route handler
├── components/                   # Generic UI components
│   ├── ResourcePage.tsx         # Main page component
│   ├── ResourceTable.tsx        # Generic table
│   ├── ResourceFilters.tsx      # Generic filters
│   └── modals/                  # Modal components
├── hooks/
│   ├── useResourceTableLogic.ts # Generic hook
│   └── useResourceFromConfig.ts # Auto-generate from config
├── lib/
│   ├── config/
│   │   └── resourcesConfig.ts   # 🎯 Central configuration
│   └── utils/
│       ├── apiBuilder.ts        # API factory
│       └── filterFactory.ts     # Filter factory
└── global/client/               # API client
```

## Adding a New Resource

### Simple Case (2 Steps)

#### Step 1: Create Hook

```typescript
// app/admin/hooks/useMyResourceLogic.ts
import { useResourceFromConfig } from './useResourceFromConfig';
import { myResourceConfig } from '../lib/config/resourcesConfig';

export function useMyResourceLogic() {
  return useResourceFromConfig(myResourceConfig);
}
```

#### Step 2: Add Configuration

```typescript
// app/admin/lib/config/resourcesConfig.ts
import { ResourceConfig } from './resourceConfig.types';

interface MyResourceType extends BaseResource {
  name: string;
  status: 'active' | 'inactive';
}

const myResourceConfig: ResourceConfig<MyResourceType> = {
  id: 'myResource',
  label: 'My Resource',
  path: '/admin/myResource',
  showInNav: true,
  hook: useMyResourceLogic,
  
  // Unified Fields Array - auto-generates table/form/filters
  fields: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      inTable: true,      // ✅ Table column
      inForm: true,       // ✅ Form input
      filterable: true,   // ✅ Filter field
      sortable: true,     // ✅ Sortable
      required: true
    }
  ],
  
  // API - Base URL (auto-generates CRUD endpoints)
  api: {
    baseUrl: '/api/my-resource',
    apiType: 'rest'
  },
  
  // UI Configuration
  header: {
    title: 'My Resource',
    showAddButton: true
  },
  
  table: {
    defaultPageSize: 15,
    defaultSort: { key: 'name', direction: 'asc' }
  },
  
  actions: {
    enableSelection: true,
    enableEdit: true,
    enableDelete: true
  }
};

// Add to resourcesConfig
export const resourcesConfig = {
  captions: captionsConfig,
  countries: countriesConfig,
  myResource: myResourceConfig,  // ✅ Add here
} as const;
```

**Done!** The system automatically:
- Creates route `/admin/myResource`
- Generates UI components
- Handles API integration
- Applies filters and sorting
- Manages pagination
- Enables CRUD operations

## API Builder

The API Builder converts configuration into ready-to-use API functions.

### Configuration Types

#### 1. Explicit Endpoints

```typescript
api: {
  list: {
    endpoint: 'getAllWords',
    method: 'GET',
    apiType: 'baseapitype'
  },
  create: {
    endpoint: 'addWord',
    method: 'POST',
    apiType: 'baseapitype'
  }
}
```

#### 2. Base URL (Auto-Generated CRUD)

```typescript
api: {
  baseUrl: '/api/users',
  apiType: 'rest'  // or 'baseapitype'
}
```

The API Builder automatically generates:
- `GET baseUrl` → list
- `POST baseUrl` → create
- `PUT baseUrl/{id}` → update
- `DELETE baseUrl/{id}` → delete

### Supported API Types

- **`baseapitype`** - Swagger/OpenAPI endpoints
- **`countries`** - External Countries API
- **`rest`** - Standard REST API

### Response Transformation

```typescript
api: {
  baseUrl: '/api/users',
  transformResponse: (response) => response.data.items,
  transformRequest: (data) => ({ user: data })
}
```

## Configuration System

### Unified Fields Array

Define fields once, use everywhere:

```typescript
fields: [
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    inTable: true,      // Auto-generates table column
    inForm: true,       // Auto-generates form input
    filterable: true,   // Auto-generates filter
    sortable: true,     // Makes column sortable
    width: 'w-1/3',     // Column width
    required: true      // Form validation
  }
]
```

**Auto-Generation:**
- `inTable: true` → Table column with renderer
- `inForm: true` → Form input field
- `filterable: true` → Filter in ResourceFilters
- `sortable: true` → Sortable column header

### Field Types

- `text` - Text input
- `number` - Number input
- `email` - Email input
- `textarea` - Textarea
- `select` - Select dropdown
- `date` - Date picker
- `boolean` - Checkbox
- `yesNo` - Yes/No selector

### Filter Types

- `search` - Text search across fields
- `select` - Single select dropdown
- `multiSelect` - Multiple select
- `boolean` - Checkbox filter
- `dateRange` - Date range picker

### Filter Sync Types

- **`simple`** - In-memory filters (no URL sync)
- **`url-synced`** - Filters synced with URL (shareable, preserves page parameter)

## Filter Factory

The Filter Factory creates filter managers from configuration:

- Reads/writes filters from/to URL (for `url-synced` type)
- Applies filters based on field types
- Handles sorting
- Preserves page parameter when filters change
- Tracks active filters count

## Hook System

### useResourceFromConfig

Auto-generates a complete hook from configuration:

```typescript
const hookResult = useResourceFromConfig(config);
// Returns: items, filters, pagination, CRUD operations, modals
```

### useResourceTableLogic

Generic hook providing:
- Data fetching
- Filtering and sorting
- Pagination
- Selection
- CRUD operations
- Modal management

### Custom Hooks

For complex cases, create resource-specific hooks:

```typescript
export function useMyResourceLogic() {
  // Custom logic
  const customFilterManager = useCustomFilters();
  
  return useResourceTableLogic({
    config: myResourceConfig,
    filterManager: customFilterManager,
    // ... custom options
  });
}
```

## Development

### Key Files

- `app/admin/lib/config/resourcesConfig.ts` - Central configuration (382 lines)
- `app/admin/lib/utils/apiBuilder.ts` - API factory
- `app/admin/lib/utils/filterFactory.ts` - Filter factory
- `app/admin/components/ResourcePage.tsx` - Generic page component
- `app/admin/hooks/useResourceTableLogic.ts` - Generic hook

## Type Safety

All components are fully typed with TypeScript:

- Type-safe resource configurations
- Type-safe hooks
- Type-safe API functions
- Type-safe components

### BaseResource

All resources should extend or be compatible with:

```typescript
interface BaseResource {
  id?: string | number;
  created_at?: string;
  updated_at?: string;
}
```

## Best Practices

1. **Use Unified Fields Array** - Define fields once, auto-generate everything
2. **Prefer Base URL** - Use `baseUrl` for standard REST APIs
3. **URL-Synced Filters** - Use for shareable filter states
4. **Type Definitions** - Define resource types for better type safety
5. **Custom Hooks** - Only when you need custom logic


## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Material-UI** - UI components
- **React 19** - UI library

## License

Private project

---

**Status**: ✅ Production Ready  


