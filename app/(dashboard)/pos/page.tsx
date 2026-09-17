// POS landing — go straight to a new receipt (the most common action).
import { redirect } from "next/navigation";

export default function PosIndexPage() {
  redirect("/pos/new");
}
