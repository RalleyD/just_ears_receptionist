import os
import warnings
from datetime import datetime
from dateutil.relativedelta import relativedelta
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(
    admin_api_key=os.environ.get("OPENAI_ADMIN_KEY"),
)


def get_monthly_usage_cost() -> float | None:
    try:
        now = datetime.now()
        start = now - relativedelta(months=1)
        total = 0.0
        page = client.admin.organization.usage.costs(
            start_time=int(start.timestamp()),
            end_time=int(now.timestamp()),
        )
        for bucket in page.auto_paging_iter():
            for result in bucket.results:
                total += result.amount.value
        return total
    except Exception as e:
        warnings.warn(f"Failed to fetch OpenAI usage: {e}")
        return None
