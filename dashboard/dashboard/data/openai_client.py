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
        headers = {"Authorization": f"Bearer {OPENAI_API_KEY}"}
        params = {
            "start_time": int(start.timestamp()),
            "end_time": int(now.timestamp()),
        }
        total = 0.0
        while True:
            response = requests.get(
                "https://api.openai.com/v1/organization/costs",
                headers=headers,
                params=params,
            )
            response.raise_for_status()
            body = response.json()
            total += sum(
                float(r["amount"]["value"])
                for bucket in body.get("data", [])
                for r in bucket.get("results", [])
            )
            if not body.get("has_more"):
                break
            params = {"page": body["next_page"]}
        return total
    except Exception as e:
        warnings.warn(f"Failed to fetch OpenAI usage: {e}")
        return None
