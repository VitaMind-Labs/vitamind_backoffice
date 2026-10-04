import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInFlow } from "@/components/admin/auth/sign-in-flow";

export const metadata: Metadata = {
  title: "Sign in · VitaMind Admin",
  robots: { index: false, follow: false },
};

export default function AdminSignInPage() {
  return (
    <Suspense>
      <SignInFlow />
    </Suspense>
  );
}
