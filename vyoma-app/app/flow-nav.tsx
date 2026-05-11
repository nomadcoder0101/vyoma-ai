"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { navItems } from "../lib/content";

export function FlowNav() {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  if (!isLoaded || !isSignedIn) return null;

  return (
    <nav className="flowNav" aria-label="Job search workflow">
      {navItems.map((item, index) => (
        <Link
          aria-current={pathname === item.href ? "page" : undefined}
          className={pathname === item.href ? "active" : ""}
          href={item.href}
          key={item.href}
        >
          <span>{index + 1}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
