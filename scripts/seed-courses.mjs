import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ufsqavndpjphowuacxfi.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmc3Fhdm5kcGpwaG93dWFjeGZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTExMzg3OCwiZXhwIjoyMDk2Njg5ODc4fQ.ntNcIPdTwLRIy25nScwqPs6d_RuT28l11Ttqoo7r8NU";

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  const contentPath = path.join(process.cwd(), "data", "content.json");
  const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));

  const rows = [];

  for (const c of content.courses || []) {
    rows.push({
      id: c.id,
      category: "academic",
      subject: c.subject,
      grade_level: c.gradeRange,
      exam_goal: c.examGoal || null,
      title: c.title,
      subtitle: c.subtitle,
      tier_match: c.tierMatch || "all",
      schedule_summary: c.schedule,
      seats_total: c.seatsTotal || 12,
      seats_remaining: c.seatsRemaining || 4,
      tuition_thb: c.tuitionThb || 0,
      duration_weeks: c.durationWeeks || 12,
    });
  }

  for (const a of content.activities || []) {
    rows.push({
      id: a.id,
      category: "activity",
      subject: a.discipline,
      grade_level: a.ageRange,
      exam_goal: null,
      title: a.title,
      subtitle: a.subtitle,
      tier_match: "all",
      schedule_summary: a.schedule,
      seats_total: 15,
      seats_remaining: a.seatsRemaining || 5,
      tuition_thb: a.trialFeeThb || 500,
      duration_weeks: 10,
    });
  }

  console.log(`Upserting ${rows.length} course/activity rows into public.courses...`);
  const { data, error } = await supabase.from("courses").upsert(rows, { onConflict: "id" }).select();

  if (error) {
    console.error("Error upserting courses:", error);
    process.exit(1);
  }

  console.log(`Successfully seeded ${data.length} courses/activities into Supabase!`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
