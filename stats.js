// recruit-ladies-playwright.js
module.exports = async function runStatsExtractor(page) {
  // -------------------------------
  // Phase 1: Profile ID Extraction
  // -------------------------------
  console.log("🚀 Starting Phase 1: Profile ID Extraction (No Club)");

  // 🔧 SURGICAL EDIT #1: MULTIPLE RANGES
  const ranges = [
    //{ tierId: 9, startPage: 1, endPage: 85 }, // tier 10 (50+)
    //{ tierId: 8, startPage: 1, endPage: 91 },
    //{ tierId: 7, startPage: 1, endPage: 126 },
    //{ tierId: 6, startPage: 1, endPage: 144 },
    //{ tierId: 5, startPage: 1, endPage: 191 },
    //{ tierId: 4, startPage: 1, endPage: 193 },
    //{ tierId: 3, startPage: 1, endPage: 298 },
    { tierId: 10, startPage: 1, endPage: 126 }, // lvl 69 and above
    // add/remove ranges as needed
  ];

  let allProfiles = [];

  await page.goto('https://v3.g.ladypopular.com', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);

  // 🔧 SURGICAL EDIT #2: LOOP OVER RANGES
  for (const { tierId, startPage, endPage } of ranges) {
    console.log(`\n🧩 Running range: Tier ${tierId} | Pages ${startPage} → ${endPage}`);
    console.log(`🔍 Scanning pages ${startPage} → ${endPage}`);

    for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
      console.log(`📄 Processing page ${currentPage} (Tier ${tierId})...`);

      try {
        const profilesOnPage = await page.evaluate(async ({ currentPage, tierId }) => {
          const res = await fetch('/ajax/ranking/players.php', {
            method: 'POST',
            body: new URLSearchParams({
              action: 'getRanking',
              page: currentPage.toString(),
              tierId: tierId.toString()
            }),
            credentials: 'same-origin'
          });

          const data = await res.json();
          if (!data.html) return [];

          const container = document.createElement('div');
          container.innerHTML = data.html;
          const rows = container.querySelectorAll('tr');
          const results = [];

          rows.forEach(row => {
            const profileLink = row.querySelector('.player-avatar a');
            const guildCell = row.querySelector('.ranking-player-guild');
            if (!profileLink || !guildCell) return;
            if (guildCell.querySelector('a')) return; // player IS in a club

            const href = profileLink.getAttribute('href');
            const idMatch = href.match(/lady_id=(\d+)/);
            if (!idMatch) return;

            const nameEl = row.querySelector('.player-avatar-name');
            const name = nameEl ? nameEl.textContent.trim() : 'Unknown';

            results.push({ ladyId: idMatch[1], name });
          });

          return results;
        }, { currentPage, tierId });

        console.log(`   🎯 Found ${profilesOnPage.length} profiles without club`);
        allProfiles.push(...profilesOnPage);
      } catch (err) {
        console.log(`❌ Error on page ${currentPage}: ${err.message}`);
      }

      await page.waitForTimeout(2000);
    }
  }

  console.log("✅ Phase 1 Complete");
  console.log(`👭 Total profiles without club: ${allProfiles.length}`);
  console.log("📋 Sample output:", allProfiles.slice(0, 5));

  // =====================================================
  // 🔒 SURGICAL ADDITION: NAME-BASED EXCLUSION FILTER
  // =====================================================

  // ✏️ Add names here (case-insensitive)
  const excludedNames = [
    "Nata_",//join n left
    "Kaisee",//rej
    "Raquel",//rej
    "Serena", //rej
    "Athenaya",//jon n left, rej
    "Whis",//rej
    "Insannie",//rej
    "Loreta",//rej
    "Anouk C.",//rej twice
    "Louise B",//rej twice
    "JеωеƖ",//rej w/ msg
    "Loki",//rej
    "Wiggy",
    "JoAnne", //rej w/ msg
    "Matska",
    "Ива Лени",// universe team president - helper friend
    "zani ali",//kicked - partial activity - not joining fights
    "Mikasapisame",//kicked - partial activity - not joining fights
    "FΣΛЯLΣSS",//kicked - partial activity - not joining fights
    "Luna",// rej
    "Lina",
    /* "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",//
    "_",// */    
  ];

  // Normalize exclusion list once
  const exclusionSet = new Set(
    excludedNames.map(name => name.toLowerCase().trim())
  );

  const excludedLadies = [];
  const filteredLadies = [];

  for (const lady of allProfiles) {
    const normalizedName = lady.name.toLowerCase().trim();

    if (exclusionSet.has(normalizedName)) {
      excludedLadies.push(lady);
    } else {
      filteredLadies.push(lady);
    }
  }

  // 🐞 Debug logging (read-only, safe)
  if (excludedLadies.length > 0) {
    console.log(`🚫 Excluded ${excludedLadies.length} ladies from invites:`);
    excludedLadies.forEach(lady => {
      console.log(`   ❌ ${lady.name} (ID: ${lady.ladyId})`);
    });
  } else {
    console.log("🚫 No ladies excluded by name filter");
  }

  const allLadies = filteredLadies;

  // -------------------------------
  // Phase 2: Sending Invites
  // -------------------------------
  if (allLadies.length === 0) {
    console.log("❌ No ladies to invite after filtering. Phase skipped.");
    return;
  }

  console.log(`🚀 Starting Phase 3: Sending invites to ${allLadies.length} ladies`);

  const inviteMessage = `Hello sweetheart! I"d love to invite you to our club, LOYALTY. Joining us boosts your stats by 50%, gives you 25% more dollars from Beauty Pageant wins, your blue energy refills 5 minutes faster, and your maximum blue energy limit increases from 10 to 13. We dont require any donations and we place no pressure on gameplay or activity, you can continue playing exactly the way you already do. Your presence would truly strengthen our club, and it would be a pleasure to have you with us (◍•ᴗ•◍)❤`;

  for (let i = 0; i < allLadies.length; i++) {
    const lady = allLadies[i];

    console.log(`📤 Sending invite ${i + 1}/${allLadies.length}`);
    console.log(`   👩 Name: ${lady.name}`);
    console.log(`   🆔 Lady ID: ${lady.ladyId}`);
    console.log(`   🌐 Current page: ${await page.url()}`);

    try {
      const res = await page.evaluate(async ({ ladyId, message }) => {
        const response = await fetch('/ajax/guilds.php', {
          method: 'POST',
          body: new URLSearchParams({
            type: 'invite',
            lady: ladyId,
            message
          }),
          credentials: 'same-origin'
        });
        return await response.json();
      }, { ladyId: lady.ladyId, message: inviteMessage });

      console.log(`   📝 Response: ${JSON.stringify(res)}`);

      if (res.status === 1) {
        console.log(`✅ Invite sent to ${lady.name} (${lady.ladyId})`);
      } else {
        console.log(`⚠️ Failed to send invite to ${lady.name} (${lady.ladyId}): ${res.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.log(`❌ Error sending invite to ${lady.name} (${lady.ladyId}): ${err.message}`);
    }

    await page.waitForTimeout(2000);
  }

  console.log("✅ Phase 3 Complete. All invites processed.");
};
