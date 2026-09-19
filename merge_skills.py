import json
import os

print("Starting merge...")

# Load the 1435 original agents
skills_path = "apps/web-app/public/skills.json"
with open(skills_path, "r", encoding="utf-8") as f:
    original_skills = json.load(f)

print(f"Loaded {len(original_skills)} original skills.")

# Load the 24 new/upgraded agents
backend_skills_path = "backend/skills_v2.json"
with open(backend_skills_path, "r", encoding="utf-8") as f:
    new_skills = json.load(f)

print(f"Loaded {len(new_skills)} new/upgraded skills.")

# Create a map for quick lookup
new_skill_ids = {s.get("id"): s for s in new_skills}

combined_skills = []

# First, add all new/upgraded skills to the combined list (they get priority)
for s in new_skills:
    combined_skills.append(s)

# Then, add the original skills if their ID is not in new_skills
added = 0
for s in original_skills:
    if s.get("id") not in new_skill_ids:
        combined_skills.append(s)
        added += 1

print(f"Added {added} original skills that were not overwritten.")
print(f"Total combined skills: {len(combined_skills)}")

# Write to both frontend and backend
frontend_target = "apps/web-app/public/skills_v2.json"
with open(frontend_target, "w", encoding="utf-8") as f:
    json.dump(combined_skills, f, indent=4, ensure_ascii=False)

with open(backend_skills_path, "w", encoding="utf-8") as f:
    json.dump(combined_skills, f, indent=4, ensure_ascii=False)

print("Merge complete!")
