"""
Creates dummy data for demo-ing the dashboard

Fields that would come from the VoIP endpoint:
    sid, start_time, duration, cost, status, direction, parent_call_sid
"""

import pandas as pd
import numpy as np
from datetime import datetime
from dateutil.relativedelta import relativedelta
import random

CALL_STATUSES = [
    "completed",
    "failed"
]

CALL_SID_EX = "CA2e1bf5b2a1d630292e1ad2b20f8085a9"


def generate_monthly_call_history() -> pd.DataFrame:
    # generate 30 days of data - daily call granularity
    end = datetime.now()
    start = end + relativedelta(months=-1)
    # 1 month DateTimeIndex
    # date and time ISO format
    dti = pd.date_range(start, end)
    # start_time col: random distribution of 0-15 calls per day
    daily_calls = np.random.randint(15, size=(len(dti)))
    # for each day in the daily index
    call_times = []
    for day, calls in zip(dti, daily_calls):
        # create a random hourly list of datetimes corresponing to the amount of calls in daily_calls
        hours = np.random.randint(23, size=(calls))
        dates = [day.to_pydatetime().replace(hour=hour) for hour in hours]
        call_times.extend(sorted(dates))
    # after, stitch a final datetimeindex together from all these dates
    dti_final = pd.DatetimeIndex(call_times)
    # parent call SID and status completed = successful transfer
    daily_call_statuses = random.choices(CALL_STATUSES, weights=[
        4, 1], k=len(dti_final))
    call_ids = [CALL_SID_EX] * len(daily_call_statuses)
    # NaN for about 50% of calls with NaN for parent SID, easy filtering downstream
    calls_transferred = random.choices(
        [CALL_SID_EX, np.nan], weights=[1, 4], k=len(call_ids))
    # price, small float between 0.08 and 0.2 (GBP)
    prices = np.round(np.random.rand(len(calls_transferred)), 2)

    return pd.DataFrame({
        "start_time": dti_final,
        "call_sid": call_ids,
        "status": daily_call_statuses,
        "parent_call_sid": calls_transferred,
        "price": prices,
    })


if __name__ == "__main__":
    print(generate_monthly_call_history().head(10))
