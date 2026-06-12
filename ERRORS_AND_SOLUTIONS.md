# Errors and Solutions Log

## Format
Each entry follows:
```
## [DATE] - [MODULE/FILE]
**Error:** Description
**Cause:** Root cause
**Solution:** Fix applied
**Status:** Resolved / Ongoing
```

---

## Known Issues & Solutions

### Prisma Client Generation
**Error:** `Cannot find module '@prisma/client'`
**Cause:** Prisma client not generated after schema changes
**Solution:** Run `cd backend && npx prisma generate`
**Status:** Resolved (run after any schema changes)

### JWT Secret Missing
**Error:** `Error: secretOrPrivateKey must have a value`
**Cause:** `JWT_SECRET` env variable not set
**Solution:** Add `JWT_SECRET=your_secret_here` to `backend/.env`
**Status:** Resolved

### CORS Issues
**Error:** `Access to XMLHttpRequest blocked by CORS`
**Cause:** Frontend origin not in CORS whitelist
**Solution:** Add frontend URL to `cors.origin` array in `backend/src/app.ts`
**Status:** Resolved

### Prisma Unique Constraint on CampaignSeller
**Error:** `Type argument of 'never' on upsert`
**Cause:** TypeScript strict mode with composite unique keys
**Solution:** Cast to `as never` for composite unique where clauses in Prisma upsert
**Status:** Resolved (see campaign.service.ts)

### React Query v5 Breaking Changes
**Error:** `onError is not a property of useMutation options`
**Cause:** React Query v5 changed `onError` placement
**Solution:** Use `onError` inside `mutationFn` options object, or handle in `.mutate()` callbacks
**Status:** Resolved

### Vite HMR Port Conflict
**Error:** `Port 5173 already in use`
**Cause:** Multiple Vite dev servers running
**Solution:** Kill existing processes or use different ports in `vite.config.ts`
**Status:** Resolved (buyer-web:5173, seller-center:5174, admin-console:5175)

### TypeScript Strict Mode Issues
**Error:** `Object is possibly undefined`
**Cause:** Optional chaining not used on nullable Prisma results
**Solution:** Use optional chaining `?.` and nullish coalescing `??` operators
**Status:** Ongoing (handle per file)

---

## Deployment Notes

- Database must be running before `npx prisma migrate dev`
- Run `npx prisma generate` after any schema changes
- All three frontend apps need `.env` files with `VITE_API_URL`
- Backend needs `.env` with `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`
