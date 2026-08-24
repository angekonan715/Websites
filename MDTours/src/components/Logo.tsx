import { Plane } from "lucide-react";

export default function Logo() {
  return (
    <a href="/" className="group flex min-w-0 shrink items-center gap-1">
      <div className="leading-none">
        <div className="flex items-baseline">
          <span className="text-xl font-extrabold tracking-tight text-white sm:text-[1.65rem]">
            M
          </span>
          <span className="relative text-xl font-extrabold tracking-tight text-white sm:text-[1.65rem]">
            D
            <Plane
              className="absolute -right-3.5 top-0.5 h-3.5 w-3.5 rotate-[-25deg] text-gold transition-transform group-hover:translate-x-0.5 sm:-right-4 sm:h-[18px] sm:w-[18px]"
              fill="currentColor"
              strokeWidth={1}
            />
          </span>
        </div>
        <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.28em] text-white sm:text-[9px] sm:tracking-[0.35em]">
          Tours
        </p>
        <p className="mt-1 hidden text-[9px] font-medium tracking-wide text-white/75 sm:block">
          Le guide de confiance
        </p>
      </div>
    </a>
  );
}
