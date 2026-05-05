import { redirect } from "next/navigation";
import { loadProfile, saveProfile, type CareerProfile } from "../../../../lib/profile";

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawProfile = String(formData.get("profile") || "");
  const profile = rawProfile
    ? ({ ...loadProfile(), ...(JSON.parse(rawProfile) as Partial<CareerProfile>) } as CareerProfile)
    : loadProfile();

  saveProfile({
    ...profile,
    confirmed: true,
  });

  redirect("/onboarding?confirmed=1");
}
