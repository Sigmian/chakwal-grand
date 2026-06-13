import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared";
import { getAnnouncements } from "@/server/actions/settings";
import { AnnouncementsClient } from "@/features/settings/components/AnnouncementsClient";

export const metadata = { title: "Announcements" };

export default async function AnnouncementsPage() {
  const user          = await requirePermission("settings:branch");
  const canManage     = hasPermission(user.role, "settings:company");
  const announcements = await getAnnouncements();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <PageHeader
        title="Announcements"
        subtitle="Manage banner announcements shown to visitors on the public website"
      />
      <AnnouncementsClient announcements={announcements as any} canManage={canManage} />
    </div>
  );
}
