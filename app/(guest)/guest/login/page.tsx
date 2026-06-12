import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getGuestSession } from "@/server/actions/guest";
import { GuestLoginForm } from "@/features/guest/components/GuestLoginForm";

export const metadata: Metadata = { title: "Sign In" };

export default async function GuestLoginPage() {
  const session = await getGuestSession();
  if (session) redirect("/guest/dashboard");

  return <GuestLoginForm />;
}
