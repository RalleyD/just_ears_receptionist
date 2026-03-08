"""
Creates a bar or line chart for the number of daily calls over a specified
period, typically 7 days, 14 days, 1 month
"""

import pandas as pd
import plotly.graph_objects as go
from dashboard.data.metrics import total_calls


def create_call_volume_chart(df: pd.DataFrame, chart_type: str, title_suffix="Monthly") -> go.Figure:
    """
    Create a chart figure based on total daily call volume

    Args:
        df (DataFrame): Twilo call log data
        chart_type (str): chose between 'bar' or 'line'

    Returns
        Plotly graph object - Figure (to be passed into Streamlit)
    """
    # group by and reduce (by-day total)
    call_ser = pd.Series(df["status"].values, index=df["start_time"])

    x_data = call_ser.resample("D").count()

    if chart_type.casefold() == "bar":
        fig_chart = go.Bar
    else:
        fig_chart = go.Scatter

    fig = go.Figure(
        data=[fig_chart(x=x_data.index, y=x_data)],
        layout=go.Layout(
            title=f"{title_suffix} Call Summary",
            xaxis=dict(title=f"Previous {title_suffix}"),
            yaxis=dict(title="Total Calls"),
            plot_bgcolor="rgba(0,0,0,0)",  # transparent
            paper_bgcolor="rgba(0,0,0,0)",  # transparent
            font_color="#E8EAED",
            # set colour pallete here. The first colour is the default.
            colorway=["#7B8CDE", "#C77DBA", "#E8C547"],
        )
    )

    return fig


if __name__ == "__main__":
    from dashboard.data.dummy import generate_monthly_call_history
    month_calls = generate_monthly_call_history()

    for chart_type in ["bar", "line"]:
        plot = create_call_volume_chart(month_calls, chart_type)
        plot.update_layout(
            template="plotly_dark",
            plot_bgcolor="#111111",
            paper_bgcolor="#111111",
        )
        plot.show()
