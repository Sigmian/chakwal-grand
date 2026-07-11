import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";

export async function DELETE() {
  try {
    const store = cookies();
    const token = store.get("cgh_customer_session")?.value;

    if (token) {
      await prisma.customerSession.deleteMany({ where: { token } }).catch(() => {});
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set("cgh_customer_session", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return res;
  } catch (err) {
    console.error("[Customer logout] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
