import type { Metadata } from "next";
import { ForgotPasswordFlow } from "@/components/admin/auth/password-reset-flow";

export const metadata: Metadata = {
  title: "Forgot password · VitaMind Admin",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordFlow />;
}
