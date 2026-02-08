(function(){

const BACKEND_URL = "https://tryon-backend-production-4f18.up.railway.app";

function getProductImage() {
  const img = document.querySelector('meta[property="og:image"]') || 
              document.querySelector('.product__main-photos img') ||
              document.querySelector('.product-featured-img') ||
              document.querySelector('img[src*="/products/"]');
  return img ? (img.content || img.src.split('?')[0]) : null;
}

// --- STYLES (same as before, kept clean) ---
const style = document.createElement("style");
style.innerHTML = `/* ... same CSS as before ... */`;
document.head.appendChild(style);

// --- MODAL ---
const overlay = document.createElement("div");
overlay.className = "tryon-overlay";
overlay.id = "tryonOverlay";
overlay.innerHTML = `/* ... same HTML as before ... */`;
document.body.appendChild(overlay);

const beforeImg = document.getElementById("beforeImg"),
      afterImg = document.getElementById("afterImg"),
      mask = document.getElementById("mask"),
      slider = document.getElementById("slider");

window.closeTryon = () => { overlay.style.display="none"; document.body.classList.remove("tryon-open"); resetTryOn(); };
overlay.onclick = (e) => { if(e.target===overlay) closeTryon(); };
document.addEventListener('keydown', (e) => { if(e.key==="Escape" && overlay.style.display==="flex") closeTryon(); });

window.resetTryOn = () => {
  document.getElementById("step3").style.display="none";
  document.getElementById("step2").style.display="none";
  document.getElementById("step1").style.display="block";
  document.getElementById("userImg").value = "";
  document.getElementById("downloadBtn").classList.remove("clicked-green");
  if(slider && mask) { slider.value = 50; mask.style.width="50%"; }
};

// --- IMAGE UPLOAD ---
document.getElementById("userImg").onchange = e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    beforeImg.src = ev.target.result;
    document.getElementById("step1").style.display="none";
    document.getElementById("step2").style.display="block";

    try {
      const startRes = await fetch(BACKEND_URL+"/tryon/start", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          userImage: ev.target.result,
          productImage: getProductImage(),
          category: "tops"
        })
      });
      const { jobId } = await startRes.json();
      if(!jobId) throw new Error("Job not created");

      // Poll for result
      let attempts = 0, result = null;
      while(attempts < 30 && !result){
        await new Promise(r=>setTimeout(r,3000));
        const statusRes = await fetch(BACKEND_URL+"/tryon/status/"+jobId);
        const statusData = await statusRes.json();
        if(statusData.status==="completed"){ result = statusData.resultUrl; break; }
        else if(statusData.status==="failed"){ throw new Error("AI failed"); }
        attempts++;
      }

      if(!result) throw new Error("Timeout generating image");
      afterImg.src = result;
      afterImg.onload = () => {
        const container = document.getElementById("compareContainer");
        mask.querySelector('img').style.width = container.offsetWidth + "px";
        mask.querySelector('img').style.height = container.offsetHeight + "px";
        document.getElementById("step2").style.display="none";
        document.getElementById("step3").style.display="block";
      };

    } catch(err){
      alert("Error: "+err.message);
      resetTryOn();
    }
  };
  reader.readAsDataURL(file);
};

// --- DOWNLOAD + SLIDER ---
document.getElementById("downloadBtn").onclick = async function(){
  this.classList.add("clicked-green");
  try{
    const resp = await fetch(afterImg.src);
    const blob = await resp.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download="my_style.png"; a.click();
    setTimeout(()=>this.classList.remove("clicked-green"),1000);
  }catch(e){ window.open(afterImg.src,'_blank'); }
};

slider.oninput = e => { mask.style.width = e.target.value+"%"; };
window.openTryon = () => { overlay.style.display="flex"; document.body.classList.add("tryon-open"); };

// --- BUTTON INJECTION ---
const target = document.querySelector("form[action*='/cart/add']") || document.querySelector(".product-form");
if(target){
  const b = document.createElement("button");
  b.type="button"; b.className="tryon-btn";
  b.innerHTML="<span>✨</span> Virtual Try-On";
  b.style.width="100%"; b.style.marginTop="15px";
  b.onclick=openTryon;
  target.after(b);
}

})();
