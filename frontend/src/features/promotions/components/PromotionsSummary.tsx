type Props = {
  total: number;
  live: number;
  drafts: number;
  aiGenerated: number;
};


function PromotionsSummary({
  total,
  live,
  drafts,
  aiGenerated,
}: Props) {
  return (
    <div className="dashboard-grid">

      <div className="metric-card">
        <span>Total Promotions</span>

        <strong>
          {total}
        </strong>

        <small>
          All campaigns on record
        </small>
      </div>


      <div className="metric-card">
        <span>Running Now</span>

        <strong>
          {live}
        </strong>

        <small>
          Active within schedule
        </small>
      </div>


      <div className="metric-card">
        <span>Pending Approval</span>

        <strong>
          {drafts}
        </strong>

        <small>
          Drafts awaiting review
        </small>
      </div>


      <div className="metric-card">
        <span>AI Suggested</span>

        <strong>
          {aiGenerated}
        </strong>

        <small>
          Generated from insights
        </small>
      </div>

    </div>
  );
}


export default PromotionsSummary;
