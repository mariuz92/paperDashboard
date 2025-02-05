// MonthPicker.tsx
import React from "react";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";

export interface MonthPickerProps {
  value: Dayjs;
  onChange: (date: Dayjs) => void; // Changed here to require Dayjs only
}

const MonthPicker: React.FC<MonthPickerProps> = ({ value, onChange }) => {
  return (
    <DatePicker
      picker='month'
      style={{ width: "100%" }}
      value={value}
      onChange={(newVal) => onChange(newVal || dayjs())} // newVal is still Dayjs | null so we force it
    />
  );
};

export default MonthPicker;
