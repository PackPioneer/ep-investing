import { redirect } from "next/navigation";

export default function ResearcherOnboardingRedirect() {
  redirect("/onboarding/individual");
}