import { Peer } from 'peerjs';
let pesos=2000,feedStock=5,roosters=[],playerName=localStorage.getItem('sabong_name')||'Player';
const FIXED_ROOM='sabong-global-lobby-v3-fixed';
const BREEDS=[
{name:'Sweater',atk:78,spd:85,def:55,color:'#ff7a00',price:1200},
{name:'Kelso',atk:72,spd:80,def:68,color:'#a0a0a0',price:1300},
{name:'Hatch',atk:88,spd:58,def:80,color:'#1a1a1a',price:1400},
{name:'Talisayin',atk:80,spd:78,def:62,color:'#b91c1c',price:1500},
{name:'Pula',atk:82,spd:75,def:65,color:'#ff0000',price:1600},
{name:'Bulik',atk:76,spd:80,def:68,color:'#666',price:1250},
{name:'Lasak',atk:79,spd:77,def:70,color:'#1f2937',price:1350},
{name:'Abuhin',atk:74,spd:84,def:60,color:'#9ca3af',price:1300},
{name:'Puti',atk:72,spd:82,def:62,color:'#ffffff',price:1450},
{name:'Itim',atk:88,spd:60,def:82,color:'#000000',price:1800}
];
const NPCS=[
{id:101,name:'Mang Tonyo',breed:'Talisayin',atk:72,spd:70,def:65,bet:150,reward:300,avatar:'👨‍🌾'},
{id:102,name:'Batang Sabong',breed:'Bulik',atk:80,spd:82,def:70,bet:250,reward:500,avatar:'🧢'},
{id:103,name:'Aling Nena',breed:'Lasak',atk:88,spd:78,def:80,bet:400,reward:800,avatar:'👩‍🌾'},
{id:104,name:'Tisoy',breed:'Abuhin',atk:92,spd:90,def:82,bet:600,reward:1200,avatar:'😎'},
{id:105,name:'Bossing',breed:'Puti',atk:98,spd:95,def:90,bet:1000,reward:2000,avatar:'🤠'},
{id:106,name:'El Presidente',breed:'Itim',atk:110,spd:100,def:105,bet:2000,reward:4000,avatar:'👑'},
{id:107,name:'Kapitan Talisay',breed:'Talisayin',atk:105,spd:92,def:95,bet:1500,reward:3000,avatar:'🐓'},
{id:108,name:'Mang Pula',breed:'Pula',atk:102,spd:96,def:92,bet:1200,reward:2500,avatar:'🔥'}
];
let selectedNPC=null,selectedMeron=null,myAuctions=[],liveAuctions=[],conns=[],peer=null,myId=null,incubators=[],fastHatch=false,leaderboardData={},pendingChallenge=null,hostConns={},isHost=false,seenIds=new Set(),isConnecting=false;
function saveGame(){localStorage.setItem('sabong_global_save',JSON.stringify({pesos,feedStock,roosters,myAuctions,playerName,fastHatch}))}
function loadGame(){let r=localStorage.getItem('sabong_global_save');if(r){try{let d=JSON.parse(r);pesos=d.pesos??2000;feedStock=d.feedStock??5;roosters=d.roosters||[];myAuctions=d.myAuctions||[];playerName=d.playerName||'Player';fastHatch=d.fastHatch||false;document.getElementById('playerName').value=playerName;return true}catch{}}return false}
function initDefault(){if(roosters.length==0){roosters.push({id:1,name:'Tandang',sex:'M',breed:'Talisayin',growth:100,atk:85,def:70,spd:80,mature:true});roosters.push({id:2,name:'Inahin',sex:'F',breed:'Bulik',growth:100,atk:65,def:75,spd:85,mature:true})}}
function calcPrice(r){let b=(r.atk+r.spd+r.def)*14;if(r.atk>90||r.spd>90)b*=1.6;if(r.atk>100)b*=1.4;return Math.floor(Math.max(1000,b))}
function updateUI(){document.getElementById('pesos').innerText='P'+pesos;document.getElementById('feeds').innerText=feedStock;renderFarm();renderSelects();renderMyAuction();renderLiveAuction();renderQuickSell();renderNPCs();renderGlobalPlayers();renderLeaderboard();renderShop()}
function renderShop(){let el=document.getElementById('fullChickenShop');if(!el)return;el.innerHTML=BREEDS.map(b=>`<div class="marketItem shop ${b.price>=1500?'strong':''}"><div><b>🐓 ${b.name}</b> - ATK${b.atk} SPD${b.spd} DEF${b.def}</div><button onclick="buyBreed('${b.name}',${b.price})">BUY P${b.price}</button></div>`).join('')}
window.buyBreed=(name,price)=>{if(pesos<price)return alert('Kulang P'+price);pesos-=price;let base=BREEDS.find(x=>x.name==name);roosters.push({id:Date.now()+Math.random(),name:name+' Shop',sex:'M',breed:name,growth:100,atk:base.atk,def:base.def,spd:base.spd,mature:true});updateUI();saveGame()}
function renderFarm(){let g=document.getElementById('farmGrid'),b=document.getElementById('breedGrid');if(g)g.innerHTML='';if(b)b.innerHTML='';roosters.forEach(r=>{let p=calcPrice(r);let c=`<div class="card ${r.mature?'mature':''}"><div class="badge">${r.sex} ${r.breed} P${p}</div><div style="font-size:32px;text-align:center">🐓</div><div style="font-family:'Black Ops One';text-align:center">🔥 ${r.name}</div><div style="background:#000;height:8px;border-radius:4px;margin:6px 0"><div style="width:${r.growth||100}%;height:100%;background:#00ff88"></div></div><div class="statRow"><div class="s"><b>${r.atk}</b>ATK</div><div class="s"><b>${r.spd}</b>SPD</div><div class="s"><b>${r.def}</b>DEF</div></div><div class="btns"><button class="feed" onclick="feedChicken(${r.id})">FEED</button><button class="train" onclick="trainChicken(${r.id})">TRAIN</button><button class="pick" onclick="pickChicken(${r.id})">✅ PILI PIT</button></div></div>`;if(g)g.innerHTML+=c;if(b)b.innerHTML+=c})}
function renderSelects(){let m=document.getElementById('maleSel'),f=document.getElementById('femaleSel'),s=document.getElementById('sellSel');if(!m)return;m.innerHTML='';f.innerHTML='';s.innerHTML='';roosters.filter(r=>r.sex=='M'&&r.mature).forEach(r=>{m.innerHTML+=`<option value="${r.id}">${r.name} P${calcPrice(r)}</option>`;s.innerHTML+=`<option value="${r.id}">${r.name} P${calcPrice(r)}</option>`});roosters.filter(r=>r.sex=='F'&&r.mature).forEach(r=>{f.innerHTML+=`<option value="${r.id}">${r.name}</option>`})}
function renderQuickSell(){let q=document.getElementById('quickSellList');if(!q)return;q.innerHTML=roosters.map(r=>{let pr=Math.floor(calcPrice(r)*0.7);return `<div class="marketItem"><div><b>${r.name}</b> ${r.breed} P${pr}</div><button onclick="quickSellMarket(${r.id})">SELL</button></div>`}).join('')}
window.quickSellMarket=(id)=>{let r=roosters.find(x=>x.id==id);let pr=Math.floor(calcPrice(r)*0.7);if(confirm('Benta P'+pr+'?')){pesos+=pr;roosters=roosters.filter(x=>x.id!=id);updateUI();saveGame()}}
window.feedChicken=(id)=>{if(feedStock<=0)return alert('Bili patuka!');let r=roosters.find(x=>x.id==id);feedStock--;r.growth=Math.min(100,(r.growth||0)+20);if(r.growth>=100)r.mature=true;updateUI();saveGame()}
window.trainChicken=(id)=>{if(pesos<100)return alert('Need P100');let r=roosters.find(x=>x.id==id);if(!r.mature)return alert('Palakihin');pesos-=100;r.atk+=4;r.spd+=3;r.def+=2;updateUI();saveGame()}
window.pickChicken=(id)=>{let r=roosters.find(x=>x.id==id);if(r.sex=='F'||!r.mature)return alert('Tandang lang');selectedMeron=r;document.getElementById('fightLabel').innerText='🐓 MERON: '+r.name+' - PWEDE NA MAG HAMON!';log('✅ PILI: '+r.name)}
window.showPage=(p)=>{document.querySelectorAll('.page').forEach(e=>e.classList.remove('active'));document.querySelectorAll('nav button').forEach(e=>e.classList.remove('active'));document.getElementById(p).classList.add('active');if(event&&event.target)event.target.classList.add('active')}
window.marketBuy=(t,pr)=>{if(pesos<pr)return alert('Kulang');pesos-=pr;if(t=='feed')feedStock+=5;if(t=='vit'){let r=roosters.filter(x=>x.mature)[0];if(r){r.atk+=6;r.spd+=6}}if(t=='inc')fastHatch=true;updateUI();saveGame()}
window.breedNow=()=>{if(pesos<30)return alert('Need P30');let mid=document.getElementById('maleSel').value,fid=document.getElementById('femaleSel').value;if(!mid||!fid)return;pesos-=30;let male=roosters.find(r=>r.id==mid),female=roosters.find(r=>r.id==fid);incubators.push({male,female,hatch:Date.now()+(fastHatch?7000:15000)});updateUI();saveGame()}
setInterval(()=>{let n=Date.now();incubators.forEach((inc,i)=>{if(n>=inc.hatch){let atk=Math.floor((inc.male.atk+inc.female.atk)/2),spd=Math.floor((inc.male.spd+inc.female.spd)/2),def=Math.floor((inc.male.def+inc.female.def)/2);let breed=Math.random()<0.5?inc.male.breed:inc.female.breed;let sex=Math.random()<0.5?'M':'F';roosters.push({id:Date.now()+i,name:'Sisiw '+breed,sex,breed,growth:5,atk:Math.max(30,atk-20),def:Math.max(30,def-20),spd:Math.max(30,spd-20),mature:false});incubators.splice(i,1);updateUI();saveGame()}});let el=document.getElementById('incubator');if(el)el.innerHTML=incubators.map(i=>`🥚 ${i.male.breed}x${i.female.breed} ${Math.ceil((i.hatch-Date.now())/1000)}s`).join('<br>')||'🥚 Walang itlog'},1000);
function renderNPCs(){let l=document.getElementById('npcList');if(!l)return;l.innerHTML=NPCS.map(n=>`<div class="npcCard ${selectedNPC?.id==n.id?'selected':''}" onclick="selectNPC(${n.id})"><div style="font-size:32px">${n.avatar}</div><div style="font-family:'Black Ops One'">🐓 ${n.name}</div><div style="font-size:9px;color:#666">Taya P${n.bet}</div></div>`).join('')}
window.selectNPC=(id)=>{selectedNPC=NPCS.find(x=>x.id==id);window.selectedWala={id:9000+id,name:selectedNPC.name,breed:selectedNPC.breed,atk:selectedNPC.atk,spd:selectedNPC.spd,def:selectedNPC.def};document.getElementById('fightLabel').innerText=(selectedMeron?selectedMeron.name:'MANOK')+' VS '+selectedNPC.name;document.getElementById('betAmount').value=selectedNPC.bet;renderNPCs()}
const canvas=document.getElementById('pitCanvas'),ctx=canvas.getContext('2d');let f1,f2,active=false,pt=0;
class Fighter{constructor(r,x,side){this.r=r;this.x=x;this.y=300;this.hp=100;this.side=side;this.cd=0;this.vx=0;this.vy=0;this.facing=side=='meron'?1:-1;this.color=BREEDS.find(b=>b.name==r.breed)?.color||'#c95a00'}update(e){this.cd=Math.max(0,this.cd-1);this.vx*=0.9;this.vy+=0.8;this.x+=this.vx;this.y+=this.vy;if(this.y>300){this.y=300;this.vy=0}let d=e.x-this.x;if(Math.abs(d)>80){this.vx+=(d>0?1:-1)*(this.r.spd/35)}else if(this.cd==0&&Math.random()<0.14){let dmg=this.r.atk/9+Math.random()*5;e.hp-=dmg;e.vx+=this.facing*7;e.vy-=4;this.cd=18-this.r.spd/12}this.facing=d>0?1:-1}draw(){ctx.save();ctx.translate(this.x,this.y);ctx.scale(this.facing,1);ctx.fillStyle=this.color;ctx.beginPath();ctx.ellipse(0,0,22,24,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffcc00';ctx.fillRect(16,8,22,3);ctx.fillStyle='#000';ctx.fillRect(-20,-38,40*(this.hp/100),5);ctx.restore()}}

// FIX - PAREHAS RESULT + MAY TABLA
function startFight(meron,wala,bet,mode){
f1=new Fighter(meron,250,'meron');f2=new Fighter(wala,550,'wala');active=true;pt=0;document.getElementById('log').innerHTML='';log('⚔️ LABAN: '+meron.name+' 🆚 '+wala.name+' P'+bet);
(function loop(){if(!active)return;pt+=0.016;ctx.clearRect(0,0,800,380);ctx.fillStyle='#ffb400';ctx.fillRect(0,330,800,5);f1.update(f2);f2.update(f1);f1.draw();f2.draw();document.getElementById('timer').innerText=pt.toFixed(1)+'s';
if(f1.hp<=0||f2.hp<=0||pt>25){active=false;
let win;
if(mode==='global'||mode==='pulis'){
  let p1=meron.atk*1.3+meron.spd*1.1+meron.def;
  let p2=wala.atk*1.3+wala.spd*1.1+wala.def;
  let diff=p1-p2;
  if(Math.abs(diff)<6){
    let tieSeed=(meron.name.length+wala.name.length+bet+meron.atk)%100;
    if(tieSeed<15){win='tie';}
    else{win=diff>=0?'meron':'wala';}
  }else{win=diff>0?'meron':'wala';}
}else{
  if(f1.hp<=0&&f2.hp<=0){win='tie';}
  else{win=f1.hp>f2.hp?'meron':'wala';}
}
if(win==='tie'){
  log('🤝 TABLA! WALANG TALO - WALANG PUSTA NAWALA 🔥');
}else if(mode=='pulis'){
  log('👮 PULIS - '+(win=='meron'?'IKAW PANALO 🎉':'TALO 😭')+' WALANG PUSTA');
}else if(mode=='global'){
  if(win=='meron'){pesos+=bet;log('🏆 PANALO KA +P'+bet+' vs '+wala.name+' 🎉');}
  else{pesos-=bet;log('💸 TALO KA -P'+bet+' vs '+wala.name+' 😭');}
  broadcast({type:'FIGHT_RESULT_FINAL',winner:win,bet:bet,fromId:myId,msgId:Date.now()+'_'+Math.random()});
}else{
  if(win=='meron'){pesos+=selectedNPC.reward;log('🏆 PANALO +P'+selectedNPC.reward)}
  else{pesos-=selectedNPC.bet;log('😭 TALO -P'+selectedNPC.bet)}
}
updateUI();saveGame();
if(mode!='global') broadcast({type:'MONEY_UPDATE',id:myId,name:playerName,pesos,chickens:roosters.length,msgId:Date.now()+'_'+Math.random()});
}else requestAnimationFrame(loop)})()
}
window.startDerby=()=>{if(!selectedMeron)return alert('Pili manok sa FARM');if(!selectedNPC)return alert('Pili NPC');if(pesos<selectedNPC.bet)return alert('Kulang');startFight(selectedMeron,window.selectedWala,selectedNPC.bet,'npc')}
window.startPulisFight=()=>{if(!pendingChallenge)return;let enemy=pendingChallenge.rooster;if(!selectedMeron)selectedMeron=roosters.filter(r=>r.mature&&r.sex=='M')[0];if(!selectedMeron)return alert('Pili manok');startFight(selectedMeron,enemy,0,'pulis');document.getElementById('challengeBox').style.display='none';pendingChallenge=null}
function log(t){let l=document.getElementById('log');if(l){l.innerHTML+=`<div>> ${t}</div>`;l.scrollTop=l.scrollHeight}}
function broadcast(d){conns.forEach(c=>{if(c.open)c.send(d)});if(isHost){Object.values(hostConns).forEach(c=>{if(c.open&&c.peer!=d.fromId)c.send(d)})}}
function addChat(m){if(m.msgId&&seenIds.has(m.msgId))return;if(m.msgId)seenIds.add(m.msgId);let box=document.getElementById('chatBox');if(!box)return;let isMe=m.fromId==myId||m.name==playerName;box.innerHTML+=`<div class="${isMe?'me':''}"><b>${m.name}:</b> ${m.text}</div>`;box.scrollTop=box.scrollHeight;}
window.sendChat=()=>{let inp=document.getElementById('chatInput');let txt=inp.value.trim();if(!txt)return;if(!myId){alert('Di pa connected');return}let msg={type:'CHAT',msgId:Date.now()+'_'+Math.random(),fromId:myId,name:playerName,text:txt};addChat(msg);broadcast(msg);inp.value='';}
window.challengePlayer=(targetId,type)=>{
if(!selectedMeron){alert('Pili muna manok sa FARM > PILI PIT');return}
if(targetId==myId)return alert('Sarili mo yan!');
let bet=0;
if(type==='sabong'){let input=prompt('💰 PUSTA? Min P100, Ikaw bahala! Pera mo P'+pesos,'500');if(!input)return;bet=parseInt(input);if(isNaN(bet)||bet<100){alert('Min P100');return}if(pesos<bet){alert('Kulang P'+pesos);return}}else{bet=0}
let payload={type:'CHALLENGE_REQUEST',msgId:Date.now()+'_'+Math.random(),fromId:myId,fromName:playerName,targetId,challengeType:type,rooster:selectedMeron,bet:bet};
broadcast(payload);log('📤 Hamon '+type.toUpperCase()+' P'+bet);alert('SEND HAMON P'+bet+'!');
}
window.acceptChallenge=()=>{
if(!pendingChallenge)return alert('Wala hamon');
if(!selectedMeron){alert('Pili manok sa FARM');document.querySelectorAll('.page').forEach(e=>e.classList.remove('active'));document.getElementById('farm').classList.add('active');return}
let enemy=pendingChallenge.rooster;let bet=pendingChallenge.bet||0;
if(pendingChallenge.challengeType==='sabong'){if(pesos<bet){alert('Kulang P'+bet);return}if(!confirm('💰 HAMON P'+bet+' ni '+pendingChallenge.fromName+'\nManok: '+enemy.name+'\nACCEPT?'))return}
let mode=pendingChallenge.challengeType==='sabong'?'global':'pulis';
let acceptMsg={type:'CHALLENGE_ACCEPT',msgId:Date.now()+'_'+Math.random(),fromId:myId,toId:pendingChallenge.fromId,fromName:playerName,rooster:selectedMeron,challengeType:pendingChallenge.challengeType,bet:bet};
broadcast(acceptMsg);log('✅ ACCEPT P'+bet);startFight(selectedMeron,enemy,bet,mode);document.getElementById('challengeBox').style.display='none';pendingChallenge=null;
}
window.declineChallenge=()=>{if(!pendingChallenge)return;let dec={type:'CHALLENGE_DECLINE',msgId:Date.now()+'_'+Math.random(),fromId:myId,toId:pendingChallenge.fromId,fromName:playerName};broadcast(dec);document.getElementById('challengeBox').style.display='none';pendingChallenge=null;}
function handleData(d,c){
if(d.msgId&&seenIds.has(d.msgId))return;if(d.msgId)seenIds.add(d.msgId);
if(d.type=='AUCTION_ADD'){if(!liveAuctions.find(x=>x.id==d.auction.id)&&!myAuctions.find(x=>x.id==d.auction.id)){liveAuctions.push(d.auction);renderLiveAuction()}}
if(d.type=='AUCTION_REMOVE'){liveAuctions=liveAuctions.filter(x=>x.id!=d.id);myAuctions=myAuctions.filter(x=>x.id!=d.id);renderMyAuction();renderLiveAuction()}
if(d.type=='AUCTION_BUY'){let a=myAuctions.find(x=>x.id==d.id);if(a){pesos+=a.price;roosters=roosters.filter(r=>r.id!=a.rooster.id);myAuctions=myAuctions.filter(x=>x.id!=d.id);updateUI();saveGame();broadcast({type:'AUCTION_REMOVE',id:d.id,msgId:Date.now()+'_'+Math.random()})}}
if(d.type=='MONEY_UPDATE'){Object.keys(leaderboardData).forEach(k=>{if(k!=d.id && leaderboardData[k] && leaderboardData[k].name.includes('(IKAW)')){delete leaderboardData[k]}});leaderboardData[d.id]={name:d.name,pesos:d.pesos,chickens:d.chickens};renderGlobalPlayers();renderLeaderboard();if(isHost)broadcast(d)}
if(d.type=='CHAT'){addChat(d);if(isHost)broadcast(d);return}
if(d.type=='CHALLENGE_REQUEST'){
  if(d.fromId==myId)return;if(d.targetId!=myId&&d.targetId!='all'&&!isHost)return;
  if(isHost&&d.targetId!=myId&&d.targetId!='all'){let targetConn=hostConns[d.targetId];if(targetConn&&targetConn.open){targetConn.send(d);return}}
  pendingChallenge=d;document.querySelectorAll('.page').forEach(e=>e.classList.remove('active'));document.getElementById('pit').classList.add('active');document.getElementById('challengeBox').style.display='block';let betText=d.bet>0?'💰 PUSTA: P'+d.bet:'👮 PULIS WALANG PUSTA';document.getElementById('challengeText').innerText='🔥 HAMON KAY '+d.fromName.toUpperCase()+'! '+d.challengeType.toUpperCase()+' '+betText+' Manok: '+d.rooster.name;log('🔥 HAMON P'+d.bet);alert('MAY HAMON P'+d.bet+' galing '+d.fromName);
}
if(d.type=='CHALLENGE_ACCEPT'){if(d.toId!=myId)return;log('✅ ACCEPTED P'+d.bet+'!');let enemy=d.rooster;let bet=d.bet||0;let mode=d.challengeType==='sabong'?'global':'pulis';document.querySelectorAll('.page').forEach(e=>e.classList.remove('active'));document.getElementById('pit').classList.add('active');if(!selectedMeron)selectedMeron=roosters.filter(r=>r.mature&&r.sex=='M')[0];if(selectedMeron)startFight(selectedMeron,enemy,bet,mode);}
if(d.type=='CHALLENGE_DECLINE'){if(d.toId==myId)log('❌ Decline')}
if(d.type=='FIGHT_RESULT_FINAL'){log('📢 RESULT: '+(d.winner==='tie'?'TABLA 🤝':d.winner.toUpperCase()+' PANALO P'+d.bet));}
if(d.type=='PLAYER_LIST'){d.players.forEach(p=>{if(p.id!=myId)leaderboardData[p.id]={name:p.name,pesos:p.pesos,chickens:p.chickens}});renderGlobalPlayers();renderLeaderboard()}
}
window.autoJoinGlobal=async()=>{
if(isConnecting)return;isConnecting=true;document.getElementById('myRoomId').innerText='⏳ JOINING GLOBAL...';
let {Peer}=await import('peerjs');
let tryHost=new Peer(FIXED_ROOM);
tryHost.on('open',id=>{isHost=true;myId=id;peer=tryHost;isConnecting=false;document.getElementById('myRoomId').innerText='👑 HOST ID:'+id;document.getElementById('peerCount').innerText='HOST 0 PLAYERS';leaderboardData={};leaderboardData[id]={name:playerName+' (IKAW)',pesos,chickens:roosters.length};renderGlobalPlayers();renderLeaderboard();tryHost.on('connection',conn=>{conn.on('open',()=>{hostConns[conn.peer]=conn;document.getElementById('peerCount').innerText='🌐 '+Object.keys(hostConns).length+' PLAYERS';myAuctions.forEach(a=>conn.send({type:'AUCTION_ADD',auction:a,msgId:Date.now()+'_'+Math.random()}));let all=Object.entries(leaderboardData).map(([i,d])=>({id:i,...d}));conn.send({type:'PLAYER_LIST',players:all,msgId:Date.now()+'_'+Math.random()});broadcast({type:'MONEY_UPDATE',id:myId,name:playerName,pesos,chickens:roosters.length,msgId:Date.now()+'_'+Math.random()});});conn.on('data',d=>handleData(d,conn));conn.on('close',()=>{delete hostConns[conn.peer];document.getElementById('peerCount').innerText='🌐 '+Object.keys(hostConns).length+' ONLINE';delete leaderboardData[conn.peer];renderGlobalPlayers();renderLeaderboard()})});});
tryHost.on('error',err=>{if(err.type=='unavailable-id'){tryHost.destroy();let clientPeer=new Peer();clientPeer.on('open',id=>{myId=id;peer=clientPeer;isHost=false;isConnecting=false;document.getElementById('myRoomId').innerText='✅ JOINED AUTO ID:'+id;let conn=clientPeer.connect(FIXED_ROOM);conn.on('open',()=>{conns=[conn];document.getElementById('peerCount').innerText='🌐 JOINED PLAYERS KITA NA!';conn.send({type:'MONEY_UPDATE',id:myId,name:playerName,pesos,chickens:roosters.length,msgId:Date.now()+'_'+Math.random()});});conn.on('data',d=>handleData(d,conn));});}else{isConnecting=false;document.getElementById('myRoomId').innerText='❌ Error Click JOIN ulit';}});
};
window.listForSale=()=>{let id=document.getElementById('sellSel').value,price=parseInt(document.getElementById('sellPrice').value);if(!id)return;if(price<1000)return alert('1000 min');let r=roosters.find(x=>x.id==id);roosters=roosters.filter(x=>x.id!=id);let obj={id:Date.now(),rooster:r,price,owner:playerName};myAuctions.push(obj);updateUI();saveGame();broadcast({type:'AUCTION_ADD',auction:obj,msgId:Date.now()+'_'+Math.random()})}
function renderMyAuction(){document.getElementById('myAuction').innerHTML=myAuctions.map(a=>`<div class="auctionCard"><div><b>🐓 ${a.rooster.name}</b> P${a.price}</div><button onclick="cancelSale(${a.id})">X</button></div>`).join('')||'Wala'}
function renderLiveAuction(){document.getElementById('liveAuction').innerHTML=liveAuctions.map(a=>`<div class="auctionCard live"><div><b>🐓 ${a.rooster.name}</b> P${a.price}<br><span style="font-size:9px">${a.owner}</span></div><button onclick="buyLive(${a.id})">BUY</button></div>`).join('')||'Wala'}
window.cancelSale=(aid)=>{let a=myAuctions.find(x=>x.id==aid);if(!a)return;roosters.push(a.rooster);myAuctions=myAuctions.filter(x=>x.id!=aid);broadcast({type:'AUCTION_REMOVE',id:aid,msgId:Date.now()+'_'+Math.random()});updateUI();saveGame()}
window.buyLive=(aid)=>{let a=liveAuctions.find(x=>x.id==aid);if(!a)return;if(pesos<a.price)return alert('Kulang');pesos-=a.price;roosters.push(a.rooster);liveAuctions=liveAuctions.filter(x=>x.id!=aid);conns.forEach(c=>{if(c.open)c.send({type:'AUCTION_BUY',id:aid,msgId:Date.now()+'_'+Math.random()})});broadcast({type:'AUCTION_REMOVE',id:aid,msgId:Date.now()+'_'+Math.random()});updateUI();saveGame()}
window.updateName=()=>{
let oldName=playerName;playerName=document.getElementById('playerName').value||'Player';localStorage.setItem('sabong_name',playerName);
Object.keys(leaderboardData).forEach(k=>{if(k!=myId && leaderboardData[k] && (leaderboardData[k].name.includes('(IKAW)') || leaderboardData[k].name===oldName || leaderboardData[k].name===oldName+' (IKAW)')){delete leaderboardData[k];}});
if(myId){leaderboardData[myId]={name:playerName+' (IKAW)',pesos,chickens:roosters.length};broadcast({type:'MONEY_UPDATE',id:myId,name:playerName+' (IKAW)',pesos,chickens:roosters.length,msgId:Date.now()+'_'+Math.random()});}
renderGlobalPlayers();renderLeaderboard();saveGame();
}
function renderGlobalPlayers(){
let el=document.getElementById('globalPlayers');if(!el)return;
let players=Object.entries(leaderboardData).map(([id,data])=>({id,...data}));
let cleanMap=new Map();
players.forEach(p=>{if(p.name.includes('(IKAW)')){if(p.id!=myId)return}cleanMap.set(p.id,p);});
let uniq=[...cleanMap.values()].sort((a,b)=>b.pesos-a.pesos);
el.innerHTML=uniq.map(p=>{let isMe=p.id==myId||p.name.includes('(IKAW)');return `<div class="globalPlayer ${isMe?'me':''}"><div><b>${isMe?'👑 ': '🐓 '}${p.name}</b><br><span style="font-size:9px;color:#888">${p.chickens} manok - P${p.pesos}</span></div><div class="btns-challenge">${isMe?'<span style="font-size:8px;color:#666">IKAW</span>':`<button class="btn-sabong" onclick="challengePlayer('${p.id}','sabong')">⚔️ SABONG BET</button><button class="btn-pulis" onclick="challengePlayer('${p.id}','pulis')">👮 PULIS</button>`}</div></div>`}).join('')||'⏳ Click JOIN';
}
function renderLeaderboard(){
if(myId){Object.keys(leaderboardData).forEach(k=>{if(k!=myId && leaderboardData[k] && leaderboardData[k].name.includes('(IKAW)')) delete leaderboardData[k]});leaderboardData[myId]={name:playerName+' (IKAW)',pesos,chickens:roosters.length};}
let map=new Map();Object.values(leaderboardData).forEach(p=>{let key=p.id;if(!map.has(key)||map.get(key).pesos<p.pesos)map.set(key,p)});
let sorted=[...map.values()].sort((a,b)=>b.pesos-a.pesos);
document.getElementById('leaderboardList').innerHTML=sorted.map((p,i)=>`<div style="display:flex;justify-content:space-between;padding:6px;background:#0006;border-radius:6px;margin-bottom:4px;font-size:11px"><div>${i==0?'👑':''} ${p.name}</div><div style="color:#00ff88">P${p.pesos}</div></div>`).join('');
}
window.saveGame=saveGame;if(!loadGame())initDefault();updateUI();setInterval(saveGame,5000);
setTimeout(()=>{window.autoJoinGlobal()},1500);
document.getElementById('chatInput')?.addEventListener('keydown',e=>{if(e.key=='Enter')sendChat()});