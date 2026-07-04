// export default function AutoHealerPage() {
//   return (
//     <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center font-sans">
//       <h1 className="text-3xl font-bold text-emerald-400 mb-4">Phase 2: AWS Auto-Healer</h1>
//       <p className="text-gray-400">Post-deployment continuous monitoring dashboard coming soon.</p>
//     </div>
//   );
// }

"use client";

 

import React, { useState, useEffect, useRef, useCallback } from "react";

import {

  Activity,

  AlertTriangle,

  Brain,

  CheckCircle2,

  Cpu,

  Database,

  HardDrive,

  Heart,

  Network,

  Play,

  RefreshCw,

  Server,

  ShieldCheck,

  Terminal,

  Wrench,

  Zap,

} from "lucide-react";

 

/* ─────────────────────────────────────────────────────────────

   Types

   ───────────────────────────────────────────────────────────── */

type SystemState = "HEALTHY" | "CRASH" | "RCA" | "MENDED";

 

interface LogLine {

  id: number;

  ts: string;

  level: "INFO" | "WARN" | "ERROR" | "FATAL";

  source: string;

  message: string;

}

 

interface VitalSign {

  id: string;

  name: string;

  icon: React.ReactNode;

  value: string;

  status: "ok" | "degraded" | "critical";

}

 

interface LedgerRow {

  id: string;

  ts: string;

  resource: string;

  diagnosis: string;

  action: string;

  status: "Success" | "In-Progress" | "Failed";

  durationMs: number;

}

 

/* ─────────────────────────────────────────────────────────────

   Static Seeds

   ───────────────────────────────────────────────────────────── */

const HEALTHY_LOG_TEMPLATES = [

  ["api-gateway", "Handled GET /v1/health 200 in 12ms"],

  ["ec2-web-01", "Heartbeat OK | mem=42% cpu=18% conn=128"],

  ["rds-primary", "Replication lag 0.4s | active sessions: 23"],

  ["auth-svc", "JWT issued sub=usr_8821 ttl=3600"],

  ["s3-uploader", "Object putObject art-2026/asset.png 204"],

  ["payments", "Stripe webhook charge.succeeded processed"],

  ["redis-cache", "GET session:9921 HIT 0.8ms"],

  ["worker-pool", "Job queue depth=4 workers=8"],

];

 

const CRASH_STACK_TRACE: LogLine[] = [

  {

    id: 0,

    ts: "",

    level: "ERROR",

    source: "ec2-web-01",

    message: "Unhandled exception in request handler /api/checkout",

  },

  {

    id: 1,

    ts: "",

    level: "ERROR",

    source: "node-runtime",

    message: "FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory",

  },

  {

    id: 2,

    ts: "",

    level: "ERROR",

    source: "node-runtime",

    message: "  at process.processTicksAndRejections (node:internal/process/task_queues:96:5)",

  },

  {

    id: 3,

    ts: "",

    level: "ERROR",

    source: "node-runtime",

    message: "  at async CheckoutController.processOrder (/app/dist/controllers/checkout.js:142:24)",

  },

  {

    id: 4,

    ts: "",

    level: "ERROR",

    source: "node-runtime",

    message: "  at async OrderService.batchValidate (/app/dist/services/order.js:88:9)",

  },

  {

    id: 5,

    ts: "",

    level: "FATAL",

    source: "ec2-web-01",

    message: "Process exited with code 137 (OOMKilled) — kernel reaper invoked",

  },

  {

    id: 6,

    ts: "",

    level: "FATAL",

    source: "cloudwatch",

    message: "ALARM: HighMemoryUtilization breached threshold 95% for 2 consecutive periods",

  },

  {

    id: 7,

    ts: "",

    level: "ERROR",

    source: "elb-target",

    message: "Target i-0abc123def456 deregistered — health check 502 Bad Gateway",

  },

];

 

const RCA_THOUGHT_STREAM = [

  "▸ Ingesting CloudWatch log group /aws/ec2/web-prod...",

  "▸ Extracted 8 lines of FATAL-level stack trace.",

  "▸ Embedding stack trace → semantic match against runbook vector store.",

  "▸ Cross-referencing with last 24h of CloudWatch metrics for ec2-web-01.",

  "▸ Pattern identified: OOMKilled (exit 137) + heap allocation failure.",

  "▸ Hypothesis: Memory leak in CheckoutController batch validation loop.",

  "▸ Correlated signal: HighMemoryUtilization alarm fired 47s before crash.",

  "▸ Querying meta-llama/llama-3.1-8b-instruct for runbook selection...",

  "▸ AI verdict: PRIMARY=restart_instance, SECONDARY=increase_memory_alarm_threshold.",

  "▸ Confidence score: 0.91 → exceeds auto-remediation threshold (0.75).",

  "▸ Dispatching boto3.ec2.reboot_instances(InstanceIds=['i-0abc123def456'])...",

  "▸ Awaiting ELB target health re-registration...",

  "✓ Instance back in service. Notifying SRE channel via Power Automate.",

];

 

/* ─────────────────────────────────────────────────────────────

   Helpers

   ───────────────────────────────────────────────────────────── */

const nowISO = () => new Date().toISOString().split("T")[1].replace("Z", "");

const rid = () => Math.random().toString(36).slice(2, 10);

 

const levelColor: Record<LogLine["level"], string> = {

  INFO: "text-emerald-400",

  WARN: "text-amber-400",

  ERROR: "text-red-400",

  FATAL: "text-red-500 font-bold",

};

 

/* ─────────────────────────────────────────────────────────────

   Main Page

   ───────────────────────────────────────────────────────────── */

export default function AutoHealerPage() {

  const [systemState, setSystemState] = useState<SystemState>("HEALTHY");

  const [logs, setLogs] = useState<LogLine[]>([]);

  const [rcaLines, setRcaLines] = useState<string[]>([]);

  const [rcaTyping, setRcaTyping] = useState<string>("");

  const [ledger, setLedger] = useState<LedgerRow[]>([

    {

      id: rid(),

      ts: "2026-06-28 04:12:09",

      resource: "rds-primary",

      diagnosis: "Connection pool exhaustion",

      action: "Scaled read replica + flushed idle conns",

      status: "Success",

      durationMs: 4120,

    },

    {

      id: rid(),

      ts: "2026-06-27 22:48:51",

      resource: "ec2-worker-04",

      diagnosis: "Disk I/O saturation (>98% iowait)",

      action: "Detached EBS, replaced with gp3 provisioned",

      status: "Success",

      durationMs: 8870,

    },

  ]);

 

  const [vitals, setVitals] = useState<VitalSign[]>([

    { id: "ec2", name: "EC2 Fleet", icon: <Server size={18} />, value: "12 / 12", status: "ok" },

    { id: "rds", name: "RDS Primary", icon: <Database size={18} />, value: "Healthy", status: "ok" },

    { id: "cpu", name: "Avg CPU", icon: <Cpu size={18} />, value: "21%", status: "ok" },

    { id: "mem", name: "Avg Memory", icon: <HardDrive size={18} />, value: "47%", status: "ok" },

    { id: "net", name: "Network I/O", icon: <Network size={18} />, value: "412 Mbps", status: "ok" },

    { id: "elb", name: "ELB Targets", icon: <Activity size={18} />, value: "All 200", status: "ok" },

  ]);

 

  const logIdRef = useRef(0);

  const logContainerRef = useRef<HTMLDivElement>(null);

  const rcaContainerRef = useRef<HTMLDivElement>(null);

 

  /* ── Healthy mode: emit INFO logs on interval ───────────────── */

  useEffect(() => {

    if (systemState !== "HEALTHY") return;

    const t = setInterval(() => {

      const [src, msg] =

        HEALTHY_LOG_TEMPLATES[Math.floor(Math.random() * HEALTHY_LOG_TEMPLATES.length)];

      setLogs((prev) => {

        const next: LogLine = {

          id: logIdRef.current++,

          ts: nowISO(),

          level: "INFO",

          source: src,

          message: msg,

        };

        const trimmed = [...prev, next];

        return trimmed.length > 80 ? trimmed.slice(trimmed.length - 80) : trimmed;

      });

    }, 700);

    return () => clearInterval(t);

  }, [systemState]);

 

  /* ── Auto-scroll terminal ───────────────────────────────────── */

  useEffect(() => {

    logContainerRef.current?.scrollTo({

      top: logContainerRef.current.scrollHeight,

      behavior: "smooth",

    });

  }, [logs]);

 

  useEffect(() => {

    rcaContainerRef.current?.scrollTo({

      top: rcaContainerRef.current.scrollHeight,

      behavior: "smooth",

    });

  }, [rcaLines, rcaTyping]);

 

  /* ── Vital sign degradation on crash ────────────────────────── */

  const degradeVitals = useCallback(() => {

    setVitals((prev) =>

      prev.map((v) => {

        if (v.id === "ec2") return { ...v, value: "11 / 12", status: "critical" };

        if (v.id === "mem") return { ...v, value: "98%", status: "critical" };

        if (v.id === "elb") return { ...v, value: "1 × 502", status: "critical" };

        if (v.id === "cpu") return { ...v, value: "84%", status: "degraded" };

        return v;

      })

    );

  }, []);

 

  const restoreVitals = useCallback(() => {

    setVitals([

      { id: "ec2", name: "EC2 Fleet", icon: <Server size={18} />, value: "12 / 12", status: "ok" },

      { id: "rds", name: "RDS Primary", icon: <Database size={18} />, value: "Healthy", status: "ok" },

      { id: "cpu", name: "Avg CPU", icon: <Cpu size={18} />, value: "23%", status: "ok" },

      { id: "mem", name: "Avg Memory", icon: <HardDrive size={18} />, value: "51%", status: "ok" },

      { id: "net", name: "Network I/O", icon: <Network size={18} />, value: "388 Mbps", status: "ok" },

      { id: "elb", name: "ELB Targets", icon: <Activity size={18} />, value: "All 200", status: "ok" },

    ]);

  }, []);

 

  /* ── RCA typewriter effect ──────────────────────────────────── */

  const runRcaTypewriter = useCallback(async () => {

    setRcaLines([]);

    for (const line of RCA_THOUGHT_STREAM) {

      // Type out char-by-char

      for (let i = 1; i <= line.length; i++) {

        setRcaTyping(line.slice(0, i));

        await new Promise((r) => setTimeout(r, 12));

      }

      setRcaLines((prev) => [...prev, line]);

      setRcaTyping("");

      await new Promise((r) => setTimeout(r, 220));

    }

  }, []);

 

  /* ── Crash sequencer ────────────────────────────────────────── */

  const simulateCrash = useCallback(async () => {

    if (systemState !== "HEALTHY") return;

 

    // 1) Inject the red stack trace

    setSystemState("CRASH");

    degradeVitals();

    for (const line of CRASH_STACK_TRACE) {

      setLogs((prev) => [

        ...prev,

        { ...line, id: logIdRef.current++, ts: nowISO() },

      ]);

      await new Promise((r) => setTimeout(r, 180));

    }

 

    // 2) Enter RCA

    await new Promise((r) => setTimeout(r, 600));

    setSystemState("RCA");

    await runRcaTypewriter();

 

    // 3) Auto-mend

    setSystemState("MENDED");

    restoreVitals();

    setLogs((prev) => [

      ...prev,

      {

        id: logIdRef.current++,

        ts: nowISO(),

        level: "INFO",

        source: "auto-healer",

        message: "✓ ec2-web-01 rebooted, ELB target re-registered, health checks PASS",

      },

    ]);

    setLedger((prev) => [

      {

        id: rid(),

        ts: new Date().toISOString().replace("T", " ").slice(0, 19),

        resource: "ec2-web-01 (i-0abc123def456)",

        diagnosis: "Node.js heap OOM in CheckoutController (exit 137)",

        action: "boto3.reboot_instances + raised mem alarm to 85%",

        status: "Success",

        durationMs: 6240,

      },

      ...prev,

    ]);

 

    // 4) Return to healthy after a beat

    await new Promise((r) => setTimeout(r, 3000));

    setSystemState("HEALTHY");

  }, [systemState, degradeVitals, restoreVitals, runRcaTypewriter]);

 

  const resetAll = () => {

    setSystemState("HEALTHY");

    setLogs([]);

    setRcaLines([]);

    setRcaTyping("");

    restoreVitals();

  };

 

  /* ─────────────────────────────────────────────────────────── */

  return (

    <div className="min-h-screen bg-[#0d1117] text-zinc-200 font-mono">

      {/* Header */}

      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-[#0d1117]/90 backdrop-blur sticky top-0 z-10">

        <div className="flex items-center gap-3">

          <ShieldCheck className="text-emerald-400" size={26} />

          <div>

            <h1 className="text-lg font-semibold text-zinc-100">

              RNM Auto-Healer · SRE Command Center

            </h1>

            <p className="text-xs text-zinc-500">

              Phase 2 · Post-deploy AIOps · CloudWatch → Lambda → OpenRouter → boto3

            </p>

          </div>

        </div>

        <div className="flex items-center gap-3">

          <StatePill state={systemState} />

          <button

            onClick={simulateCrash}

            disabled={systemState !== "HEALTHY"}

            className="flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-sm font-semibold transition"

          >

            <Zap size={16} /> Simulate App Crash

          </button>

          <button

            onClick={resetAll}

            className="flex items-center gap-2 px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm transition"

          >

            <RefreshCw size={14} /> Reset

          </button>

        </div>

      </header>

 

      <main className="p-6 space-y-6">

        {/* ───────── Vital Signs Row ───────── */}

        <section>

          <SectionTitle icon={<Heart size={16} />} title="System Vital Signs" />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

            {vitals.map((v) => (

              <VitalCard key={v.id} v={v} />

            ))}

          </div>

        </section>

 

        {/* ───────── Telemetry + RCA Console ───────── */}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Live Telemetry */}

          <div className="bg-[#161b22] border border-zinc-800 rounded-lg overflow-hidden">

            <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">

              <div className="flex items-center gap-2 text-sm text-zinc-300">

                <Terminal size={14} className="text-emerald-400" />

                <span>Live Telemetry · /aws/ec2/web-prod</span>

              </div>

              <span className="text-xs text-zinc-500">{logs.length} lines</span>

            </div>

            <div

              ref={logContainerRef}

              className="h-[420px] overflow-y-auto px-4 py-3 text-xs leading-relaxed scroll-smooth"

            >

              {logs.map((l) => (

                <div key={l.id} className="flex gap-3">

                  <span className="text-zinc-600 shrink-0">{l.ts}</span>

                  <span className={`shrink-0 ${levelColor[l.level]}`}>[{l.level}]</span>

                  <span className="text-sky-400 shrink-0">{l.source}</span>

                  <span

                    className={

                      l.level === "ERROR" || l.level === "FATAL"

                        ? "text-red-300"

                        : "text-zinc-300"

                    }

                  >

                    {l.message}

                  </span>

                </div>

              ))}

              {logs.length === 0 && (

                <div className="text-zinc-600 italic">Awaiting telemetry…</div>

              )}

            </div>

          </div>

 

          {/* RCA Agent Console */}

          <div className="bg-[#161b22] border border-zinc-800 rounded-lg overflow-hidden">

            <div className="px-4 py-2 border-b border-zinc-800 flex items-center justify-between">

              <div className="flex items-center gap-2 text-sm text-zinc-300">

                <Brain size={14} className="text-fuchsia-400" />

                <span>Agentic RCA Console · llama-3.1-8b-instruct</span>

              </div>

              {systemState === "RCA" && (

                <span className="text-xs text-fuchsia-400 animate-pulse">analyzing…</span>

              )}

            </div>

            <div

              ref={rcaContainerRef}

              className="h-[420px] overflow-y-auto px-4 py-3 text-xs leading-relaxed scroll-smooth"

            >

              {rcaLines.length === 0 && systemState !== "RCA" && (

                <div className="text-zinc-600 italic">

                  Idle. Awaiting CloudWatch trigger from EventBridge.

                </div>

              )}

              {rcaLines.map((l, i) => (

                <div

                  key={i}

                  className={

                    l.startsWith("✓")

                      ? "text-emerald-400"

                      : l.includes("AI verdict")

                      ? "text-fuchsia-300"

                      : "text-zinc-300"

                  }

                >

                  {l}

                </div>

              ))}

              {rcaTyping && (

                <div className="text-fuchsia-300">

                  {rcaTyping}

                  <span className="inline-block w-2 h-3 bg-fuchsia-300 ml-1 animate-pulse" />

                </div>

              )}

            </div>

          </div>

        </section>

 

        {/* ───────── Action History Ledger ───────── */}

        <section className="bg-[#161b22] border border-zinc-800 rounded-lg overflow-hidden">

          <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2 text-sm text-zinc-300">

            <Wrench size={14} className="text-amber-400" />

            <span>Action History Ledger (immutable audit trail)</span>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-xs">

              <thead className="bg-[#0d1117] text-zinc-500">

                <tr>

                  <th className="text-left px-4 py-2 font-medium">Timestamp (UTC)</th>

                  <th className="text-left px-4 py-2 font-medium">Resource</th>

                  <th className="text-left px-4 py-2 font-medium">AI Diagnosis</th>

                  <th className="text-left px-4 py-2 font-medium">Autonomous Action</th>

                  <th className="text-left px-4 py-2 font-medium">Duration</th>

                  <th className="text-left px-4 py-2 font-medium">Status</th>

                </tr>

              </thead>

              <tbody>

                {ledger.map((r) => (

                  <tr key={r.id} className="border-t border-zinc-800 hover:bg-zinc-900/40">

                    <td className="px-4 py-2 text-zinc-400">{r.ts}</td>

                    <td className="px-4 py-2 text-sky-300">{r.resource}</td>

                    <td className="px-4 py-2 text-zinc-300">{r.diagnosis}</td>

                    <td className="px-4 py-2 text-zinc-300">{r.action}</td>

                    <td className="px-4 py-2 text-zinc-400">{(r.durationMs / 1000).toFixed(2)}s</td>

                    <td className="px-4 py-2">

                      <span

                        className={

                          r.status === "Success"

                            ? "text-emerald-400 flex items-center gap-1"

                            : r.status === "Failed"

                            ? "text-red-400 flex items-center gap-1"

                            : "text-amber-400 flex items-center gap-1"

                        }

                      >

                        {r.status === "Success" ? (

                          <CheckCircle2 size={12} />

                        ) : (

                          <AlertTriangle size={12} />

                        )}

                        {r.status}

                      </span>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        </section>

 

        <footer className="text-center text-xs text-zinc-600 pt-4">

          RNM Autonomous DevSecOps · Phase 2 AIOps Auto-Healer · MTTR target &lt; 10s

        </footer>

      </main>

    </div>

  );

}

 

/* ─────────────────────────────────────────────────────────────

   Subcomponents

   ───────────────────────────────────────────────────────────── */

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {

  return (

    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-400 mb-3">

      {icon}

      <span>{title}</span>

    </div>

  );

}

 

function VitalCard({ v }: { v: VitalSign }) {

  const ring =

    v.status === "ok"

      ? "border-emerald-700/40 shadow-emerald-900/20"

      : v.status === "degraded"

      ? "border-amber-700/50 shadow-amber-900/20"

      : "border-red-700/60 shadow-red-900/30 animate-pulse";

 

  const dot =

    v.status === "ok"

      ? "bg-emerald-400"

      : v.status === "degraded"

      ? "bg-amber-400"

      : "bg-red-500";

 

  return (

    <div className={`bg-[#161b22] border ${ring} rounded-lg p-3 shadow-lg`}>

      <div className="flex items-center justify-between mb-2">

        <div className="flex items-center gap-2 text-zinc-400 text-xs">

          {v.icon}

          <span>{v.name}</span>

        </div>

        <span className={`w-2 h-2 rounded-full ${dot}`} />

      </div>

      <div className="text-lg font-semibold text-zinc-100">{v.value}</div>

    </div>

  );

}

 

function StatePill({ state }: { state: SystemState }) {

  const cfg: Record<SystemState, { label: string; cls: string }> = {

    HEALTHY: { label: "● HEALTHY", cls: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50" },

    CRASH: { label: "● CRASH DETECTED", cls: "bg-red-900/50 text-red-300 border-red-700/60 animate-pulse" },

    RCA: { label: "● RCA IN PROGRESS", cls: "bg-fuchsia-900/40 text-fuchsia-300 border-fuchsia-700/50" },

    MENDED: { label: "● AUTO-MENDED", cls: "bg-sky-900/40 text-sky-300 border-sky-700/50" },

  };

  const c = cfg[state];

  return (

    <span className={`text-xs px-3 py-1.5 rounded-full border font-semibold ${c.cls}`}>

      {c.label}

    </span>

  );

}