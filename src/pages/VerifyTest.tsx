import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Modal from '../common/Modal';
import Dropdown from '../components/Dropdown';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { useAuth } from '../common/AuthContext';
import type { IActionPlan, IGoal } from '../types';
import { YEAR_OPTIONS } from '../common/constants';
import { fetchActionPlansByYear } from '../api/actionPlansApi';
import { fetchLeaderGoals } from '../api/leaderApi';
import { fetchLeaderUsers, type LeaderUser } from '../api/usersApi';
import { fetchLeaderTeams, type LeaderTeam } from '../api/teamsApi';
import {
  createVerificationRequest,
  fetchVerificationRequests,
  fetchVerificationRequestById,
  fetchVerificationTemplates,
  reviewVerificationRequest,
  type VerificationRequestRow,
  type VerificationTemplate,
} from '../api/verificationsApi';

type ReviewResult = 'Pass' | 'NeedsWork' | 'Fail';

export default function VerifyTestPage() {
  const { auth } = useAuth();
  const isLeader = auth.user?.role === 'leader';

  const years = YEAR_OPTIONS;
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [goals, setGoals] = useState<IGoal[]>([]);
  const [templates, setTemplates] = useState<VerificationTemplate[]>([]);

  // Leader queue
  const [teams, setTeams] = useState<LeaderTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('All');
  const [leaderUsers, setLeaderUsers] = useState<LeaderUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('Pending');
  const [requests, setRequests] = useState<VerificationRequestRow[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequestRow | null>(null);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState<VerificationRequestRow | null>(null);
  const [isLoadingSelected, setIsLoadingSelected] = useState(false);

  // Member submit
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [selectedActionPlanId, setSelectedActionPlanId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('Custom');
  const [scope, setScope] = useState<string>('');
  const [memberNotes, setMemberNotes] = useState<string>('');
  const [evidenceDraft, setEvidenceDraft] = useState<string>('');
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>([]);

  // Leader review form
  const [reviewResult, setReviewResult] = useState<ReviewResult>('NeedsWork');
  const [leaderFeedback, setLeaderFeedback] = useState<string>('');
  const [scores, setScores] = useState<Record<string, number>>({});

  const goalOptions = useMemo(() => {
    return goals.map((g) => ({ id: g.id, label: g.name }));
  }, [goals]);

  const selectedGoal = useMemo(() => goals.find((g) => g.id === selectedGoalId) || null, [goals, selectedGoalId]);
  const actionPlanOptions = useMemo(() => {
    const plans = (selectedGoal?.action_plans || []) as IActionPlan[];
    const truncate = (s: string, max = 60) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);
    return plans.map((p) => ({ id: p.id, label: truncate(p.activity || '', 60) }));
  }, [selectedGoal]);

  const templateOptions = useMemo(() => {
    return [
      { id: 'Custom', label: 'Custom (no template)' },
      ...templates.map((t) => ({ id: t.id, label: `${t.name}${t.category ? ` • ${t.category}` : ''}` })),
    ];
  }, [templates]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId) || null,
    [templates, selectedTemplateId]
  );

  type NormalizedCriterion = { id: string; label: string; description?: string; weight: number };
  const normalizeCriteria = (criteriaLike: unknown): NormalizedCriterion[] => {
    const arr = Array.isArray(criteriaLike) ? criteriaLike : [];
    return arr
      .map((c: any, idx: number) => ({
        id: String(c?.id || `c${idx + 1}`),
        label: String(c?.label || `Criteria ${idx + 1}`),
        description: typeof c?.description === 'string' ? c.description : '',
        weight: typeof c?.weight === 'number' && Number.isFinite(c.weight) ? c.weight : 1,
      }))
      .filter((c) => c.id && c.label);
  };

  const rubricCriteria = useMemo(() => normalizeCriteria(selectedTemplate?.criteria), [selectedTemplate]);

  const requiredEvidence = useMemo(() => {
    if (!selectedTemplate || selectedTemplateId === 'Custom') return [];
    return Array.isArray(selectedTemplate.required_evidence) ? selectedTemplate.required_evidence : [];
  }, [selectedTemplate, selectedTemplateId]);

  const requiredEvidenceCount = useMemo(() => {
    return requiredEvidence.filter((e) => e && (e as any).required !== false).length;
  }, [requiredEvidence]);

  // Load templates (all roles)
  useEffect(() => {
    const load = async () => {
      if (!auth.token) return;
      const { res, result } = await fetchVerificationTemplates(auth.token);
      if (!res.ok) return;
      setTemplates(result.data);
    };
    load();
  }, [auth.token]);

  // Load goals/action plans for member OR leader goals list (used only for member submit dropdown)
  useEffect(() => {
    const load = async () => {
      if (!auth.token) return;
      if (isLeader) {
        // Not required for leader queue; keep empty.
        setGoals([]);
        return;
      }
      const { res, result } = await fetchActionPlansByYear(auth.token, selectedYear);
      if (!res.ok) return;
      setGoals(result.data);
    };
    load();
  }, [auth.token, isLeader, selectedYear]);

  // Leader: load teams (team-scoped by backend)
  useEffect(() => {
    const load = async () => {
      if (!auth.token) return;
      if (!isLeader) return;
      const { res, result } = await fetchLeaderTeams(auth.token);
      if (!res.ok) return;
      setTeams(result.data);
    };
    load();
  }, [auth.token, isLeader]);

  // Leader: load members (filtered by selected team)
  useEffect(() => {
    const load = async () => {
      if (!auth.token) return;
      if (!isLeader) return;
      const teamId = selectedTeamId !== 'All' ? selectedTeamId : undefined;
      const { res, result } = await fetchLeaderUsers(auth.token, { teamId, limit: 500, offset: 0 });
      if (!res.ok) return;
      setLeaderUsers(result.data);

      if (selectedUserId !== 'All') {
        const exists = (result.data || []).some((u) => u.id === selectedUserId);
        if (!exists) setSelectedUserId('All');
      }
    };
    load();
  }, [auth.token, isLeader, selectedTeamId, selectedUserId]);

  // Leader: load queue
  useEffect(() => {
    const load = async () => {
      if (!auth.token) return;
      const teamId = isLeader && selectedTeamId !== 'All' ? selectedTeamId : undefined;
      const params = isLeader
        ? {
            year: selectedYear,
            status: statusFilter,
            teamId,
            userId: selectedUserId !== 'All' ? selectedUserId : undefined,
          }
        : { year: selectedYear };
      const { res, result } = await fetchVerificationRequests(auth.token, params);
      if (!res.ok) return;
      setRequests(result.data);
    };
    load();
  }, [auth.token, isLeader, selectedYear, statusFilter, selectedUserId, selectedTeamId]);

  // Reset create modal state when opened
  useEffect(() => {
    if (!isCreateOpen) return;
    setSelectedGoalId('');
    setSelectedActionPlanId('');
    setSelectedTemplateId('Custom');
    setScope('');
    setMemberNotes('');
    setEvidenceDraft('');
    setEvidenceLinks([]);
  }, [isCreateOpen]);

  // If user selected a template and hasn't filled scope yet, default scope to template name.
  useEffect(() => {
    if (selectedTemplateId === 'Custom') return;
    if (!selectedTemplate) return;
    if (!scope.trim()) setScope(selectedTemplate.name);
  }, [selectedTemplateId, selectedTemplate]); // intentionally not depending on scope

  // When switching goal, clear action plan
  useEffect(() => {
    setSelectedActionPlanId('');
  }, [selectedGoalId]);

  // When template changes, reset scoring map (leader)
  useEffect(() => {
    const next: Record<string, number> = {};
    for (const c of rubricCriteria) next[c.id] = 0;
    setScores(next);
  }, [rubricCriteria]);

  // Leader: derive rubric/evidence from the selected request (snapshot first, fallback to template)
  const reviewCriteria = useMemo(() => {
    const req = selectedRequestDetail || selectedRequest;
    if (!req) return [];
    const snap = req.rubric_snapshot as any;
    const snapCriteria = snap?.criteria;
    if (Array.isArray(snapCriteria) && snapCriteria.length > 0) return normalizeCriteria(snapCriteria);
    const tpl = templates.find((t) => t.id === req.template_id);
    return normalizeCriteria(tpl?.criteria);
  }, [selectedRequest, selectedRequestDetail, templates]);

  const reviewRequiredEvidence = useMemo(() => {
    const req = selectedRequestDetail || selectedRequest;
    if (!req) return [];
    const snap = req.rubric_snapshot as any;
    const snapEv = snap?.required_evidence;
    if (Array.isArray(snapEv) && snapEv.length > 0) return snapEv;
    const tpl = templates.find((t) => t.id === req.template_id);
    return Array.isArray(tpl?.required_evidence) ? tpl!.required_evidence : [];
  }, [selectedRequest, selectedRequestDetail, templates]);

  const reviewMinimumBar = useMemo(() => {
    const req = selectedRequestDetail || selectedRequest;
    if (!req) return null;
    const snap = req.rubric_snapshot as any;
    return snap?.minimum_bar ?? null;
  }, [selectedRequest, selectedRequestDetail]);

  const reviewScoreSummary = useMemo(() => {
    if (reviewCriteria.length === 0) return { weighted: 0, maxWeighted: 0, avg: 0 };
    let weighted = 0;
    let maxWeighted = 0;
    for (const c of reviewCriteria) {
      const v = Number(scores[c.id] ?? 0);
      const w = c.weight || 1;
      weighted += v * w;
      maxWeighted += 5 * w;
    }
    const avg = maxWeighted > 0 ? (weighted / maxWeighted) * 5 : 0;
    return { weighted, maxWeighted, avg: Number(avg.toFixed(2)) };
  }, [reviewCriteria, scores]);

  // Initialize review form when opening a request
  useEffect(() => {
    const req = selectedRequestDetail || selectedRequest;
    if (!req) return;
    // If already reviewed, try to prefill from existing review
    const existing = (req.verification_reviews || [])[0] as any;
    if (existing?.result && ['Pass', 'NeedsWork', 'Fail'].includes(existing.result)) {
      setReviewResult(existing.result as ReviewResult);
    } else {
      setReviewResult('NeedsWork');
    }
    setLeaderFeedback(typeof existing?.leader_feedback === 'string' ? existing.leader_feedback : '');

    const nextScores: Record<string, number> = {};
    const existingScores = existing?.scores && typeof existing.scores === 'object' ? existing.scores : {};
    for (const c of reviewCriteria) {
      const raw = (existingScores as any)[c.id];
      nextScores[c.id] = typeof raw === 'number' ? raw : 0;
    }
    setScores(nextScores);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRequest?.id, selectedRequestDetail?.id, reviewCriteria.length]);

  // Fetch full request detail when opening the modal (includes verification_reviews)
  useEffect(() => {
    const load = async () => {
      if (!auth.token) return;
      if (!selectedRequest?.id) {
        setSelectedRequestDetail(null);
        return;
      }
      setIsLoadingSelected(true);
      try {
        const { res, result } = await fetchVerificationRequestById(auth.token, selectedRequest.id);
        if (!res.ok) throw new Error(result.error || 'Fetch request failed');
        setSelectedRequestDetail(result.data);
      } catch (e) {
        console.error(e);
        setSelectedRequestDetail(null);
      } finally {
        setIsLoadingSelected(false);
      }
    };
    load();
  }, [auth.token, selectedRequest?.id]);

  const memberOptions = useMemo(
    () => [{ id: 'All', label: 'All members' }, ...leaderUsers.map((u) => ({ id: u.id, label: u.name || u.email || u.id }))],
    [leaderUsers]
  );

  const teamOptions = useMemo(
    () => [{ id: 'All', label: 'All teams' }, ...teams.map((t) => ({ id: t.id, label: t.name }))],
    [teams]
  );

  async function submitRequest() {
    if (!auth.token) return;
    if (!selectedGoalId) return alert('Please select a goal');
    if (!scope.trim()) return alert('Please enter scope');
    if (selectedTemplateId !== 'Custom' && requiredEvidenceCount > 0 && evidenceLinks.length < requiredEvidenceCount) {
      return alert(`Please add at least ${requiredEvidenceCount} evidence link(s) for the selected template.`);
    }

    const snapshot =
      selectedTemplate && selectedTemplateId !== 'Custom'
        ? {
            template_id: selectedTemplate.id,
            name: selectedTemplate.name,
            criteria: selectedTemplate.criteria,
            required_evidence: selectedTemplate.required_evidence,
            scoring_type: selectedTemplate.scoring_type,
          }
        : {};

    const { res, result } = await createVerificationRequest(auth.token, {
      goal_id: selectedGoalId,
      action_plan_id: selectedActionPlanId || null,
      template_id: selectedTemplateId !== 'Custom' ? selectedTemplateId : null,
      scope: scope.trim(),
      evidence_links: evidenceLinks,
      member_notes: memberNotes.trim() || null,
      rubric_snapshot: snapshot,
    });

    if (!res.ok) return alert(result.error || 'Submit failed');
    setIsCreateOpen(false);
    // refresh list (member view)
    const { res: r2, result: rr2 } = await fetchVerificationRequests(auth.token, { year: selectedYear });
    if (r2.ok) setRequests(rr2.data);
  }

  async function submitReview() {
    if (!auth.token) return;
    if (!selectedRequest) return;

    const { res, result } = await reviewVerificationRequest(auth.token, selectedRequest.id, {
      result: reviewResult,
      scores,
      leader_feedback: leaderFeedback,
    });
    if (!res.ok) return alert(result.error || 'Review failed');
    setSelectedRequest(null);
    setSelectedRequestDetail(null);

    const { res: r2, result: rr2 } = await fetchVerificationRequests(auth.token, {
      year: selectedYear,
      status: statusFilter,
      userId: selectedUserId !== 'All' ? selectedUserId : undefined,
    });
    if (r2.ok) setRequests(rr2.data);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Verify Test</h1>

        <div className="flex flex-wrap gap-4 items-end mb-6">
          <Dropdown label="Year" value={selectedYear} options={years} onChange={(v) => setSelectedYear(Number(v))} />
          {isLeader ? (
            <>
              <Dropdown label="Status" value={statusFilter} options={['Pending', 'Reviewed', 'Cancelled']} onChange={setStatusFilter} />
              <Dropdown label="Team" value={selectedTeamId} options={teamOptions} onChange={(v) => setSelectedTeamId(String(v))} />
              <Dropdown label="Member" value={selectedUserId} options={memberOptions} onChange={(v) => setSelectedUserId(String(v))} />
            </>
          ) : (
            <Button variant="primary" onClick={() => setIsCreateOpen(true)}>
              + Request verification
            </Button>
          )}
        </div>

        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <h2 className="font-semibold">{isLeader ? 'Verification queue' : 'My verification requests'}</h2>
              <p className="text-xs text-gray-500">{requests.length} items</p>
            </div>
            <div className="flex items-center gap-2">
              {!isLeader && (
                <Button variant="secondary" size="sm" onClick={() => setIsCreateOpen(true)}>
                  New
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  if (!auth.token) return;
                  const teamId = isLeader && selectedTeamId !== 'All' ? selectedTeamId : undefined;
                  const params = isLeader
                    ? {
                        year: selectedYear,
                        status: statusFilter,
                        teamId,
                        userId: selectedUserId !== 'All' ? selectedUserId : undefined,
                      }
                    : { year: selectedYear };
                  const { res, result } = await fetchVerificationRequests(auth.token, params);
                  if (res.ok) setRequests(result.data);
                }}
              >
                Refresh
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {isLeader && <th className="p-3 text-left">Member</th>}
                  {isLeader && <th className="p-3 text-left">Team</th>}
                  <th className="p-3 text-left">Goal</th>
                  <th className="p-3 text-left">Scope</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-t">
                    {isLeader && <td className="p-3">{r.member_name || r.member_email || r.requester_id}</td>}
                    {isLeader && <td className="p-3">{r.team_name || '-'}</td>}
                    <td className="p-3">{r.goal?.name || r.goal_id}</td>
                    <td className="p-3">{r.scope}</td>
                    <td className="p-3">{r.status}</td>
                    <td className="p-3">{(r.created_at || '').slice(0, 10)}</td>
                    <td className="p-3">
                      <Button variant="secondary" size="sm" onClick={() => {
                        setSelectedRequest(r);
                      }}>
                        {isLeader ? 'Review' : 'View'}
                      </Button>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td className="p-3 text-gray-500 italic" colSpan={isLeader ? 7 : 5}>
                      No items.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member create modal */}
        <Modal isOpen={isCreateOpen} title="Request verification" onClose={() => setIsCreateOpen(false)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Dropdown
              label="Goal"
              value={selectedGoalId}
              options={[{ id: '', label: '-- Select goal --' }, ...goalOptions]}
              onChange={(v) => setSelectedGoalId(String(v))}
            />
            <Dropdown
              label="Action plan (optional)"
              value={selectedActionPlanId}
              options={[{ id: '', label: '-- None --' }, ...actionPlanOptions]}
              onChange={(v) => setSelectedActionPlanId(String(v))}
              disabled={!selectedGoalId}
            />
            <Dropdown
              label="Template"
              value={selectedTemplateId}
              options={templateOptions}
              onChange={(v) => setSelectedTemplateId(String(v))}
            />
            <Input
              label="Scope"
              value={scope}
              onChange={setScope}
              placeholder="e.g. Speaking B1 / AWS SAA domain 1-2 / Client F2F"
            />
          </div>

          {selectedTemplateId !== 'Custom' && selectedTemplate && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border rounded p-3">
                <div className="font-semibold text-sm mb-2">Rubric preview</div>
                <div className="space-y-2 text-sm">
                  {rubricCriteria.length === 0 && (
                    <div className="text-gray-500 italic">No criteria configured for this template.</div>
                  )}
                  {rubricCriteria.map((c) => (
                    <div key={c.id}>
                      <div className="font-medium">{c.label}</div>
                      {c.description ? <div className="text-xs text-gray-500">{c.description}</div> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border rounded p-3">
                <div className="font-semibold text-sm mb-2">Required evidence</div>
                <div className="space-y-2 text-sm">
                  {requiredEvidence.length === 0 && (
                    <div className="text-gray-500 italic">No required evidence configured.</div>
                  )}
                  {requiredEvidence.map((e, idx) => (
                    <div key={`${(e as any).type || 'e'}-${idx}`} className="flex items-start justify-between gap-3">
                      <div className="text-gray-700">
                        {(e as any).label || (e as any).type || `Evidence ${idx + 1}`}
                      </div>
                      <div className="text-xs text-gray-500 font-semibold">
                        {(e as any).required === false ? 'optional' : 'required'}
                      </div>
                    </div>
                  ))}
                  {requiredEvidenceCount > 0 && (
                    <div className="text-xs text-gray-500 pt-1">
                      Minimum links to attach: <span className="font-semibold">{requiredEvidenceCount}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-3">
            <Textarea
              label="Member notes (optional)"
              value={memberNotes}
              onChange={setMemberNotes}
              placeholder="What do you want the leader to verify? Any context?"
            />

            <div className="border rounded p-3">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label="Evidence link"
                    value={evidenceDraft}
                    onChange={setEvidenceDraft}
                    placeholder="https://... (repo/cert/recording/score)"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const v = evidenceDraft.trim();
                    if (!v) return;
                    setEvidenceLinks((prev) => [...prev, v]);
                    setEvidenceDraft('');
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {evidenceLinks.map((l, idx) => (
                  <div key={`${l}-${idx}`} className="flex items-center justify-between gap-3">
                    <div className="text-gray-700 truncate">{l}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEvidenceLinks((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {evidenceLinks.length === 0 && <div className="text-gray-500 italic">No evidence links yet.</div>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitRequest}>
              Submit request
            </Button>
          </div>
        </Modal>

        {/* Leader review / view modal */}
        <Modal
          isOpen={!!selectedRequest}
          title={isLeader ? 'Review verification' : 'Verification request'}
          onClose={() => {
            setSelectedRequest(null);
            setSelectedRequestDetail(null);
          }}
        >
          {selectedRequest && (
            <div className="space-y-4">
              {isLoadingSelected && <div className="text-sm text-gray-500 italic">Loading details...</div>}
              {(() => {
                const req = selectedRequestDetail || selectedRequest;
                const existing = (req.verification_reviews || [])[0] as any;
                const hasReview = !!existing?.id;

                return (
                  <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {isLeader && (
                  <div className="text-sm">
                    <div className="text-gray-500">Member</div>
                    <div className="font-semibold">{req.member_name || req.member_email || req.requester_id}</div>
                    <div className="text-gray-500 text-xs">{req.team_name || '-'}</div>
                  </div>
                )}
                <div className="text-sm">
                  <div className="text-gray-500">Goal</div>
                  <div className="font-semibold">{req.goal?.name || req.goal_id}</div>
                </div>
              </div>

              <div className="text-sm">
                <div className="text-gray-500">Scope</div>
                <div className="font-medium">{req.scope}</div>
              </div>

              <div className="text-sm">
                <div className="text-gray-500">Evidence</div>
                <div className="space-y-1">
                  {(req.evidence_links || []).map((l, i) => (
                    <a
                      key={`${l}-${i}`}
                      href={l}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-blue-700 hover:underline"
                      title={l}
                    >
                      {l}
                    </a>
                  ))}
                  {(req.evidence_links || []).length === 0 && (
                    <div className="text-gray-500 italic">No evidence provided.</div>
                  )}
                </div>
              </div>

              {req.member_notes ? (
                <div className="text-sm">
                  <div className="text-gray-500">Member notes</div>
                  <div className="text-gray-700 whitespace-pre-wrap">{req.member_notes}</div>
                </div>
              ) : null}

              {isLeader && reviewRequiredEvidence.length > 0 ? (
                <div className="text-sm border rounded p-3 bg-white">
                  <div className="text-gray-700 font-semibold mb-2">Evidence checklist</div>
                  <div className="space-y-2">
                    {reviewRequiredEvidence.map((e: any, idx: number) => (
                      <div key={`${e?.type || 'e'}-${idx}`} className="flex items-start justify-between gap-3">
                        <div className="text-gray-700">
                          {e?.label || e?.type || `Evidence ${idx + 1}`}
                          <span className="text-xs text-gray-400"> {e?.required === false ? '(optional)' : '(required)'}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {(req.evidence_links || []).length > 0 ? 'attached' : 'missing'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Member (and leader) can see the latest review result */}
              {hasReview && (
                <div className="border rounded p-3 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">Leader review result</div>
                    <div className="text-xs text-gray-500">{(existing.reviewed_at || '').slice(0, 10)}</div>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Result:</span>{' '}
                    <span className="font-semibold">{existing.result}</span>
                  </div>
                  {existing.leader_feedback ? (
                    <div className="text-sm">
                      <div className="text-gray-500">Feedback</div>
                      <div className="text-gray-700 whitespace-pre-wrap">{existing.leader_feedback}</div>
                    </div>
                  ) : null}

                  {existing.scores && typeof existing.scores === 'object' && reviewCriteria.length > 0 ? (
                    <div className="text-sm">
                      <div className="text-gray-500 mb-1">Scores</div>
                      <div className="space-y-1">
                        {reviewCriteria.map((c) => (
                          <div key={c.id} className="flex items-center justify-between gap-3">
                            <div className="text-gray-700">{c.label}</div>
                            <div className="font-semibold text-gray-600">
                              {typeof (existing.scores as any)[c.id] === 'number' ? (existing.scores as any)[c.id] : '—'}/5
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {isLeader && (
                <div className="space-y-3 border rounded p-3 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Dropdown
                      label="Result"
                      value={reviewResult}
                      options={['Pass', 'NeedsWork', 'Fail']}
                      onChange={(v) => setReviewResult(v as ReviewResult)}
                    />
                    <div className="text-sm">
                      <div className="text-gray-500">Score (weighted)</div>
                      <div className="font-semibold">
                        {reviewCriteria.length === 0
                          ? '—'
                          : `${reviewScoreSummary.weighted.toFixed(1)}/${reviewScoreSummary.maxWeighted.toFixed(1)} (avg ${reviewScoreSummary.avg}/5)`}
                      </div>
                      {reviewMinimumBar ? (
                        <div className="text-xs text-gray-500">Min bar: {JSON.stringify(reviewMinimumBar)}</div>
                      ) : null}
                    </div>
                  </div>

                  {reviewCriteria.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Rubric</div>
                      {reviewCriteria.map((c) => (
                        <div key={c.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                          <div className="md:col-span-2">
                            <div className="text-sm font-medium">{c.label}</div>
                            {c.description ? <div className="text-xs text-gray-500">{c.description}</div> : null}
                          </div>
                          <Dropdown
                            label="Score"
                            value={scores[c.id] ?? 0}
                            options={[0, 1, 2, 3, 4, 5]}
                            onChange={(v) =>
                              setScores((prev) => ({ ...prev, [c.id]: Number(v) }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <Textarea label="Leader feedback" value={leaderFeedback} onChange={setLeaderFeedback} />

                  <div className="flex justify-end">
                    <Button variant="primary" onClick={submitReview}>
                      Submit review
                    </Button>
                  </div>
                </div>
              )}
                  </>
                );
              })()}
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}


