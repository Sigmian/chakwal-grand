import { prisma } from "@/lib/db/prisma";
import { executeAgentTool } from "@/lib/agent/tools";

async function withWake<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < 6; i++) {
    try { return await fn(); }
    catch (e) {
      if (String(e).includes("reach database")) { await new Promise(r => setTimeout(r, 8000)); continue; }
      throw e;
    }
  }
  throw new Error("DB unreachable after retries");
}

const b = await withWake(() => prisma.booking.findFirst({
  where: { status: { in: ["PENDING", "CONFIRMED"] } },
  include: { customer: { select: { phone: true } } },
}));
if (!b) { console.log("No PENDING/CONFIRMED booking — skipping."); process.exit(0); }

const victimPhone = b.customer.phone;
console.log(`Booking ${b.bookingRef} owned by ${victimPhone}, status=${b.status}`);

const attack = await executeAgentTool(
  "cancel_booking",
  { booking_ref: b.bookingRef, guest_phone: victimPhone },
  "923009999999",
) as { success?: boolean; error?: string };
const afterAttack = await prisma.booking.findUnique({ where: { id: b.id }, select: { status: true } });
console.log("Attack result:", JSON.stringify(attack));
console.log("Status after attack:", afterAttack?.status);
console.log(attack.success === false && afterAttack?.status === b.status ? ">>> DENY PATH: PASS" : ">>> DENY PATH: FAIL");

const legit = await executeAgentTool(
  "cancel_booking",
  { booking_ref: "BK-DOES-NOT-EXIST", guest_phone: "irrelevant" },
  victimPhone,
) as { success?: boolean; error?: string };
console.log("Legit-owner bogus ref:", JSON.stringify(legit));
console.log(legit.error === "Booking not found." ? ">>> ALLOW PATH: PASS (identity ok, only ref failed)" : ">>> ALLOW PATH: CHECK");

await prisma.$disconnect();
