import {
  useMemo,
} from "react";

import PromotionForm
  from "./components/PromotionForm";

import PromotionsSummary
  from "./components/PromotionsSummary";

import PromotionsTable
  from "./components/PromotionsTable";

import {
  usePromotions,
} from "./hooks/usePromotions";


function PromotionsPage() {
  const {
    promotions,
    loading,
    creating,
    error,

    handleCreatePromotion,
    handleChangeStatus,
    handleDeletePromotion,
  } = usePromotions();


  const live = useMemo(
    () =>
      promotions.filter(
        (promotion) =>
          promotion.is_live
      ).length,
    [promotions]
  );


  const drafts = useMemo(
    () =>
      promotions.filter(
        (promotion) =>
          promotion.status === "DRAFT"
      ).length,
    [promotions]
  );


  const aiGenerated = useMemo(
    () =>
      promotions.filter(
        (promotion) =>
          promotion.source === "AI"
      ).length,
    [promotions]
  );


  if (loading) {
    return (
      <div>
        <p>
          Loading promotions...
        </p>
      </div>
    );
  }


  return (
    <div>
      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            Campaigns
          </p>

          <h1>
            Promotions
          </h1>

          <p>
            Create, approve and schedule
            discounts across POS and online.
          </p>
        </div>


        <div className="header-stat">
          <span>
            Running Now
          </span>

          <strong>
            {live}
          </strong>
        </div>
      </div>


      {error && (
        <p className="error-message">
          {error}
        </p>
      )}


      <PromotionsSummary
        total={promotions.length}
        live={live}
        drafts={drafts}
        aiGenerated={aiGenerated}
      />


      <PromotionForm
        creating={creating}
        onCreate={handleCreatePromotion}
      />


      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>
              All Promotions
            </h2>

            <p>
              Drafts need approval before
              they start running.
            </p>
          </div>
        </div>


        <PromotionsTable
          promotions={promotions}
          onChangeStatus={
            handleChangeStatus
          }
          onDelete={
            handleDeletePromotion
          }
        />
      </section>
    </div>
  );
}


export default PromotionsPage;
