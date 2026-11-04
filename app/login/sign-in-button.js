"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      className="microsoft-button"
      type="button"
      onClick={() => signIn("azure-ad", { callbackUrl: "/account" })}
    >
      <span className="microsoft-mark" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
      Continue with Microsoft
    </button>
  );
}
