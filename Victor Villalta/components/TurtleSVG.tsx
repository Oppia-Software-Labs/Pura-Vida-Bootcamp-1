import { useId } from "react";

const body = "M149 67C115 64 101 91 99 123c-2 38 14 80 50 113 34-31 51-77 50-113-1-33-17-59-50-56Z";
const flippers = [
  "M109 97C77 80 37 86 14 115c-8 10-8 28 7 21 26-12 51-10 82-3Z",
  "M188 97c32-17 72-11 95 18 8 10 8 28-7 21-26-12-51-10-82-3Z",
  "M124 185c-34 8-45 31-36 44 6 9 20-8 48-19Z",
  "M173 185c34 8 45 31 36 44-6 9-20-8-48-19Z",
];
const head = "M132 75c-4-13-12-34-5-47 5-10 12-16 22-16s17 6 22 16c7 13-1 34-5 47Z";
const ridges = [
  "M116 88c-22 37-10 87 22 126",
  "M125 81c-17 39-9 92 17 143",
  "M136 76c-10 51-4 109 10 154",
  "M149 74v159",
  "M162 76c10 51 4 109-10 154",
  "M173 81c17 39 9 92-17 143",
  "M182 88c22 37 10 87-22 126",
];

export function TurtleSVG({ className }: { className?: string }) {
  const id = useId();
  const spots = Array.from({ length: 165 }, (_, i) => ({
    x: (i * 83.17) % 291 + 4,
    y: (i * 67.21) % 232 + 9,
    r: 0.55 + (i % 6) * 0.25,
    opacity: 0.18 + (i % 7) * 0.065,
  }));

  return (
    <svg className={className} aria-hidden="true" viewBox="0 0 300 248" fill="none">
      <defs>
        <linearGradient id={id + "-skin"} x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="#496974"/><stop offset=".48" stopColor="#1B2430"/><stop offset="1" stopColor="#071821"/>
        </linearGradient>
        <radialGradient id={id + "-shell"} cx=".31" cy=".24" r=".9">
          <stop stopColor="#446473"/><stop offset=".51" stopColor="#1B2430"/><stop offset="1" stopColor="#081722"/>
        </radialGradient>
        <clipPath id={id + "-spots"}><path d={head}/>{flippers.map((d) => <path key={d} d={d}/>)}</clipPath>
        <clipPath id={id + "-carapace"}><path d={body}/></clipPath>
      </defs>
      <path d="m140 220 9 22 9-22" fill="#102635" stroke="#3a6a76"/>
      {[head, ...flippers].map((d) => <path key={d} d={d} fill={`url(#${id}-skin)`} stroke="#78b9bc" strokeWidth="1.5" strokeOpacity=".62"/>)}
      <g clipPath={`url(#${id}-spots)`} fill="#E8E6DF">
        {spots.map(({ x, y, r, opacity }, i) => <circle key={i} cx={x} cy={y} r={r} opacity={opacity}/>)}
      </g>
      <path d={body} fill={`url(#${id}-shell)`} stroke="#75b2b5" strokeOpacity=".72" strokeWidth="2"/>
      <g clipPath={`url(#${id}-carapace)`} fill="#E8E6DF" opacity=".24">
        {spots.map(({ x, y, r, opacity }, i) => <circle key={i} cx={x} cy={y} r={r * .7} opacity={opacity}/>)}
      </g>
      {ridges.map((d, i) => <path key={d} d={d} stroke={i === 3 ? "#92cdc3" : "#78b0b2"} strokeOpacity={i === 3 ? ".84" : ".55"} strokeWidth={i === 3 ? "1.85" : "1.3"} strokeLinecap="round"/>)}
      <circle cx="135" cy="32" r="2.4" fill="#040b12"/><circle cx="163" cy="32" r="2.4" fill="#040b12"/>
      <path d="M143 22q6-3 12 0" stroke="#eadfc7" strokeOpacity=".55" strokeLinecap="round"/>
    </svg>
  );
}
