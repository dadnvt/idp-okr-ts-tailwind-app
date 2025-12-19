import { useEffect, useMemo, useState } from "react";
import type { IActionPlan, IWeeklyReport } from "../types";
import { useAuth } from "../common/AuthContext";
import { fetchWeeklyReportsByActionPlan, updateWeeklyReport } from "../api/weeklyReportsApi";
import { Button } from "./Button";

export function ActionPlanDetail({
  plan,
  refreshKey,
  createdWeeklyReport,
}: {
  plan: IActionPlan;
  refreshKey?: number;
  createdWeeklyReport?: IWeeklyReport | null;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { auth } = useAuth();
  const [reports, setReports] = useState<IWeeklyReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  // Optimistic update: immediately show the newly created weekly report
  // (sometimes GET-after-POST can be eventually consistent).
  useEffect(() => {
    if (!createdWeeklyReport) return;
    if (createdWeeklyReport.action_plan_id !== plan.id) return;

    setReports((prev) => {
      if (prev.some((r) => r.id === createdWeeklyReport.id)) return prev;
      return [createdWeeklyReport, ...prev];
    });
  }, [createdWeeklyReport, plan.id]);

  const weeklyReports = useMemo(() => {
    return [...reports].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [reports]);

  const visibleReports = useMemo(() => weeklyReports.slice(0, 3), [weeklyReports]);
  const hasMore = weeklyReports.length > visibleReports.length;

  useEffect(() => {
    const load = async () => {
      if (!auth.token) return;
      setIsLoading(true);
      try {
        // Fetch only first page; we display latest 3.
        const { res, result } = await fetchWeeklyReportsByActionPlan(auth.token, plan.id, {
          limit: 10,
          offset: 0,
        });
        if (!res.ok) throw new Error(result.error || 'Fetch weekly reports failed');
        setReports(result.data);
      } catch (e) {
        console.error(e);
        setReports([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [auth.token, plan.id, refreshKey]);

  return (
    <div className="space-y-4">
      <p><strong className="font-medium">Activity:</strong> {plan.activity}</p>
      <p><strong className="font-medium">Duration:</strong> {plan.start_date} → {plan.end_date}</p>
      <p><strong className="font-medium">Status:</strong> {plan.status}</p>

      <h4 className="font-bold mt-4 font-medium">
        Weekly Reports <span className="text-sm text-gray-500">({weeklyReports.length})</span>
      </h4>
      <div className="space-y-3">
        {isLoading && (
          <p className="text-sm text-gray-400 italic">Loading weekly reports...</p>
        )}
        {weeklyReports.length === 0 && (
          <p className="text-sm text-gray-400 italic">No weekly reports yet.</p>
        )}

        {visibleReports.map((wr) => {
          const isExpanded = expandedId === wr.id;
          const isLeader = auth.user?.role === 'leader';
          const draft = feedbackDrafts[wr.id] ?? wr.lead_feedback ?? '';
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

                  {isLeader && (
                    <div className="pt-2 space-y-2">
                      <label className="block text-sm font-medium">Update leader feedback</label>
                      <textarea
                        className="w-full border rounded p-2"
                        rows={3}
                        value={draft}
                        onChange={(e) =>
                          setFeedbackDrafts((prev) => ({ ...prev, [wr.id]: e.target.value }))
                        }
                      />
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          disabled={!auth.token || savingId === wr.id}
                          onClick={async () => {
                            if (!auth.token) return;
                            setSavingId(wr.id);
                            try {
                              const { res, result } = await updateWeeklyReport(auth.token, wr.id, {
                                lead_feedback: draft,
                              });
                              if (!res.ok) throw new Error((result as any)?.error || 'Update failed');
                              // Refresh local list
                              setReports((prev) =>
                                prev.map((r) => (r.id === wr.id ? { ...r, lead_feedback: draft } : r))
                              );
                            } catch (e) {
                              console.error(e);
                              alert(e instanceof Error ? e.message : 'Update failed');
                            } finally {
                              setSavingId(null);
                            }
                          }}
                        >
                          {savingId === wr.id ? 'Saving...' : 'Save feedback'}
                        </Button>
                      </div>
                    </div>
                  )}
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