interface IconProps {
  size?: number;
  className?: string;
}

const baseProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function WalletIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18a2 2 0 0 1 2 2v1" />
      <path d="M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1v-3" />
      <path d="M20 10h-4a3 3 0 0 0 0 6h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1Z" />
      <circle cx="16" cy="13" r=".6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CopyIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

export function CheckIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

export function RefreshIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M20 7v5h-5" />
      <path d="M4 17v-5h5" />
      <path d="M6.1 9a7 7 0 0 1 11.4-1.6L20 12" />
      <path d="M17.9 15a7 7 0 0 1-11.4 1.6L4 12" />
    </svg>
  );
}

export function ExternalIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M14 4h6v6" />
      <path d="m20 4-9 9" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

export function ArrowUpRightIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

export function ArrowDownLeftIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="m17 7-10 10" />
      <path d="M16 17H7V8" />
    </svg>
  );
}

export function SendIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="m21 3-7.5 18-3.2-7.3L3 10.5 21 3Z" />
      <path d="m10.3 13.7 4.2-4.2" />
    </svg>
  );
}

export function ShieldIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M12 3 5 6v5c0 4.4 2.9 8.2 7 9.5 4.1-1.3 7-5.1 7-9.5V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export function SparkIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M12 3c.6 4.7 2.3 6.4 7 7-4.7.6-6.4 2.3-7 7-.6-4.7-2.3-6.4-7-7 4.7-.6 6.4-2.3 7-7Z" />
    </svg>
  );
}

export function PlusIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function AlertIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...baseProps} width={size} height={size} className={className}>
      <path d="M12 3 2.8 19a1.4 1.4 0 0 0 1.2 2h16a1.4 1.4 0 0 0 1.2-2L12 3Z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="17" r=".7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function LogoMark({ size = 34 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="13" fill="currentColor" />
      <path
        d="M20 8.5c1.1 6.2 4.4 9.5 10.5 10.5-6.1 1.1-9.4 4.4-10.5 10.5-1.1-6.1-4.4-9.4-10.5-10.5C15.6 18 18.9 14.7 20 8.5Z"
        fill="#C9F56B"
      />
      <circle cx="29.5" cy="10.5" r="2" fill="#F7F3E9" />
    </svg>
  );
}
