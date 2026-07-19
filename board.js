'use strict';

let BOARD = normalizeData();
let lastLoadedDate = '';
let builtInAudio = null;
const days = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת קודש'];

function parts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BOARD.timezone,
    year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  return Object.fromEntries(formatter.formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
}

function ymd() {
  const value = parts();
  return `${value.year}-${value.month}-${value.day}`;
}

function addDays(date, amount) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + amount, 12)).toISOString().slice(0, 10);
}

function formatTime(iso) {
  if (!iso) return '--:--';
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: BOARD.timezone,
    hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date(iso));
}

function choose(object, keys) {
  for (const key of keys) if (object?.[key]) return object[key];
  return null;
}

function applyData(data) {
  BOARD = normalizeData(data);
  $('synagogueName').textContent = BOARD.synagogue;
  $('shacharit').textContent = BOARD.shacharit;
  $('mincha').textContent = BOARD.mincha;
  $('maariv').textContent = BOARD.maariv;
  $('dedication').textContent = BOARD.dedication;
  $('dedication').hidden = !BOARD.dedication;
  $('ticker').style.animationDuration = `${BOARD.tickerSpeed}s`;
  $('music').volume = BOARD.musicVolume;
  $('music').src = BOARD.musicUrl || '';
  document.title = `לוח ${BOARD.synagogue}`;
  loadBoard();
}

function tick() {
  const value = parts();
  const hour = value.hour === '24' ? '00' : value.hour;
  $('clock').textContent = `${hour}:${value.minute}:${value.second}`;
  $('gregDate').textContent = `${value.month}.${value.day}.${value.year}`;
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(value.weekday);
  $('dayName').textContent = Number(hour) >= 18 && dayIndex < 6
    ? `ליל ${days[(dayIndex + 1) % 7].replace('יום ', '')}`
    : days[dayIndex];
  try {
    $('hebrewTop').textContent = new Intl.DateTimeFormat('he-u-ca-hebrew', {
      timeZone: BOARD.timezone, day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date());
  } catch {}

  const today = `${value.year}-${value.month}-${value.day}`;
  if (lastLoadedDate && today !== lastLoadedDate) loadBoard();
}

async function getJSON(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

async function loadBoard() {
  const currentDate = ymd();
  lastLoadedDate = currentDate;
  try {
    const zmanim = await getJSON(`https://www.hebcal.com/zmanim?cfg=json&geonameid=${encodeURIComponent(BOARD.geo)}&date=${currentDate}`);
    const times = zmanim.times || {};
    $('alot').textContent = formatTime(choose(times, ['alotHaShachar', 'alotHaShachar72']));
    $('sunrise').textContent = formatTime(times.sunrise);
    $('shema').textContent = formatTime(choose(times, ['sofZmanShma', 'sofZmanShmaMGA']));
    $('chatzot').textContent = formatTime(times.chatzot);
    $('minchaGedola').textContent = formatTime(times.minchaGedola);
    $('sunset').textContent = formatTime(times.sunset);
    $('tzeit').textContent = formatTime(choose(times, ['tzeit7083deg', 'tzeit85deg', 'tzeit42min']));

    const shabbat = await getJSON(`https://www.hebcal.com/shabbat?cfg=json&geonameid=${encodeURIComponent(BOARD.geo)}&M=on&leyning=off&lg=he`);
    const items = shabbat.items || [];
    const parashah = items.find(item => item.category === 'parashat');
    const candles = items.find(item => item.category === 'candles');
    const havdalah = items.find(item => item.category === 'havdalah');
    $('parasha').textContent = (parashah?.hebrew || parashah?.title || 'שבת').replace(/^פרשת\s+/, '');
    $('candles').textContent = candles ? formatTime(candles.date) : '--:--';
    $('havdalah').textContent = havdalah ? formatTime(havdalah.date) : '--:--';
    $('hebrewDate').textContent = new Intl.DateTimeFormat('he-u-ca-hebrew', {
      timeZone: BOARD.timezone, day: 'numeric', month: 'long'
    }).format(new Date());

    const end = addDays(currentDate, 120);
    const calendar = await getJSON(`https://www.hebcal.com/hebcal?v=1&cfg=json&start=${currentDate}&end=${end}&maj=on&min=on&mod=on&nx=on&mf=on&lg=he&geo=geoname&geonameid=${encodeURIComponent(BOARD.geo)}`);
    const fast = (calendar.items || []).find(item => item.category === 'fast' && String(item.date).slice(0, 10) >= currentDate);
    if (fast) {
      const fastDate = String(fast.date).slice(0, 10);
      $('fastName').textContent = fast.hebrew || fast.title;
      const [year, month, day] = fastDate.split('-').map(Number);
      $('fastDate').textContent = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })
        .format(new Date(Date.UTC(year, month - 1, day, 12)));
      const longFast = /יום כיפור|תשעה באב|Yom Kippur|Tish/i.test(`${fast.hebrew || ''}${fast.title || ''}`);
      const fastZmanim = await getJSON(`https://www.hebcal.com/zmanim?cfg=json&geonameid=${encodeURIComponent(BOARD.geo)}&date=${longFast ? addDays(fastDate, -1) : fastDate}`);
      $('fastStart').textContent = formatTime(longFast
        ? fastZmanim.times?.sunset
        : choose(fastZmanim.times || {}, ['alotHaShachar', 'alotHaShachar72']));
    } else {
      $('fastName').textContent = 'אין צום קרוב';
      $('fastDate').textContent = '';
      $('fastStart').textContent = '--:--';
    }

    const messages = [
      `ברוכים הבאים ל${BOARD.synagogue}`,
      BOARD.rabbi && `מרא דאתרא: ${BOARD.rabbi}`,
      parashah && `פרשת ${$('parasha').textContent}`,
      ...(BOARD.announcements || [])
    ].filter(Boolean);
    $('ticker').textContent = messages.join(' • ');
  } catch (error) {
    console.error(error);
    $('ticker').textContent = `${BOARD.synagogue} • השעון פעיל • לעדכון זמני היום נדרש חיבור לאינטרנט`;
  }
}

function stopBuiltInMelody() {
  if (!builtInAudio) return;
  clearInterval(builtInAudio.timer);
  builtInAudio.context.close();
  builtInAudio = null;
}

function startBuiltInMelody() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;
  const context = new AudioContextClass();
  const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
  let index = 0;
  const playNote = () => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = notes[index++ % notes.length];
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.005, BOARD.musicVolume * 0.07), context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.75);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.8);
  };
  playNote();
  builtInAudio = { context, timer: setInterval(playNote, 900) };
  return true;
}

async function toggleMusic() {
  const button = $('musicButton');
  const audio = $('music');
  const playing = !audio.paused || Boolean(builtInAudio);
  if (playing) {
    audio.pause();
    stopBuiltInMelody();
    button.textContent = '▶';
    button.setAttribute('aria-label', 'הפעל מוזיקה');
    return;
  }

  try {
    if (BOARD.musicUrl) {
      audio.src = BOARD.musicUrl;
      audio.volume = BOARD.musicVolume;
      await audio.play();
    } else if (!startBuiltInMelody()) {
      throw new Error('Audio is not supported');
    }
    button.textContent = '❚❚';
    button.setAttribute('aria-label', 'עצור מוזיקה');
  } catch (error) {
    console.error(error);
    button.textContent = '▶';
  }
}

$('musicButton').addEventListener('click', toggleMusic);
$('music').addEventListener('pause', () => {
  if (!builtInAudio) $('musicButton').textContent = '▶';
});
$('music').addEventListener('play', () => { $('musicButton').textContent = '❚❚'; });

tick();
setInterval(tick, 1000);
watchBoardData(applyData);
setInterval(loadBoard, 30 * 60 * 1000);
