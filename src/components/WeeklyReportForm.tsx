// src/components/WeeklyReportForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import type { IActionPlan, IReportFormInput } from '../types'; 
import type { SubmitHandler } from 'react-hook-form';
import { FaPaperPlane, FaTimes } from 'react-icons/fa';
import { Button } from './Button';

interface WeeklyReportFormProps {
    actionPlan: IActionPlan;
    onClose: () => void;
}

const WeeklyReportForm: React.FC<WeeklyReportFormProps> = ({ actionPlan, onClose }) => {
  // Thay thế useToast bằng console.log/alert đơn giản hoặc thư viện toast của bên thứ ba
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  
  const {
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<IReportFormInput>();

  const onSubmit: SubmitHandler<IReportFormInput> = async (values) => {
    setIsSubmitting(true);
    console.log('Dữ liệu Report gửi đi:', {
        ...values,
        step_id: actionPlan.id,
        goal_id: actionPlan.goal_id,
        report_date: new Date().toISOString().split('T')[0],
    });

    await new Promise((resolve) => setTimeout(resolve, 1500)); 

    alert(`Báo cáo cho Step ID ${actionPlan.id} đã được nộp thành công! (Mô phỏng)`);
    
    setIsSubmitting(false);
    reset();
    onClose();
  };
  
  // Custom Tailwind Input/Textarea component with error state
  const FormField: React.FC<{
      label: string; 
      name: keyof IReportFormInput & string; 
      isTextArea?: boolean; 
      isRequired?: boolean;
      rows?: number;
      placeholder?: string;
  }> = ({ label, name, isTextArea = false, isRequired = false, rows = 4, placeholder = '' }) => {
      const isInvalid = !!errors[name];
      
      const inputClasses = `w-full p-3 border rounded-lg focus:outline-none transition duration-150 
                            ${isInvalid 
                                ? 'border-red-500 focus:ring-2 focus:ring-red-500' 
                                : 'border-gray-300 focus:ring-2 focus:ring-brand'
                            } 
                            bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white`;
      
      const commonProps = {
          id: name,
          ...register(name, isRequired ? { required: 'Trường này là bắt buộc.' } : {}),
          placeholder: placeholder
      };

      return (
          <div className="space-y-1">
              <label htmlFor={name} className="block text-sm font-bold text-gray-700 dark:text-gray-200">
                  {label} {isRequired && <span className="text-brand">*</span>}
              </label>
              {isTextArea 
                ? <textarea {...commonProps} rows={rows} className={inputClasses} />
                : <input type="text" {...commonProps} className={inputClasses} />
              }
              {isInvalid && (
                  <p className="text-sm text-red-500 font-medium">
                      {errors[name]?.message || 'Lỗi dữ liệu nhập vào.'}
                  </p>
              )}
          </div>
      );
  };

  return (
    <div className="p-8 max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">Nộp Báo Cáo Tuần</h1>
      <p className="text-lg text-gray-500 mb-6">Cập nhật tiến độ cho Action Plan: **{actionPlan.activity}**</p>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          
          <FormField
            label="1. Công việc đã hoàn thành trong tuần"
            name="work_done"
            isTextArea={true}
            isRequired={true}
            rows={4}
            placeholder="Ví dụ: Hoàn thành 2/4 buổi học 1-1; Đã làm xong lab A, B."
          />

          <FormField
            label="2. Chỉ số tiến độ/Cập nhật"
            name="progress_update"
            isRequired={true}
            placeholder="Ví dụ: 60% tổng thể. Hoặc: Đã đạt B trong buổi mock meeting."
          />

          <FormField
            label="3. Blockers/Vấn đề đang gặp phải (Tùy chọn)"
            name="blockers_challenges"
            isTextArea={true}
            rows={3}
            placeholder="Ví dụ: Khó khăn trong việc sắp xếp thời gian; Cần TL hỗ trợ về..."
          />
          
          <FormField
            label="4. Kế hoạch cụ thể cho tuần tiếp theo"
            name="next_week_plan"
            isTextArea={true}
            isRequired={true}
            rows={4}
            placeholder="Ví dụ: Dành 4 tiếng để luyện tập giao tiếp; Chuẩn bị slide cho client meeting."
          />

          <div className="flex justify-end pt-4 space-x-4">
            <Button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              variant="secondary"
              className="flex items-center px-6 py-3"
            >
              <FaTimes className="mr-2" />
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="primary"
              className="flex items-center px-6 py-3"
            >
              <FaPaperPlane className="mr-2" />
              {isSubmitting ? 'Đang Gửi...' : 'Gửi Báo Cáo'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default WeeklyReportForm;