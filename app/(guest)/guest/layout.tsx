import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Guest Portal | Chakwal Guest House", template: "%s | Guest Portal" },
  description: "Manage your stay at Chakwal Guest House.",
};

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-base">
      {children}
    </div>
  );
}
