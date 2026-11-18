import type { SVGProps } from "react";

const shapes = {
  arrow: <><path d="M4 12h15"/><path d="m13 6 6 6-6 6"/></>,
  back: <><path d="M20 12H5"/><path d="m11 6-6 6 6 6"/></>,
  external: <><path d="M13 5h6v6m0-6-9 9"/><path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></>,
  info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8h.01"/></>,
  nest: <><path d="M3 16c2 4 5 5 9 5s7-1 9-5M2 15c6 2 14 2 20 0"/><path d="M7 15C4 13 7 5 9 5c3 0 5 8 2 10m2 0c-2-2 0-7 2-7s4 5 2 7"/></>,
  egg: <><path d="M5 14c0-5 4-11 7-11s7 6 7 11a7 7 0 0 1-14 0Z"/><path d="m6 10 4 3 3-3 5 3"/></>,
  steps: <><path d="M6 17c-1-2 0-4 1-5 2-1 4 0 4 2 0 3-4 6-5 3Zm8-7c-1-2 0-4 1-5 2-1 4 0 4 2 0 3-4 6-5 3Z"/><path d="m5 21 2-1m6-7 2-1"/></>,
  waves: <><path d="M2 7c3 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2M2 12c3 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2M2 17c3 0 3-2 5-2s3 2 5 2 3-2 5-2 3 2 5 2"/></>,
  chat: <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5c-1.2 0-2.3-.2-3.3-.7L4 20l1.5-4.4a7.5 7.5 0 1 1 14.5-4.1Z"/>,
  raven: <><path d="M3 21c3-1 5-4 6-7 1-3 0-6 2-8 2-3 7-4 10 0l-4 2c0 4-3 8-8 9l-2 4H3Z"/><circle cx="16" cy="6.5" r=".8" fill="currentColor" stroke="none"/><path d="M10 14c1.5 0 3-1 3.5-2.5"/></>,
  wallet: <><path d="M20 8V6a1 1 0 0 0-1-1H6a3 3 0 0 0 0 6h14m-17-3v9a2 2 0 0 0 2 2h15v-4"/><path d="M16 11h5v4h-5a2 2 0 0 1 0-4Zm.1 2h.01"/></>,
  lock: <><rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0v3m-3 4v2"/></>,
  check: <path d="m5 12 4 4L19 6"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  copy: <><rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 8a7 7 0 0 1 11-2l3 6M4 12l3 6a7 7 0 0 0 11-2"/></>,
  spark: <><path d="M12 2c.6 6 3.4 8.9 9 10-5.6 1.1-8.4 4-9 10-.6-6-3.4-8.9-9-10 5.6-1.1 8.4-4 9-10Z"/><path d="M20 4v4m-2-2h4"/></>,
  warning: <><path d="M10.5 4.7a1.7 1.7 0 0 1 3 0l7 12.6a1.7 1.7 0 0 1-1.5 2.5H5a1.7 1.7 0 0 1-1.5-2.5Z"/><path d="M12 9v4m0 3h.01"/></>,
  book: <><path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Zm0 0v14"/></>,
} satisfies Record<string, React.ReactNode>;

export type IconName = keyof typeof shapes;

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" {...props}>{shapes[name]}</svg>;
}
