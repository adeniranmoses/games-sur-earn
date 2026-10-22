"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-red-400 font-medium hover:text-red-300 transition-colors text-sm"
    >
      Sign Out
    </button>
  );
}
