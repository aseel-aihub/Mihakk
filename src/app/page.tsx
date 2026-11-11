import Link from "next/link";
import { ArrowRight, FlaskConical, ShieldCheck, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STEPS = [
  { Icon: FlaskConical, title: "Test", text: "Run the agent on fictional files that contain inert test instructions, and record what it is asked to do." },
  { Icon: ShieldCheck, title: "Protect", text: "Give each task a signed, time-limited contract. The shield checks every action against it and denies everything else." },
  { Icon: ListChecks, title: "Re-evaluate", text: "Run the same cases again and compare results with a simulated no-shield baseline, including legitimate tasks blocked by mistake." },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="flex flex-col items-start gap-6 md:flex-row md:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="Mihakk logo" width={120} height={132} className="h-32 w-auto" />
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Mihakk</h1>
          <p className="max-w-2xl text-lg text-steel">
            Mihakk helps teams check how safely an AI agent handles files before it is trusted with real work. It limits the agent with a task contract, then re-runs the same tests to show what changed.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/lab">Try Mihakk <ArrowRight aria-hidden className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/results">See evaluation results</Link>
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="workflow">
        <h2 id="workflow" className="mb-4 text-xl font-semibold">How it works: Test, Protect, Re-evaluate</h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map(({ Icon, title, text }, i) => (
            <li key={title}>
              <Card className="h-full">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper">{i + 1}</span>
                  <Icon aria-hidden className="h-6 w-6" />
                  <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <p className="text-sm text-steel">{text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
