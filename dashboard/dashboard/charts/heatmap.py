
import pandas as pd
import plotly.graph_objects as go


def create_hourly_heatmap(call_data_period: pd.DataFrame) -> go.Figure:
    # get a dataframe of the start time col
    # -> group by hour
    # -> size to get the size of each group (No. elements per-hour)
    # -> to_frame with a named column, 'reset_index(name=count)' may also work
    hourly_count_df = call_data_period.loc[:, ["start_time"]].groupby(
        pd.Grouper(key="start_time",
                   axis=0,
                   freq="H")
    ).size().to_frame(name="count")

    print(hourly_count_df.head())

    # create a 2D matrix of Y(Dates), X(Time), Z(count)
    hourly_count_df["Dates"] = hourly_count_df.index.to_series().dt.date.values
    hourly_count_df["Time"] = hourly_count_df.index.to_series().dt.time.values
    # TODO may need fillna(0)
    matrix = hourly_count_df.pivot(
        index="Dates",
        columns="Time",
        values="count"
    ).fillna(0)

    # heatmap, for each day (row) there should be an axes element on the same plot
    # go.Heatmap (x = hour, y = day, z = sum calls)
    # TODO colourscale (blue = lower qt, yellow = inter qt, red/magenta = upper qt)
    fig = go.Figure(
        data=go.Heatmap(
            z=matrix.values,
            x=[t.strftime("%H:%M") for t in matrix.columns],
            y=matrix.index,
            colorscale=[
                [0.0, "#f5f0fa"],
                [0.25, "#c9a0e8"],
                [0.5, "#B65CFF"],
                [0.75, "#7A00DF"],
                [1.0, "#5A00A3"],
            ]
        )
    )
    fig.update_xaxes(tickangle=45)
    fig.update_yaxes(tickmode="array",
                     tickvals=matrix.index)
    fig.update_layout(
        title=dict(text="Daily Call Volume"),
        plot_bgcolor="rgba(0,0,0,0)",
        paper_bgcolor="rgba(0,0,0,0)",
        font_color="#313131",
    )

    return fig


if __name__ == "__main__":
    from dashboard.data.dummy import generate_monthly_call_history

    plot = create_hourly_heatmap(generate_monthly_call_history())
    plot.show()
