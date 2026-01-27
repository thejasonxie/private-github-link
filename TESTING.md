# Testing Guide

This document describes the testing setup and practices for the private-github-link project.

## Overview

The project uses **Vitest** as the test runner with **Testing Library** for component testing and **MSW (Mock Service Worker)** for API mocking.

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Test Structure

Tests are co-located with their source files using the `.test.ts` or `.test.tsx` extension.

```
src/
├── lib/
│   ├── utils.ts
│   ├── utils.test.ts
│   ├── format.ts
│   ├── format.test.ts
│   └── github/
│       ├── api.ts
│       ├── api.test.ts
│       ├── client.ts
│       └── client.test.ts
├── components/
│   ├── error-fallback.tsx
│   ├── error-fallback.test.tsx
│   └── file-explorer/
│       ├── breadcrumb.tsx
│       ├── breadcrumb.test.tsx
│       └── viewers/
│           ├── code-viewer.tsx
│           ├── code-viewer.test.tsx
│           └── ...
└── test/
    ├── setup.ts          # Test setup and global mocks
    └── mocks/
        ├── handlers.ts   # MSW request handlers
        └── server.ts     # MSW server configuration
```

## Test Categories

### 1. Utility Tests (`src/lib/*.test.ts`)

Pure function tests without any mocking required.

- `utils.test.ts` - `cn()` utility for className merging
- `format.test.ts` - Date and file size formatting
- `tree-utils.test.ts` - Tree traversal utilities
- `file-utils.test.ts` - File type detection, MIME types, URL resolution
- `route-utils.test.ts` - Route parsing utilities

### 2. API Tests (`src/lib/github/*.test.ts`)

Tests for GitHub API client functions using MSW for request mocking.

- `client.test.ts` - `withTimeout` utility
- `api.test.ts` - GitHub API functions (getContributors, getFileContent, etc.)

**Note:** Some API functions (`getRepoInfo`, `getBranches`, `getRepoTree`) use `AbortSignal.timeout()` which is incompatible with MSW in the jsdom test environment. These functions should be tested via integration tests.

### 3. Component Tests (`src/components/**/*.test.tsx`)

React component tests using Testing Library.

- **Simple Components:** `error-fallback.test.tsx`, `breadcrumb.test.tsx`
- **Theme Components:** `theme-provider.test.tsx`, `mode-toggle.test.tsx`
- **Viewer Components:** `code-viewer.test.tsx`, `markdown-viewer.test.tsx`, `image-viewer.test.tsx`, etc.

## Writing Tests

### Testing Utilities

```typescript
import { describe, expect, it } from "vitest";
import { myFunction } from "./my-module";

describe("myFunction", () => {
  it("should do something", () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

### Testing Components

```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MyComponent } from "./my-component";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle click", () => {
    const onClick = vi.fn();
    render(<MyComponent onClick={onClick} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### Testing with MSW

```typescript
import { http, HttpResponse } from "msw";
import { server } from "@/test/mocks/server";

describe("API function", () => {
  it("should handle error response", async () => {
    // Override the default handler for this test
    server.use(
      http.get("https://api.github.com/endpoint", () => {
        return HttpResponse.json({ message: "Error" }, { status: 500 });
      })
    );

    await expect(apiFunction()).rejects.toThrow();
  });
});
```

### Testing Hooks

```typescript
import { renderHook, act } from "@testing-library/react";
import { useMyHook } from "./my-hook";

describe("useMyHook", () => {
  it("should update state", () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.update("new value");
    });

    expect(result.current.value).toBe("new value");
  });
});
```

## MSW Mock Handlers

Default mock handlers are defined in `src/test/mocks/handlers.ts`. They provide successful responses for all GitHub API endpoints.

To test error cases, use `server.use()` to override handlers in individual tests:

```typescript
server.use(
  http.get("https://api.github.com/repos/:owner/:repo", () => {
    return HttpResponse.json(
      { message: "Not Found" },
      { status: 404 }
    );
  })
);
```

## Configuration

### Vitest Configuration (`vitest.config.ts`)

- **Environment:** jsdom
- **Setup File:** `src/test/setup.ts`
- **Path Aliases:** `@/` maps to `src/`
- **Coverage:** V8 provider with HTML and LCOV reporters

### Coverage Exclusions

The following are excluded from coverage:
- `node_modules/`
- `src/test/` - Test utilities
- `src/components/ui/` - ShadCN components (external library)
- `src/routeTree.gen.ts` - Generated file
- Config files
- Build outputs

## Known Limitations

1. **AbortSignal.timeout():** Functions using `AbortSignal.timeout()` cannot be tested with MSW in jsdom due to a compatibility issue with Node's undici implementation.

2. **Lucide Icons:** Icon class names from lucide-react are not predictable in tests. Use `document.querySelectorAll("svg")` to verify icons are rendered.

3. **Dropdown Menus:** Radix UI dropdown menus require clicking to open before testing menu items.

## Best Practices

1. **Test behavior, not implementation** - Focus on what the user sees and does
2. **Use Testing Library queries** - Prefer `getByRole`, `getByText`, `getByLabelText`
3. **Mock at the boundary** - Mock API calls with MSW, not internal functions
4. **Keep tests isolated** - Each test should be independent
5. **Use descriptive test names** - `it("should display error when API fails")`

## Troubleshooting

### Tests hang or timeout
- Check for unhandled promises
- Verify MSW handlers are returning responses
- Look for infinite loops or effects

### MSW not intercepting requests
- Ensure the URL matches exactly (including query params)
- Check that the handler is registered in `handlers.ts`
- Verify `server.listen()` is called in setup

### Component not rendering
- Check for missing providers (ThemeProvider, etc.)
- Verify all required props are passed
- Look for errors in the console output
