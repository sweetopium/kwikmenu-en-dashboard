# Coolify Deploy

This project has a production-oriented Docker Compose file for Coolify:

```text
docker-compose.coolify.yml
```

It does not bind fixed host ports. Services only expose internal ports, so Coolify can route domains through its proxy without conflicting with other projects on the same server.

## Recommended Domains

Assign domains in Coolify:

- `frontend` service: `https://app.kwikme.nu`
- `admin` service: `https://admin.kwikme.nu` if the admin panel is needed

The frontend nginx container proxies `/api/*` to the internal `backend:8000` service. With this setup, the public API and Stripe webhook URL are on the same app domain:

```text
https://app.kwikme.nu/api/billing/stripe/webhook
```

If you prefer a separate API domain, add a domain to the `backend` service and update the frontend API environment/build configuration accordingly.

## Coolify Setup

1. Create a new Coolify project.
2. Add a Docker Compose resource from this repository.
3. Use `docker-compose.coolify.yml` as the compose file.
4. Add environment variables from `.env.coolify.example` in Coolify.
5. Set real secrets in Coolify, not in repository files.
6. Assign `https://app.kwikme.nu` to the `frontend` service.
7. Assign `https://admin.kwikme.nu` to the `admin` service if needed.
8. Deploy.

## Required Environment Variables

At minimum, set:

```env
POSTGRES_PASSWORD=
OPENROUTER_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
MEDIA_STORAGE_ENDPOINT_URL=
MEDIA_STORAGE_BUCKET=
MEDIA_STORAGE_ACCESS_KEY_ID=
MEDIA_STORAGE_SECRET_ACCESS_KEY=
MEDIA_STORAGE_PUBLIC_BASE_URL=
```

Use live Stripe keys for production. If test keys are used, Stripe Checkout will create test subscriptions only.

## Stripe

Create a webhook endpoint in Stripe Dashboard:

```text
https://app.kwikme.nu/api/billing/stripe/webhook
```

Subscribe to:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Copy the signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

For hosted Checkout terms consent, configure your business profile, Terms URL, and Privacy URL in Stripe Dashboard.

## Google OAuth

In Google Cloud Console, configure redirect URI:

```text
https://app.kwikme.nu/api/auth/oauth/google/callback
```

The app origin should be:

```text
https://app.kwikme.nu
```

## Media Storage

Cloudflare R2 must allow the browser to upload and read media from the configured public base URL.

Expected backend variables:

```env
MEDIA_STORAGE_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com
MEDIA_STORAGE_BUCKET=...
MEDIA_STORAGE_ACCESS_KEY_ID=...
MEDIA_STORAGE_SECRET_ACCESS_KEY=...
MEDIA_STORAGE_REGION=auto
MEDIA_STORAGE_PUBLIC_BASE_URL=https://media.kwikme.nu
```

## Health Checks

The compose file includes health checks:

- backend: `http://127.0.0.1:8000/health`
- frontend/admin: `/`
- postgres: `pg_isready`
- redis: `redis-cli ping`

After deploy, verify:

```text
https://app.kwikme.nu/
https://app.kwikme.nu/health
https://app.kwikme.nu/api/auth/me
```

The frontend nginx container proxies `/health` to the internal backend health endpoint.

## Backups

Enable Coolify backups for the Postgres volume before onboarding real users.
