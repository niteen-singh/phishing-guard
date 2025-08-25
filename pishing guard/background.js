/* global browser */
const TWO_LVL = new Set(["co.uk","ac.uk","org.uk","co.in","com.au","com.br","co.nz","com.cn"]);
const BAD_TLDS = new Set(["xyz","top","gq","tk","ml","cf","zip","cam","click","country"]);
const SHORTENERS = new Set(["bit.ly","t.co","tinyurl.com","rb.gy","rebrand.ly"]);
const BRANDS = {
  paypal:"paypal.com", google:"google.com", gmail:"gmail.com", amazon:"amazon.com",
  netflix:"netflix.com", whatsapp:"whatsapp.com", facebook:"facebook.com",
  microsoft:"microsoft.com", icici:"icicibank.com", hdfc:"hdfcbank.com",
  cgd:"cgd.pt"  // For CGD spoof detection
};
const NAV_LIMIT = 6;

/* ---------- helpers ---------- */
const eTLD1 = h=>{
  const s=h.split("."); if(s.length<=2) return h;
  const t=s.slice(-2).join("."), t3=s.slice(-3).join(".");
  return TWO_LVL.has(t)?t3:t;
};
const scoreUrl = (url, page={})=>{
  let score=0, issues=[], host="", e2="";
  try{ const u=new URL(url); host=u.hostname.toLowerCase(); e2=eTLD1(host);
  }catch{ score+=3; issues.push("Malformed URL."); return {score,level:"High Risk",issues}; }
  if(url.length>150){score+=2;issues.push("Very long URL.");}
  else if(url.length>90){score+=1;issues.push("Unusually long URL.");}
  if(/\b\d{1,3}(\.\d{1,3}){3}\b/.test(url)){score+=2;issues.push("Uses IP address.");}
  if(url.includes("@")){score+=1;issues.push("Contains “@”.");}
  if((url.match(/\./g)||[]).length>5){score+=1;issues.push("Many dots.");}
  if(!url.startsWith("https://")){score+=1;issues.push("Not HTTPS.");}
  const tld=host.split(".").pop(); if(BAD_TLDS.has(tld)){score+=1;issues.push("Low-reputation TLD ."+tld);}
  if(SHORTENERS.has(e2)){score+=2;issues.push("URL shortener hides destination.");}
  if(host.includes("xn--")){score+=2;issues.push("Punycode (IDN) domain.");}
  ["login","verify","account","secure","update","password"].forEach(k=>{
    if(url.toLowerCase().includes(k)){score+=1;issues.push(`Contains “${k}”.`);}
  });
  // brand spoof
  Object.keys(BRANDS).forEach(b=>{
    if(url.toLowerCase().includes(b) && e2!==BRANDS[b]){score+=3;issues.push(`Mimics brand “${b}” on wrong domain (expected ${BRANDS[b]}).`);}
  });
  if(host.includes("cgd") && !host.endsWith("cgd.pt")){score+=3;issues.push("Suspicious CGD domain variation.");}
  // page signals
  if(page.pass){score+=2;issues.push("Page includes password field.");}
  if(page.cross){score+=2;issues.push("Form posts to another domain or http.");}
  if(page.titleBrand && BRANDS[page.titleBrand] && e2!==BRANDS[page.titleBrand]){
    score+=3;issues.push(`Title says “${page.titleBrand}” but domain differs.`);}
  const level= score>=7?"High Risk": score>=4?"Suspicious":"Safe";
  return {score,level,issues};
};
/* ---------- storage ---------- */
const save=async(tabId,url,res,page)=>{
  const key=`${tabId}`; const p=await browser.storage.local.get(key);
  const hist=(p[key]?.hist)||[]; hist.unshift({url,time:Date.now(),level:res.level});
  if(hist.length>NAV_LIMIT) hist.pop();
  await browser.storage.local.set({[key]:{url,res,page,hist}});
};
/* ---------- notify ---------- */
const notify=id=>lvl=>{
  const base={type:"basic",iconUrl:lvl==="Safe"?"safe-icon.png":"warning-icon.png"};
  const opt=lvl==="High Risk"?{...base,title:"High-Risk URL!",message:"Likely phishing – click for details."}:
             lvl==="Suspicious"?{...base,title:"Suspicious URL",message:"May be unsafe – click for details."}:
             {...base,title:"URL looks safe",message:"Click for full analysis."};
  browser.notifications.create(id,opt);
  browser.notifications.onClicked.addListener(n=>{ if(n===id) browser.tabs.create({url:browser.runtime.getURL(`details.html?tabId=${id}`)}); });
};
/* ---------- main analyse ---------- */
const analyse=async(tabId,url,page={},silent=false)=>{
  const result=scoreUrl(url,page);
  await save(tabId,url,result,page);
  if(!silent) notify(`${tabId}`)(result.level);
};

/* ---------- tab events ---------- */
browser.tabs.onUpdated.addListener(async(id,info)=>{
  if(info.url && /^https?:\/\//.test(info.url)) await analyse(id,info.url);
});
browser.tabs.onActivated.addListener(async({tabId})=>{
  const t=await browser.tabs.get(tabId);
  if(/^https?:\/\//.test(t.url)) await analyse(tabId,t.url,{},true);
});
/* ---------- messages ---------- */
browser.runtime.onMessage.addListener(async(m,sender)=>{
  if(m.type==="pageSignals" && sender.tab){
    const tabId = sender.tab.id;
    const url = sender.tab.url;
    const key = `${tabId}`;
    const existing = (await browser.storage.local.get(key))[key] || {};
    const prevLevel = existing.res?.level;
    await analyse(tabId, url, m.signals, false);  // Re-score with signals, notify if changed
    const updated = (await browser.storage.local.get(key))[key];
    if (updated.res.level !== prevLevel && updated.res.level !== "Safe") {
      notify(key)(updated.res.level);  // Notify on escalation
    }
  }
  if(m.type==="forceAnalyse" && m.tabId && m.url) await analyse(m.tabId,m.url,{},false);
});
/* ---------- startup ---------- */
(async()=>{
  const [t]=await browser.tabs.query({active:true,currentWindow:true});
  if(t?.id && /^https?:\/\//.test(t.url)) await analyse(t.id,t.url,{},true);
})();
