import { redirect } from "next/navigation";
import { SIGNIN_PATH } from "@/lib/auth/constants";

/** Legacy URL: admin sign-in now lives at /auth/admin/signin. */
export default function LegacySignInPage() {
  redirect(SIGNIN_PATH);
}
