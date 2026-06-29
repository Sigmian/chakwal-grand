# Production Deployment Checklist — Chakwal Guest House

## Before First Deployment

### 1. Environment Variables
- [ ] `DATABASE_URL` — Neon pooled connection string set
- [ ] `DIRECT_URL` — Neon direct connection for migrations
- [ ] `NEXTAUTH_SECRET` — generated with `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` — set to `https://chakwalgrand.pk`
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` — from Cloudinary dashboard
- [ ] `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` — "cgh_rooms" preset, set to Unsigned
- [ ] `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` — for WhatsApp notifications
- [ ] `SMTP_*` — email credentials configured
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` — for push notifications
- [ ] `ANTHROPIC_API_KEY` — for Zara AI assistant

### 2. Database
- [ ] Run `npm run db:migrate:prod` to apply all migrations
- [ ] Run `npx tsx database/seeds/index.ts` to seed initial data
- [ ] Run `npx tsx database/seeds/madina-branch.ts` to seed Madina Town branch
- [ ] Verify both branches exist in admin panel
- [ ] Verify Grand Opening offer (AUTO_GRANDOPEN50) is active for Madina Town
- [ ] Create first super-admin account via admin panel

### 3. Cloudinary Configuration
- [ ] Cloudinary account created
- [ ] Upload preset "cgh_rooms" created (unsigned, folder: cgh/rooms/)
- [ ] Upload at least 2 photos per room to replace Unsplash placeholders
- [ ] Test upload from Admin → Gallery → Upload Photo
- [ ] Verify images render correctly on public rooms page

### 4. DNS & SSL
- [ ] Domain pointed to hosting provider
- [ ] SSL certificate active (Let's Encrypt or hosting provider)
- [ ] `www.chakwalgrand.pk` redirects to `chakwalgrand.pk`
- [ ] HSTS header is being served (verify: securityheaders.com)

### 5. Security Verification
- [ ] Run `npm run typecheck` — zero errors
- [ ] Open securityheaders.com and check rating (target: A or A+)
- [ ] Verify CSP is not blocking any resources (check browser console)
- [ ] Verify rate limiting works: try 6 bookings in 60 seconds
- [ ] Verify `AUTO_GRANDOPEN50` cannot be entered as a manual promo code
- [ ] Test SQL injection in phone field: `'; DROP TABLE customers; --`
- [ ] Verify admin routes return 401/403 when not authenticated

### 6. Performance
- [ ] Run Lighthouse on homepage (target: Performance ≥ 90)
- [ ] Verify WebP/AVIF images are served (check Network tab → image MIME types)
- [ ] Verify `/_next/static/*` assets have immutable cache headers
- [ ] Check Core Web Vitals in Google Search Console after first crawl

### 7. Functional Testing
- [ ] Book a room end-to-end (Main Branch)
- [ ] Book a room end-to-end (Madina Town — verify 50% discount applied)
- [ ] Receive WhatsApp confirmation message
- [ ] Look up booking via /my-booking
- [ ] Admin: confirm booking, check in, check out
- [ ] Admin: add room image via URL and via file upload
- [ ] Admin: switch between branches in all admin views
- [ ] Branch selector modal appears for new visitors
- [ ] Branch preference is remembered on refresh
- [ ] Branch can be switched from navbar

### 8. Mobile Testing
- [ ] Test on real Android device (Chrome)
- [ ] Test on real iOS device (Safari)
- [ ] Branch selector modal is usable at 375px width
- [ ] Booking form is completable on mobile
- [ ] Touch targets are adequately sized (≥ 44px)

## After Each Deployment

- [ ] Run `npm run test:e2e` against production URL
- [ ] Verify homepage loads in < 3s on 4G
- [ ] Spot-check admin panel
- [ ] Check for console errors in browser
- [ ] Check server logs for 5xx errors

## Multi-Instance / Scale-Up Notes

If deployed to multiple instances (e.g. Kubernetes, multiple Vercel regions):
- The in-memory rate limiter in `lib/rate-limit.ts` is PER-INSTANCE.
  Replace with Redis-backed rate limiting (Upstash) before scaling.
- Push notification subscriptions are stored in the DB — these are fine for multi-instance.
- Session tokens via NextAuth are signed with NEXTAUTH_SECRET — ensure the same
  secret is used across all instances.
