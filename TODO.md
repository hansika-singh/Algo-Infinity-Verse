# Work Plan: Supabase Auth (auth-only) and remove Firebase Auth

## Step 1 — Repo audit (already done)
- Identified current auth flow:
  - Frontend: `modules/firebase-client.js` + `auth.js` calls `/api/auth/google`
    - Backend: `server.js` implements `/api/auth/google` using Firebase Admin verification
      - Guest login: `POST /api/guest` (must remain)
      
      ## Step 2 — Add Supabase client-side OAuth helper
      - Create `modules/supabase-auth-client.js`:
        - Initialize Supabase with `SUPABASE_URL` + `SUPABASE_ANON_KEY`
          - Provide `signInWithGoogle()` + `handleRedirectResult()` (or popup flow)
          
          ## Step 3 — Update frontend `auth.js`
          - Remove reliance on `window.__firebaseClient`
          - Replace Google sign-in to use Supabase:
            - Get Supabase access token (JWT)
              - POST to new backend route `/api/auth/supabase` with the JWT
              
              ## Step 4 — Update backend auth endpoint
              - In `server.js`:
                - Replace `POST /api/auth/google` logic with a Supabase verification handler:
                    - Verify Supabase JWT using Supabase JWKS or service-role verification (based on env approach)
                        - Extract user claims
                            - Upsert user record into existing user store (Firestore when `VERCEL=1`, otherwise JSON store)
                              - Keep guest route unchanged.
                              
                              ## Step 5 — Clean up Firebase runtime wiring
                              - Stop serving/using `/api/firebase-config` from frontend auth flow.
                              - Ensure no auth UI references Firebase client.
                              - Keep Firebase server init only if still required for Firestore (data), but remove Firebase auth verification dependency.
                              
                              ## Step 6 — Add/verify environment variables
                              - Update `.env.example`:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_JWT_SECRET` *or* config needed to verify JWT server-side

## Step 7 — Smoke tests
- Guest login continues to work:
  - `/api/guest` sets cookies
  - `/api/session` returns authenticated=true
- Google login works end-to-end:
  - User gets stored/upserted
  - `/api/session` returns the correct user

- [x] Add a "Current date" ✅ (completed - added to Streak Card and Profile Card with reset timer)
## Step 8 — Final cleanup (optional)
- Remove unused Firebase client dependencies/files if not used elsewhere.

