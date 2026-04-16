## Summary

- What changed?
- Why is it needed for the closed pilot?

## Checks

- [ ] Base branch is `release/closed-pilot-v1`
- [ ] `npm ci`
- [ ] `npm run build`
- [ ] `npm test`
- [ ] Verified Vercel Preview URL
- [ ] No frontend env vars were committed to `vercel.json`
- [ ] Cloudflare remains DNS-only for `railmatch.ru` and `www.railmatch.ru`

## Pilot Impact

- User-facing changes:
- Risks / rollback notes:
