(function(root){
'use strict';
const topics={1:'Объём текста',2:'Кодирование',3:'Логика',4:'Кратчайший путь',5:'Исполнитель',6:'Анализ программы',7:'Адреса в Интернете',8:'Поисковые запросы',9:'Количество путей',10:'Системы счисления'};
const random=seed=>{let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};};
const int=(r,a,b)=>a+Math.floor(r()*(b-a+1));
const pick=(r,a)=>a[int(r,0,a.length-1)];
function shuffle(values,r){const a=[...values];for(let i=a.length-1;i>0;i--){const j=int(r,0,i);[a[i],a[j]]=[a[j],a[i]];}return a;}
function shortest(matrix,start,end){const d=matrix.map(()=>Infinity),used=new Set();d[start]=0;while(used.size<matrix.length){let u=-1;for(let i=0;i<d.length;i++)if(!used.has(i)&&(u<0||d[i]<d[u]))u=i;if(u<0||!Number.isFinite(d[u]))break;used.add(u);matrix[u].forEach((w,v)=>{if(w>0)d[v]=Math.min(d[v],d[u]+w);});}return d[end];}
function countPaths(edges,start,end,excluded=-1){const ways=Array(end+1).fill(0);if(start!==excluded)ways[start]=1;for(let u=start;u<=end;u++)if(u!==excluded)for(const [a,b]of edges)if(a===u&&b!==excluded&&b<=end)ways[b]+=ways[u];return ways[end];}
function make(number,mode,r){
 const q={number,mode,title:topics[number],kind:'integer',unit:'',paragraphs:[],solution:[]};
 if(number===1){
  const bits=pick(r,[8,16,32]);
  if(mode===0){const words=shuffle(['ёж','кот','аист','цапля','ворона','ласточка','жаворонок'],r),removed=pick(r,words),bytes=(removed.length+2)*bits/8;
   Object.assign(q,{kind:'word',paragraphs:[`В некоторой кодировке каждый символ занимает ${bits} бит. Записан текст:`,`«${words.join(', ')}».`,`Ученик удалил одно название, а также лишние запятую и пробел. Размер текста уменьшился на ${bytes} байт. Остальные символы не изменились. Какое название удалено?`],answer:removed,solution:[`Один символ занимает ${bits/8} байт.`,`Удалено ${bytes} ÷ ${bits/8} = ${removed.length+2} символов.`,`Два символа — запятая и пробел. Длина названия: ${removed.length}.`,`В списке такую длину имеет только «${removed}».`],params:{bits,words,bytes}});
  }else{const pages=int(r,2,16),lines=pick(r,[32,64]),chars=pick(r,[32,64]),answer=pages*lines*chars*bits/8/1024;
   Object.assign(q,{unit:'Кбайт',paragraphs:[`Текст занимает ${pages} страниц. На каждой странице ${lines} строки, в каждой строке ${chars} символа, включая пробелы и знаки препинания. Каждый символ кодируется ${bits} битами.`,`Найдите информационный объём текста в Кбайтах. Дополнительные служебные данные не учитываются. 1 Кбайт = 1024 байта.`],answer:String(answer),solution:[`Символов: ${pages} × ${lines} × ${chars} = ${pages*lines*chars}.`,`Байт: ${pages*lines*chars} × ${bits/8} = ${answer*1024}.`,`Объём: ${answer*1024} ÷ 1024 = ${answer} Кбайт.`],params:{bits,pages,lines,chars}});
  }
 }
 if(number===2){
  const letters=['А','Б','В','Г','Д'],codes=shuffle(mode===0?['0','10','110','1110','1111']:['00','01','10','110','111'],r),table=letters.map((l,i)=>[l,codes[i]]),answer=Array.from({length:int(r,5,8)},()=>pick(r,letters)).join(''),encoded=[...answer].map(l=>codes[letters.indexOf(l)]).join('');
  Object.assign(q,{kind:'letters',paragraphs:['Для передачи сообщения используются только пять букв. Их коды даны в таблице.',`Расшифруйте последовательность: ${encoded}`,`Запишите полученную последовательность русских букв без пробелов. Коды позволяют однозначно разделить сообщение.`],table:{heads:['Буква','Код'],rows:table},answer,solution:[`Разделяем сообщение на коды: ${[...answer].map(l=>codes[letters.indexOf(l)]).join(' | ')}.`,`Подставляем буквы из таблицы: ${answer}.`],params:{table,encoded}});
 }
 if(number===3){
  const low=int(r,3,25),high=low+int(r,5,18),maximum=Boolean(int(r,0,1)),even=Boolean(int(r,0,1));
  const values=Array.from({length:100},(_,i)=>i).filter(x=>mode===0?!(x<=low)&&x<high:!((x<low)||(x>high))&&(x%2===(even?0:1)));
  const expression=mode===0?`НЕ (X ≤ ${low}) И (X < ${high})`:`НЕ ((X < ${low}) ИЛИ (X > ${high})) И (X ${even?'чётное':'нечётное'})`;
  Object.assign(q,{paragraphs:[`Укажите ${maximum?'наибольшее':'наименьшее'} целое число X, для которого истинно высказывание:`,expression],answer:String(maximum?values.at(-1):values[0]),solution:[mode===0?`После отрицания получаем X > ${low} и X < ${high}.`:`После отрицания получаем ${low} ≤ X ≤ ${high}. Оставляем ${even?'чётные':'нечётные'} числа.`,`Подходящие числа: ${values.join(', ')}.`,`Выбираем ${maximum?'наибольшее':'наименьшее'}: ${maximum?values.at(-1):values[0]}.`],params:{low,high,maximum,even}});
 }
 if(number===4){
  const labels=['А','Б','В','Г','Д','Е'],matrix=Array.from({length:6},()=>Array(6).fill(0));
  for(let i=0;i<5;i++)matrix[i][i+1]=matrix[i+1][i]=int(r,2,10);
  for(let i=0;i<6;i++)for(let j=i+2;j<6;j++)if(r()<0.45)matrix[i][j]=matrix[j][i]=int(r,3,20);
  const destination=mode===0?5:4,answer=shortest(matrix,0,destination);
  const d=labels.map((_,i)=>shortest(matrix,0,i));
  Object.assign(q,{unit:'км',paragraphs:[`Между населёнными пунктами ${labels.join(', ')} проложены дороги. В таблице указаны длины дорог в километрах. «—» означает, что прямой дороги нет. Дороги двусторонние.`,`Найдите длину кратчайшего пути из А в ${labels[destination]}. Передвигаться можно только по указанным дорогам.`],table:{heads:['',...labels],rows:labels.map((l,i)=>[l,...matrix[i].map(w=>w||'—')])},answer:String(answer),solution:[`Сравниваем все маршруты, накапливая минимальные расстояния от А.`,`Минимальные расстояния: ${labels.map((l,i)=>`${l}: ${d[i]}`).join('; ')} км.`,`До ${labels[destination]}: ${answer} км.`],params:{matrix,destination}});
 }
 if(number===5){
  const start=int(r,2,12),add=int(r,1,6),factor=int(r,2,5),program=pick(r,['11212','12121','21112','12211','21211']);
  let result=start;const steps=[start];for(const c of program){result=c==='1'?result+add:result*factor;steps.push(result);}
  Object.assign(q,{paragraphs:mode===0?[`У исполнителя две команды: 1 — прибавь ${add}; 2 — умножь на b. Число b — целое, больше 1.`,`Программа ${program} переводит число ${start} в число ${result}. Определите b.`]:[`У исполнителя две команды: 1 — прибавь ${add}; 2 — умножь на ${factor}.`,`После выполнения программы ${program} получилось число ${result}. Какое число было исходным?`],answer:String(mode===0?factor:start),solution:mode===0?[`Подставляем b = ${factor}.`,`Последовательность значений: ${steps.join(' → ')}.`,`Результат совпал. При b > 1 и положительном начальном числе итог строго растёт с b, поэтому значение единственное.`]:[`Идём по командам справа налево: вместо умножения делим на ${factor}, вместо прибавления вычитаем ${add}.`,`Обратная последовательность: ${[...steps].reverse().join(' → ')}.`,`Исходное число: ${start}.`],params:{start,add,factor,program,result}});
 }
 if(number===6){
  const boundary=int(r,1,9),other=int(r,1,9),op=pick(r,['and','or']),pairs=shuffle([[boundary,other],[boundary+1,other],[boundary,other+1],[boundary+1,other+1],[boundary-1,other-1],[boundary+2,other-2],[boundary-2,other+2],[0,0],[12,12]],r);
  const count=a=>pairs.filter(([s,t])=>op==='and'?s>a&&t>other:s>a||t>other).length;
  if(mode===0){const answer=count(boundary);Object.assign(q,{paragraphs:['Программу запускали девять раз. При каждом запуске вводили одну пару чисел из таблицы (сначала s, затем t).','Сколько запусков напечатали YES?'],code:`s = int(input())\nt = int(input())\nif s > ${boundary} ${op} t > ${other}:\n    print("YES")\nelse:\n    print("NO")`,table:{heads:['Запуск','s','t'],rows:pairs.map((pair,i)=>[i+1,...pair])},answer:String(answer),solution:[`${op==='and'?'and требует выполнения обоих условий':'or требует выполнения хотя бы одного условия'}.`,`YES напечатан для пар: ${pairs.filter(([s,t])=>op==='and'?s>boundary&&t>other:s>boundary||t>other).map(p=>`(${p.join('; ')})`).join(', ')||'ни для одной'}.`,`Количество: ${answer}.`],params:{pairs,boundary,other,op,target:answer}});
  }else{const target=count(boundary),valid=Array.from({length:16},(_,i)=>i).filter(a=>count(a)===target),maximum=Boolean(int(r,0,1)),answer=maximum?valid.at(-1):valid[0];Object.assign(q,{paragraphs:[`Программа содержит целый параметр A от 0 до 15 включительно. Её запускали на каждой паре из таблицы.`,`Найдите ${maximum?'наибольшее':'наименьшее'} A, при котором ровно ${target} запусков напечатают YES.`],code:`s = int(input())\nt = int(input())\nA = ...\nif s > A ${op} t > ${other}:\n    print("YES")\nelse:\n    print("NO")`,table:{heads:['Запуск','s','t'],rows:pairs.map((pair,i)=>[i+1,...pair])},answer:String(answer),solution:[`Для каждого A проверяем ${op==='and'?'оба условия одновременно':'хотя бы одно из условий'} на девяти парах.`,`Условию подходят A: ${valid.join(', ')}.`,`Требуется ${maximum?'наибольшее':'наименьшее'} значение: ${answer}.`],params:{pairs,boundary,other,op,target,maximum}});}
 }
 if(number===7){
  const protocol=mode===0?'https':'ftp',host=pick(r,['school','robot','class','lesson']),zone=pick(r,['ru','org','net']),file=pick(r,['task','data','plan','notes']),ext=pick(r,['txt','pdf','png']),parts=[protocol,'://',host,`.${zone}`,'/',file,`.${ext}`],mixed=shuffle(parts,r),rows=mixed.map((part,i)=>[i+1,part]),answer=parts.map(part=>mixed.indexOf(part)+1).join('');
  Object.assign(q,{kind:'digits',paragraphs:[`Файл ${file}.${ext} находится на сервере ${host}.${zone}. Доступ к нему осуществляется по протоколу ${protocol}. Файл лежит в корневом каталоге сервера.`,`Соберите полный адрес файла из фрагментов. В ответ запишите последовательность номеров фрагментов без пробелов.`],table:{heads:['Номер','Фрагмент'],rows},answer,solution:[`Порядок: протокол, ://, имя сервера, доменная зона, /, имя файла, расширение.`,`Адрес: ${parts.join('')}.`,`Номера фрагментов: ${answer}.`],params:{parts,mixed}});
 }
 if(number===8){
  const onlyA=int(r,2,20)*100,onlyB=int(r,2,20)*100,both=int(r,1,15)*100,a=onlyA+both,b=onlyB+both,union=onlyA+onlyB+both,words=shuffle(['робот','алгоритм','пиксель','программа','сеть'],r).slice(0,2),[A,B]=words;
  Object.assign(q,{unit:'страниц',paragraphs:['В поисковых запросах символ & означает «И», символ | — «ИЛИ». Все запросы выполнены одновременно по неизменному набору страниц.',`Найдите число страниц для запроса «${A} ${mode===0?'&':'|'} ${B}».`],table:{heads:['Запрос','Найдено страниц'],rows:mode===0?[[A,a],[B,b],[`${A} | ${B}`,union]]:[[A,a],[B,b],[`${A} & ${B}`,both]]},answer:String(mode===0?both:union),solution:['Используем формулу: |A ∪ B| = |A| + |B| − |A ∩ B|.',mode===0?`Пересечение: ${a} + ${b} − ${union} = ${both}.`:`Объединение: ${a} + ${b} − ${both} = ${union}.`],params:{onlyA,onlyB,both,mode}});
 }
 if(number===9){
  const labels=['А','Б','В','Г','Д','Е','Ж'],positions=[[40,150],[150,65],[150,235],[275,65],[275,235],[400,150],[515,150]],base=[[0,1],[0,2],[1,3],[2,4],[3,5],[4,5],[5,6]],optional=shuffle([[0,3],[0,4],[1,4],[2,3],[1,5],[2,5],[3,6],[4,6]],r).slice(0,int(r,2,5)),edges=[...base,...optional],via=pick(r,[1,2,3,4]),answer=mode===0?countPaths(edges,0,via)*countPaths(edges,via,6):countPaths(edges,0,6,via);
  Object.assign(q,{paragraphs:['На схеме изображены дороги между городами. Двигаться можно только по направлению стрелок.',`Сколько различных путей ведут из А в Ж ${mode===0?'через город':'без посещения города'} ${labels[via]}?`],graph:{labels,positions,edges},table:{heads:['Из города','Можно перейти в'],rows:labels.slice(0,-1).map((l,i)=>[l,edges.filter(e=>e[0]===i).map(e=>labels[e[1]]).join(', ')])},answer:String(answer),solution:mode===0?[`Путей из А в ${labels[via]}: ${countPaths(edges,0,via)}.`,`Путей из ${labels[via]} в Ж: ${countPaths(edges,via,6)}.`,`Перемножаем: ${countPaths(edges,0,via)} × ${countPaths(edges,via,6)} = ${answer}.`]:[`Исключаем город ${labels[via]} и все связанные с ним дороги.`,`В каждый оставшийся город число путей равно сумме чисел путей в его предшественники.`,`До Ж без города ${labels[via]}: ${answer}.`],params:{edges,via}});
 }
 if(number===10){
  const values=shuffle(Array.from({length:220},(_,i)=>i+20),r).slice(0,3),bases=shuffle([2,8,16],r),rows=values.map((v,i)=>[v.toString(bases[i]).toUpperCase(),bases[i]]);
  if(mode===0){const maximum=Boolean(int(r,0,1)),answer=maximum?Math.max(...values):Math.min(...values);Object.assign(q,{paragraphs:[`Среди трёх чисел выберите ${maximum?'наибольшее':'наименьшее'}. Основание системы счисления дано в отдельном столбце.`,`Запишите выбранное число в десятичной системе счисления. Основание в ответе не указывайте.`],table:{heads:['Запись числа','Основание'],rows},answer:String(answer),solution:rows.map(([s,b],i)=>`${s} в системе с основанием ${b} = ${values[i]} в десятичной.`).concat(`Ответ: ${answer}.`),params:{values,bases,maximum}});
  }else{const value=values[0],base=bases[0];Object.assign(q,{paragraphs:[`Число ${value} записано в десятичной системе счисления. Сколько цифр 1 содержит его двоичная запись?`],answer:String([...value.toString(2)].filter(c=>c==='1').length),solution:[`${value}₁₀ = ${value.toString(2)}₂.`,`Считаем цифры 1: ${[...value.toString(2)].filter(c=>c==='1').length}.`],params:{value,base}});}
 }
 return q;
}
function generateQuestions(count,seed){if(![10,20,30].includes(count))throw new RangeError('Количество заданий: 10, 20 или 30');const r=random(seed),questions=[],seen=new Set();for(let round=0;round<count/10;round++)for(let n=1;n<=10;n++){let q,key,tries=0;do{q=make(n,(round+((seed>>>0)+n)%2)%2,r);key=JSON.stringify([n,q.paragraphs,q.table,q.code]);if(++tries>1000)throw new Error('Не удалось создать вариант');}while(seen.has(key));seen.add(key);questions.push(q);}return shuffle(questions,r).map((q,i)=>({...q,id:`${seed}-${i}`}));}
function normalize(value,kind){const s=String(value).normalize('NFC').trim();if(kind==='integer')return /^\d+$/.test(s)?String(Number(s)):null;if(kind==='digits')return /^\d+$/.test(s)?s:null;return /^[А-ЯЁа-яё]+$/.test(s)?s.toUpperCase():null;}
function isCorrect(q,value){const n=normalize(value,q.kind);return n!==null&&n===normalize(q.answer,q.kind);}
const api={topics,random,shuffle,make,generateQuestions,normalize,isCorrect,shortest,countPaths};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.OgeTasks=api;
})(globalThis);
