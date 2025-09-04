import { useState, useEffect } from "react";
import { alertsStore } from "@/bridge/alertsStore";

export function useAlertsBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load initial count
    const loadCount = () => {
      setUnreadCount(alertsStore.unreadCount());
    };

    loadCount();

    // Listen for badge updates
    const handleBadgeUpdate = (e: CustomEvent) => {
      setUnreadCount(e.detail.count);
    };

    // Listen for new alerts
    const handleNewAlert = () => {
      setUnreadCount(alertsStore.unreadCount());
    };

    window.addEventListener('alerts:badge:update', handleBadgeUpdate as EventListener);
    window.addEventListener('blossom:alert', handleNewAlert);

    return () => {
      window.removeEventListener('alerts:badge:update', handleBadgeUpdate as EventListener);
      window.removeEventListener('blossom:alert', handleNewAlert);
    };
  }, []);

  return unreadCount;
}

