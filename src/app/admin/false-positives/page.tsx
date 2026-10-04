import { redirect } from "next/navigation";

/** Merged into Detection quality (/admin/model-drift), which shows drift and false positives together. */
export default function FalsePositivesRedirect() {
  redirect("/admin/model-drift");
}
