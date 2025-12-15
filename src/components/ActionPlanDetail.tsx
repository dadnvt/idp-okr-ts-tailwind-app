import { useMemo, useState } from "react";
import type { IActionPlan } from "../types";
import { Button } from "./Button";

export function ActionPlanDetail({ plan }: { plan: IActionPlan }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const weeklyReports = useMemo(() => {
    const list = plan.weekly_reports || [];
    return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [plan.weekly_reports]);

  const visibleReports = useMemo(() => weeklyReports.slice(0, 3), [weeklyReports]);
  const hasMore = weeklyReports.length > visibleReports.length;

  return (
    <div className="space-y-4">
      <p><strong className="font-medium">Activity:</strong> {plan.activity}</p>
      <p><strong className="font-medium">Duration:</strong> {plan.start_date} → {plan.end_date}</p>
      <p><strong className="font-medium">Status:</strong> {plan.status}</p>

      <h4 className="font-bold mt-4 font-medium">
        Weekly Reports <span className="text-sm text-gray-500">({weeklyReports.length})</span>
      </h4>
      <div className="space-y-3">
        {weeklyReports.length === 0 && (
          <p className="text-sm text-gray-400 italic">No weekly reports yet.</p>
        )}

        {visibleReports.map((wr) => {
          const isExpanded = expandedId === wr.id;
          return (
            <div key={wr.id} className="border rounded p-3 bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p><strong className="font-medium">Date:</strong> {wr.date}</p>
                  <p><strong className="font-medium">Summary:</strong> {wr.summary || '-'}</p>
                  <p><strong className="font-medium">Leader feedback:</strong> {wr.lead_feedback || '-'}</p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setExpandedId(isExpanded ? null : wr.id)}
                >
                  {isExpanded ? 'Hide' : 'View'}
                </Button>
              </div>

              {isExpanded && (
                <div className="mt-3 space-y-1 text-sm">
                  <p><strong className="font-medium">Work done:</strong> {wr.work_done || '-'}</p>
                  <p><strong className="font-medium">Blockers:</strong> {wr.blockers_challenges || '-'}</p>
                  <p><strong className="font-medium">Next week plan:</strong> {wr.next_week_plan || '-'}</p>
                </div>
              )}
            </div>
          );
        })}

        {hasMore && (
          <p className="text-xs text-gray-500 italic font-medium">
            Showing latest 3 reports. Use Weekly Reports page to see all.
          </p>
        )}
      </div>
    </div>
  );
}