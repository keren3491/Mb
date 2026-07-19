'use strict';

const FORM_FIELDS = ['synagogue', 'rabbi', 'dedication', 'geo', 'timezone', 'shacharit', 'mincha', 'maariv', 'tickerSpeed', 'musicUrl'];

function setForm(data) {
  const d = normalizeData(data);
  for (const key of FORM_FIELDS) $(key).value = d[key] ?? '';
  $('announcements').value = (d.announcements || []).join('\n');
  $('musicVolume').value = Math.round((d.musicVolume ?? DEFAULT_DATA.musicVolume) * 100);
}

function getForm() {
  return normalizeData({
    synagogue: $('synagogue').value.trim() || DEFAULT_DATA.synagogue,
    rabbi: $('rabbi').value.trim(),
    dedication: $('dedication').value.trim(),
    announcements: $('announcements').value.split(/\n+/).map(value => value.trim()).filter(Boolean),
    geo: $('geo').value.trim() || DEFAULT_DATA.geo,
    timezone: $('timezone').value.trim() || DEFAULT_DATA.timezone,
    shacharit: $('shacharit').value.trim(),
    mincha: $('mincha').value.trim(),
    maariv: $('maariv').value.trim(),
    tickerSpeed: Number($('tickerSpeed').value) || DEFAULT_DATA.tickerSpeed,
    musicUrl: $('musicUrl').value.trim(),
    musicVolume: Number($('musicVolume').value) / 100
  });
}

(async () => {
  setForm(await getBoardData());
  $('mode').textContent = firebaseReady()
    ? 'מצב ענן פעיל: השינויים יתעדכנו בכל המסכים בזמן אמת.'
    : 'מצב מקומי: יש להוסיף את פרטי Firebase בקובץ config.js כדי לעדכן מסכים מרחוק.';
})();

$('save').onclick = async () => {
  $('status').textContent = 'שומר...';
  try {
    const result = await saveBoardData(getForm());
    $('status').textContent = result.cloud
      ? 'נשמר בענן בהצלחה. כל המסכים יתעדכנו אוטומטית.'
      : 'נשמר במכשיר זה. כדי לסנכרן מרחוק, יש להגדיר Firebase.';
  } catch (error) {
    console.error(error);
    $('status').textContent = 'השמירה בענן נכשלה, אבל ההגדרות נשמרו במכשיר זה.';
  }
};

$('export').onclick = () => {
  const blob = new Blob([JSON.stringify(getForm(), null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'synagogue-board-settings.json';
  link.click();
  URL.revokeObjectURL(link.href);
};

$('import').onclick = () => $('file').click();
$('file').onchange = async event => {
  try {
    const file = event.target.files?.[0];
    if (!file) return;
    setForm(JSON.parse(await file.text()));
    $('status').textContent = 'הקובץ נטען. לחץ שמור ועדכן.';
  } catch {
    $('status').textContent = 'הקובץ אינו תקין.';
  } finally {
    event.target.value = '';
  }
};
