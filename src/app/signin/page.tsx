import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth/AuthScreen";

export const metadata: Metadata = {
  title: "Sign In | VitaMind",
  description: "Secure sign in experience for VitaMind users.",
};

export default function SignInPage() {
  return <AuthScreen />;
}
