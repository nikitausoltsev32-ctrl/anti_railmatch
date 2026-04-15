---
type: community
cohesion: 0.67
members: 4
---

# Profile Rate Limiting

**Cohesion:** 0.67 - moderately connected
**Members:** 4 nodes

## Members
- [[Daily Profile View Limit 50day]] - document - components/ProfileViewMonitor.jsx
- [[Escrow-based contact unlock]] - document - components/ProfileViewMonitor.jsx
- [[ProfileViewMonitor]] - code - components/ProfileViewMonitor.jsx
- [[SecurityManager]] - code - components/SecurityManager.jsx

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Profile_Rate_Limiting
SORT file.name ASC
```
