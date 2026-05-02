import requests
import os
import warnings
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")


def get_openai_credit_balance() -> float | None:
    try:
        headers = {
            "Authorization": "Bearer " + OPENAI_API_KEY
        }
        response = requests.get("https://api.openai.com/dashboard/billing/credit_grants",
                                headers=headers)
        response.raise_for_status()
        return float(response.json()['total_available'])
    except Exception as e:
        warnings.warn(f"Failed to fetch OpenAI credit: {e}")
        return None
