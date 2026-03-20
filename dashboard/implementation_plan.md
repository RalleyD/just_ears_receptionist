# Just Ears Call Dashboard - Implementation Plan

## Context

The Just Ears Receptionist project is a Node.js/Twilio/OpenAI voice AI system. Call data lives in Twilio's API (not stored locally). An N8N workflow already fetches call records weekly for CSV reports. The client needs a visual dashboard to monitor call volume, costs, and transfers — something professional they can check on demand rather than waiting for weekly emails.

We'll build a **Streamlit + Plotly** Python dashboard as a self-contained subproject in `/dashboard`. The code is structured with a clean separation between data/chart logic and the Streamlit UI layer, so we can migrate to **Dash** when the dashboard needs to scale (more pages, complex interactivity, multi-user state).

## Data Source

Twilio REST API via the Python SDK (`client.calls.list()`), matching the pattern in `n8n/twilio-weekly-call-report.json`. Key fields:
- `start_time`, `end_time`, `duration` — for volume/time charts
- `price` (negative string, can be None) — for cost widget
- `parent_call_sid` (non-empty = transfer child leg) — for transfer widget
- `status`, `direction`, `from_formatted`, `to_formatted`

Credentials reuse existing env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`.

---

## Phase 0: Scaffolding & Environment [COMPLETE]

**You'll learn:** Python project structure, virtual environments, Streamlit theming

**Created:**
- `dashboard/pyproject.toml` — project metadata and dependencies
- `dashboard/.streamlit/config.toml` — dark theme with soft color palette
- `dashboard/app.py` — minimal Streamlit entry point
- `dashboard/dashboard/data/` and `dashboard/dashboard/charts/` — package structure
- Updated root `.gitignore` for Python artifacts

---

## Phase 1: Dashboard Layout with Dummy Data

**You'll learn:** Streamlit layout (`st.columns`, `st.metric`, `st.radio`), Plotly chart basics, pandas DataFrames, and how to structure code for future migration

**Architecture note (Dash migration readiness):** We separate data, chart building, and UI into distinct layers. The `dashboard/data/` and `dashboard/charts/` packages have **zero Streamlit imports** — when migrating to Dash, only `app.py` gets rewritten.

**Create:**
- `dashboard/dashboard/data/dummy.py` — generates realistic fake call data as a DataFrame
- `dashboard/dashboard/data/metrics.py` — pure metric computation functions (framework-agnostic)
- `dashboard/dashboard/charts/volume.py` — Plotly chart builder (framework-agnostic)
- Update `dashboard/app.py` — full layout with controls, widgets, and chart

**Step 1a -- Dummy data generator** (`data/dummy.py`): [COMPLETE]
- Function `generate_monthly_call_history() -> pd.DataFrame`
- Columns match real Twilio fields: `call_sid`, `start_time`, `price`, `status`, `parent_call_sid`
- Random distribution of 0-15 calls per day across a calendar month
- ~20% of calls have a `parent_call_sid` (transfers), rest are NaN
- Price is a small positive float

**Step 1b -- Metrics module** (`data/metrics.py`):
- `total_calls(df) -> int`
- `total_cost(df) -> float`
- `total_transfers(df) -> int` — count rows where `parent_call_sid` is not NaN

**Step 1c -- Chart builder** (`charts/volume.py`):
- `create_call_volume_chart(df, chart_type: str) -> go.Figure`
- Group by date for daily call volume
- Support "Bar" and "Line" chart types
- Color palette: blue `#7B8CDE`, magenta `#C77DBA`, yellow `#E8C547`
- Transparent backgrounds to blend with dark theme

**Step 1d -- App layout** (`app.py`):
- Period selector (7, 14, 30 days) and chart type toggle in a control row
- 3 metric widgets in a row (Total Calls, Total Cost, Calls Transferred)
- Plotly chart below
- All using dummy data for now

**Verify:** `streamlit run app.py` — full dashboard renders with dummy data, controls work, chart toggles between bar/line.

**step 1e - Table tab** (`tables.py`):
- keeping the same period selector 
- chart tab - "call log" tab
- - the table shows the pure Twilio data for the specified period
- - Does streamlit provide a table where we can filter and search?

**step 1f - call heatmap** (```charts/heatmap.py```):
- create a dropdown of dates (populated with dateutil for a valid month range, past 1 days, past 7 days)
- calendar day (Y-axis), hour (x axis): total the call volume each hour and colour the heatmap based on the range (red upper quartile, blue lower quartile, yellow interquartile)

**step 1g - credit widget**
- Traffic light widget - Remaining Twilio Credit (Green > $20, Yellow < $10, Red < $5)
- figure out the nicest place to put this for now.
---

## Phase 2: Wire Up Real Twilio Data

**You'll learn:** Twilio Python SDK, `@st.cache_data` for API caching, python-dotenv

**Create:** `dashboard/dashboard/data/twilio_client.py`

**Key steps:**
1. `fetch_calls(days: int) -> pd.DataFrame` — uses `client.calls.list()` with date filters
2. Maps Twilio `CallInstance` objects to the same DataFrame columns as dummy data
3. Handles price quirks: negative string -> positive float, None -> 0.0
4. In `app.py`: swap `generate_monthly_call_history()` for `fetch_calls()`, wrap with `@st.cache_data(ttl=300)`
5. Get twilio account/project credit
6. Add manual "Refresh" button that clears the cache

**Watch out for:**
- Twilio returns UTC — convert to `Europe/London` for display
- `price` can be `None` for in-progress calls
- Cache TTL of 300s avoids hammering the API

**Verify:** Dashboard shows real call data. Changing period fetches new data. Metrics match Twilio console.

---

## Phase 3: Polish & Styling

**You'll learn:** Custom CSS injection in Streamlit, layout refinement

**Key steps:**
1. Inject CSS via `st.markdown(unsafe_allow_html=True)` to style metric cards
2. Add `st.caption()` showing last-refreshed time
3. Add `st.divider()` between sections
4. Fine-tune chart margins, hover labels, axis formatting

**Verify:** Dashboard looks cohesive — dark background, soft accent colors, professional feel.

---

## Final File Structure

```
dashboard/
  .streamlit/
    config.toml              # Theme configuration
  dashboard/
    data/
      __init__.py
      dummy.py               # Dummy data generator (removed after Phase 2)
      twilio_client.py       # Twilio SDK data fetching (framework-agnostic)
      metrics.py             # Metric computations (framework-agnostic)
    charts/
      __init__.py
      volume.py              # Plotly call volume chart (framework-agnostic)
  .env                       # TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN (gitignored)
  pyproject.toml             # Python dependencies
  app.py                     # Streamlit UI layer (only file that imports streamlit)
```

**Migration to Dash:** When ready, you replace `app.py` (and `.streamlit/`) with a Dash `app.py` that imports from the same `dashboard/data/` and `dashboard/charts/` packages. The data fetching, metric computation, and chart building all stay unchanged.

## Reference Files

- `n8n/twilio-weekly-call-report.json` — Twilio API field mapping reference
- `server/config.ts` — Environment variable names
- `server/twilio-handler.ts` — Transfer call flow (creates child legs with parent_call_sid)

## End-to-End Verification

1. Start the dashboard: `cd dashboard && streamlit run app.py`
2. Confirm dark theme loads with correct colors
3. Select each period (7, 14, 30 days) — data loads, chart and widgets update
4. Toggle bar/line chart — chart redraws correctly
5. Check cost widget against a manual Twilio console check
6. Verify transfer count by cross-referencing with known transferred calls
7. Hit "Refresh" button — cache clears, fresh data loads

---

## Future: Migration Path to Dash

When the dashboard needs to scale (multiple pages, complex callbacks, multi-user auth), migrate as follows:

1. **Keep unchanged:** `dashboard/data/` package, `dashboard/charts/` package — these have zero Streamlit imports
2. **Replace:** `app.py` with a Dash app that uses `dash-bootstrap-components` for dark theming
3. **Replace:** `.streamlit/config.toml` with Dash Bootstrap theme (e.g., `dbc.themes.DARKLY`)
4. **Add:** Dash callbacks for interactivity (period selector, chart toggle) — replaces Streamlit's re-run model
5. **Add:** `dash>=2.18.0`, `dash-bootstrap-components>=1.6.0` to requirements; remove `streamlit`

**Triggers to migrate:** multiple dashboard pages needed, role-based access control, complex cross-filtering between charts, or embedding the dashboard within another web app.
