(() => {
'use strict';
const C=window.BOARD_CONFIG;
const U=window.BoardUtil;

function applySettings(){
  const s=U.settings();
  U.set('synagogue',s.synagogue);
  U.set('rabbi',s.rabbi?`הרב ${String(s.rabbi).replace(/^הרב\s+/,'')}`:'שם הרב');
  ['shacharit','mincha','maariv','lesson'].forEach(id=>U.set(id,s[id]));
  U.set('ticker',[s.announcements,s.dedication].filter(Boolean).join(' • '));
}

function timeAt(zone){
  return new Intl.DateTimeFormat('en-US',{
    timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false
  }).format(new Date());
}

function seasonalPrayer(now=new Date()){
  const {day,month}=U.hebrewParts(now);
  const winterMonths=new Set(['Heshvan','Kislev','Tevet','Shevat','Adar','Adar I','Adar II']);
  const winter=(month==='Tishri'&&day>=22)||winterMonths.has(month)||(month==='Nisan'&&day<15);
  return winter?'מַשִּׁיב הָרוּחַ וּמוֹרִיד הַגֶּשֶׁם':'מוֹרִיד הַטָּל';
}

function birkatHashanim(now=new Date()){
  const {day,month}=U.hebrewParts(now);
  if(month==='Nisan'&&day>=15) return 'בָּרְכֵנוּ';
  if(['Iyyar','Sivan','Tammuz','Av','Elul','Tishri','Heshvan','Kislev'].includes(month)){
    const local=new Date(now.toLocaleString('en-US',{timeZone:C.timeZone}));
    const year=local.getFullYear();
    const centuryShift=(year>=2100);
    const startDay=centuryShift?6:5;
    if(month==='Kislev' || local>=new Date(year,11,startDay)) return 'בָּרֵךְ עָלֵינוּ';
    return 'בָּרְכֵנוּ';
  }
  return 'בָּרֵךְ עָלֵינוּ';
}

function tick(){
  const now=new Date();
  U.set('nyClock',timeAt(C.timeZone));
  U.set('israelClock',timeAt(C.israelTimeZone));
  U.set('civilDate',new Intl.DateTimeFormat('he-IL',{
    timeZone:C.timeZone,weekday:'long',year:'numeric',month:'long',day:'numeric'
  }).format(now));
  U.set('hebrewDate',new Intl.DateTimeFormat('he-u-ca-hebrew',{
    timeZone:C.timeZone,day:'numeric',month:'long',year:'numeric'
  }).format(now));
  U.set('seasonalPrayer',seasonalPrayer(now));
  U.set('birkatHashanim',birkatHashanim(now));
}

function dailyGuidance(items,now=new Date()){
  const hp=U.hebrewParts(now);
  const isSat=new Intl.DateTimeFormat('en-US',{timeZone:C.timeZone,weekday:'short'}).format(now)==='Sat';
  const rosh=U.has(items,[/ראש חודש|Rosh Chodesh/i]);
  const chanukah=U.has(items,[/חנוכה|Chanukah/i]);
  const purim=U.has(items,[/פורים|Purim/i]);
  const pesach=U.has(items,[/פסח|Pesach/i]);
  const shavuot=U.has(items,[/שבועות|Shavuot/i]);
  const sukkot=U.has(items,[/סוכות|Sukkot|שמיני עצרת|Shemini Atzeret|שמחת תורה|Simchat Torah/i]);
  const rh=U.has(items,[/ראש השנה|Rosh Hashana/i]);
  const yomKippur=U.has(items,[/יום כיפור|Yom Kippur/i]);

  U.set('yaalehVeyavo',(rosh||pesach||shavuot||sukkot||rh)?'אומרים':'אין אומרים');
  U.set('alHanissim',(chanukah||purim)?'אומרים':'אין אומרים');
  U.set('roshChodesh',rosh?'היום ראש חודש':'לא היום');

  let hallel='אין הלל';
  if(chanukah||shavuot||sukkot) hallel='הלל שלם';
  else if(rosh||pesach) hallel='חצי הלל';
  U.set('hallel',hallel);

  const noTachanun=isSat||rosh||chanukah||purim||pesach||shavuot||sukkot||rh||yomKippur||
    hp.month==='Nisan'||(hp.month==='Sivan'&&hp.day<=12)||
    (hp.month==='Av'&&(hp.day===9||hp.day===15))||hp.month==='Tishri'||
    (hp.month==='Shevat'&&hp.day===15)||(hp.month==='Iyyar'&&(hp.day===14||hp.day===18));
  U.set('tachanun',noTachanun?'אין אומרים':'אומרים');

  const special=rosh||chanukah||pesach||shavuot||sukkot||rh||yomKippur;
  U.set('avHarachamim',isSat?(special?'אין אומרים':'אומרים'):'רק בשבת');
  U.set('shabbatCustoms',isSat?(noTachanun?'אין צדקתך • ויתן לך במוצ״ש':'צדקתך • ויתן לך במוצ״ש'):'לשבת בלבד');
}

async function getJson(url){
  const sep=url.includes('?')?'&':'?';
  const response=await fetch(`${url}${sep}_=${Date.now()}`,{cache:'no-store'});
  if(!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

async function loadCalendar(){
  const today=U.nyDateISO();
  const endDate=new Date();
  endDate.setDate(endDate.getDate()+30);
  const end=U.nyDateISO(endDate);

  try{
    const shabbat=await getJson(`https://www.hebcal.com/shabbat?cfg=json&geonameid=${C.geonameId}&M=on&leyning=off&lg=he`);
    const items=shabbat.items||[];
    const parasha=items.find(x=>x.category==='parashat');
    const candles=items.find(x=>x.category==='candles');
    const havdalah=items.find(x=>x.category==='havdalah');
    U.set('parasha',parasha?U.title(parasha).replace(/^פרשת\s+/,''):'שבת');
    U.set('candles',candles?U.fmtTime(candles.date):'--:--');
    U.set('havdalah',havdalah?U.fmtTime(havdalah.date):'--:--');
  }catch(error){
    console.error(error);
    U.set('parasha','לא זמין');
  }

  try{
    const daily=await getJson(`https://www.hebcal.com/hebcal?cfg=json&v=1&F=on&o=on&maj=on&min=on&mod=on&nx=on&lg=he&start=${today}&end=${end}&geo=geoname&geonameid=${C.geonameId}&M=on`);
    const all=daily.items||[];
    const todays=all.filter(x=>String(x.date||'').slice(0,10)===today);
    const daf=todays.find(x=>x.category==='dafyomi');
    const omer=todays.find(x=>x.category==='omer');
    const holidays=todays.filter(x=>['holiday','roshchodesh','fast'].includes(x.category));
    const fast=holidays.find(x=>/צום|תענית|Fast|Tish'a B'Av|Yom Kippur/i.test(U.title(x)));
    const event=holidays.find(x=>x!==fast);

    U.set('dafYomi',daf?U.title(daf):'לא זמין');
    U.set('omer',omer?U.title(omer).replace(/^היום\s*/,''):'לא בתקופת העומר');
    U.set('event',event?U.title(event):'אין אירוע מיוחד');
    U.set('fastName',fast?U.title(fast):'אין צום היום');

    const upcoming=all.find(x=>String(x.date||'').slice(0,10)>today&&['holiday','roshchodesh','fast'].includes(x.category));
    U.set('upcomingHoliday',upcoming?`${U.title(upcoming)} • ${new Intl.DateTimeFormat('he-IL',{timeZone:C.timeZone,day:'numeric',month:'numeric'}).format(new Date(upcoming.date))}`:'אין אירוע ב־30 הימים הקרובים');
    dailyGuidance(todays);
  }catch(error){
    console.error(error);
    ['dafYomi','omer','event','fastName','upcomingHoliday','tachanun','hallel','roshChodesh','yaalehVeyavo','alHanissim','avHarachamim','shabbatCustoms']
      .forEach(id=>U.set(id,'לא זמין'));
  }

  try{
    const zmanim=await getJson(`https://www.hebcal.com/zmanim?cfg=json&geonameid=${C.geonameId}`);
    U.set('sunrise',zmanim.times?.sunrise?U.fmtTime(zmanim.times.sunrise):'--:--');
    U.set('sunset',zmanim.times?.sunset?U.fmtTime(zmanim.times.sunset):'--:--');
  }catch(error){
    console.error(error);
  }
}

window.addEventListener('storage',applySettings);
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden){ applySettings(); tick(); loadCalendar(); }
});

applySettings();
tick();
loadCalendar();
setInterval(tick,1000);
setInterval(loadCalendar,C.refreshMinutes*60*1000);

// Register a versioned service worker. It does not cache HTML or JavaScript.
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('./sw.js?v=3.0.0').catch(console.error);
}
})();
