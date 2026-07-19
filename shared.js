
const DEFAULT_DATA = {"synagogue": "בית הכנסת אליהו הנביא", "rabbi": "", "dedication": "לעילוי נשמת זהבה חלא בת דינה", "announcements": ["שיעור גמרא במוצ״ש 21:15"], "geo": "5128581", "timezone": "America/New_York", "shacharit": "07:00", "mincha": "לפני השקיעה", "maariv": "20:30", "tickerSpeed": 32};
const LOCAL_KEY = 'synagogueCloudBoardData';
const $ = id => document.getElementById(id);
function localData(){try{return {...DEFAULT_DATA,...JSON.parse(localStorage.getItem(LOCAL_KEY)||'{}')}}catch{return {...DEFAULT_DATA}}}
function saveLocal(data){localStorage.setItem(LOCAL_KEY,JSON.stringify(data))}
function firebaseReady(){
 const f=window.APP_CONFIG?.firebase||{};
 return !!(f.apiKey&&f.projectId&&f.databaseURL);
}
async function getBoardData(){
 if(!firebaseReady()) return localData();
 try{
  const id=window.APP_CONFIG.boardId||'main';
  const url=`${window.APP_CONFIG.firebase.databaseURL.replace(/\/$/,'')}/boards/${encodeURIComponent(id)}.json`;
  const r=await fetch(url,{cache:'no-store'});
  if(!r.ok) throw new Error();
  const data=await r.json();
  return {...DEFAULT_DATA,...(data||{})};
 }catch{return localData()}
}
async function saveBoardData(data){
 saveLocal(data);
 if(!firebaseReady()) return {cloud:false};
 const id=window.APP_CONFIG.boardId||'main';
 const url=`${window.APP_CONFIG.firebase.databaseURL.replace(/\/$/,'')}/boards/${encodeURIComponent(id)}.json`;
 const r=await fetch(url,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 if(!r.ok) throw new Error('Cloud save failed');
 return {cloud:true};
}
function watchBoardData(callback){
 callback(localData());
 if(!firebaseReady()) return;
 const id=window.APP_CONFIG.boardId||'main';
 const url=`${window.APP_CONFIG.firebase.databaseURL.replace(/\/$/,'')}/boards/${encodeURIComponent(id)}.json`;
 let last='';
 setInterval(async()=>{
  try{
   const r=await fetch(url,{cache:'no-store'}); const d=await r.json(); const s=JSON.stringify(d||{});
   if(s!==last){last=s;callback({...DEFAULT_DATA,...(d||{})})}
  }catch{}
 },5000);
}
