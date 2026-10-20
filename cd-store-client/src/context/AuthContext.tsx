
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type Role = "ADMIN" | "STAFF" | "CUSTOMER";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: Role | null;
  isLoading: boolean;
  logout: () => Promise<void>;
};

const API_URL = import.meta.env.VITE_API_URL;

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

type AuthProviderProps = {
  children: ReactNode;
};

const isRole = (value: unknown): value is Role =>
  value === "ADMIN" ||
  value === "STAFF" ||
  value === "CUSTOMER";

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserRole = async (
    currentSession: Session
  ): Promise<Role | null> => {
    if (!API_URL) {
      console.error("VITE_API_URL is not configured.");
      return null;
    }

    try {
      const response = await fetch(
        `${API_URL.replace(/\/$/, "")}/users/me/role`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${currentSession.access_token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const result = await response.json().catch(() => null);

        console.error(
          "Failed to load user role:",
          response.status,
          result?.message ?? response.statusText
        );

        return null;
      }

      const result: unknown = await response.json();

      if (
        typeof result !== "object" ||
        result === null ||
        !("role" in result) ||
        !isRole(result.role)
      ) {
        console.error("The API returned an invalid user role.");
        return null;
      }

      return result.role;
    } catch (error) {
      console.error("Unable to connect to the role API:", error);
      return null;
    }
  };

  useEffect(() => {
    let active = true;
    let latestSession: Session | null = null;
    let requestId = 0;

    const syncSession = async (currentSession: Session | null) => {
      latestSession = currentSession;
      const currentRequestId = ++requestId;

      if (!active) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setRole(null);

      if (!currentSession) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const nextRole = await loadUserRole(currentSession);

      if (
        !active ||
        currentRequestId !== requestId ||
        latestSession?.user.id !== currentSession.user.id
      ) {
        return;
      }

      setRole(nextRole);
      setIsLoading(false);
    };

    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        console.error("Failed to get session:", error);
        setIsLoading(false);
        return;
      }

      await syncSession(data.session);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      // Avoid awaiting network requests inside the auth callback.
      void syncSession(currentSession);
    });

    void initialize();

    return () => {
      active = false;
      requestId++;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
};
