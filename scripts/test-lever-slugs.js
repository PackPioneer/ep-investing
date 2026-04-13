const slugs = [
  "watershedclimate",
  "heirloomcarbon", 
  "cfs",
  "fervoenergy",
  "nexamp",
  "form-energy",
  "crusoe",
  "leveltenenergy",
  "turntide",
  "twelve-co",
  "southpolegroup",
  "zeroavia",
  "stem-inc",
  "lanzatech",
  "xpansiv",
  "palmettocleantech",
];

async function test() {
  for (const slug of slugs) {
    const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
    const jobs = await res.json();
    const count = Array.isArray(jobs) ? jobs.length : 0;
    if (count > 0) console.log(`✅ ${slug}: ${count} jobs`);
    else console.log(`❌ ${slug}: 0 jobs`);
    await new Promise(r => setTimeout(r, 300));
  }
}

test();
