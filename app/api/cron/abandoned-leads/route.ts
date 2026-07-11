// ============================================================
// Abandoned-lead follow-up cron — runs every hour ("0 * * * *")
// Finds leads created 2–4 hours ago that haven't been followed up,
// sends a WhatsApp message, and marks them as followed up.
//
// NOTE: Requires Meta template "cgh_abandoned_lead" to be approved
//       before messages will actually send.
// ============================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { sendAbandonedLeadFollowup } from "@/lib/whatsapp/templates";

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed when secret is unset
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now        = new Date();
  const fourHrsAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  const twoHrsAgo  = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  const leads = await prisma.abandonedLead.findMany({
    where: {
      followedUp: false,
      createdAt: {
        gte: fourHrsAgo,
        lte: twoHrsAgo,
      },
    },
  });

  const results = { sent: 0, failed: 0 };

  for (const lead of leads) {
    const res = await sendAbandonedLeadFollowup({
      phone:     lead.phone,
      guestName: lead.name ?? "Guest",
    });

    if (res.ok) {
      results.sent++;
      // Only mark as followed up if the send actually succeeded — otherwise
      // let the next cron retry. Bounded naturally by the 4h lookback window.
      await prisma.abandonedLead.update({
        where: { id: lead.id },
        data:  { followedUp: true, followedUpAt: now },
      });
    } else {
      results.failed++;
      console.error(`[Cron/abandoned-leads] Failed for ${lead.phone}:`, res.error);
    }
  }

  console.log("[Cron/abandoned-leads] run complete:", JSON.stringify(results));

  return NextResponse.json({ ok: true, results });
}
