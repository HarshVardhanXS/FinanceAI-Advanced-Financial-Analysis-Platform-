import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "alert" | "info" | "success" | "warning";
  is_read: boolean;
  created_at: string;
}

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscription();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications((data || []) as Notification[]);
      setUnreadCount(data?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast.info(payload.new.title);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative group">
          <Bell className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:text-primary" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-bounce-in pulse-glow"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 animate-fade-in" align="end">
        <div className="flex items-center justify-between border-b p-4 bg-card/50 backdrop-blur-sm">
          <h3 className="font-semibold font-heading">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="hover:scale-105 transition-transform">
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground animate-fade-in">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
              <p>No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-accent/50 transition-all duration-200 fade-slide-in ${
                    !notification.is_read ? "bg-accent/20 border-l-2 border-primary" : ""
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm font-heading">{notification.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-success/10 hover:text-success transition-all hover:scale-110"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-danger/10 hover:text-danger transition-all hover:scale-110"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
