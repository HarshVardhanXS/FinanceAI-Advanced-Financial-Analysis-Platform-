import { Home, BarChart3, Wallet, Star, Shield, Bell, Search, TrendingUp, Bot } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";

const mainItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "AI Analysis", url: "/ai", icon: Bot },
  { title: "Stock Browser", url: "/stocks", icon: Search },
  { title: "Portfolio", url: "/portfolio", icon: Wallet },
  { title: "Watchlist", url: "/watchlist", icon: Star },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Alerts", url: "/alerts", icon: Bell },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const { role } = useUserRole();
  const isMobile = useIsMobile();
  const collapsed = state === "collapsed";

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile, setOpen]);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 backdrop-blur-xl">
      <SidebarContent className="bg-background/95">
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground font-medium min-h-[44px]"
                          : "hover:bg-accent/50 min-h-[44px]"
                      }
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/options"
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground font-medium min-h-[44px]"
                          : "hover:bg-accent/50 min-h-[44px]"
                      }
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <TrendingUp className="h-5 w-5" />
                      {!collapsed && <span>Options Trading</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/admin"
                      className={({ isActive }) =>
                        isActive
                          ? "bg-accent text-accent-foreground font-medium min-h-[44px]"
                          : "hover:bg-accent/50 min-h-[44px]"
                      }
                      onClick={() => isMobile && setOpen(false)}
                    >
                      <Shield className="h-5 w-5" />
                      {!collapsed && <span>Admin Panel</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
