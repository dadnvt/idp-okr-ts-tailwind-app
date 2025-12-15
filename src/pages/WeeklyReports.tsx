import React, { useState } from 'react';
import Modal from '../common/Modal';
import type { IWeeklyReport } from '../types';

const mockWeeklyReports: IWeeklyReport[] = [
  {
    id: 'WR1',
    goal_id: 'G1',
    action_plan_id: 'AP1',
    date: '2025-11-01',
    summary: 'Hoàn thành 1 buổi mock meeting với TL',
    work_done: 'Được feedback tốt về phát âm',
    blockers_challenges: 'Thiếu thời gian chuẩn bị slide',
    next_week_plan: 'Chuẩn bị thêm 1 buổi mock meeting',
    lead_feedback: 'Tiến bộ rõ rệt, tiếp tục duy trì'
  },
  {
    id: 'WR2',
    goal_id: 'G1',
    action_plan_id: 'AP2',
    date: '2025-11-08',
    summary: 'Thực hiện thêm 1 buổi mock meeting',
    work_done: '',
    blockers_challenges: 'Cần cải thiện tốc độ nói',
    next_week_plan: 'Thực hành thêm với đồng đội',
    lead_feedback: 'Khá tốt, chú ý tốc độ'
  }
];

export default function WeeklyReportsPage() {
  const [selectedReport, setSelectedReport] = useState<IWeeklyReport | null>(null);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Weekly Reports</h1>
      <button
        className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark mb-6"
        onClick={() => setSelectedReport({} as IWeeklyReport)}
      >
        + Tạo Weekly Report
      </button>

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
          {mockWeeklyReports.map((report) => (
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
        </tbody>
      </table>

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
        ) : (
          <form className="space-y-4">
            <input className="w-full border p-2 rounded" placeholder="Ngày báo cáo" />
            <textarea className="w-full border p-2 rounded" placeholder="Tóm tắt" />
            <textarea className="w-full border p-2 rounded" placeholder="Công việc đã hoàn thành" />
            <textarea className="w-full border p-2 rounded" placeholder="Blockers/Vấn đề" />
            <textarea className="w-full border p-2 rounded" placeholder="Kế hoạch tuần tới" />
            <button className="bg-brand text-white px-4 py-2 rounded">Lưu</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
