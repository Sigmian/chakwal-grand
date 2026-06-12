import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Guest Portal | Chakwal Grand", template: "%s | Guest Portal" },
  description: "Manage your stay at Chakwal Grand Guest House.",
};

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-base">
      {children}
    </div>
  );
}
