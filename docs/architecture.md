# GroundPulse Architecture & Technical Specification

## 1. Overview & Core Philosophy

**GroundPulse** is a student-powered campus sports ground discovery and availability-reporting web application. Its core philosophy is **radical transparency and anti-misinformation**:

- **No Fake Sensors:** The platform makes no claim of computer vision cameras, LiDAR, or automatic occupancy sensors. All live statuses reflect genuine crowd check-ins submitted by students.
- **Configurable Freshness Tiers:** Because conditions change quickly on campus, status reports decay over time:
  - **Fresh (<15 minutes):** High confidence that reported conditions still hold.
  - **Aging (15–60 minutes):** Moderate confidence. Games may be winding down or starting.
  - **Stale (>60 minutes):** Expired. Demoted to **Unknown / Stale** so students are never misled into walking across campus based on stale data.
- **Graceful Non-GPS Ground Support:** Open lawns or recreational areas without fixed coordinates are displayed fully in the Ground Directory without fabricating artificial map markers.

---

## 2. Component & Service Architecture

```
[UI Layer]
  ├── Navbar (Top Bar Contract: Brand, Nav links, Report CTA)
  ├── FilterBar (Search, Sport filter, Status segmented control, Geolocation sort)
  ├── GroundCard (Responsive cards with WCAG AA text badges, freshness indicators)
  ├── MapView (Leaflet + OpenStreetMap tiles, custom SVG divIcon markers & popups)
  ├── ReportModal (Input validation, character limits, cooldown debouncing)
  └── GroundDetailModal (Ground details, prominent current status, chronological history)
        │
[Service & Logic Layer]
  ├── groundService.ts (Data access, search filtering, Haversine distance, sorting)
  ├── reportService.ts (Validation, sanitization, debounce cooldown, database dispatch)
  ├── statusUtils.ts (Freshness categorization, demotion of stale reports, relative time)
  └── validation.ts (Constraint checks, HTML sanitization, status enum validation)
        │
[Persistence & Integration Layer]
  ├── supabaseClient.ts (Config detection, connection testing, PostgreSQL client)
  ├── demoData.ts (Local session fallback with realistic sample data & storage)
  └── Supabase PostgreSQL Database (grounds, ground_reports, RLS policies, indexes)
```

---

## 3. Database Schema & Security (Row Level Security)

### `grounds` Table
- Stores verified campus athletic facilities.
- **RLS Policy:** Public read access (`SELECT`), write operations (`INSERT`, `UPDATE`, `DELETE`) restricted to `service_role` or verified administrators.

### `ground_reports` Table
- Stores crowd-sourced check-ins.
- **RLS Policy:**
  - Public read access (`SELECT`).
  - Public insert access (`INSERT`) enforced with server-side check constraints:
    `status IN ('Available', 'Occupied', 'Unknown')` and `char_length(note) <= 280`.
  - Disallows client updates (`UPDATE` = false) and client deletions (`DELETE` restricted to service role) to preserve audit history and prevent tampering.

---

## 4. Fallback & Safe Demo Mode

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are not configured:
1. GroundPulse activates **Demo Mode**, displaying an explicit banner.
2. Clearly labelled fictional sample grounds are loaded into memory and sessionStorage.
3. Submissions update the local session without pretending to be shared globally.
4. If Supabase **is configured** but fails due to a network or authentication error, GroundPulse surfaces a **real database error with a retry button** rather than masking the failure with mock data.
