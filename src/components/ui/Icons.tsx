import type { ReactElement, SVGProps } from "react";
import { cn } from "../../utils/cn";

export type IconName =
  | "grid"
  | "book"
  | "chart"
  | "flask"
  | "spark"
  | "settings"
  | "menu"
  | "close"
  | "sun"
  | "moon"
  | "bell"
  | "user"
  | "chevronDown"
  | "chevronRight"
  | "arrowUp"
  | "arrowRight"
  | "mic"
  | "paperclip"
  | "copy"
  | "refresh"
  | "trash"
  | "check"
  | "search"
  | "filter"
  | "plus"
  | "alert"
  | "info"
  | "clock"
  | "target"
  | "trendUp"
  | "trendDown"
  | "shield"
  | "brain"
  | "layers"
  | "cpu"
  | "calendar"
  | "flag"
  | "zap"
  | "download"
  | "external"
  | "more"
  | "moreH"
  | "panelLeft"
  | "pin"
  | "share"
  | "image"
  | "file"
  | "stop"
  | "eye"
  | "eyeOff"
  | "lock"
  | "logout"
  | "upload"
  | "camera";

const paths: Record<IconName, ReactElement> = {
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20" />
      <path d="M9 7.5h7" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7 16V9" />
      <path d="M12 16V5" />
      <path d="M17 16v-4" />
    </>
  ),
  flask: (
    <>
      <path d="M9 3h6" />
      <path d="M10 3v5.2L5 17.4A2 2 0 0 0 6.8 20.4h10.4A2 2 0 0 0 19 17.4L14 8.2V3" />
      <path d="M7.5 14.5h9" />
    </>
  ),
  spark: (
    <>
      <path d="M12 2.5v6" />
      <path d="M12 15.5v6" />
      <path d="M2.5 12h6" />
      <path d="M15.5 12h6" />
      <path d="M5.6 5.6l3.2 3.2" />
      <path d="M15.2 15.2l3.2 3.2" />
      <path d="M18.4 5.6l-3.2 3.2" />
      <path d="M8.8 15.2l-3.2 3.2" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
  menu: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h11" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </>
  ),
  moon: <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />,
  bell: (
    <>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8-2.5 8h17S18 15 18 8.5" />
      <path d="M10.2 20.5a2 2 0 0 0 3.6 0" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.5c.6-3.8 3.7-5.5 7.5-5.5s6.9 1.7 7.5 5.5" />
    </>
  ),
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  chevronRight: <path d="M9.5 6l6 6-6 6" />,
  arrowUp: (
    <>
      <path d="M12 20V5" />
      <path d="M5.5 11.5L12 5l6.5 6.5" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v3" />
    </>
  ),
  paperclip: <path d="M20.5 11.5l-8.4 8.4a5 5 0 0 1-7.1-7.1L13.5 4.3a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.4a1.7 1.7 0 0 1-2.4-2.4l8-8" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 5.5A2.5 2.5 0 0 0 12.5 3h-6A3.5 3.5 0 0 0 3 6.5v6A2.5 2.5 0 0 0 5.5 15" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1" />
      <path d="M20.5 4.5v5h-5" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16" />
      <path d="M9.5 7V4.5h5V7" />
      <path d="M6 7l1 13h10l1-13" />
      <path d="M10.5 11v5M13.5 11v5" />
    </>
  ),
  check: <path d="M4.5 12.5l5 5 10-11" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  filter: <path d="M3.5 5h17l-6.6 7.6V20l-3.8-2.2v-5.2z" />,
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.6h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5" />
      <path d="M12 7.8h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  trendUp: (
    <>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M21 7h-5M21 7v5" />
    </>
  ),
  trendDown: (
    <>
      <path d="M3 7l6 6 4-4 8 8" />
      <path d="M21 17h-5M21 17v-5" />
    </>
  ),
  shield: <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" />,
  brain: (
    <>
      <path d="M12 5.5a3 3 0 0 0-5.7-1.3A3 3 0 0 0 4 8.6 3.2 3.2 0 0 0 4.6 14 3 3 0 0 0 9 19a3 3 0 0 0 3-2.5z" />
      <path d="M12 5.5a3 3 0 0 1 5.7-1.3A3 3 0 0 1 20 8.6a3.2 3.2 0 0 1-.6 5.4A3 3 0 0 1 15 19a3 3 0 0 1-3-2.5z" />
      <path d="M12 5.5v11" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l8.5 4.5L12 12 3.5 7.5z" />
      <path d="M3.5 12.5L12 17l8.5-4.5" />
      <path d="M3.5 17L12 21.5 20.5 17" />
    </>
  ),
  cpu: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M10 3.5v2M14 3.5v2M10 18.5v2M14 18.5v2M3.5 10h2M3.5 14h2M18.5 10h2M18.5 14h2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
    </>
  ),
  flag: (
    <>
      <path d="M5.5 21V4" />
      <path d="M5.5 4.5h11l-2.5 4 2.5 4h-11" />
    </>
  ),
  zap: <path d="M13.5 3L5.5 14h5.2l-1.2 7 8-11.5h-5.3z" />,
  download: (
    <>
      <path d="M12 4v11" />
      <path d="M7.5 11.5l4.5 4.5 4.5-4.5" />
      <path d="M4.5 20h15" />
    </>
  ),
  external: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4L11 13" />
      <path d="M18.5 14v5.5h-13v-13H11" />
    </>
  ),
  more: (
    <>
      <circle cx="12" cy="5.5" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="12" cy="18.5" r="1.4" />
    </>
  ),
  panelLeft: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <path d="M9.5 4v16" />
    </>
  ),
  moreH: (
    <>
      <circle cx="5.5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="18.5" cy="12" r="1.4" />
    </>
  ),
  pin: (
    <>
      <path d="M9 4.5h6l-.8 5.2 2.3 2.3V14H7.5v-2l2.3-2.3z" />
      <path d="M12 14v6" />
    </>
  ),
  share: (
    <>
      <circle cx="18" cy="5.5" r="2.2" />
      <circle cx="18" cy="18.5" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <path d="M8 11.2l8-4.4M8 12.8l8 4.4" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2.2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M3.8 16.5l5.2-4.4 3.4 2.8 2.6-2.2 5.2 3.8" />
    </>
  ),
  file: (
    <>
      <path d="M7 3.5h7l5.5 5.5V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5z" />
      <path d="M14 3.5V9h5.5" />
    </>
  ),
  stop: <rect x="7" y="7" width="10" height="10" rx="1.6" fill="currentColor" stroke="none" />,
  eye: (
    <>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M9.9 9.9A2.6 2.6 0 0 0 12 14.6" />
      <path d="M6.1 6.4C3.9 8 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.7 0 3.2-.4 4.5-1.1" />
      <path d="M12.7 5.6A10.4 10.4 0 0 1 21.5 12s-.6 1.1-1.7 2.4" />
    </>
  ),
  lock: (
    <>
      <rect x="5.5" y="11" width="13" height="9.5" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 4.5H6.5A2 2 0 0 0 4.5 6.5v11A2 2 0 0 0 6.5 19.5H10" />
      <path d="M10 12h9.5" />
      <path d="M16.5 8.5L20 12l-3.5 3.5" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V5" />
      <path d="M7.5 9.5L12 5l4.5 4.5" />
      <path d="M4.5 20h15" />
    </>
  ),
  camera: (
    <>
      <path d="M8 7l1.4-2h5.2L16 7h3.5A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-9A1.5 1.5 0 0 1 4.5 7z" />
      <circle cx="12" cy="13" r="3.2" />
    </>
  ),
};

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
