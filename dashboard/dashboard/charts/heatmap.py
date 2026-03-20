
import pandas as pd
import plotly.graph_objects as go
from dashboard.data.dummy import generate_monthly_call_history


def create_hourly_heatmap(call_data_period: pd.DataFrame) -> go.Figure:
    # starting with a flat dataframe
    # group by (day, hour)
    # set the index to start_time
    hourly_count_df = call_data_period.loc[:, ["start_time"]].groupby(
        pd.Grouper(key="start_time",
                   axis=0,
                   freq="H")
    ).size().to_frame(name="count")

    print(hourly_count_df.head())

    hourly_count_df["Dates"] = hourly_count_df.index.to_series().dt.date.values

    hourly_count_df["Time"] = hourly_count_df.index.to_series().dt.time.values

    matrix = hourly_count_df.pivot(
        index="Dates",
        columns="Time",
        values="count"
    )  # .to_csv("./foo.csv")

    print(matrix.head())

    # print(call_data_period.reindex(
    #     call_data_period["start_time"]).to_csv("./foo.csv"))
    # day_hour_sum_df = call_data_period.resample("H").count()
    # print(day_hour_sum_df.head(10))
    # pivot - each row is a day, each column is an hour with aggregated (sum) calls.
    # heatmap, for each day (row) there should be an axes element on the same plot
    # go.Heatmap (x = hour, y = day, z = sum calls)
    # colourscale (blue = lower qt, yellow = inter qt, red = upper qt)


if __name__ == "__main__":
    _ = create_hourly_heatmap(generate_monthly_call_history())
    # plot.show()
