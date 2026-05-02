# Plan: Add OpenAI Credit Balance as 4th `st.metric`

## Context
The dashboard currently shows three metrics (Total Calls, Total Cost, Total Transferred) and displays a Twilio account balance badge in the top bar. The goal is to add a 4th metric — remaining OpenAI credit — in the same metrics row (`app.py` lines 201–213).

---

## Implementation

### Step 1 — Create `dashboard/dashboard/data/openai_client.py`

New file. Use `requests` (already a dependency — no new packages needed) to hit the OpenAI billing API:

```
GET https://api.openai.com/dashboard/billing/credit_grants
Authorization: Bearer {OPENAI_API_KEY}
```

The response includes a `total_available` field (float, USD).

Mirror the pattern from `get_account_balance()` in `twilio_client.py`:

```python
import os
import warnings
import requests
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def get_openai_credit_balance() -> float | None:
    try:
        response = requests.get(
            "https://api.openai.com/dashboard/billing/credit_grants",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
        )
        response.raise_for_status()
        return float(response.json()["total_available"])
    except Exception as e:
        warnings.warn(f"Failed to fetch OpenAI credit balance: {e}")
        return None
```

### Step 2 — Update `dashboard/dashboard/app.py`

**Add import** at the top with the other data imports:
```python
from dashboard.data.openai_client import get_openai_credit_balance
```

**Add 4th metric** in the metrics container (after `Total Transferred`, around line 213):
```python
openai_credit = get_openai_credit_balance()
st.metric(
    label="OpenAI Credit",
    value=f"${openai_credit:.2f}" if openai_credit is not None else "N/A"
)
```

Call the function once into a variable — avoids fetching twice.

---

## Files to Change
| File | Action |
|---|---|
| `dashboard/dashboard/data/openai_client.py` | **Create** |
| `dashboard/dashboard/app.py` | **Edit** — import + 4th metric |

No changes to `pyproject.toml` — `requests` is already listed.

---

## Verification
1. Ensure `OPENAI_API_KEY` is set in `.env`
2. Run: `cd dashboard && streamlit run app.py`
3. Confirm 4 metric cards appear in the bordered container
4. Test the `None` path: temporarily remove `OPENAI_API_KEY` from `.env` and confirm the metric shows `"N/A"` without crashing
