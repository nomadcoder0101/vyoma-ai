import { redirect } from "next/navigation";
import { loadProfileAsync, saveProfileAsync, type CareerProfile } from "../../../../lib/profile";

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawProfile = String(formData.get("profile") || "");
  const current = await loadProfileAsync();
  const profile = rawProfile
    ? ({ ...current, ...(JSON.parse(rawProfile) as Partial<CareerProfile>) } as CareerProfile)
    : current;

  await saveProfileAsync({
    ...profile,
    confirmed: true,
  });

  redirect("/onboarding?confirmed=1");
}
