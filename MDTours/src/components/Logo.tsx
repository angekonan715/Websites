import { Plane } from "lucide-react";

export default function Logo() {
  return (
    <a href="/" className="group flex items-center gap-1">
      <div className="leading-none">
        <div className="flex items-baseline">
          <span className="text-[1.65rem] font-extrabold tracking-tight text-white">
            M
          </span>
          <span className="relative text-[1.65rem] font-extrabold tracking-tight text-white">
            D
            <Plane
              className="absolute -right-4 top-0.5 h-[18px] w-[18px] rotate-[-25deg] text-gold transition-transform group-hover:translate-x-0.5"
              fill="currentColor"
              strokeWidth={1}
            />
          </span>
        </div>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.35em] text-white">
          Tours
        </p>
        <p className="mt-1 text-[9px] font-medium tracking-wide text-white/75">
          Voyagez autrement
        </p>
      </div>
    </a>
  );
}
