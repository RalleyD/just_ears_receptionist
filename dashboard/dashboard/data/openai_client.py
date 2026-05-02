import os
import warnings
import requests
from datetime import datetime
from dateutil.relativedelta import relativedelta
from dotenv import load_dotenv

load_dotenv()

OPENAI_ADMIN_KEY = os.environ.get("OPENAI_API_KEY")


def get_monthly_usage_cost() -> float | None:
    try:
        now = datetime.now()
        start = now - relativedelta(months=1)
        headers = {"Authorization": f"Bearer {OPENAI_ADMIN_KEY}"}
        params = {
            "start_time": int(start.timestamp()),
            "end_time": int(now.timestamp()),
            "limit": 180,
        }
        response = requests.get(
            "https://api.openai.com/v1/organization/costs",
            headers=headers,
            params=params,
        )
        response.raise_for_status()
        data = response.json().get("data", [])
        return sum(
            float(r["amount"]["value"])
            for bucket in data
            for r in bucket.get("results", [])
        )
    except Exception as e:
        warnings.warn(f"Failed to fetch OpenAI usage: {e}")
        return None


if __name__ == "__main__":
    print(get_monthly_usage_cost())
