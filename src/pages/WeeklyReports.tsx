import React, { useEffect, useMemo, useState } from 'react';
import Modal from '../common/Modal';
import type { IActionPlan, IGoal, IWeeklyReport } from '../types';
import Sidebar from '../components/Sidebar';
import Dropdown from '../components/Dropdown';
import { YEAR_OPTIONS } from '../common/constants';
import { useAuth } from '../common/AuthContext';
import { fetchActionPlansByYear } from '../api/actionPlansApi';
import { fetchLeaderGoals } from '../api/leaderApi';
import { createWeeklyReport, fetchWeeklyReportsByActionPlan } from '../api/weeklyReportsApi';
import { Button } from '../components/Button';

export default function WeeklyReportsPage() {
  const { auth } = useAuth();
  const years = YEAR_OPTIONS;
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [goals, setGoals] = useState<IGoal[]>([]);
  const [selectedReport, setSelectedReport] = useState<IWeeklyReport | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedActionPlanId, setSelectedActionPlanId] = useState<string>('');
  const [reports, setReports] = useState<IWeeklyReport[]>([]);
  const [reportsOffset, setReportsOffset] = useState(0);
  const reportsLimit = 20;
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const allActionPlans: IActionPlan[] = useMemo(() => {
    return goals.flatMap((g) => g.action_plans || []);
  }, [goals]);

  // Direction B: weekly reports are loaded lazily per action plan (paged).

  const [createForm, setCreateForm] = useState<{
    action_plan_id: string;
    date: string;
    summary: string;
    work_done: string;
    blockers_challenges: string;
    next_week_plan: string;
  }>({
    action_plan_id: '',
    date: new Date().toISOString().slice(0, 10),
    summary: '',
    work_done: '',
    blockers_challenges: '',
    next_week_plan: '',
  });

  useEffect(() => {
    const load = async () => {
      if (!auth.token) return;
      if (auth.user?.role === 'leader') {
        const { result } = await fetchLeaderGoals(auth.token, { year: selectedYear, limit: 500, offset: 0 });
        setGoals(result.data);
      } else {
        const { result } = await fetchActionPlansByYear(auth.token, selectedYear);
        setGoals(result.data);
      }
    };
    load();
  }, [auth.token, auth.user?.role, selectedYear]);

  // Auto-select first action plan when the year/goals change
  useEffect(() => {
    if (!selectedActionPlanId && allActionPlans.length > 0) {
      setSelectedActionPlanId(allActionPlans[0].id);
      setReportsOffset(0);
    }
    if (allActionPlans.length === 0) {
      setSelectedActionPlanId('');
      setReports([]);
      setReportsOffset(0);
    }
  }, [allActionPlans, selectedActionPlanId]);

  // Load reports for selected action plan (paged)
  useEffect(() => {
    const loadReports = async () => {
      if (!auth.token) return;
      if (!selectedActionPlanId) return;
      setIsLoadingReports(true);
      try {
        const { res, result } = await fetchWeeklyReportsByActionPlan(auth.token, selectedActionPlanId, {
          limit: reportsLimit,
          offset: reportsOffset,
        });
        if (!res.ok) throw new Error(result.error || 'Fetch weekly reports failed');
        setReports(result.data);
      } catch (e) {
        console.error(e);
        setReports([]);
      } finally {
        setIsLoadingReports(false);
      }
    };
    loadReports();
  }, [auth.token, selectedActionPlanId, reportsOffset]);

  const actionPlanOptions = allActionPlans.map((p) => ({
    id: p.id,
    label: `${p.activity} (${p.id})`,
  }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!auth.token) return;
    if (!createForm.action_plan_id) return alert('Please select an Action Plan');

    const plan = allActionPlans.find((p) => p.id === createForm.action_plan_id);
    if (!plan) return alert('Invalid Action Plan');

    const payload = {
      goal_id: plan.goal_id,
      action_plan_id: plan.id,
      date: createForm.date,
      summary: createForm.summary,
      work_done: createForm.work_done,
      blockers_challenges: createForm.blockers_challenges,
      next_week_plan: createForm.next_week_plan,
      lead_feedback: '',
    };

    const { res, result } = await createWeeklyReport(auth.token, plan.id, payload);
    if (!res.ok) return alert(result.error || 'Create weekly report failed');

    // Reload first page for the selected plan so the new report appears (sorted by date desc)
    setSelectedActionPlanId(plan.id);
    setReportsOffset(0);

    setIsCreateOpen(false);
    setCreateForm((f) => ({
      ...f,
      summary: '',
      work_done: '',
      blockers_challenges: '',
      next_week_plan: '',
    }));
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Weekly Reports</h1>

        <div className="flex items-end justify-between gap-4 mb-6">
          <Dropdown
            label="Year"
            value={selectedYear}
            options={years}
            onChange={setSelectedYear}
          />

          <Button onClick={() => setIsCreateOpen(true)} variant="primary">
            + Tạo Weekly Report
          </Button>
        </div>
      <button
        className="hidden"
        onClick={() => null}
      />

        <div className="flex flex-wrap gap-4 items-end mb-4">
          <div className="min-w-[280px]">
            <label className="block text-sm font-medium mb-1">Action Plan</label>
            <select
              className="w-full border p-2 rounded"
              value={selectedActionPlanId}
              onChange={(e) => {
                setSelectedActionPlanId(e.target.value);
                setReportsOffset(0);
              }}
            >
              {actionPlanOptions.length === 0 && <option value="">-- No action plans --</option>}
              {actionPlanOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-gray-500">
            Page size: {reportsLimit}
          </div>
        </div>

        <table className="w-full bg-white shadow rounded">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Summary</th>
              <th className="p-3 text-left">Work Done</th>
              <th className="p-3 text-left">Blockers</th>
              <th className="p-3 text-left">Next Week</th>
              <th className="p-3 text-left">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr
                key={report.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedReport(report)}
              >
                <td className="p-3">{report.date}</td>
                <td className="p-3">{report.summary}</td>
                <td className="p-3">
                  {report.work_done || <span className="text-gray-400 italic">Chưa cập nhật</span>}
                </td>
                <td className="p-3">{report.blockers_challenges}</td>
                <td className="p-3">{report.next_week_plan}</td>
                <td className="p-3">{report.lead_feedback}</td>
              </tr>
            ))}
            {!isLoadingReports && reports.length === 0 && (
              <tr>
                <td className="p-3 text-gray-400 italic" colSpan={6}>
                  No weekly reports for this action plan.
                </td>
              </tr>
            )}
            {isLoadingReports && (
              <tr>
                <td className="p-3 text-gray-400 italic" colSpan={6}>
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between mt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={reportsOffset === 0 || isLoadingReports}
            onClick={() => setReportsOffset((o) => Math.max(0, o - reportsLimit))}
          >
            Prev
          </Button>
          <div className="text-xs text-gray-500">
            Offset: {reportsOffset}
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={reports.length < reportsLimit || isLoadingReports}
            onClick={() => setReportsOffset((o) => o + reportsLimit)}
          >
            Next
          </Button>
        </div>

      <Modal
        isOpen={!!selectedReport}
        title={selectedReport?.id ? "Chi tiết Weekly Report" : "Thêm Weekly Report"}
        onClose={() => setSelectedReport(null)}
      >
        {selectedReport?.id ? (
          <div className="space-y-2">
            <p><strong>Ngày:</strong> {selectedReport.date}</p>
            <p><strong>Tóm tắt:</strong> {selectedReport.summary}</p>
            <p><strong>Công việc đã hoàn thành:</strong> {selectedReport.work_done || 'Chưa cập nhật'}</p>
            <p><strong>Blockers/Vấn đề:</strong> {selectedReport.blockers_challenges}</p>
            <p><strong>Kế hoạch tuần tới:</strong> {selectedReport.next_week_plan}</p>
            <p><strong>Feedback Leader:</strong> {selectedReport.lead_feedback}</p>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isCreateOpen}
        title="Thêm Weekly Report"
        onClose={() => setIsCreateOpen(false)}
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          <div>
            <label className="block text-sm font-medium mb-1">Action Plan</label>
            <select
              className="w-full border p-2 rounded"
              value={createForm.action_plan_id}
              onChange={(e) => setCreateForm((f) => ({ ...f, action_plan_id: e.target.value }))}
            >
              <option value="">-- Select action plan --</option>
              {actionPlanOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <input
            className="w-full border p-2 rounded"
            type="date"
            value={createForm.date}
            onChange={(e) => setCreateForm((f) => ({ ...f, date: e.target.value }))}
          />
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Tóm tắt"
            value={createForm.summary}
            onChange={(e) => setCreateForm((f) => ({ ...f, summary: e.target.value }))}
          />
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Công việc đã hoàn thành"
            value={createForm.work_done}
            onChange={(e) => setCreateForm((f) => ({ ...f, work_done: e.target.value }))}
          />
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Blockers/Vấn đề"
            value={createForm.blockers_challenges}
            onChange={(e) => setCreateForm((f) => ({ ...f, blockers_challenges: e.target.value }))}
          />
          <textarea
            className="w-full border p-2 rounded"
            placeholder="Kế hoạch tuần tới"
            value={createForm.next_week_plan}
            onChange={(e) => setCreateForm((f) => ({ ...f, next_week_plan: e.target.value }))}
          />
          <Button type="submit" variant="primary">
            Lưu
          </Button>
        </form>
      </Modal>
      </main>
    </div>
  );
}
