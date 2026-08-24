"use client";

import { useEffect, useMemo, useState } from "react";

const COUNTRY_CODES = [
  { iso: "CI", name: "Côte d’Ivoire", dial: "+225" },
  { iso: "SN", name: "Sénégal", dial: "+221" },
  { iso: "GH", name: "Ghana", dial: "+233" },
  { iso: "TG", name: "Togo", dial: "+228" },
  { iso: "BJ", name: "Bénin", dial: "+229" },
  { iso: "BF", name: "Burkina Faso", dial: "+226" },
  { iso: "ML", name: "Mali", dial: "+223" },
  { iso: "GN", name: "Guinée", dial: "+224" },
  { iso: "NE", name: "Niger", dial: "+227" },
  { iso: "NG", name: "Nigeria", dial: "+234" },
  { iso: "LR", name: "Liberia", dial: "+231" },
  { iso: "SL", name: "Sierra Leone", dial: "+232" },
  { iso: "GM", name: "Gambie", dial: "+220" },
  { iso: "GW", name: "Guinée-Bissau", dial: "+245" },
  { iso: "MR", name: "Mauritanie", dial: "+222" },
  { iso: "CV", name: "Cap-Vert", dial: "+238" },
  { iso: "CM", name: "Cameroun", dial: "+237" },
  { iso: "GA", name: "Gabon", dial: "+241" },
  { iso: "CG", name: "Congo", dial: "+242" },
  { iso: "CD", name: "RDC", dial: "+243" },
  { iso: "TD", name: "Tchad", dial: "+235" },
  { iso: "MA", name: "Maroc", dial: "+212" },
  { iso: "DZ", name: "Algérie", dial: "+213" },
  { iso: "TN", name: "Tunisie", dial: "+216" },
  { iso: "EG", name: "Égypte", dial: "+20" },
  { iso: "FR", name: "France", dial: "+33" },
  { iso: "BE", name: "Belgique", dial: "+32" },
  { iso: "CH", name: "Suisse", dial: "+41" },
  { iso: "DE", name: "Allemagne", dial: "+49" },
  { iso: "IT", name: "Italie", dial: "+39" },
  { iso: "ES", name: "Espagne", dial: "+34" },
  { iso: "PT", name: "Portugal", dial: "+351" },
  { iso: "NL", name: "Pays-Bas", dial: "+31" },
  { iso: "GB", name: "Royaume-Uni", dial: "+44" },
  { iso: "IE", name: "Irlande", dial: "+353" },
  { iso: "CA", name: "Canada", dial: "+1" },
  { iso: "US", name: "États-Unis", dial: "+1" },
  { iso: "BR", name: "Brésil", dial: "+55" },
  { iso: "AE", name: "Émirats", dial: "+971" },
  { iso: "SA", name: "Arabie saoudite", dial: "+966" },
  { iso: "CN", name: "Chine", dial: "+86" },
  { iso: "IN", name: "Inde", dial: "+91" },
  { iso: "AU", name: "Australie", dial: "+61" },
] as const;

const DEFAULT_ISO = "CI";
const SORTED_DIALS = [...new Set(COUNTRY_CODES.map((item) => item.dial))].sort(
  (a, b) => b.length - a.length
);

function nationalDigits(value: string) {
  return value.replace(/\D/g, "");
}

function composePhone(dial: string, national: string) {
  const digits = nationalDigits(national);
  return digits ? `${dial}${digits}` : "";
}

function parsePhone(value: string): { dial: string; national: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return {
      dial: COUNTRY_CODES.find((item) => item.iso === DEFAULT_ISO)?.dial ?? "+225",
      national: "",
    };
  }

  const compact = trimmed.replace(/[^\d+]/g, "");
  const withPlus = compact.startsWith("+") ? compact : `+${compact}`;
  const match = SORTED_DIALS.find(
    (dial) => withPlus.startsWith(dial) || compact.startsWith(dial.slice(1))
  );

  if (match) {
    const rest = withPlus.startsWith(match)
      ? withPlus.slice(match.length)
      : compact.replace(/^\+?/, "").slice(match.slice(1).length);
    return { dial: match, national: nationalDigits(rest) };
  }

  return {
    dial: COUNTRY_CODES.find((item) => item.iso === DEFAULT_ISO)?.dial ?? "+225",
    national: nationalDigits(trimmed),
  };
}

function isoForDial(dial: string, preferred?: string) {
  if (preferred) {
    const current = COUNTRY_CODES.find((item) => item.iso === preferred);
    if (current?.dial === dial) return preferred;
  }
  return COUNTRY_CODES.find((item) => item.dial === dial)?.iso ?? DEFAULT_ISO;
}

export function isValidInternationalPhone(value: string) {
  const digits = nationalDigits(value);
  return digits.length >= 8 && digits.length <= 15;
}

export default function PhoneInput({
  value,
  onChange,
  required = false,
  id,
  name = "phone",
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
  name?: string;
}) {
  const parsed = useMemo(() => parsePhone(value), [value]);
  const [iso, setIso] = useState(() => isoForDial(parsed.dial));

  useEffect(() => {
    setIso((current) => isoForDial(parsed.dial, current));
  }, [parsed.dial]);

  const current = COUNTRY_CODES.find((item) => item.iso === iso) ?? COUNTRY_CODES[0];

  function update(nextIso: string, national: string) {
    const country = COUNTRY_CODES.find((item) => item.iso === nextIso) ?? COUNTRY_CODES[0];
    setIso(country.iso);
    onChange(composePhone(country.dial, national));
  }

  return (
    <div className="mt-1 flex gap-2">
      <label className="sr-only" htmlFor={id ? `${id}-code` : undefined}>
        Indicatif pays
      </label>
      <select
        id={id ? `${id}-code` : undefined}
        value={current.iso}
        onChange={(event) => update(event.target.value, parsed.national)}
        className="w-[9.75rem] shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-2.5 text-sm text-navy outline-none focus:border-gold"
      >
        {COUNTRY_CODES.map((country) => (
          <option key={country.iso} value={country.iso}>
            {country.iso} {country.dial}
          </option>
        ))}
      </select>
      <input
        id={id}
        name={name}
        required={required}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={parsed.national}
        onChange={(event) => update(current.iso, event.target.value)}
        placeholder="0556633766"
        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gold"
      />
    </div>
  );
}
