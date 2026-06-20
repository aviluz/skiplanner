import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Select מותאם RTL:
 * - טקסט מיושר לימין
 * - החץ בצד שמאל (flex-row-reverse)
 * - הרשימה נפתחת עם גלילה פנימית
 * - התפריט מתהפך אוטומטית כשאין מקום למטה
 */
export default function RtlSelect({
  id,
  value,
  onValueChange,
  options = [],
  placeholder = "בחר/י...",
  disabled = false,
  className = "",
}) {
  return (
    <Select
      dir="rtl"
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className={`
          h-12 
          text-right 
          justify-between 
          flex-row-reverse
          pr-3 
          pl-10
          ${className}
        `}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent
        position="popper"
        sideOffset={6}
        align="end"
        avoidCollisions
        className="text-right rtl:text-right max-h-72 overflow-y-auto p-0"
      >
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="justify-end text-right rtl:text-right cursor-pointer"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}