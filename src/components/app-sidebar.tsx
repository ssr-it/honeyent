import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ShoppingCart,
  Truck,
  Scale,
  Route as RouteIcon,
  Users,
  Factory,
  Package,
  Bus,
  IdCard,
  FileText,
  Receipt,
  BarChart3,
  Mountain,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const sections = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/", icon: LayoutDashboard }],
  },
  {
    label: "Operations",
    items: [
      { title: "Orders", url: "/orders", icon: ShoppingCart },
      { title: "Dispatch", url: "/dispatch", icon: Truck },
      { title: "Weighbridge", url: "/weighbridge", icon: Scale },
      { title: "Trips", url: "/trips", icon: RouteIcon },
    ],
  },
  {
    label: "Masters",
    items: [
      { title: "Customers", url: "/customers", icon: Users },
      { title: "Suppliers", url: "/suppliers", icon: Factory },
      { title: "Products", url: "/products", icon: Package },
      { title: "Vehicles", url: "/vehicles", icon: Bus },
      { title: "Drivers", url: "/drivers", icon: IdCard },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Sales", url: "/sales", icon: FileText },
      { title: "Purchases", url: "/purchases", icon: Receipt },
      { title: "Reports", url: "/reports", icon: BarChart3 },
    ],
  },
  {
    label: "Setup",
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Mountain className="h-5 w-5" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="font-display text-sm font-semibold tracking-tight">Honey Enterprises</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">Stone &amp; Transport ERP</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
