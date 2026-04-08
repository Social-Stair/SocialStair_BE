const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { initializeApp } = require('firebase-admin/app');
const { getPrevTag, calcSection } = require('./services/tagService');
const { updateStats, updateManualStats } = require('./services/statsService');

initializeApp();

exports.onTagCreated = onDocumentCreated('tags/{docId}', async (event) => {
  const { cardUid, floor, inputType } = event.data.data();

  if (inputType === 'manual') {
    await updateManualStats(floor);
    return;
  }

  const prevTag = await getPrevTag(cardUid);
  if (!prevTag) return;

  const { floorsClimbed, sectionKey } = calcSection(prevTag.floor, floor);
  if (floorsClimbed === 0) return;

  await updateStats(floorsClimbed, sectionKey);
});
