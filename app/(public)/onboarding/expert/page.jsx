import { redirect } from "next/navigation";

export default function ExpertOnboardingRedirect() {
  redirect("/onboarding/individual");
}