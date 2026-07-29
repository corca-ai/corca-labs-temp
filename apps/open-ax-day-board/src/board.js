const people = [
  {id:"seulmin",name:"Seulmin Park",company:"교원",role:"경영관리팀 및 AI TF · 사내 활용 확산, 정책 수립, 과제 발굴 및 PoC 기획",topic:"자동화 에이전트",want:"그룹사별 매출·영업이익 데이터의 수집, 엑셀 가공, 실적 분석, 대시보드 생성, AI 인사이트 제시까지 전 과정을 연결한 자동화 에이전트.",why:"현재 수작업으로 처리하는 업무 공수를 줄이고 정확도를 높이기 위해서다. 사람이 놓친 패턴까지 AI가 찾아내는 경영실적 대시보드를 기대한다.",data:"기간별 매출과 영업이익 XLSX · 약 200행",quick:["표준화가 안 된 데이터","AI가 다 대체할 수 있다는 것","업무 프로세스와 병목을 정확히 아는 사람"],color:"#e95c3f"},
  {id:"yoonji",name:"이윤지B",company:"데이원컴퍼니",role:"AX팀 · 사내 AX 과제 발굴·구현·정착 및 외부 AX 교육·컨설팅 프로그램 설계",topic:"AX 문제 정의 프레임",want:"모호한 현업 요청을 구체적인 AX 문제로 정의하고 근본 원인을 찾는 실무자의 암묵적 판단 기준을 재사용 가능한 프레임으로 구조화한다.",why:"문제 정의 역량이 일부 경험자의 감각에 머물지 않고 다른 구성원도 배우고 적용할 수 있는 형태가 되길 바란다. 풀스택 FDE의 가능성과 협업의 경계를 함께 탐색한다.",data:"교안 검수 플러그인 방향 전환 사례 · Markdown 1건",quick:["판단 기준을 스스로도 명확히 설명하기 어려움","AI가 일을 통째로 대신할 수 있다는 것","될 때까지 계속 묻고 고쳐보는 사람"],color:"#6c62c9"},
  {id:"geonho",name:"신건호",company:"데이원컴퍼니",role:"엔터프라이즈 사업부장 · 탑다운/보텀업 AX 및 대외 AI·AX 교육",topic:"AX 과업 우선순위 파이프라인",want:"고객사를 입력하면 비즈니스 레버 → 드라이버 → 병목 후보 → 가설 → 검증용 AX PoC 순으로 우선 추진할 과업을 도출하는 파이프라인.",why:"고객사들은 AI 아이디어를 비즈니스 임팩트로 연결하고 후속 시나리오를 설계하는 데 어려움을 겪는다. 사전 미팅에서 분석 결과를 바로 제시하고 싶다.",data:"DOCX 6개, MD 1개, TXT 1개 · 약 1.4MB",quick:["산출물 품질에 대한 형식지화된 규약 부재","워크플로우 재설계보다 AI가 더 중요하다는 생각","원래도 일을 잘 하는 사람"],color:"#6c62c9"},
  {id:"minsung",name:"박민성",company:"데이터라이즈",role:"CSO / CPO / HR팀장 / 마케터 · 전사 AX 및 에이전트 개발",topic:"AI-Native 개발·배포 실험",want:"인터뷰에서 SDD 산출물을 만들고 BE·FE·DAE·Design Agent가 개발하며 QA Agent가 테스트까지 수행하는, 인간은 의도와 의사결정만 담당하는 프로세스.",why:"AI만으로 개발부터 배포까지 어디까지 가능한지 극단적으로 실험하고, 데이터라이즈에 가장 적절한 인간과 AI의 결합 지점을 역으로 찾고 싶다.",data:"회사 절차 확인 후 공유 예정",quick:["장애물이 없음","특별한 오해 없음","AI를 사랑하고 인사이트를 나누는 사람"],color:"#eb9e2f"},
  {id:"datarize-1",name:"남상균",company:"데이터라이즈",role:"백엔드 엔지니어·테크리드 · 제품 AI 기능 설계 및 개발 워크플로우 AI 도입",topic:"백오피스 확인·조치 AI 네이티브 워크플로우",want:"AM이나 CX가 개발자를 거치지 않고 대화로 백오피스의 설정·DB 값·로그를 함께 확인하고 조치하게 한다. 반복 요청은 스킬로 정형화하고, 새로운 요청은 스킬 생성을 요청할 수 있는 실행 가능한 프로세스로 남긴다.",why:"백오피스가 중첩되어 필요한 기능을 찾기 어렵고, 확인 요청마다 개발자가 백오피스·DB·로그를 오가느라 고객 응답이 늦어진다. 요청자의 대기 시간과 개발자의 컨텍스트 스위칭을 함께 줄이고 싶다.",data:"백오피스 화면 캡처 + PII를 제외한 오류 확인용 로그 텍스트 일부",quick:["조직 차원의 AI 방향성과 수렴","AI가 은탄환이며 빠름이 문제 해결의 전부라는 생각","압도적으로 많이 시도하는 사람"],color:"#eb9e2f"},
  {id:"james-jo",name:"James Jo (조윤호)",company:"직방",role:"프로덕트 오너 · 프로덕트 기획서 작성 및 운영성 업무 자동화",topic:"담당자 클론 에이전트",want:"프로덕트 오너·개발·QA 담당자의 전문 비서이자 클론 역할을 하는 에이전트. 맡긴 일을 처리하는 단계에서 시작해 담당자처럼 판단하고 대신 처리하는 형태로 확장한다.",why:"기획 이후 기존 자료 조회와 반복 질문, 명확한 규칙의 재설명이 계속 발생해 리소스가 낭비된다. 본인의 지식이 담긴 클론이 반복 업무를 맡으면 더 많은 의사결정에 집중할 수 있다.",data:"기획서 MD 2~3건 + Slack 질문 캡처 약 10건",quick:["쪼개진 휴먼 워크플로우","AI가 100% 정확할 거라는 생각","작업의 속도가 빠른 사람"],color:"#ff6b3d"},
  {id:"zigbang-2",name:"직방2",company:"직방",role:"참가자 · 상세 정보 미정",topic:"준비 내용 미정",want:"아직 제공된 준비 내용이 없습니다.",why:"아직 제공된 내용이 없습니다.",data:"아직 제공된 샘플 데이터가 없습니다.",quick:["응답 미정","응답 미정","응답 미정"],color:"#ff6b3d"},
  {id:"hansol",name:"Hansol Kim",company:"타이키 테크놀로지스",role:"Head of Growth 겸 AX 총 책임자 · 전사 AI 도입, 문화, 정책, 기술 설계",topic:"AI 중심 사내 업무 OS",want:"개별 바이브 코딩 툴을 넘어 모든 업무 흐름을 AI 중심으로 효율화하는 구조·원칙·단계를 문서 형태의 업무 OS 청사진으로 정리한다.",why:"구두·Slack 대화에 갇힌 조직의 명시지와 암묵지를 모두가 활용하게 하고, 반복되는 의사결정과 업무 프로세스를 AI 스킬로 만들고 싶다.",data:"업무 히스토리와 의사결정이 담긴 Slack 캡처",quick:["불명확한 요구사항과 로드맵","딱히 생각나지 않음","개발 멘탈 모델과 호기심이 있는 사람"],color:"#2c86bd"},
  {id:"henry",name:"Henry Kim",company:"타이키 테크놀로지스",role:"현업 부서 담당자 · 복수 업무 프로세스 AX",topic:"데이터 분석 자동화",want:"판매가 잘되는 자동차 부품 카테고리를 찾기 위해 입력 데이터를 정형화하고 동일한 분석 로직으로 결과를 만드는 재사용 가능한 파이프라인.",why:"이베이 25,000개, 알리바바 100,000개로 SKU 등록 수가 제한돼 있어 판매 데이터 기반으로 유망 SKU와 카테고리를 골라야 한다.",data:"판매·트래픽·매입·SKU 데이터 · 100만 행 이상",quick:["AI 작업물을 무조건 신뢰하는 것","AI는 어렵다는 생각","꼼꼼하고 최초 설계와 인프라를 잘 아는 사람"],color:"#2c86bd"},
  {id:"kibun",name:"kibun kim",company:"타이키 테크놀로지스",role:"내셔널 모터스 · 브랜드커뮤니케이션 팀장 · 마케팅·CRM·CS 및 AX TF",topic:"상담 기록·세일즈 패턴 분석",want:"콜 녹취 다운로드와 STT부터 고객별 상담 기록 축적, 상담 의사 시그널 감지, 리드 전환 예측 스코어링까지 이어지는 자동화.",why:"상담원이 통화마다 엑셀을 작성하는 시간을 줄이고 놓친 고객 신호를 복원해 CRM 리드의 신뢰도와 전환율을 높이고 싶다.",data:"WAV 약 2분/500KB + 소량 상담 텍스트",quick:["매일매일 바쁜 업무","내가 하는 것이 더 정확하고 빠르다는 생각","호기심이 많고 새 시도를 두려워하지 않는 사람"],color:"#2c86bd"},
  {id:"corca-hwidong",name:"휘동",company:"Corca",role:"Corca team",topic:"Open AX Day host",special:true,color:"#62d5f4"},
  {id:"corca-jongho",name:"종호",company:"Corca",role:"Corca team",topic:"Open AX Day host",special:true,color:"#62d5f4"},
  {id:"corca-jaeyoung",name:"재영",company:"Corca",role:"Corca team",topic:"Open AX Day host",special:true,color:"#62d5f4"},
  {id:"corca-jeongmin",name:"정민",company:"Corca",role:"Corca team",topic:"Open AX Day host",special:true,color:"#62d5f4"},
  {id:"corca-jeonghyeok",name:"정혁",company:"Corca",role:"Corca team",topic:"Open AX Day host",special:true,color:"#62d5f4"},
  {id:"corca-hak",name:"학",company:"Corca",role:"Corca team",topic:"Open AX Day host",special:true,color:"#62d5f4"}
];

const stage=document.querySelector("#stage"), drawer=document.querySelector("#drawer"), content=document.querySelector("#drawerContent");
const search=document.querySelector("#search"), toast=document.querySelector("#toast"), empty=document.querySelector("#empty");
let state={positions:{},groups:{},groupLabels:{},groupColors:{},notes:{},showNotes:false,autoArrange:false,history:[],dragStart:null,moved:false,selected:null};
let noteReflowTimer;
const groupPalette=["#087f8c","#7656c9","#d74878","#d27a16","#2878c8","#6b9838","#d14d3f","#0b91b8","#9b5b32","#5966b3"];
const layoutToken=name=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name))||0;
const cardW=()=>layoutToken("--card-width"),cardH=()=>layoutToken("--card-height");
const nodeW=id=>people.find(p=>p.id===id)?.special?layoutToken("--badge-width"):cardW();
const nodeH=id=>{
  const rendered=document.querySelector(`[data-id="${id}"]`);
  if(rendered)return rendered.offsetHeight;
  return people.find(p=>p.id===id)?.special?layoutToken("--badge-height"):cardH();
};

function reconcileState(){
  const validIds=new Set(people.map(p=>p.id));
  Object.keys(state.positions).forEach(id=>{if(!validIds.has(id))delete state.positions[id]});
  Object.keys(state.groups).forEach(id=>{if(!validIds.has(id))delete state.groups[id]});
  [...new Set(Object.values(state.groups))].forEach(g=>{
    const members=Object.keys(state.groups).filter(id=>state.groups[id]===g);
    if(members.length<2)members.forEach(id=>delete state.groups[id]);
  });
  const activeGroups=new Set(Object.values(state.groups));
  Object.keys(state.groupLabels).forEach(g=>{if(!activeGroups.has(g))delete state.groupLabels[g]});
  Object.keys(state.groupColors).forEach(g=>{if(!activeGroups.has(g))delete state.groupColors[g]});
  Object.keys(state.notes).forEach(id=>{if(!validIds.has(id)||people.find(p=>p.id===id)?.special)delete state.notes[id]});
}
function initialPositions(){
  const columnStep=cardW()+layoutToken("--card-gap-x");
  const w=stage.clientWidth,h=stage.clientHeight, cols=Math.max(1,Math.floor((w-40)/columnStep));
  const rowStep=cardH()+layoutToken("--card-gap-y");
  people.forEach((p,i)=>{ const col=i%cols,row=Math.floor(i/cols); state.positions[p.id]={x:24+col*columnStep,y:28+row*rowStep}; });
}
function snapshot(){ return JSON.stringify({positions:state.positions,groups:state.groups,groupLabels:state.groupLabels,groupColors:state.groupColors,notes:state.notes,showNotes:state.showNotes,autoArrange:state.autoArrange}); }
function pushHistory(s){ if(state.history.at(-1)!==s){state.history.push(s);if(state.history.length>30)state.history.shift();} }
function save(){
  const serialized=snapshot();
  localStorage.setItem("openAxPeopleBoard",serialized);
  window.boardPersistence?.save(JSON.parse(serialized));
}
function alphaLabel(index){
  let label="";
  do{label=String.fromCharCode(65+index%26)+label;index=Math.floor(index/26)-1}while(index>=0);
  return label;
}
function ensureGroupLabels(){
  const groupIds=[...new Set(Object.values(state.groups))].filter(g=>groupMembers(g).length>1);
  const used=new Set(Object.values(state.groupLabels).map(label=>String(label).toUpperCase()));
  const usedColors=new Set(Object.values(state.groupColors));
  let index=0;
  groupIds.forEach(g=>{
    if(!state.groupLabels[g]){
      while(used.has(alphaLabel(index)))index++;
      const label=alphaLabel(index++);state.groupLabels[g]=label;used.add(label);
    }
    if(!state.groupColors[g]){
      const color=groupPalette.find(candidate=>!usedColors.has(candidate))||groupPalette[groupIds.indexOf(g)%groupPalette.length];
      state.groupColors[g]=color;usedColors.add(color);
    }
  });
}
function load(){
  try{
    const s=JSON.parse(localStorage.getItem("openAxPeopleBoard"));
    if(s?.positions){
      const validIds=new Set(people.map(p=>p.id));
      state.positions=s.positions;
      state.groups=Object.fromEntries(Object.entries(s.groups||{}).filter(([id])=>validIds.has(id)));
      state.groupLabels=s.groupLabels||{};
      state.groupColors=s.groupColors||{};
      state.notes=s.notes||{};
      state.showNotes=Boolean(s.showNotes);
      state.autoArrange=Boolean(s.autoArrange);
      [...new Set(Object.values(state.groups))].forEach(g=>{
        if(groupMembers(g).length<2){
          Object.keys(state.groups).forEach(id=>{if(state.groups[id]===g)delete state.groups[id]});
          delete state.groupLabels[g];
          delete state.groupColors[g];
        }
      });
      ensureGroupLabels();save();
      return true;
    }
  }catch(e){}
  return false;
}
function clampPos(pos,id){ return {x:Math.max(8,Math.min(pos.x,stage.clientWidth-nodeW(id)-8)),y:Math.max(8,Math.min(pos.y,stage.clientHeight-nodeH(id)-8))}; }
function applyNotesVisibility(){
  document.documentElement.classList.toggle("notes-visible",state.showNotes);
  const toggle=document.querySelector("#toggleNotes");
  if(toggle)toggle.checked=state.showNotes;
}
function applyAutoArrangeSetting(){
  const toggle=document.querySelector("#toggleAutoArrange");
  if(toggle)toggle.checked=state.autoArrange;
}
function updateCardNote(id){
  const noteEl=document.querySelector(`[data-id="${id}"] .card-note`);
  if(!noteEl)return;
  const value=state.notes[id]?.trim()||"메모 없음";
  noteEl.classList.toggle("note-empty",!state.notes[id]?.trim());
  noteEl.querySelector("span").textContent=value;
}
function render(){
  stage.querySelectorAll(".person,.group-hull").forEach(el=>el.remove());
  const columnStep=cardW()+layoutToken("--card-gap-x");
  const cols=Math.max(1,Math.floor((stage.clientWidth-40)/columnStep));
  people.forEach((p,i)=>{
    if(!state.positions[p.id]) state.positions[p.id]={x:24+(i%cols)*columnStep,y:28+Math.floor(i/cols)*(cardH()+layoutToken("--card-gap-y"))};
    state.positions[p.id]=clampPos(state.positions[p.id],p.id);
    const group=state.groups[p.id],groupColor=group?state.groupColors[group]:"";
    const el=document.createElement("article"); el.className=`person${p.special?" corca":""}${group?" grouped":""}`; el.dataset.id=p.id; el.tabIndex=0;
    el.style.cssText=`--card-color:${p.color};--group-color:${groupColor};transform:translate(${state.positions[p.id].x}px,${state.positions[p.id].y}px)`;
    el.setAttribute("aria-label",`${p.name}, ${p.company}. 자세히 보기`);
    el.innerHTML=`<div class="eyebrow"><i class="dot"></i>${p.company}</div><h2>${p.name}</h2><div class="role">${p.role}</div><div class="topic"><span>↗</span>${p.topic}</div>${p.special?"":'<div class="card-note"><b>Internal notes</b><span></span></div>'}`;
    el.addEventListener("click",()=>{if(!state.moved)openDrawer(p.id)});
    el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openDrawer(p.id)}});
    el.addEventListener("contextmenu",e=>{e.preventDefault();ungroup(p.id)});
    stage.appendChild(el);
    if(!p.special)updateCardNote(p.id);
  });
  updateHulls(); filter();
}
function groupMembers(g){ return people.filter(p=>state.groups[p.id]===g).map(p=>p.id); }
function updateGroupCardStyles(){
  document.querySelectorAll(".person").forEach(el=>{
    const group=state.groups[el.dataset.id];
    el.classList.toggle("grouped",Boolean(group));
    el.style.setProperty("--group-color",group?state.groupColors[group]||groupPalette[0]:"transparent");
  });
}
function updateHulls(){
  stage.querySelectorAll(".group-hull").forEach(e=>e.remove());
  [...new Set(Object.values(state.groups))].forEach(g=>{
    const ids=groupMembers(g); if(ids.length<2)return;
    const ps=ids.map(id=>state.positions[id]), pad=layoutToken("--cluster-pad");
    const minX=Math.min(...ps.map(p=>p.x))-pad,minY=Math.min(...ps.map(p=>p.y))-pad;
    const maxX=Math.max(...ids.map(id=>state.positions[id].x+nodeW(id)))+pad;
    const maxY=Math.max(...ids.map(id=>state.positions[id].y+nodeH(id)))+pad;
    const hull=document.createElement("div");hull.className="group-hull";
    hull.style.cssText=`--group-color:${state.groupColors[g]||groupPalette[0]};left:${minX}px;top:${minY}px;width:${maxX-minX}px;height:${maxY-minY}px`;
    const button=document.createElement("button");
    button.type="button";button.textContent=state.groupLabels[g]||`cluster · ${ids.length}`;
    button.title="클릭해서 그룹 이름 지정";button.setAttribute("aria-label",`${button.textContent} 그룹 이름 변경`);
    button.addEventListener("click",()=>editGroupLabel(g));
    hull.appendChild(button);stage.prepend(hull);
  });
}
function editGroupLabel(g){
  const current=state.groupLabels[g]||"";
  const next=prompt("그룹 이름을 입력하세요. 비워두면 기본 이름으로 돌아갑니다.",current);
  if(next===null)return;
  pushHistory(snapshot());
  const clean=next.trim().slice(0,40);
  if(clean)state.groupLabels[g]=clean;else{delete state.groupLabels[g];ensureGroupLabels()}
  settleLayoutChange(clean?"그룹 이름을 저장했어요":"자동 그룹 이름을 지정했어요",updateHulls);
}
function group(a,b){
  pushHistory(state.dragStart||snapshot());
  const ga=state.groups[a],gb=state.groups[b],g=ga||gb||`g${Date.now()}`;
  if(ga&&gb&&ga!==gb){
    Object.keys(state.groups).forEach(id=>{if(state.groups[id]===gb)state.groups[id]=ga});
    if(!state.groupLabels[ga]&&state.groupLabels[gb])state.groupLabels[ga]=state.groupLabels[gb];
    delete state.groupLabels[gb];
    delete state.groupColors[gb];
  }
  state.groups[a]=g;state.groups[b]=g;ensureGroupLabels();
  settleLayoutChange("그룹을 만들었어요",()=>{updateGroupCardStyles();updateHulls()});
}
function ungroup(id){
  const g=state.groups[id];if(!g){showToast("이 카드는 그룹에 속해 있지 않아요");return}
  pushHistory(snapshot());delete state.groups[id];
  if(groupMembers(g).length<2){Object.keys(state.groups).forEach(k=>{if(state.groups[k]===g)delete state.groups[k]});delete state.groupLabels[g];delete state.groupColors[g]}
  settleLayoutChange("그룹에서 분리했어요",()=>{updateGroupCardStyles();updateHulls()});
}
function shakeToUngroup(id){
  const g=state.groups[id];if(!g)return false;
  delete state.groups[id];
  if(groupMembers(g).length<2){Object.keys(state.groups).forEach(k=>{if(state.groups[k]===g)delete state.groups[k]});delete state.groupLabels[g];delete state.groupColors[g]}
  state.shake.broken=true;updateGroupCardStyles();updateHulls();
  if(navigator.vibrate)navigator.vibrate(35);
  showToast("흔들어서 그룹에서 분리했어요");
  return true;
}
function shuffled(items){
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}
  return copy;
}
function randomizeGroups(groupCount){
  pushHistory(snapshot());
  const participants=people.filter(p=>!p.special);
  state.groups={};
  state.groupLabels={};
  state.groupColors={};
  const buckets=Array.from({length:groupCount},()=>[]);
  const companies=new Map();
  participants.forEach(p=>{
    if(!companies.has(p.company))companies.set(p.company,[]);
    companies.get(p.company).push(p);
  });
  const companyBatches=shuffled([...companies.values()])
    .map(batch=>shuffled(batch))
    .sort((a,b)=>b.length-a.length);
  companyBatches.forEach(batch=>batch.forEach(person=>{
    const candidates=shuffled(buckets).sort((a,b)=>{
      const sameA=a.filter(member=>member.company===person.company).length;
      const sameB=b.filter(member=>member.company===person.company).length;
      return sameA-sameB||a.length-b.length;
    });
    candidates[0].push(person);
  }));
  buckets.forEach((bucket,index)=>{
    if(bucket.length<2)return;
    const groupId=`random-${Date.now()}-${index}`;
    bucket.forEach(p=>state.groups[p.id]=groupId);
  });
  ensureGroupLabels();save();
  arrangeBoard({record:false,message:`회사 다양성을 고려해 ${groupCount}개 그룹을 만들었어요`});
}
function arrangeBoard(options={}){
  const {record=true,silent=false,message="클러스터 안에서 Corca 배지를 오른쪽으로 정렬했어요"}=options;
  if(record)pushHistory(snapshot());
  const groupedIds=new Set(Object.keys(state.groups));
  const groupedUnits=[...new Set(Object.values(state.groups))]
    .map(g=>groupMembers(g))
    .filter(ids=>ids.length>1)
    .sort((a,b)=>b.length-a.length);
  const singleUnits=people.filter(p=>!groupedIds.has(p.id)).map(p=>[p.id]);
  const units=[...groupedUnits,...singleUnits];
  const gapX=layoutToken("--card-gap-x"),gapY=layoutToken("--card-gap-y");
  const marginX=24,marginY=layoutToken("--canvas-margin-y");
  const measuredCardH=Math.max(cardH(),...[...document.querySelectorAll(".person:not(.corca)")].map(el=>el.offsetHeight));
  const cellW=cardW()+gapX,cellH=measuredCardH+gapY;
  const corcaUnits=units.filter(ids=>ids.every(id=>people.find(p=>p.id===id)?.special));
  const mainUnits=units.filter(ids=>!corcaUnits.includes(ids));
  const useRail=stage.clientWidth>=760&&corcaUnits.length>0;
  const badgeGapX=layoutToken("--badge-gap-x");
  const railWidth=useRail?nodeW(corcaUnits.flat()[0])*2+badgeGapX+layoutToken("--cluster-pad")*2:0;
  const cols=Math.max(1,Math.floor((stage.clientWidth-marginX*2-railWidth+gapX)/cellW));
  const layoutUnits=useRail?mainUnits:units;
  let cursorCol=0,cursorRow=0,rowSpan=1;
  layoutUnits.forEach(ids=>{
    const regularIds=ids.filter(id=>!people.find(p=>p.id===id)?.special);
    const specialIds=ids.filter(id=>people.find(p=>p.id===id)?.special);
    const mixed=regularIds.length>0&&specialIds.length>0&&cols>1;
    if(mixed){
      if(cursorCol>0){cursorRow+=rowSpan;cursorCol=0;rowSpan=1}
      const specialCols=Math.min(2,Math.max(1,cols-1));
      const badgeW=nodeW(specialIds[0]),badgeH=nodeH(specialIds[0]);
      const badgeGapX=layoutToken("--badge-gap-x"),badgeGapY=layoutToken("--badge-gap-y");
      const layoutWidth=cols*cellW-gapX;
      const specialRailWidth=specialCols*badgeW+(specialCols-1)*badgeGapX;
      const regularWidth=Math.max(cardW(),layoutWidth-specialRailWidth-gapX);
      const regularCols=Math.max(1,Math.floor((regularWidth+gapX)/cellW));
      const regularRows=Math.ceil(regularIds.length/regularCols);
      const specialRows=Math.ceil(specialIds.length/specialCols);
      const regularHeight=regularRows*measuredCardH+Math.max(0,regularRows-1)*gapY;
      const specialHeight=specialRows*badgeH+Math.max(0,specialRows-1)*badgeGapY;
      const unitHeight=Math.max(regularHeight,specialHeight);
      const unitRows=Math.max(1,Math.ceil((unitHeight+gapY)/cellH));
      const unitTop=marginY+cursorRow*cellH;
      const specialRailX=marginX+layoutWidth-specialRailWidth;
      regularIds.forEach((id,i)=>{
        const col=i%regularCols,row=cursorRow+Math.floor(i/regularCols);
        state.positions[id]={x:marginX+col*cellW,y:marginY+row*cellH};
      });
      specialIds.forEach((id,i)=>{
        const col=i%specialCols,row=Math.floor(i/specialCols);
        state.positions[id]={x:specialRailX+col*(badgeW+badgeGapX),y:unitTop+row*(badgeH+badgeGapY)};
      });
      cursorRow+=unitRows;cursorCol=0;rowSpan=1;
      return;
    }
    const unitCols=Math.min(ids.length,cols),unitRows=Math.ceil(ids.length/unitCols);
    if(cursorCol+unitCols>cols){cursorRow+=rowSpan;cursorCol=0;rowSpan=1}
    ids.forEach((id,i)=>{
      const col=cursorCol+i%unitCols,row=cursorRow+Math.floor(i/unitCols);
      const centeredOffset=(cardW()-nodeW(id))/2;
      state.positions[id]={x:marginX+col*cellW+centeredOffset,y:marginY+row*cellH};
    });
    cursorCol+=unitCols;rowSpan=Math.max(rowSpan,unitRows);
    if(cursorCol>=cols){cursorRow+=rowSpan;cursorCol=0;rowSpan=1}
  });
  if(useRail){
    const railIds=corcaUnits.flat(),badgeGapY=layoutToken("--badge-gap-y"),badgeCols=2;
    const railX=stage.clientWidth-marginX-(nodeW(railIds[0])*badgeCols+badgeGapX);
    railIds.forEach((id,i)=>{
      state.positions[id]={x:railX+(i%badgeCols)*(nodeW(id)+badgeGapX),y:marginY+Math.floor(i/badgeCols)*(nodeH(id)+badgeGapY)};
    });
  }
  save();render();if(!silent)showToast(message);
}
function settleLayoutChange(message,update=render){
  if(state.autoArrange){
    arrangeBoard({record:false,message:`${message.replace(/요$/,"")}고 자동 정렬했어요`});
    return;
  }
  save();update();showToast(message);
}
function markdownText(value){
  return String(value||"").replace(/([\\`*_[\]<>])/g,"\\$1").replace(/\n+/g," ");
}
function exportMarkdown(){
  const lines=["# Open AX Day · People Canvas","","현재 캔버스의 그룹 구성입니다.",""];
  const groupIds=[...new Set(Object.values(state.groups))];
  groupIds.forEach((g,index)=>{
    const ids=groupMembers(g);
    if(ids.length<2)return;
    lines.push(`## ${markdownText(state.groupLabels[g]||`클러스터 ${index+1}`)}`,"");
    ids.forEach(id=>{
      const p=people.find(person=>person.id===id);
      lines.push(`- **${markdownText(p.name)}** — ${markdownText(p.company)}`);
      lines.push(`  - ${markdownText(p.special?"Open AX Day host":p.topic)}`);
      if(!p.special&&state.notes[p.id]?.trim())lines.push(`  - **내부 메모:** ${markdownText(state.notes[p.id])}`);
    });
    lines.push("");
  });
  const groupedIds=new Set(Object.keys(state.groups));
  const ungrouped=people.filter(p=>!groupedIds.has(p.id));
  if(ungrouped.length){
    lines.push("## 그룹 없음","");
    ungrouped.forEach(p=>{
      lines.push(`- **${markdownText(p.name)}** — ${markdownText(p.company)}`);
      lines.push(`  - ${markdownText(p.special?"Open AX Day host":p.topic)}`);
      if(!p.special&&state.notes[p.id]?.trim())lines.push(`  - **내부 메모:** ${markdownText(state.notes[p.id])}`);
    });
    lines.push("");
  }
  const blob=new Blob([lines.join("\n")],{type:"text/markdown;charset=utf-8"});
  const url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download="open-ax-day-groups.md";document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  showToast("Markdown 파일을 내보냈어요");
}
function downloadFile(name,text,type){
  const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),link=document.createElement("a");
  link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function exportJson(){
  const payload={
    schema:"open-ax-day-people-canvas/v1",
    exportedAt:new Date().toISOString(),
    participants:people.map(({id,name,company})=>({id,name,company})),
    board:{positions:state.positions,groups:state.groups,groupLabels:state.groupLabels,groupColors:state.groupColors,notes:state.notes,showNotes:state.showNotes,autoArrange:state.autoArrange}
  };
  downloadFile("open-ax-day-board.json",JSON.stringify(payload,null,2),"application/json;charset=utf-8");
  showToast("JSON 파일을 내보냈어요");
}
async function importJsonFile(file){
  try{
    const payload=JSON.parse(await file.text());
    if(payload?.schema!=="open-ax-day-people-canvas/v1"||!payload.board)throw new Error("schema");
    const validIds=new Set(people.map(p=>p.id)),positions={},groups={},groupLabels={},groupColors={},notes={};
    people.forEach(p=>{
      const imported=payload.board.positions?.[p.id];
      positions[p.id]=imported&&Number.isFinite(imported.x)&&Number.isFinite(imported.y)
        ? clampPos({x:imported.x,y:imported.y},p.id)
        : state.positions[p.id]||{x:24,y:28};
    });
    const importedGroups=payload.board.groups||{},groupMap=new Map();
    people.forEach(p=>{
      const importedGroup=importedGroups[p.id];
      if(typeof importedGroup!=="string"||!importedGroup||!validIds.has(p.id))return;
      if(!groupMap.has(importedGroup))groupMap.set(importedGroup,`import-g${groupMap.size+1}`);
      groups[p.id]=groupMap.get(importedGroup);
    });
    [...new Set(Object.values(groups))].forEach(g=>{
      const members=Object.keys(groups).filter(id=>groups[id]===g);
      if(members.length<2)members.forEach(id=>delete groups[id]);
    });
    groupMap.forEach((safeGroup,importedGroup)=>{
      if(!Object.values(groups).includes(safeGroup))return;
      const label=payload.board.groupLabels?.[importedGroup];
      if(typeof label==="string"&&label.trim())groupLabels[safeGroup]=label.trim().slice(0,40);
      const color=payload.board.groupColors?.[importedGroup];
      if(typeof color==="string"&&/^#[0-9a-f]{6}$/i.test(color))groupColors[safeGroup]=color;
    });
    people.filter(p=>!p.special).forEach(p=>{
      const note=payload.board.notes?.[p.id];
      if(typeof note==="string"&&note.trim())notes[p.id]=note.slice(0,20000);
    });
    pushHistory(snapshot());state.positions=positions;state.groups=groups;state.groupLabels=groupLabels;state.groupColors=groupColors;state.notes=notes;state.showNotes=Boolean(payload.board.showNotes);state.autoArrange=Boolean(payload.board.autoArrange);
    ensureGroupLabels();
    applyNotesVisibility();applyAutoArrangeSetting();
    settleLayoutChange("JSON에서 보드 상태와 메모를 가져왔어요");
  }catch(error){
    showToast("올바른 People Canvas JSON 파일이 아니에요");
  }
}
function openDrawer(id){
  const p=people.find(x=>x.id===id);state.selected=id;
  content.innerHTML=p.special
  ? `<div class="drawer-company">Corca · Open AX Day</div><h2>${p.name}</h2><p class="drawer-role">Corca team</p>
  <section><h3>Workshop role</h3><h4>Open AX Day host</h4><p>참가자들과 함께 워크숍을 만드는 Corca 멤버입니다.</p></section>`
  : `<div class="drawer-company">${p.company}</div><h2>${p.name}</h2><p class="drawer-role">${p.role}</p>
  <section><h3>Workshop build</h3><h4>${p.topic}</h4><p>${p.want}</p></section>
  <section><h3>Why this matters</h3><p>${p.why}</p></section>
  <section><h3>Sample data</h3><p>${p.data}</p></section>
  <section><h3>Quick responses</h3><div class="quick"><div><b>AI 도입의 장애물</b><span>${p.quick[0]}</span></div><div><b>주변의 오해</b><span>${p.quick[1]}</span></div><div><b>AI를 잘 활용하는 사람</b><span>${p.quick[2]}</span></div></div></section>
  <section><h3>Internal notes</h3><textarea class="notes-field" id="personNotes" placeholder="이 참가자에 대한 내부 메모를 남기세요…"></textarea><p class="notes-help">입력하는 즉시 이 브라우저에 자동 저장됩니다.</p></section>`;
  if(!p.special){
    const field=document.querySelector("#personNotes");
    field.value=state.notes[p.id]||"";
    field.addEventListener("input",()=>{
      const value=field.value.slice(0,20000);
      if(value)state.notes[p.id]=value;else delete state.notes[p.id];
      save();updateCardNote(p.id);updateHulls();
      if(state.showNotes){
        clearTimeout(noteReflowTimer);
        noteReflowTimer=setTimeout(()=>arrangeBoard({record:false,silent:true}),300);
      }
    });
  }
  drawer.classList.add("open");drawer.setAttribute("aria-hidden","false");document.querySelector("#close").focus({preventScroll:true});
}
function closeDrawer(){drawer.classList.remove("open");drawer.setAttribute("aria-hidden","true");const el=document.querySelector(`[data-id="${state.selected}"]`);if(el)setTimeout(()=>el.focus(),250)}
function filter(){
  const q=search.value.trim().toLocaleLowerCase("ko");let visible=0;
  people.forEach(p=>{const hit=!q||Object.values(p).join(" ").toLocaleLowerCase("ko").includes(q);document.querySelector(`[data-id="${p.id}"]`)?.classList.toggle("match-dim",!hit);if(hit)visible++});
  document.querySelector("#count").textContent=`${visible} ${visible===1?"person":"people"}`;empty.classList.toggle("show",visible===0);
}
let toastTimer;function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),1800)}

interact(".person").draggable({
  ignoreFrom:".card-note",
  inertia:{resistance:18,minSpeed:250,endSpeed:60}, modifiers:[interactModifiers.restrictRect({restriction:"parent",endOnly:true})],
  listeners:{
    start(e){
      state.dragStart=snapshot();state.moved=false;
      state.shake={dir:0,run:0,reversals:0,start:performance.now(),broken:false};
      e.target.classList.add("dragging");
    },
    move(e){
      state.moved=true;const id=e.target.dataset.id;
      if(!state.shake.broken&&state.groups[id]){
        const direction=Math.sign(e.dx);
        if(direction){
          if(!state.shake.dir||direction===state.shake.dir)state.shake.run+=Math.abs(e.dx);
          else{
            if(state.shake.run>=14)state.shake.reversals++;
            state.shake.dir=direction;state.shake.run=Math.abs(e.dx);
          }
          if(!state.shake.dir)state.shake.dir=direction;
        }
        if(performance.now()-state.shake.start>1200){
          state.shake.reversals=0;state.shake.start=performance.now();
        }else if(state.shake.reversals>=3)shakeToUngroup(id);
      }
      const g=state.groups[id],ids=g?groupMembers(g):[id];
      ids.forEach(mid=>{const p=state.positions[mid];p.x+=e.dx;p.y+=e.dy;const el=document.querySelector(`[data-id="${mid}"]`);el.style.transform=`translate(${p.x}px,${p.y}px)`});
      document.querySelectorAll(".person").forEach(el=>el.classList.remove("drop-target"));
      const r=e.target.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
      const target=[...document.elementsFromPoint(cx,cy)].find(el=>el.classList?.contains("person")&&el!==e.target);
      if(target)target.classList.add("drop-target");updateHulls();
    },
    end(e){
      e.target.classList.remove("dragging");document.querySelectorAll(".person").forEach(el=>el.classList.remove("drop-target"));
      const r=e.target.getBoundingClientRect(),target=[...document.elementsFromPoint(r.left+r.width/2,r.top+r.height/2)].find(el=>el.classList?.contains("person")&&el!==e.target);
      const detachedByShake=state.shake?.broken;
      if(target&&!detachedByShake)group(e.target.dataset.id,target.dataset.id);
      else if(state.moved){pushHistory(state.dragStart);settleLayoutChange(detachedByShake?"그룹에서 분리했어요":"카드를 이동했어요")}
      state.shake=null;
      setTimeout(()=>state.moved=false,0);
    }
  }
});
search.addEventListener("input",filter);
document.querySelector("#close").addEventListener("click",closeDrawer);document.querySelector("#scrim").addEventListener("click",closeDrawer);
document.querySelector("#exportMd").addEventListener("click",exportMarkdown);
document.querySelector("#exportJson").addEventListener("click",exportJson);
document.querySelector("#importJson").addEventListener("click",()=>document.querySelector("#jsonFile").click());
document.querySelector("#jsonFile").addEventListener("change",e=>{const file=e.target.files[0];if(file)importJsonFile(file);e.target.value=""});
document.querySelector("#randomize").addEventListener("click",()=>{
  const participantCount=people.filter(p=>!p.special).length;
  const maxGroups=Math.max(1,Math.floor(participantCount/2));
  const input=document.querySelector("#randomGroupCount");
  input.max=String(maxGroups);input.value=String(Math.min(3,maxGroups));
  document.querySelector("#randomDialog").showModal();setTimeout(()=>input.select(),0);
});
document.querySelector("#cancelRandom").addEventListener("click",()=>document.querySelector("#randomDialog").close());
document.querySelector("#randomForm").addEventListener("submit",e=>{
  e.preventDefault();
  const input=document.querySelector("#randomGroupCount"),count=Number(input.value);
  if(!input.checkValidity()||!Number.isInteger(count))return input.reportValidity();
  document.querySelector("#randomDialog").close();randomizeGroups(count);
});
document.querySelector("#toggleNotes").addEventListener("change",e=>{
  state.showNotes=e.target.checked;applyNotesVisibility();
  arrangeBoard({record:false,message:state.showNotes?"카드에 내부 메모를 표시했어요":"카드의 내부 메모를 숨겼어요"});
});
document.querySelector("#toggleAutoArrange").addEventListener("change",e=>{
  state.autoArrange=e.target.checked;
  if(state.autoArrange)arrangeBoard({record:false,message:"변경 후 자동 정렬을 켰어요"});
  else{save();showToast("변경 후 자동 정렬을 껐어요")}
});
document.querySelector("#arrange").addEventListener("click",arrangeBoard);
document.querySelector("#undo").addEventListener("click",()=>{const s=state.history.pop();if(!s)return showToast("되돌릴 변경이 없어요");const prev=JSON.parse(s);state.positions=prev.positions;state.groups=prev.groups;state.groupLabels=prev.groupLabels||{};state.groupColors=prev.groupColors||{};ensureGroupLabels();settleLayoutChange("마지막 변경을 되돌렸어요")});
document.querySelector("#reset").addEventListener("click",()=>{pushHistory(snapshot());state.groups={};state.groupLabels={};state.groupColors={};initialPositions();settleLayoutChange("보드를 초기화했어요")});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeDrawer();if(e.key==="/"&&document.activeElement!==search){e.preventDefault();search.focus()}if((e.metaKey||e.ctrlKey)&&e.key==="z"){e.preventDefault();document.querySelector("#undo").click()}});
addEventListener("resize",()=>{clearTimeout(window.resizeTimer);window.resizeTimer=setTimeout(()=>{Object.keys(state.positions).forEach(id=>state.positions[id]=clampPos(state.positions[id],id));render();save()},180)});
const restored=load();
if(!restored)initialPositions();
reconcileState();applyNotesVisibility();applyAutoArrangeSetting();render();
if(restored)save();

export {};
