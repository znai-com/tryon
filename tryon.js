(function(){

const BACKEND_URL = "https://tryon-backend-production-4f18.up.railway.app";

function getProductImage() {
  const img = document.querySelector('meta[property="og:image"]') || 
              document.querySelector('.product__main-photos img') ||
              document.querySelector('.product-featured-img') ||
              document.querySelector('img[src*="/products/"]');
  return img ? (img.content || img.src.split('?')[0]) : null;
}

const style = document.createElement("style");
style.innerHTML = `
:root { --accent: #007AFF; --bg: #ffffff; --text: #1d1d1f; --secondary: #f5f5f7; }
body.tryon-open { overflow:hidden; }
.tryon-overlay{
  position:fixed; inset:0; background:rgba(0,0,0,0.4); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  display:none; align-items:center; justify-content:center; z-index:1000000; transition: all 0.3s ease;
}
.tryon-box{
  background: var(--bg); width:95%; max-width:500px; border-radius:30px; 
  padding:32px; position:relative; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.2);
}
/* Alignment Fix Styles */
.compare { position:relative; width:100%; height:500px; background:#f0f0f0; overflow:hidden; border-radius:20px; display:flex; align-items:center; justify-content:center; }
.compare img { width:100% !important; height:100% !important; object-fit: contain !important; position:absolute; top:0; left:0; pointer-events:none; }
#mask { position:absolute; top:0; left:0; bottom:0; width:50%; overflow:hidden; border-right:2px solid #fff; z-index:5; background:#f0f0f0; }
#mask img { width: 436px !important; height: 500px !important; object-fit: contain !important; }

/* Modern Select & Buttons */
#manualCategory { 
  width:100%; padding:12px; border-radius:12px; border:1px solid #d2d2d7; 
  margin:15px 0; font-size:15px; background:var(--secondary); cursor:pointer;
}
.tryon-btn { 
  margin:10px 5px; padding:14px 24px; border-radius:14px; border:none; cursor:pointer; 
  font-weight:600; font-size:15px; transition: all 0.2s ease;
}
.btn-primary { background: var(--accent); color:#fff; box-shadow: 0 4px 12px rgba(0,122,255,0.3); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,122,255,0.4); }
.btn-secondary { background: var(--secondary); color:var(--text); }
.btn-secondary:hover { background: #e8e8ed; }

.loader { width:30px; height:30px; border:3px solid #f3f3f3; border-top:3px solid var(--accent); border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 20px; }
@keyframes spin { to { transform:rotate(360deg); } }
.close-btn { position:absolute; top:20px; right:20px; cursor:pointer; background:#eee; width:30px; height:30px; border-radius:50%; line-height:30px; font-weight:bold; }
`;
document.head.appendChild(style);

const overlay = document.createElement("div");
overlay.className = "tryon-overlay";
overlay.id = "tryonOverlay";
overlay.innerHTML = `
<div class="tryon-box">
  <div class="close-btn" id="closeTryonBtn">✕</div>
  <div id="step1">
    <div style="font-size:11px; font-weight:700; color:var(--accent); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">AI Power</div>
    <h2 style="margin:0 0 20px 0; font-size:24px;">Find Your Fit</h2>
    <select id="manualCategory">
        <option value="tops">👕 Tops & Outerwear</option>
        <option value="one-pieces">🥋 Tracksuits & Sets</option>
        <option value="bottoms">👖 Trousers & Shorts</option>
    </select>
    <div style="padding:40px; border:2px dashed #d2d2d7; border-radius:20px; cursor:pointer; background:var(--secondary);" onclick="document.getElementById('userImg').click()">
      <span style="font-size:32px;">📤</span><br><strong style="display:block; margin-top:10px;">Upload Portrait</strong>
    </div>
    <input id="userImg" type="file" hidden accept="image/*">
  </div>
  <div id="step2" style="display:none">
    <div class="loader"></div>
    <h3 style="margin-bottom:5px;">AI Tailoring...</h3>
    <p style="font-size:14px; color:#86868b;">Perfecting your custom look</p>
  </div>
  <div id="step3" style="display:none">
    <div class="compare" id="compareContainer">
      <img id="afterImg" crossorigin="anonymous">
      <div id="mask"><img id="beforeImgOverlay"></div>
      <input type="range" class="range" id="slider" min="0" max="100" value="50">
    </div>
    <div style="display:flex; justify-content:center; margin-top:20px;">
        <button class="tryon-btn btn-secondary" id="retryBtn">Try New</button>
        <button class="tryon-btn btn-primary" id="downloadBtn">Save Look</button>
    </div>
  </div>
</div>`;
document.body.appendChild(overlay);

const beforeImgOverlay = document.getElementById("beforeImgOverlay"),
      afterImg = document.getElementById("afterImg"),
      mask = document.getElementById("mask"),
      slider = document.getElementById("slider");

const closeUI = () => { overlay.style.display="none"; document.body.classList.remove("tryon-open"); resetUI(); };
document.getElementById("closeTryonBtn").onclick = closeUI;
window.addEventListener('keydown', (e) => { if(e.key === "Escape") closeUI(); });

function resetUI() {
  document.getElementById("step3").style.display="none";
  document.getElementById("step2").style.display="none";
  document.getElementById("step1").style.display="block";
  document.getElementById("userImg").value = "";
}
document.getElementById("retryBtn").onclick = resetUI;

document.getElementById("downloadBtn").onclick = async () => {
    if(!afterImg.src) return;
    const res = await fetch(afterImg.src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = "my-fitting.jpg";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
};

document.getElementById("userImg").onchange = e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    beforeImgOverlay.src = ev.target.result;
    document.getElementById("step1").style.display="none";
    document.getElementById("step2").style.display="block";

    try {
      const startRes = await fetch(BACKEND_URL+"/tryon/start", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          userImage: ev.target.result,
          productImage: getProductImage(),
          category: document.getElementById("manualCategory").value 
        })
      });
      const data = await startRes.json();
      
      let result = null;
      for(let i=0; i<40; i++) {
        await new Promise(r=>setTimeout(r,2500));
        const st = await (await fetch(BACKEND_URL+"/tryon/status/"+data.jobId)).json();
        if(st.status==="completed") { result = st.resultUrl; break; }
        if(st.status==="failed") throw new Error("Processing failed");
      }

      if(!result) throw new Error("Timeout");
      
      afterImg.src = result;
      afterImg.onload = () => {
        // Alignment Fix: Using object-fit contain on both layers
        const container = document.getElementById("compareContainer");
        beforeImgOverlay.style.width = container.offsetWidth + "px";
        beforeImgOverlay.style.height = container.offsetHeight + "px";
        document.getElementById("step2").style.display="none";
        document.getElementById("step3").style.display="block";
      };
    } catch(err){ alert(err.message); resetUI(); }
  };
  reader.readAsDataURL(file);
};

slider.oninput = e => { mask.style.width = e.target.value+"%"; };
window.openTryon = () => { overlay.style.display="flex"; document.body.classList.add("tryon-open"); };

const target = document.querySelector("form[action*='/cart/add']") || document.querySelector(".product-form");
if(target){
  const b = document.createElement("button");
  b.type="button"; b.className="tryon-btn btn-primary";
  b.innerHTML="✨ Virtual Try-On";
  b.style.width="100%"; b.style.marginTop="10px"; b.onclick=openTryon;
  target.after(b);
}

})();
