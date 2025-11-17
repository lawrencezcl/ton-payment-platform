import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import WebApp from "@twa-dev/sdk";

interface TelegramContextValue {
  webApp: typeof WebApp | null;
  user: {
    id: number;
    firstName: string;
    lastName?: string;
    username?: string;
    photoUrl?: string;
  } | null;
  isReady: boolean;
}

const TelegramContext = createContext<TelegramContextValue>({
  webApp: null,
  user: null,
  isReady: false,
});

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [webApp, setWebApp] = useState<typeof WebApp | null>(null);
  const [user, setUser] = useState<TelegramContextValue["user"]>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      WebApp.ready();
      setWebApp(WebApp);
      
      // Get Telegram user data
      const tgUser = WebApp.initDataUnsafe?.user;
      if (tgUser) {
        setUser({
          id: tgUser.id,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name,
          username: tgUser.username,
          photoUrl: tgUser.photo_url,
        });
      }
      
      // Expand to full height
      WebApp.expand();
      
      // Enable closing confirmation
      WebApp.enableClosingConfirmation();
      
      setIsReady(true);
    } catch (error) {
      console.error("Failed to initialize Telegram WebApp:", error);
      setIsReady(true); // Still set ready for development mode
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ webApp, user, isReady }}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error("useTelegram must be used within TelegramProvider");
  }
  return context;
}
