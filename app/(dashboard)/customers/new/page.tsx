import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { NewCustomerForm } from "@/features/customers/components/NewCustomerForm";

export const metadata = { title: "New Customer" };

export default async function NewCustomerPage() {
  await requirePermission("customers:create");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/customers" className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground font-serif">Add Customer</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Register a new guest in the system</p>
        </div>
      </div>
      <NewCustomerForm />
    </div>
  );
}
