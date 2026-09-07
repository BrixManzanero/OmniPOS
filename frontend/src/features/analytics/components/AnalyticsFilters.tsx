import type {
  AnalyticsPeriod,
} from "@/services/api";


type Props = {
  period: AnalyticsPeriod;
  customStartDate: string;
  customEndDate: string;

  onPeriodChange: (
    period: AnalyticsPeriod
  ) => void;

  onStartDateChange: (
    value: string
  ) => void;

  onEndDateChange: (
    value: string
  ) => void;

  onApplyCustom: () => void;
};


const PERIODS = [
  {
    value: "today",
    label: "Today",
  },
  {
    value: "7d",
    label: "7 Days",
  },
  {
    value: "30d",
    label: "30 Days",
  },
  {
    value: "custom",
    label: "Custom",
  },
] as const;


function AnalyticsFilters({
  period,
  customStartDate,
  customEndDate,
  onPeriodChange,
  onStartDateChange,
  onEndDateChange,
  onApplyCustom,
}: Props) {
  const isCustom =
    period === "custom";

  const canApply =
    Boolean(
      customStartDate &&
      customEndDate
    );


  return (
    <section className="analytics-filter-section">
      <div className="analytics-filter-header">
        <div>
          <p className="page-eyebrow">
            Date Range
          </p>

          <h2>
            Analysis Period
          </h2>
        </div>


        <div className="analytics-period-buttons">
          {PERIODS.map(
            ({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`analytics-period-button${
                  period === value
                    ? " active"
                    : ""
                }`}
                onClick={() =>
                  onPeriodChange(value)
                }
              >
                {label}
              </button>
            )
          )}
        </div>
      </div>


      {isCustom && (
        <div className="analytics-custom-range">
          <label>
            <span>From</span>

            <input
              type="date"
              value={customStartDate}
              onChange={(event) =>
                onStartDateChange(
                  event.target.value
                )
              }
            />
          </label>


          <label>
            <span>To</span>

            <input
              type="date"
              value={customEndDate}
              onChange={(event) =>
                onEndDateChange(
                  event.target.value
                )
              }
            />
          </label>


          <button
            type="button"
            className="primary-button"
            disabled={!canApply}
            onClick={onApplyCustom}
          >
            Apply
          </button>
        </div>
      )}
    </section>
  );
}


export default AnalyticsFilters;