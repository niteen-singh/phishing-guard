(async()=>{
  const [tab]=await browser.tabs.query({active:true,currentWindow:true});
  const key=`${tab.id}`; let data=(await browser.storage.local.get(key))[key]||{};
  document.getElementById('u').textContent=tab.url;
  const badge=document.getElementById('b');
  const ul=document.getElementById('list');
  const det=document.getElementById('det');
  if(data.res && data.page){  // Ensure both URL and page signals are present
    badge.textContent=data.res.level;
    badge.classList.add(data.res.level==="High Risk"?"bHigh":data.res.level==="Suspicious"?"bSus":"bSafe");
    (data.res.issues||["No issues found."]).forEach(i=>{const li=document.createElement('li');li.textContent=i;ul.appendChild(li);});
    det.onclick=()=>browser.tabs.create({url:browser.runtime.getURL(`details.html?tabId=${tab.id}`)});
  }else{
    badge.textContent="Analysing…";
    det.disabled=true;
    await browser.runtime.sendMessage({type:"forceAnalyse",tabId:tab.id,url:tab.url});
    // Retry after delay to allow content script signals to process
    await new Promise(r=>setTimeout(r,800));
    data=(await browser.storage.local.get(key))[key]||{};
    if(data.res && data.page){
      window.location.reload();  // Refresh popup with full data
    }else{
      badge.textContent="Analysis incomplete";
      ul.innerHTML="<li>Reload the page and try again.</li>";
    }
  }
})();
