# Wall Photo Display - AI Coding Instructions

A multi-user photo wall PWA with Vue 3 + TypeScript frontend and Express.js backend. See `guidelines-claude-opus.md` for UI/UX specifications in Chinese.

## Architecture & Data Flow

```
Frontend (src/)                Backend (server/)              Storage
┌─────────────────┐           ┌─────────────────┐           ┌──────────┐
│ Vue Components  │──Axios────│ Express Routes  │───────────│ SQLite   │
│ + Pinia Stores  │  /api/*   │ + Controllers   │           │ data/*.db│
└─────────────────┘           └─────────────────┘           └──────────┘
                                     │                       ┌──────────┐
                              Multer + Sharp ────────────────│ uploads/ │
                              (UUID filenames, thumbnails)   └──────────┘
```

**Key directories:**
- `server/types/index.ts` - Backend types (snake_case DB entities → camelCase API responses)
- `src/types/index.ts` - Frontend types (must match API response shapes)
- `src/styles/variables.css` - iOS-style CSS variables (`--color-*`, `--spacing-*`, `--radius-*`)
- `data/config.json` - Runtime system config (siteName, forceLogin, uploadReview)

## Development Commands

```bash
npm run dev          # Concurrent: tsx watch server + Vite
npm run init-db      # Initialize SQLite + default admin (admin/admin123)
npm run build:all    # Build client (vite) + server (tsc)
npm run typecheck    # Validate both frontend and backend TypeScript
```

## TypeScript Conventions

**Backend (ES Modules):** All imports MUST use `.js` extension even for `.ts` files:
```typescript
// server/controllers/photoController.ts
import { Photo } from '../models/index.js'  // NOT index.ts
```

**Type transformation:** DB entities use snake_case, API responses use camelCase. Models transform via SQL aliases:
```typescript
// server/models/Photo.ts - SQL alias pattern
const stmt = db.prepare(`
  SELECT p.user_id as userId, p.file_path as filePath, ...
  FROM photos p
`)
```

## API Response Pattern

All endpoints return `{ success: boolean, data?: T, error?: string }`. Frontend uses response interceptor that unwraps to `data`:
```typescript
// src/utils/request.ts - Response interceptor returns response.data directly
// src/api/photos.ts - Returns ApiResponse<T> type
getPhotos(params): Promise<ApiResponse<PhotoListResponse>>
```

## Component Patterns

**Dialogs** (`src/components/dialogs/`): Use `Modal.vue` wrapper with `v-model`:
```vue
<Modal v-model="isOpen" title="标题" size="md">
  <!-- content -->
  <template #footer><!-- actions --></template>
</Modal>
```

**Tags:** Parse with `#` prefix regex: `/#([^\s#]+)/g`. Filter invalid chars with `/^[\w\u4e00-\u9fa5\-]+$/`. Use `TagInput.vue` for creation, `TagSelector.vue` for filtering.

**Pinia Stores:** Use composition API style (`defineStore` with setup function). See `src/stores/auth.ts` for pattern.

## Auth Middleware Chain

Backend routes MUST apply middleware in order:
```typescript
// server/routes/photos.ts - Example patterns
router.get('/', optionalAuthMiddleware, getPhotos)        // Public with optional user context
router.post('/', authMiddleware, uploadPhotos)            // Requires login
router.get('/pending', authMiddleware, adminMiddleware, getPendingPhotos)  // Admin only
```
- `authMiddleware` - Validates JWT, attaches `req.user: JwtPayload`, rejects if missing
- `adminMiddleware` - Requires `req.user.role === 'admin'`
- `optionalAuthMiddleware` - Validates token if present, continues with `req.user = undefined` if not

## File Upload Flow

1. Frontend: Send `FormData` with field `photos` (array) + `tags` string (`#tag1 #tag2`)
2. Backend: `multer` saves with UUID filename, `sharp` generates `thumb_<uuid>` thumbnail
3. Photo status: `pending` (if `uploadReview` enabled) or `approved`
4. Response: Photo object with computed `url` and `thumbnailUrl` fields

Upload limits defined in `server/middleware/upload.ts`: 10MB max, 20 files max, JPEG/PNG/GIF/WebP only.

## Styling (iOS-like)

Use CSS variables from `src/styles/variables.css`. Theme applied via `data-theme` attribute on `<html>`:
```css
.btn-primary {
  background: var(--color-accent);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
```

## System Config

Runtime config stored in `data/config.json`, managed via `useConfigStore`. Key flags:
- `forceLogin` - Require authentication to view photos
- `uploadReview` - New uploads require admin approval

## Database Migrations

Schema changes use `server/utils/migrator.ts`. Add new migrations to the `migrations` array:
```typescript
// server/utils/migrator.ts - Add to migrations array
{
  name: '002_add_new_column',  // Sequential naming: 00X_description
  up: () => {
    // Check column existence first (idempotent)
    const columns = db.pragma('table_info(table_name)') as Array<{ name: string }>
    if (!columns.some(col => col.name === 'new_column')) {
      db.exec("ALTER TABLE table_name ADD COLUMN new_column VARCHAR(50) DEFAULT 'value'")
    }
  }
}
```

**Key points:**
- Migrations run automatically on server start via `runMigrations()`
- Each migration runs in a transaction and is tracked in `migrations` table
- Always check if column/table exists before altering (makes migrations idempotent)
- Update corresponding types in `server/types/index.ts` and `src/types/index.ts`

## Key Implementation Details

- **Waterfall layout** (`src/composables/useWaterfall.ts`): Items placed in shortest column, recalculates on resize
- **Token storage**: `localStorage` key `photowall_token`, JWT expires in 7 days
- **Auth events**: `window.dispatchEvent(new CustomEvent('auth:unauthorized'))` on 401 response
- **Batch operations**: Always verify ownership of ALL items before processing
- **Photo paths**: Stored relative in DB (`<uuid>.jpg`), served via `/uploads/` static route
