"""
Creates a bar or line chart for the number of daily calls over a specified
period, typically 7 days, 14 days, 1 month
"""

import pandas as pd
import plotly.graph_objects as go
from dashboard.data.metrics import total_calls


def create_call_volume_chart(df: pd.DataFrame, chart_type: str) -> go.Figure:

    weekday = df["start_time"]  # . TBC!

    fig = go.Figure(
        data=[go.Bar(x=weekday, y=total_calls)],
        layout=go.Layout(
            title=go.Layout.title(text="Month Call Summary")
        )
    )

    fig.update_layout(
        plot_bgcolor="rgba(0,0,0,0)",  # transparent
        paper_bgcolor="rgba(0,0,0,0)",  # transparent
        font_color="#E8EAED",
        colorway=["#7B8CDE", "#C77DBA", "#E8C547"],
    )

    return fig
