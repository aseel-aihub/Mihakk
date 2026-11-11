import { CircleCheck, CircleMinus, CircleX, ShieldAlert, ShieldCheck, TriangleAlert, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "allowed" | "denied" | "pass" | "fail" | "not-run" | "baseline";

const MAP: Record<Kind, { label: string; cls: string; Icon: typeof CircleCheck }> = {
  allowed: { label: "Allowed", cls: "bg-okbg text-ok", Icon: ShieldCheck },
  denied: { label: "Denied", cls: "bg-badbg text-bad", Icon: ShieldAlert },
  pass: { label: "Pass", cls: "bg-okbg text-ok", Icon: CircleCheck },
  fail: { label: "Fail", cls: "bg-badbg text-bad", Icon: CircleX },
  "not-run": { label: "Not run", cls: "bg-wash text-steel", Icon: CircleMinus },
  baseline: { label: "Would be accepted", cls: "bg-wash text-ink border border-mist", Icon: TriangleAlert },
};

/** Status is always shown with an icon AND text, never by color alone. */
export function StatusPill({ kind, label }: { kind: Kind; label?: string }) {
  const { label: l, cls, Icon } = MAP[kind];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", cls)}>
      <Icon aria-hidden className="h-4 w-4" />
      {label ?? l}
    </span>
  );
}

export function Notice({ tone, title, children }: { tone: "info" | "warn" | "error" | "ok"; title: string; children?: React.ReactNode }) {
  const tones = { info: "border-line bg-wash", warn: "border-mist bg-wash", error: "border-bad bg-badbg", ok: "border-ok bg-okbg" };
  const Icon = tone === "error" ? CircleX : tone === "warn" ? TriangleAlert : tone === "ok" ? CircleCheck : Info;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-lg border p-4 text-sm", tones[tone])}>
      <Icon aria-hidden className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">{title}</p>
        {children && <div className="mt-1 text-steel">{children}</div>}
      </div>
    </div>
  );
}
