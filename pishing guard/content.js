(function(){
  const pass=!!document.querySelector('input[type="password"]');
  let cross=false;
  try{
    const origin=new URL(location.href); const forms=[...document.forms];
    cross=forms.some(f=>{
      const act=f.getAttribute("action")||""; if(!act) return false;
      const u=new URL(act,origin); return u.protocol==="http:"||u.hostname!==origin.hostname;
    });
  }catch{}
  const title=(document.title||"").toLowerCase();
  const brand=/paypal|google|gmail|amazon|netflix|whatsapp|facebook|microsoft|icici|hdfc|cgd/.exec(title)?.[0]||null;
  browser.runtime.sendMessage({type:"pageSignals",signals:{pass,cross,titleBrand:brand}});
})();
