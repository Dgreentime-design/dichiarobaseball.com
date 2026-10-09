# Go-live runbook, Monday 12 October 2026, 1:00pm Eastern

One page, in order. Each step has an owner and a check. If a check fails,
stop at that step and tell Claude Code; do not move on. Vercel project:
**dichiarobaseball.com-rgr6** (the only one left). Written 9 October, round 19.

**Have these in hand before 12:00** (Vercel cannot show you secret values it
already holds, so they cannot be copied from Preview): the Airtable personal
access token, the Clover private API token and the Clover merchant ID. If a
variable lets you tick Production on its existing Preview entry, that works
too.

## Before 12:00

| Owner | Step | How to check it worked |
|---|---|---|
| Claude Code | Final preview check: `verify`, `check:payments`, `check:enquiry`, the 34 old Framer paths, Home at 390 and 1440 | All pass, reported with the preview link |
| Daniel | Approve the preview | Say "go" |

## 12:00 to 12:30, Daniel: variables, then merge

Set the variables **before** merging. The merge starts a Production build on
its own, so the variables must already be there or that build runs without them.

1. **Vercel:** vercel.com, team Box to Box Product Design, project
   dichiarobaseball.com-rgr6, **Settings**, **Environment Variables**. For each
   row below: **Add New**, type the Key, paste the Value, tick **Production
   only** (not Preview, not Development), Sensitive on, **Save**.

   | Key | Value |
   |---|---|
   | `PAYMENT_PROVIDER` | `clover` |
   | `CLOVER_ENV` | `production` |
   | `CLOVER_MERCHANT_ID` | from Clover |
   | `CLOVER_PRIVATE_TOKEN` | from Clover |
   | `AIRTABLE_TOKEN` | from Airtable |
   | `AIRTABLE_BASE_ID` | the `app...` part of the base's Airtable address |
   | `AIRTABLE_TABLE_NAME` | `Registrations` (exists already: **Edit**, re-type it to be sure) |
   | `ENQUIRIES_TABLE_NAME` | `Enquiries` |
   | `SITE_ORIGIN` | `https://dichiarobaseball.com` exactly, no slash at the end |

   `CLOVER_WEBHOOK_SECRET` comes at 12:30. Never add `MOCK_WEBHOOK_SECRET` to Production.
   **Check:** the list shows all nine names with "Production".
2. **GitHub:** github.com/Dgreentime-design/dichiarobaseball.com, **Pull
   requests**, **New pull request**, base `main`, compare `review`, **Create
   pull request**, **Merge pull request**, **Confirm merge**. No build step
   first: Vercel runs the build itself.
   **Check:** Vercel, **Deployments**: the top row says Production and turns
   Ready within a few minutes. Open it, **Building**: the log line under
   "Machine layer" reads `origin https://dichiarobaseball.com (production)`
   and `sitemap 21 of 24 pages`.

## 12:30, Daniel: Clover webhook and secret, one sitting

1. **Clover:** clover.com, sign in, **Settings**, **Ecommerce**, **Hosted
   Checkout** (the screen used on 1 October: Webhook URL, signing secret,
   TEST URL). Webhook URL: `https://dichiarobaseball.com/api/webhooks/clover`.
   **Save**. Signing secret: **Generate**, copy it. Generate replaces the old
   secret at once.
2. **Vercel:** add `CLOVER_WEBHOOK_SECRET`, Production only, the copied value.
3. **Vercel:** **Deployments**, top Production row, **...**, **Redeploy**,
   **Redeploy**.
   **Check:** the new row is Ready. **Do not click TEST URL yet.** The domain
   still points at Framer, so it fails until 13:00.

## 12:45, Daniel: DNS (website records only)

1. **Vercel:** **Settings**, **Domains**, **Add**, `dichiarobaseball.com`. Pick
   the option that adds it **and redirects www to it**. The apex must be
   primary to match `SITE_ORIGIN`. Vercel lists the records it needs.
2. **InMotion** (the nameservers): cPanel, **Zone Editor**,
   dichiarobaseball.com, **Manage**.
   - **Delete both** A records for `dichiarobaseball.com` (`31.43.160.6`
     and `31.43.161.6`). Add the one A record Vercel shows. One Framer
     record left behind sends half the visitors to the old site.
   - Edit the `www` CNAME from `sites.framer.app` to the value Vercel shows.
   - **Touch nothing else:** not MX, not `mail`, `webmail`, `cpanel`,
     `autodiscover`, `autoconfig` or `ftp`, not the TXT records (SPF,
     DKIM, DMARC). Email runs on them.

**Check:** Vercel, **Domains**, both names show Valid Configuration. TTL is
15 minutes, so allow up to 30.

## 13:00, live checks (Claude Code, Daniel where named)

| Owner | Step | How to check it worked |
|---|---|---|
| Claude Code | Home on `https://dichiarobaseball.com`; `http://` and `www` redirect to it | 200 over HTTPS, one redirect each |
| Claude Code | `node scripts/check-deployed.mjs https://dichiarobaseball.com` | Passes: routes, canonicals, robots allows, sitemap 21 URLs |
| Claude Code | 5 random old Framer URLs | Each 301 to its page, then 200 |
| Daniel | Clover, Hosted Checkout, **TEST URL** | "verification succeeded". Claude Code deletes the `UNMATCHED-` row it leaves |
| Claude Code | One Contact message marked TEST | Row in `Enquiries`; Daniel confirms the alert at info@; row deleted |
| Daniel pays, Claude Code reads | Monday Hit Night Fall, Single session, $30, on Daniel's card | Row in `Registrations`: `confirmed`, 30, a Clover order ID; alert at info@ |
| Daniel | Clover, **Transactions**, the $30 payment, **Void** (or Refund) | Voided in Clover; Claude Code marks the row TEST, voided (voids send no webhook) |

If the payment is still "Confirming" after 2 minutes: **stop, do not pay
again.** Clover does not resend a rejected webhook. Playbook, Troubleshooting.

## After

- Daniel: Google Search Console, add property `dichiarobaseball.com` (Domain,
  verified with one TXT record at InMotion), **Sitemaps**, submit
  `https://dichiarobaseball.com/sitemap.xml`. Vercel, **Analytics**, **Enable**.
- Michael, **once the $30 test has confirmed**: retire the Home Game links and
  listing, update the Google Business Profile website, Instagram and Facebook bios.
- Keep the Framer site published and its domain setting untouched for 7 days.
  The rollback depends on it.

## Rollback

If card payments are blocked and not fixed within 30 minutes, put the old DNS
back in InMotion's Zone Editor: delete Vercel's A record, add back A
`31.43.160.6` and A `31.43.161.6`, and set `www` CNAME back to
`sites.framer.app`. With a 15 minute TTL most visitors are back on Framer
within 15 minutes, a few up to an hour. Parents then register through Home
Game again, which is why it stays live until the test payment confirms. For a
bad deploy that is not about payments, Vercel, **Deployments**, the last good
Production row, **...**, **Instant Rollback** takes seconds and needs no DNS.
