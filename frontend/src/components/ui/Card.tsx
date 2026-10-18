import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-lightBorder shadow-subtle ${
        hoverEffect ? "transition-all duration-200 hover:shadow-md hover:border-sageAccent hover:-translate-y-0.5 cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = "" }) => (
  <div className={`p-5 pb-3 border-b border-lightBorder flex items-start justify-between ${className}`}>
    <div>
      <h3 className="text-base font-bold text-darkGreen">{title}</h3>
      {subtitle && <p className="text-xs text-darkGreen font-medium mt-0.5">{subtitle}</p>}
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);
