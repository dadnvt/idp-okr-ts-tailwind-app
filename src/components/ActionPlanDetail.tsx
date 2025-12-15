import type { IActionPlan } from "../types";

export function ActionPlanDetail({ plan }: { plan: IActionPlan }) {
  return (
    <div className="space-y-4">
      <p><strong>Activity:</strong> {plan.activity}</p>
      <p><strong>Duration:</strong> {plan.start_date} → {plan.end_date}</p>
      <p><strong>Status:</strong> {plan.status}</p>

      <h4 className="font-bold mt-4">Weekly Reports</h4>
      <div className="space-y-3">
        {plan.weeklyReports?.map(wr => (
          <div key={wr.id} className="border rounded p-3 bg-gray-50">
            <p><strong>Date:</strong> {wr.date}</p>
            <p><strong>Summary:</strong> {wr.summary}</p>
            <p><strong>Blockers:</strong> {wr.blockers_challenges}</p>
            <p><strong>Leader feedback:</strong> {wr.lead_feedback}</p>
          </div>
        ))}
      </div>
    </div>
  );
}