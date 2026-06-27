import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared";
import { ZaraKnowledgeForm } from "@/features/settings/components/ZaraKnowledgeForm";
import { getZaraKnowledge } from "@/server/actions/zara-knowledge";

export const metadata = { title: "Zara AI Knowledge" };

export default async function ZaraKnowledgePage() {
  await requirePermission("settings:ai");
  const knowledge = await getZaraKnowledge();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <PageHeader
        title="Zara AI Knowledge"
        subtitle="Control what Zara tells guests — update anytime without a redeploy"
      />
      <ZaraKnowledgeForm initial={knowledge} />
    </div>
  );
}
