---
type: community
cohesion: 0.40
members: 5
---

# Core UI Screens

**Cohesion:** 0.40 - moderately connected
**Members:** 5 nodes

## Members
- [[LandingScreen]] - code - components/LandingScreen.jsx
- [[ProfileSettings]] - code - components/ProfileSettings.jsx
- [[RequestCard]] - code - components/RequestCard.jsx
- [[haptic utility]] - code - src/haptic.js
- [[supabaseClient]] - code - src/supabaseClient.js

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Core_UI_Screens
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_Telegram Backend and DB]]

## Top bridge nodes
- [[ProfileSettings]] - degree 3, connects to 1 community