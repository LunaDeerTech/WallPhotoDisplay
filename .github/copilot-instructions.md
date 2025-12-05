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

## Development Commands

```bash
npm run dev          # Concurrent: tsx watch server + Vite
npm run init-db      # Initialize SQLite + default admin (admin/admin123)
npm run build:all    # Build client (vite) + server (tsc)
npm run typecheck    # Validate both frontend and backend TypeScript
```

## TypeScript Conventions

**Backend (ES Modules):** All imports must use `.js` extension even for `.ts` files:
```typescript
// server/controllers/photoController.ts
import { Photo } from '../models/index.js'  // NOT index.ts
```

**Type naming:** DB entities use snake_case (`user_id`), API responses use camelCase (`userId`). Models handle transformation in queries using SQL aliases.

## API Response Pattern

All endpoints return `{ success: boolean, data?: T, error?: string }`. See `src/api/*.ts` for typed wrappers:
```typescript
// src/api/photos.ts - Example pattern
export default {
  async getPhotos(params?: PhotoQueryParams): Promise<PaginatedResponse<Photo>> {
    const { data } = await request.get<PaginatedResponse<Photo>>('/photos', { params })
    return data
  }
}
```

## Component Patterns

**Dialogs** (`src/components/dialogs/`): Use `Modal.vue` wrapper with `v-model` control:
```vue
<Modal v-model="isOpen" title="标题" size="md">
  <!-- content -->
  <template #footer><!-- actions --></template>
</Modal>
```

**Tags:** Parse with `#` prefix regex: `/#([^\s#]+)/g`. Use `TagInput.vue` for creation, `TagSelector.vue` for filtering.

## Auth Middleware Chain

Backend routes must apply middleware in order:
```typescript
// server/routes/users.ts
router.get('/', authMiddleware, adminMiddleware, userController.getUsers)
```
- `authMiddleware` - Validates JWT, attaches `req.user: JwtPayload`
- `adminMiddleware` - Requires `req.user.role === 'admin'`
- `optionalAuthMiddleware` - Validates token if present, continues if not

## File Upload Flow

1. Frontend: Send `FormData` with files + `tags` string (`#tag1 #tag2`)
2. Backend: `multer` saves with UUID filename, `sharp` generates `thumb_` prefixed thumbnail
3. Response: Photo object with computed `url` and `thumbnailUrl` fields

## Styling (iOS-like)

Use CSS variables from `src/styles/variables.css`. Theme applied via `data-theme` attribute on `<html>`:
```css
/* Example: Button with iOS styling */
.btn-primary {
  background: var(--color-accent);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: var(--transition-fast);
}
```

## Key Implementation Details

- **Waterfall layout** (`useWaterfall.ts`): Recalculate on resize and column count change
- **Token storage**: `localStorage` key `photowall_token`, JWT expires in 7 days
- **Batch operations**: Always verify ownership of ALL items before processing
- **Photo paths**: Stored relative in DB (`photos/<uuid>.jpg`), served via `/uploads/` static route
