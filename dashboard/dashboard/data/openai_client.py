import requests
import os
import warnings
from datetime import datetime
from dateutil.relativedelta import relativedelta
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")


def get_monthly_usage_cost() -> float | None:
    try:
        now = datetime.now()
        start = now - relativedelta(months=1)
        response = requests.get(
            "https://api.openai.com/v1/organization/costs",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            params={
                "start_time": int(start.timestamp()),
                "end_time": int(now.timestamp()),
            }
        )
        response.raise_for_status()
        data = response.json().get("data", [])
        return sum(float(r["amount"]["value"]) for bucket in data for r in bucket.get("results", []))
    except Exception as e:
        warnings.warn(f"Failed to fetch OpenAI usage: {e}")
        return None
