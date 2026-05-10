"use client";

import { useClerk, useUser, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowRight, Settings } from "lucide-react";

type AuthControlsProps = {
  variant?: "nav" | "hero" | "login";
  signInRedirectUrl?: string;
  signUpRedirectUrl?: string;
};

export function AuthControls({
  variant = "nav",
  signInRedirectUrl = "/dashboard",
  signUpRedirectUrl = "/onboarding",
}: AuthControlsProps) {
  const { isSignedIn, isLoaded } = useUser();
  const clerk = useClerk();
  const className = `authControls ${variant === "hero" ? "heroAuthControls" : ""}`;

  if (!isLoaded) {
    return <div className={className} aria-hidden="true" />;
  }

  if (isSignedIn) {
    return (
      <div className={className}>
        <Link className="button primary" href="/dashboard">
          Open dashboard <ArrowRight size={16} />
        </Link>
        {variant === "nav" ? (
          <Link className="iconOnly" href="/settings" aria-label="Settings" title="Settings">
            <Settings size={18} />
          </Link>
        ) : null}
        <UserButton />
      </div>
    );
  }

  return (
    <div className={className}>
      <button
        className="button primary"
        type="button"
        onClick={() => clerk.openSignUp({ fallbackRedirectUrl: signUpRedirectUrl })}
      >
        Create account
      </button>
      <button
        className="button secondary"
        type="button"
        onClick={() => clerk.openSignIn({ fallbackRedirectUrl: signInRedirectUrl })}
      >
        Sign in
      </button>
    </div>
  );
}
