import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/market");
  return (
    <div className="mx-auto flex min-h-[72vh] max-w-7xl items-center justify-center px-4 py-12">
      <AuthForm mode="login" />
    </div>
  );
}
