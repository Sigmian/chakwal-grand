"use client";

// ============================================================
// features/pos/components/PrinterSetupHelp.tsx
// Reception-desk help for 80mm thermal printers (SpeedX SP-200 and the other
// POS-80 clones). The website can only decide how long the page is; how much
// paper actually comes out is decided by the Windows driver, so the settings
// that matter live here next to the Print button rather than in a manual
// nobody can find at 11pm.
// ============================================================

import { useState } from "react";
import { HelpCircle, X, Printer, AlertTriangle } from "lucide-react";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-[11px] font-bold text-gold-300">{n}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <div className="mt-0.5 space-y-1 text-xs leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}

const kbd = "rounded bg-surface-highlight px-1.5 py-0.5 font-mono text-[11px] text-foreground";

export function PrinterSetupHelp() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
      >
        <HelpCircle className="h-4 w-4" /> Printer setup
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="card-luxury my-8 w-full max-w-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-foreground">
                  <Printer className="h-5 w-5 text-gold-400" /> 80mm thermal printer setup
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">SpeedX SP-200 and other POS-80 printers, on Windows + Chrome.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200/90">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
              <p>
                <b>Endless blank paper?</b> That is the printer&apos;s paper size, not the receipt. The receipt is sent as a single
                page exactly as tall as the bill. If the driver&apos;s paper is set to a long roll (some ship with
                <span className={kbd}> 80 × 3276mm</span>), the printer feeds that whole length every time — blank.
                Step 2 fixes it.
              </p>
            </div>

            <ol className="space-y-3.5">
              <Step n={1} title="First, find out whose fault it is">
                <p>
                  Windows <b>Settings → Bluetooth &amp; devices → Printers &amp; scanners → SP-200 → Printer properties → Print Test Page</b>.
                </p>
                <p>If the test page <b>also</b> feeds endless blank paper, the website is not involved at all — continue with steps 2–4. If the test page is fine, go to step 4.</p>
              </Step>

              <Step n={2} title="Set the paper size (this is the usual cause)">
                <p><b>Printer properties → Preferences → Paper / Page Setup → Paper size</b>.</p>
                <p>Choose <span className={kbd}>80 × 297mm</span> — or create a custom size of <span className={kbd}>80 × 200mm</span>. Never leave it on a very long roll length such as 3276mm.</p>
                <p>On the same screen set <b>Paper cut / Feed after print</b> to cut (or feed 0–3mm), not a fixed long feed.</p>
              </Step>

              <Step n={3} title="Check the driver is the right one">
                <p>The printer must use the <b>SP-200 / POS-80 driver</b>. A &ldquo;Generic / Text Only&rdquo; driver cannot render the logo and totals and will push out blank or garbled paper.</p>
                <p>If a stuck job keeps reprinting: cancel everything in the queue, then restart the <b>Print Spooler</b> service. Windows retries a failed job forever, which also looks like endless printing.</p>
              </Step>

              <Step n={4} title="Chrome&apos;s print window">
                <p><b>Destination</b>: the SP-200 itself. <b>Paper size</b>: the same 80mm size as step 2.</p>
                <p>Open <b>More settings</b> and set <b>Margins: None</b>, <b>Scale: Default (100)</b>, <b>Headers and footers: off</b>, <b>Background graphics: on</b>.</p>
                <p>Chrome remembers these per printer, so this is a one-time job per reception PC.</p>
              </Step>

              <Step n={5} title="If it still misbehaves">
                <p>Use <b>Save Receipt</b> to get a PDF and print that — it is the same receipt and rules out the browser entirely. The 80mm/A4 choice beside the Print button is remembered on this computer.</p>
              </Step>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
