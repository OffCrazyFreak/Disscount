import { JSX } from "react";

export default function Loading(): JSX.Element {
  return (
    <div className="grid place-items-center h-[calc(70dvh)]">
      <svg
        width="96"
        height="96"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <style>{`.spinner_9y7u{animation:spinner_fUkk 2.4s linear infinite;animation-delay:-2.4s}.spinner_DF2s{animation-delay:-1.6s}.spinner_q27e{animation-delay:-.8s}@keyframes spinner_fUkk{8.33%{x:13px;y:1px}25%{x:13px;y:1px}33.3%{x:13px;y:13px}50%{x:13px;y:13px}58.33%{x:1px;y:13px}75%{x:1px;y:13px}83.33%{x:1px;y:1px}}`}</style>

        <rect
          className="spinner_9y7u"
          x="1"
          y="1"
          rx="1"
          width="10"
          height="10"
          fill="#2ec50d"
        />
        <rect
          className="spinner_9y7u spinner_DF2s"
          x="1"
          y="1"
          rx="1"
          width="10"
          height="10"
          fill="#2ec50d"
        />
        <rect
          className="spinner_9y7u spinner_q27e"
          x="1"
          y="1"
          rx="1"
          width="10"
          height="10"
          fill="#2ec50d"
        />
      </svg>
    </div>
  );
}
