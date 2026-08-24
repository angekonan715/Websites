export function downloadCsv(filename: string, rows: string[][]) {
  const content = rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          if (/[;"\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
          return value;
        })
        .join(";")
    )
    .join("\n");
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function formatAdminDate(value?: string) {
  if (!value) return "—";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
