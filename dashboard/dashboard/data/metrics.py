"""
This module exists as a nice form of abstraction:

    - Keeps the data extraction separate from the app.
    - Separates data injestion from extraction.
    
This way, the app can easily be swapped e.g Streamlit -> Dash.
Likewise, the data ingestion source (dummy, Twilio). 
Without breaking the interface.
"""

import pandas as pd


def total_calls(df: pd.DataFrame) -> int:
    # sum the numer of "completed" calls
    # return df[df["status"] == "completed"].count()
    return df.loc[df["status"] == "completed", "status"].count()


def total_cost(df: pd.DataFrame) -> float:
    # sum the total cost of the calls
    # using single label loc to get a series to sum
    # from twilio, call costs come as a negative string float (None if empty)
    prices = df.loc[:, "price"]
    prices = prices.fillna(0.0)
    prices = prices.astype(float)
    return prices.sum()


def total_transfers(df: pd.DataFrame) -> int:
    """Count all calls where parent SID exists and status completed"""
    return df.loc[df["status"] == "completed", "parent_call_sid"].dropna().count()


if __name__ == "__main__":
    from dashboard.data.twilio_client import generate_monthly_call_history

    month_calls: pd.DataFrame = generate_monthly_call_history()

    print("--- Testing Metrics with Dummy Data ---\n")
    print("    total calls: ", total_calls(month_calls))
    print("    total cost, GBP: ", total_cost(month_calls))
    print("    total calls transferred: ", total_transfers(month_calls))
