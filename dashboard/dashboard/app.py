"""
┌─────────────────────────────────────────────────┐
│  Title                                          │
├──────────┬──────────┬──────────┬────────────────┤
│ [Period] │ [Chart]  │          │  Twilio Balance│
│ selector │ toggle   │          │                │
├──────────┴──────────┴──────────┴────────────────┤
│ Total Calls  │  Total Cost  │ Calls Transferred │
├──────────────┴──────────────┴───────────────────┤
│ Chart | Call Log |                              |
│-------------------------------------------------|
│       Call Volume Chart / Call Log Table        │
│                                                 │
└─────────────────────────────────────────────────┘
"""

import streamlit as st
import pandas as pd
import random
from pandas.tseries.offsets import DateOffset
from dashboard.data.dummy import generate_monthly_call_history
import dashboard.data.metrics as metrics
from dashboard.charts.volume import create_call_volume_chart
from dashboard.charts.heatmap import create_hourly_heatmap

st.set_page_config(
    page_title="Just Ears - Call Dashboard",
    page_icon="\u260E",
    layout="wide",
)

st.markdown("""
<style>
    /* Brand font stack */
    html, body, [class*="css"] {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                     "Helvetica Neue", Arial, sans-serif;
    }
    /* Clean dark headings */
    h1, h2, h3 {
        color: #000000 !important;
    }
    /* Metric card styling */
    [data-testid="stMetric"] {
        background: #eeeeee;
        border-left: 4px solid #7a00df;
        border-radius: 6px;
        padding: 12px 16px;
    }
    [data-testid="stMetricLabel"] {
        color: #313131 !important;
    }
    [data-testid="stMetricValue"] {
        color: #32373c !important;
    }
</style>
""", unsafe_allow_html=True)

st.title("Just Ears Call Dashboard")


def period_filter():
    pass

# ------------------- #
#  UI Elements  #
# ------------------- #


# ------------------- #
#  UI Layout  #
# ------------------- #

@st.cache_data
def get_call_history() -> pd.DataFrame:
    return generate_monthly_call_history()


# def st_segmented_control_no_deselect(container, label, options, default, key=None):
#     def prevent_deselection(key, default):
#         if st.session_state[key] is None:
#             st.session_state[key] = default

#     if key not in st.session_state:
#         st.session_state[key] = default

#     return container.segmented_control(
#         label,
#         options=options,
#         selection_mode="single",
#         on_change=lambda: prevent_deselection(key, default),
#     )


with st.container(horizontal=True) as no_deselect:
    calls_data = get_call_history()

    # TODO figure out string parsing, if required
    # period = st.segmented_control(
    #     "Period",
    #     ["7 Days", "14 Days", "1 Month"],
    #     selection_mode="single",
    #     default="1 Month"
    # )
    # period = st_segmented_control_no_deselect(
    #     container=no_deselect,
    #     label="Period",
    #     options=["7 Days", "14 Days", "1 Month"],
    #     default="1 Month"
    # )

    period = st.radio(
        "Period",
        ["7 Days", "14 Days", "1 Month"],
        index=2,
        horizontal=True
    )

    chart_type: str = st.radio(
        "Chart Type",
        ["Bar", "Line"],
        index=0,
        horizontal=True
    )

    twilio_balance = st.container()
    twilio_balance.text("Twilio Balance")
    tw_balance = random.randrange(0, 20)
    balance_thresh = {
        5: "red",
        10: "yellow",
        20: "green"
    }
    balance_icon = {
        "red": ":material/exclamation:",
        "green": ":material/check:",
        "yellow": ":material/warning:"
    }
    if tw_balance < min(list(balance_thresh.keys())):
        tw_col = "red"
    else:
        for thresh in reversed(list(balance_thresh.keys())):
            if tw_balance // thresh:
                tw_col = balance_thresh.get(thresh, "red")
                break
    twilio_balance.badge(f"£{tw_balance}", color=tw_col,
                         icon=balance_icon.get(tw_col, "red"))

    period_spec = period.split(" ")
    # work backwards so that times align - although
    # this isn't a dealbreakeras we can always .loc by YYYY-MM-DD only
    period_spec = {period_spec[1].lower(): -int(period_spec[0])}
    # setattr of dateoffset tuple[1], value[0]

    if "Month" in period:
        duration = period_spec.pop("month")
        period_spec["months"] = duration

    print(calls_data["start_time"].iloc[-1] + DateOffset(**period_spec))

    call_data_period = calls_data.copy()
    call_data_period = call_data_period.loc[
        call_data_period["start_time"] >= call_data_period["start_time"].iloc[-1] +
        DateOffset(**period_spec),
        call_data_period.columns
    ]

with st.container(horizontal=True, border=True):
    st.metric(
        label="Total Calls",
        value=metrics.total_calls(call_data_period)
    )
    st.metric(
        label="Total Cost",
        value=f"£{metrics.total_cost(call_data_period)}"
    )
    st.metric(
        label="Total Transferred",
        value=metrics.total_transfers(call_data_period)
    )

tab_1, tab_2, tab_3 = st.tabs(["chart", "Call Volume", "Call Volume"])
# with st.container(horizontal=True, border=True):
with tab_1:
    st.plotly_chart(create_call_volume_chart(
        call_data_period, chart_type.casefold(), title_suffix=period))

with tab_2:
    st.dataframe(call_data_period,
                 hide_index=True)

with tab_3:
    st.plotly_chart(create_hourly_heatmap(
        call_data_period
    ))
