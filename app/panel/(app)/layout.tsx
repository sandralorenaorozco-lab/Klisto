import { requirePanel } from "@/lib/auth";
import { PanelNav } from "@/components/panel/panel-nav";

export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const session = await requirePanel();
  const { business, member } = session;

  return (
    <div className="flex min-h-dvh flex-1 flex-col bg-mist">
      <PanelNav
        role={member.role}
        displayName={member.display_name}
        businessName={business.name}
        businessSlug={business.slug}
        suspended={business.subscription_status === "suspended"}
      />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
