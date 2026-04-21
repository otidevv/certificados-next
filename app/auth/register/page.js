import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { safeRedirectOr } from "@/lib/safe-redirect";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage({ searchParams }) {
  const [session, params] = await Promise.all([auth(), searchParams]);
  if (session?.user?.id) {
    redirect(safeRedirectOr(params?.redirect, "/"));
  }
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
