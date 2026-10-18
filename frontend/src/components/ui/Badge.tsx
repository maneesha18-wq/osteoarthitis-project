import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "grade0" | "grade1" | "grade2" | "grade3" | "grade4" | "success" | "warning" | "danger" | "neutral" | "teal";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}) => {
  const variants = {
    grade0: "bg-softBg text-darkGreen border-lightBorder",
    grade1: "bg-[#EAF1EA] text-darkGreen-light border-lightSage",
    grade2: "bg-lightSage text-darkGreen border-sageAccent/50 font-medium",
    grade3: "bg-[#BCD1BE] text-darkGreen border-sageAccent font-medium",
    grade4: "bg-darkGreen text-white border-darkGreen font-medium",
    success: "bg-[#EAF1EA] text-darkGreen border-lightSage",
    warning: "bg-lightSage text-darkGreen border-sageAccent",
    danger: "bg-darkGreen text-white border-darkGreen",
    neutral: "bg-softBg text-darkGreen border-lightBorder",
    teal: "bg-lightSage text-darkGreen border-sageAccent/40",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs font-medium",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const getGradeBadgeVariant = (grade: number): "grade0" | "grade1" | "grade2" | "grade3" | "grade4" => {
  switch (grade) {
    case 0:
      return "grade0";
    case 1:
      return "grade1";
    case 2:
      return "grade2";
    case 3:
      return "grade3";
    case 4:
      return "grade4";
    default:
      return "grade0";
  }
};

export const KL_GRADE_DETAILS: Record<
  number,
  { label: string; severity: string; description: string; color: string }
> = {
  0: {
    label: "Grade 0",
    severity: "None / Normal",
    description: "No radiographic evidence of osteoarthritis. Joint space normal, no osteophytes.",
    color: "#10B981",
  },
  1: {
    label: "Grade 1",
    severity: "Doubtful",
    description: "Doubtful joint space narrowing and possible osteophytic lipping.",
    color: "#0EA5E9",
  },
  2: {
    label: "Grade 2",
    severity: "Mild",
    description: "Definite osteophytes present, possible mild joint space narrowing.",
    color: "#F59E0B",
  },
  3: {
    label: "Grade 3",
    severity: "Moderate",
    description: "Multiple moderate osteophytes, definite joint space narrowing, some sclerosis.",
    color: "#F97316",
  },
  4: {
    label: "Grade 4",
    severity: "Severe",
    description: "Large osteophytes, marked joint space narrowing, severe bone sclerosis and deformity.",
    color: "#EF4444",
  },
};
