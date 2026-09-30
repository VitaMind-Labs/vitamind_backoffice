import { notFound } from "next/navigation";

/** Retired: the backend exposes no matching admin endpoint. Kept as a 404 until the unused files are removed. */
export default function RetiredPage() {
  notFound();
}
