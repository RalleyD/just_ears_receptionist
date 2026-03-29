
import pandas as pd
from datetime import datetime
from dateutil.relativedelta import relativedelta
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException, TwilioException
from dotenv import load_dotenv
import warnings
import os
import dashboard.data.dummy as dummy

load_dotenv(override=False)
# perform module level Client instantiation and auth
try:
    account_sid = os.environ['TWILIO_ACCOUNT_SID']
    auth_token = os.environ['TWILIO_AUTH_TOKEN']
    client = Client(account_sid, auth_token)
except Exception as e:
    warnings.warn("Twilio Client initialisation failed, using dummy data: ", e)


def generate_monthly_call_history() -> pd.DataFrame:
    end_time = datetime.now()
    start_time = end_time + relativedelta(months=-1)

    try:
        calls = client.calls.list(
            start_time_after=start_time,
            end_time_before=end_time,
            limit=31
        )
    except (TwilioException, TwilioRestException) as e:
        warnings.warn("Twilio API request failed, using dummy data: ", e)
        return dummy.generate_monthly_call_history()

    start_time = []
    call_sid = []
    status = []
    parent_call_sid = []
    price = []
    for record in calls:
        start_time.append(record.start_time)
        call_sid.append(record.sid)
        parent_call_sid.append(record.parent_call_sid)
        status.append(record.status)
        price.append(record.price)

    # dti_final
    # once all call records collected ->
    # create a series and convert to datetime
    dti_final = pd.to_datetime(start_time)

    # parse calls into a dict -> to frame
    return pd.DataFrame({
        "start_time": dti_final,
        "call_sid": call_sid,
        "status": status,
        "parent_call_sid": parent_call_sid,
        "price": price,
    })


def get_account_balance() -> float | None:
    """
    https://www.twilio.com/docs/iam/api/account#fetch-an-account-resource
    """
    import json
    try:
        account = client.api.v2010.accounts(
            account_sid
        ).fetch()

        return float(account.balance.fetch().balance)
    except (TwilioException, TwilioRestException) as e:
        warnings.warn("Twilio: unable to access account balance: ", e)
        return None


if __name__ == "__main__":
    print(
        generate_monthly_call_history().head(30)
    )
    print(get_account_balance())
