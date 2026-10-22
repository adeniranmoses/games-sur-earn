"use client";

import { SessionProvider } from "next-auth/react";

// This component wraps our entire app so that any page can access
// the current user's session (who is logged in)
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
