import {
  useState,
} from "react";

import {
  createPromotion,
} from "@/features/promotions/api/promotionsApi";

import type {
  Insight,
} from "../types/insight.types";


type Props = {
  insight: Insight;
};


const SEVERITY_LABEL: Record<
  string,
  string
> = {
  opportunity: "Opportunity",
  warning: "Needs attention",
  info: "For information",
};


function describeSuggestion(
  insight: Insight
) {
  const promotion =
    insight.suggested_promotion;

  if (!promotion) {
    return "";
  }

  const amount =
    promotion.discount_type === "PERCENT"
      ? `${promotion.discount_value}% off`
      : `${promotion.discount_value} off`;

  const scope =
    promotion.target_type === "PRODUCT"
      ? "one product"
      : promotion.target_type === "CATEGORY"
      ? `the ${promotion.target_category} category`
      : "all products";

  const channel =
    promotion.channel === "ALL"
      ? "POS and online"
      : promotion.channel === "ONLINE"
      ? "online only"
      : "POS only";

  const window =
    promotion.start_hour !== null &&
    promotion.start_hour !== undefined &&
    promotion.end_hour !== null &&
    promotion.end_hour !== undefined
      ? `, ${promotion.start_hour}:00 to ` +
        `${promotion.end_hour}:00 daily`
      : "";

  return (
    `${amount} on ${scope}, ${channel}${window}.`
  );
}


function InsightCard({
  insight,
}: Props) {
  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");


  async function handleCreateDraft() {
    if (!insight.suggested_promotion) {
      return;
    }


    try {
      setSaving(true);
      setError("");

      await createPromotion({
        ...insight.suggested_promotion,
        status: "DRAFT",
        source: "AI",
      });

      setSaved(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save the draft."
      );
    } finally {
      setSaving(false);
    }
  }


  return (
    <article className="section-card">

      <div className="panel-header">
        <div>
          <p className="page-eyebrow">
            {SEVERITY_LABEL[
              insight.severity
            ] || insight.severity}
          </p>

          <h3>
            {insight.title}
          </h3>
        </div>
      </div>


      <p>
        {insight.summary}
      </p>


      {insight.metrics.length > 0 && (
        <div className="overview-list">
          {insight.metrics.map(
            (metric) => (
              <div
                key={metric.label}
                className="order-detail-item"
              >
                <span>
                  {metric.label}
                </span>

                <strong>
                  {metric.value}
                </strong>
              </div>
            )
          )}
        </div>
      )}


      {insight.suggested_promotion && (
        <div className="form-action">
          <p className="muted-text">
            Suggested action:{" "}
            {describeSuggestion(insight)}
          </p>


          <button
            type="button"
            className="primary-button"
            onClick={handleCreateDraft}
            disabled={saving || saved}
          >
            {saved
              ? "Draft created"
              : saving
              ? "Saving..."
              : "Save as draft promotion"}
          </button>
        </div>
      )}


      {saved && (
        <p className="success-message">
          Saved to Promotions as a draft.
          Approve it there to start running it.
        </p>
      )}


      {error && (
        <p className="error-message">
          {error}
        </p>
      )}

    </article>
  );
}


export default InsightCard;
