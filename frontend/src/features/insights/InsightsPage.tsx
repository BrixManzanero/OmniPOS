import InsightCard
  from "./components/InsightCard";

import {
  useInsights,
} from "./hooks/useInsights";


function InsightsPage() {
  const {
    result,
    loading,
    refreshing,
    error,
    refreshInsights,
  } = useInsights();


  if (loading) {
    return (
      <div>
        <p>
          Analyzing recent sales activity...
        </p>
      </div>
    );
  }


  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            Recommendations
          </p>

          <h1>
            AI Insights
          </h1>

          <p>
            Patterns found in your recent
            sales, stock and customer
            activity. Nothing is applied
            until you approve it.
          </p>
        </div>


        <div className="header-stat">
          <span>
            Orders Analyzed
          </span>

          <strong>
            {result?.orders_analyzed ?? 0}
          </strong>
        </div>
      </div>


      {error && (
        <p className="error-message">
          {error}
        </p>
      )}


      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              What we found
            </h2>

            <p>
              Based on the last{" "}
              {result?.period_days ?? 30}{" "}
              days of completed orders.
            </p>
          </div>


          <button
            type="button"
            className="secondary-button"
            onClick={refreshInsights}
            disabled={refreshing}
          >
            {refreshing
              ? "Re-analyzing..."
              : "Re-run analysis"}
          </button>
        </div>


        <div className="analytics-grid">
          {result?.insights.map(
            (insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
              />
            )
          )}
        </div>
      </section>
    </div>
  );
}


export default InsightsPage;
