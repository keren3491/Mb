(() => {
'use strict';
const C = window.BOARD_CONFIG;
window.BoardUtil = {
  el(id){ return document.getElementById(id); },
  set(id,value){ const e=document.getElementById(id); if(e) e.textContent=value; },
  settings(){
    try{
      return {...C.defaults,...JSON.parse(localStorage.getItem(C.storageKey)||'{}')};
    }catch{
      return {...C.defaults};
    }
  },
  hebrewParts(date=new Date()){
    const parts=new Intl.DateTimeFormat('en-u-ca-hebrew',{
      timeZone:C.timeZone, day:'numeric', month:'long', year:'numeric'
    }).formatToParts(date);
    const get=t=>parts.find(p=>p.type===t)?.value||'';
    return {day:Number(get('day')),month:get('month'),year:Number(get('year'))};
  },
  nyDateISO(date=new Date()){
    const parts=new Intl.DateTimeFormat('en-CA',{
      timeZone:C.timeZone,year:'numeric',month:'2-digit',day:'2-digit'
    }).formatToParts(date);
    const get=t=>parts.find(p=>p.type===t)?.value;
    return `${get('year')}-${get('month')}-${get('day')}`;
  },
  fmtTime(value){
    return new Intl.DateTimeFormat('en-US',{
      timeZone:C.timeZone,hour:'numeric',minute:'2-digit'
    }).format(new Date(value));
  },
  title(item){ return String(item?.hebrew||item?.title||''); },
  has(items,patterns){
    return items.some(item=>patterns.some(pattern=>pattern.test(String(item?.hebrew||item?.title||''))));
  }
};
})();
