// src/types/index.ts

export interface IGoal {
  id: string; 
  user_id: string;
  year: number;
  name: string; 
  user_email: string; 
  type: 'Hard' | 'Soft'; // Mục tiêu kỹ thuật hay kỹ năng mềm
  skill: string;
  specific: string; // Trong cấu trúc SMART
  measurable: string;
  achievable: string;
  relevant: string;
  start_date: string; 
  time_bound: string; // Hạn chót
  success_metric: string;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Cancelled' | 'Not started'; 
  weight: number; // Trọng số
  progress: number; // Tiến độ (%)
  risk: string;
  dependencies: string;
  notes: string;
  is_locked: boolean; // Trạng thái khóa (do Leader review)
  leader_review_notes: string; // Ghi chú đánh giá của Leader
  review_status: string;
  duration_type : string;
  actionPlans?: IActionPlan[];
}

export interface IActionPlan {
  id: string; // Step ID (ví dụ: 1.1, 1.2)
  goal_id: string;
  activity: string; // Hoạt động cụ thể
  owner: string;
  start_date: string;
  end_date: string;
  resources: string;
  expected_outcome: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
  evidence_link: string; // Đường link bằng chứng/tài liệu
  weeklyReports?: IWeeklyReport[];
}

export interface IWeeklyReport  {
  id : string,
  goal_id : string,
  action_plan_id: string,
  date : string,
  summary : string,
  work_done: string; // Công việc đã hoàn thành trong tuần
  blockers_challenges: string; // Các vấn đề/cản trở
  next_week_plan: string; // Kế hoạch cho tuần tiếp theo,
  lead_feedback : string;
}

interface IUser {
  id: string;
  email: string;
  role: 'member' | 'leader';
}