(function(root){
'use strict';
const T=typeof module!=='undefined'&&module.exports?require('./tasks.js'):root.OgeTasks;
const VERSION=1,DEFAULT={version:1,id:'practice',title:'Контрольная ОГЭ · 1–10',count:10,minutes:45,strict:true,reviewHash:''};
const EVENT_LABELS={away:'Уход со страницы',reload:'Перезагрузка / восстановление', 'fullscreen-exit':'Выход из полного экрана','fullscreen-denied':'Полный экран не включён',paste:'Попытка вставки',copy:'Попытка копирования',cut:'Попытка вырезания',drop:'Попытка переноса текста',contextmenu:'Контекстное меню',print:'Попытка печати',shortcut:'Служебное сочетание клавиш',offline:'Потеря соединения',online:'Соединение восстановлено','clock-change':'Изменение системных часов','heartbeat-gap':'Перерыв в наблюдении',resume:'Возврат к заданиям','storage-error':'Ошибка сохранения','duplicate-tab':'Вторая вкладка',start:'Начало работы',finish:'Завершение работы'};
function validConfig(c){return Boolean(c&&c.version===1&&typeof c.id==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(c.id)&&typeof c.title==='string'&&c.title.trim()&&c.title.length<=100&&[10,20,30].includes(c.count)&&[20,30,45,60,90].includes(c.minutes)&&typeof c.strict==='boolean'&&typeof c.reviewHash==='string'&&/^(?:[a-f0-9]{64})?$/.test(c.reviewHash));}
function encodeConfig(c){if(!validConfig(c))throw new Error('Некорректные настройки');const text=JSON.stringify(c);const bytes=new TextEncoder().encode(text);return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function decodeConfig(s){if(typeof s!=='string'||s.length>3000)throw new Error('Ссылка на работу повреждена');try{const base=s.replace(/-/g,'+').replace(/_/g,'/');const c=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(base),v=>v.charCodeAt(0))));if(!validConfig(c))throw Error();return c;}catch{throw new Error('Ссылка на работу повреждена. Получите новую ссылку у учителя.');}}
async function hash(text){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}
function grade(correct,total){if(!Number.isInteger(correct)||!Number.isInteger(total)||total<=0||correct<0||correct>total)throw new Error('Неверный балл');const percent=100*correct/total;return {correct,total,percent,grade:percent>=85?5:percent>=70?4:percent>=50?3:percent>=20?2:1};}
function createSession(profile,config,seed,attemptId,time=Date.now()){
 if(!validConfig(config)||!Number.isInteger(seed)||seed<0||seed>0xFFFFFFFF||typeof attemptId!=='string'||attemptId.length>100)throw Error('Некорректные параметры');
 const clean=Object.fromEntries(['firstName','lastName','className'].map(k=>[k,String(profile[k]||'').trim()]));
 if(Object.values(clean).some(s=>!s||s.length>50))throw Error('Заполните имя, фамилию и класс (до 50 символов).');
 return {version:VERSION,config:{...config},seed,attemptId,profile:clean,startedAt:time,deadline:time+config.minutes*60000,lastSeenAt:time,finishedAt:null,finishReason:null,current:0,answers:Array(config.count).fill(''),flags:Array(config.count).fill(false),timeOnTask:Array(config.count).fill(0),edits:Array(config.count).fill(0),firstAnswerAt:Array(config.count).fill(null),lastAnswerAt:Array(config.count).fill(null),events:[],eventOverflow:0,awaySince:null,awayKinds:[],awayMs:0,reviewUnlocked:false};
}
function log(s,type,time=Date.now(),details={}){if(!Object.hasOwn(EVENT_LABELS,type))return;if(s.events.length>=3000){s.eventOverflow++;return;}s.events.push({type,at:Math.min(time,s.deadline),...details});}
function beginAway(s,kind,time){if(s.finishedAt!==null)return;if(s.awaySince===null){s.awaySince=Math.min(time,s.deadline);s.awayKinds=[kind];log(s,'away',time,{endedAt:null,kinds:[kind]});}else if(!s.awayKinds.includes(kind)){s.awayKinds.push(kind);const e=s.events.findLast(e=>e.type==='away'&&e.endedAt===null);if(e)e.kinds=[...s.awayKinds];}}
function endAway(s,time){if(s.awaySince===null)return;const end=Math.min(s.deadline,Math.max(time,s.awaySince));s.awayMs+=end-s.awaySince;const e=s.events.findLast(e=>e.type==='away'&&e.endedAt===null);if(e)e.endedAt=end;s.awaySince=null;s.awayKinds=[];}
function finish(s,reason,time){if(s.finishedAt!==null)return;endAway(s,time);s.finishedAt=Math.min(Math.max(time,s.startedAt),s.deadline);s.finishReason=time>=s.deadline?'timeout':reason;log(s,'finish',s.finishedAt);}
function score(s){const questions=T.generateQuestions(s.config.count,s.seed),results=questions.map((q,i)=>({...q,input:s.answers[i],correct:T.isCorrect(q,s.answers[i]),timeMs:s.timeOnTask[i],edits:s.edits[i]}));return {...grade(results.filter(q=>q.correct).length,results.length),results};}
function signals(s){const count=type=>s.events.filter(e=>e.type===type).length;const attention=['away','reload','fullscreen-exit','paste','copy','cut','drop','print','shortcut','clock-change','duplicate-tab'];const marked=s.events.filter(e=>attention.includes(e.type)).length;return {away:count('away'),awayMs:s.awayMs,fullscreen:count('fullscreen-exit'),reloads:count('reload'),clipboard:['paste','copy','cut','drop'].reduce((n,t)=>n+count(t),0),technical:s.events.filter(e=>['offline','heartbeat-gap','storage-error','fullscreen-denied'].includes(e.type)).length,status:marked||s.eventOverflow?'Требует просмотра':s.config.strict?'Сигналов не обнаружено':'Обычный режим',marked};}
function validateSession(s){
 if(!s||s.version!==VERSION||!validConfig(s.config)||!Number.isInteger(s.seed)||s.seed<0||s.seed>0xFFFFFFFF||typeof s.attemptId!=='string'||s.attemptId.length>100)return false;
 const n=s.config.count;
 if(!s.profile||['firstName','lastName','className'].some(k=>typeof s.profile[k]!=='string'||!s.profile[k].trim()||s.profile[k].length>50))return false;
 if(![s.startedAt,s.deadline,s.lastSeenAt,s.awayMs,s.eventOverflow].every(Number.isFinite)||s.awayMs<0||s.eventOverflow<0||s.deadline!==s.startedAt+s.config.minutes*60000)return false;
 if(s.finishedAt!==null&&(!Number.isFinite(s.finishedAt)||s.finishedAt<s.startedAt||s.finishedAt>s.deadline))return false;
 if(!Number.isInteger(s.current)||s.current<0||s.current>=n)return false;
 if(!Array.isArray(s.answers)||s.answers.length!==n||s.answers.some(a=>typeof a!=='string'||a.length>100))return false;
 if(!Array.isArray(s.flags)||s.flags.length!==n||s.flags.some(a=>typeof a!=='boolean'))return false;
 if(['timeOnTask','edits'].some(k=>!Array.isArray(s[k])||s[k].length!==n||s[k].some(a=>!Number.isFinite(a)||a<0)))return false;
 if(['firstAnswerAt','lastAnswerAt'].some(k=>!Array.isArray(s[k])||s[k].length!==n||s[k].some(a=>a!==null&&!Number.isFinite(a))))return false;
 if(s.awaySince!==null&&!Number.isFinite(s.awaySince))return false;
 if(!Array.isArray(s.awayKinds)||s.awayKinds.some(a=>!['blur','hidden','pagehide'].includes(a)))return false;
 if(!Array.isArray(s.events)||s.events.length>3000||s.events.some(e=>!e||!Object.hasOwn(EVENT_LABELS,e.type)||!Number.isFinite(e.at)||(e.type==='away'&&(!Array.isArray(e.kinds)||e.kinds.some(k=>!['blur','hidden','pagehide'].includes(k))||(e.endedAt!==null&&!Number.isFinite(e.endedAt))))))return false;
 return typeof s.reviewUnlocked==='boolean';
}
function report(s){if(!validateSession(s)||s.finishedAt===null)throw Error('Неполная работа');const result=score(s);return {format:'oge-1-10-report',version:1,exportedAt:Date.now(),warning:'Локальный отчёт без серверной подписи. Подлинность не подтверждена.',session:s,summary:{...grade(result.correct,result.total),signals:signals(s)}};}
function readReport(data){if(!data||data.format!=='oge-1-10-report'||data.version!==1||!validateSession(data.session)||data.session.finishedAt===null)throw Error('Не поддерживаемый или повреждённый отчёт');return report(data.session);}
const api={VERSION,DEFAULT,EVENT_LABELS,validConfig,encodeConfig,decodeConfig,hash,grade,createSession,log,beginAway,endAway,finish,score,signals,validateSession,report,readReport};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.OgeCore=api;
})(globalThis);
