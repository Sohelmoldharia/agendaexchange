"use client";

import { usePathname } from "next/navigation";

/**
 * Renders its children everywhere EXCEPT routes under `prefix`. Used so the
 * FANDX chrome (nav, ticker tape, footer) stays out of the /anime directory,
 * which ships its own shell — without moving any FANDX route files.
 */
export function PathHide({
  prefix,
  children,
}: {
  prefix: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  if (pathname === prefix || pathname?.startsWith(prefix + "/")) return null;
  return <>{children}</>;
}
