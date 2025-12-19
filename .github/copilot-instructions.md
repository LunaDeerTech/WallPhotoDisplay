# Wall Photo Display - AI Coding Instructions

Multi-user photo wall PWA: Vue 3 + TypeScript frontend, Express.js + SQLite backend. See [guidelines-claude-opus.md](../guidelines-claude-opus.md) for detailed UI/UX specs (Chinese).

## Quick Start

```bash
npm run dev          # Concurrent: tsx watch server + Vite client
npm run init-db      # Initialize SQLite + default admin (admin/admin123)
npm run build:all    # Build client + server for production
npm run typecheck    # Validate both frontend and backend TypeScript
```

## Architecture

```
src/ (Vue 3)              server/ (Express)           data/
├── api/        ──────────► routes/ → controllers/    ├── photowall.db
├── stores/     Axios       models/ (SQL aliases)     ├── uploads/
├── components/ /api/*      middleware/auth.ts        └── config.json
└── types/                  types/index.ts
```

## Critical TypeScript Rules

**Backend imports MUST use `.js` extension** (ES Modules requirement):
```typescript
// server/controllers/photoController.ts
import Photo from '../models/Photo.js'  // ✓ NOT Photo.ts
```

**Type naming convention** - DB uses snake_case, API uses camelCase:
```typescript
// server/types/index.ts: UserEntity (DB) vs UserPublic (API response)
// Models transform via SQL aliases: SELECT user_id as userId ...
```

## API Pattern

All endpoints: `{ success: boolean, data?: T, error?: string }`

Frontend interceptor ([src/utils/request.ts](../src/utils/request.ts)) unwraps `response.data`:
```typescript
// src/api/photos.ts
getPhotos(params): Promise<ApiResponse<PhotoListResponse>>
```

## Auth Middleware (server/middleware/auth.ts)

Apply in order on routes:
- `optionalAuthMiddleware` - Public routes, `req.user` may be undefined
- `authMiddleware` - Requires valid JWT, attaches `req.user: JwtPayload`
- `adminMiddleware` - Requires `req.user.role === 'admin'`

```typescript
router.get('/', optionalAuthMiddleware, getPhotos)           // Public
router.post('/', authMiddleware, uploadPhotos)               // Login required
router.get('/pending', authMiddleware, adminMiddleware, ...)  // Admin only
```

## Component Patterns

**Dialogs**: Wrap with [Modal.vue](../src/components/common/Modal.vue):
```vue
<Modal v-model="isOpen" title="标题" size="md">
  <template #footer><!-- actions --></template>
</Modal>
```

**Pinia stores**: Composition API style ([src/stores/auth.ts](../src/stores/auth.ts)):
```typescript
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  return { user, isAdmin }
})
```

**Tags**: Parse `#tag` format with `/#([^\s#]+)/g`, validate with `/^[\w\u4e00-\u9fa5\-]+$/`

## Database Migrations

Add to `migrations` array in [server/utils/migrator.ts](../server/utils/migrator.ts):
```typescript
{
  name: '003_add_feature',  // Sequential: 00X_description
  up: () => {
    const cols = db.pragma('table_info(table)') as Array<{ name: string }>
    if (!cols.some(c => c.name === 'new_col')) {
      db.exec("ALTER TABLE table ADD COLUMN new_col VARCHAR(50) DEFAULT 'val'")
    }
  }
}
```
Migrations auto-run on server start. Always check existence (idempotent). Update types in both `server/types/` and `src/types/`.

## Styling

Use CSS variables from [src/styles/variables.css](../src/styles/variables.css). Theme via `data-theme` on `<html>`:
```css
background: var(--color-accent);
border-radius: var(--radius-md);
```

## Key Details

- **Token**: `localStorage` key `photowall_token`, 7-day JWT expiry
- **Auth events**: `window.dispatchEvent(new CustomEvent('auth:unauthorized'))` on 401
- **Upload limits**: 10MB/file, 20 files/batch, JPEG/PNG/GIF/WebP only
- **Photo storage**: UUID filenames, `thumb_<uuid>` thumbnails, relative paths in DB
- **Config**: Runtime flags in `data/config.json` (`forceLogin`, `uploadReview`)
