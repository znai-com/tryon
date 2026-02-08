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
:root { --accent: #111; --btn-bg: #111; --bg: #ffffff; --text: #111; --gray: #f2f2f2; }
body.tryon-open { overflow:hidden; }
.tryon-overlay{
  position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter: blur(12px);
  display:none; align-items:center; justify-content:center; z-index:1000000;
}
.tryon-box{
  background: var(--bg); width:95%; max-width:500px; border-radius:12px; 
  padding:40px; position:relative; text-align: center; box-shadow: 0 30px 60px rgba(0,0,0,0.3);
}
/* ALIGNMENT FIX: Container remains 1:1 or 4:5 ratio */
.compare { 
  position:relative; width:100%; height:500px; background:var(--gray); 
  overflow:hidden; border-radius:8px; margin-bottom:20px;
}
/* Both images must have identical positioning */
.compare img { 
  width:100% !important; height:100% !important; 
  object-fit: contain !important; 
  position:absolute; top:0; left:0;
}
#mask { 
  position:absolute; top:0; left:0; bottom:0; width:50%; 
  overflow:hidden; border-right:3px solid #fff; z-index:5; 
}
/* Crucial: Mask image must be same size as parent */
#mask img { width: 420px !important; height: 500px !important; object-fit: contain !important; }

.tryon-btn { 
  flex:1; padding:16px; border-radius:4px; border:none; cursor:pointer; 
  font-weight:700; font-size:14px; text-transform: uppercase; letter-spacing:1px;
  transition: all 0.3s;
}
.btn-primary { background: var(--btn-bg); color:#fff; }
.btn-primary:hover { opacity: 0.9; }
.btn-secondary { background: none; color:var(--text); border: 1px solid #ddd; margin-right:10px; }

#manualCategory { 
  width:100%; padding:14px; border-radius:4px; border:1px solid #eee; 
  margin:20px 0; background:var(--gray); font-family: inherit;
}
.close-btn { 
  position:absolute; top:15px; right:15px; cursor:pointer; font-size:18px; color:#999;
}
.loader { 
  width:40px; height:40px; border:2px solid #eee; border-top:2px solid #111; 
  border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 20px; 
}
@keyframes spin { to { transform:rotate(360deg); } }
`;
document.head.appendChild(style);

const overlay = document.createElement("div");
overlay.className = "tryon-overlay";
overlay.id = "tryonOverlay";
overlay.innerHTML = `
<div class="tryon-box">
  <div class="close-btn" id="closeTryon">✕</div>
  <div id="step1">
    <h2 style="font-size:20px; margin-bottom:10px; letter-spacing:-0.5px;">VIRTUAL TRY-ON</h2>
    <p style="font-size:13px; color:#666; margin-bottom:20px;">Experience the collection on yourself.</p>
    <select id="manualCategory">
        <option value="tops">Tops & Jackets</option>
        <option value="one-pieces">Tracksuits & Full Sets</option>
        <option value="bottoms">Trousers & Bottoms</option>
    </select>
    <div style="padding:50px 20px; border:1px solid #eee; background:var(--gray); cursor:pointer; border-radius:8px;" onclick="document.getElementById('userImg').click()">
      <span style="font-size:24px;">↑</span><br><span style="font-size:12px; font-weight:700; margin-top:10px; display:block;">UPLOAD YOUR IMAGE</span>
    </div>
    <input id="userImg" type="file" hidden accept="image/*">
  </div>
  <div id="step2" style="display:none">
    <div class="loader"></div>
    <p style="font-size:12px; font-weight:700; letter-spacing:1px;">AI IS PROCESSING...</p>
  </div>
  <div id="step3" style="display:none">
    <div class="compare" id="compareContainer">
      <img id="afterImg" crossorigin="anonymous">
      <div id="mask"><img id="beforeImgOverlay"></div>
      <input type="range" class="range" id="slider" min="0" max="100" value="50" style="position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:ew-resize; z-index:10;">
    </div>
    <div style="display:flex; margin-top:20px;">
        <button class="tryon-btn btn-secondary" id="retryBtn">RETRY</button>
        <button class="tryon-btn btn-primary" id="downloadBtn">SAVE LOOK</button>
    </div>
  </div>
</div>`;
document.body.appendChild(overlay);

const beforeImgOverlay = document.getElementById("beforeImgOverlay"),
      afterImg = document.getElementById("afterImg"),
      mask = document.getElementById("mask"),
      slider = document.getElementById("slider");

const closeFn = () => { overlay.style.display="none"; document.body.classList.remove("tryon-open"); resetFn(); };
document.getElementById("closeTryon").onclick = closeFn;
window.addEventListener('keydown', (e) => { if(e.key === "Escape") closeFn(); });

function resetFn() {
  document.getElementById("step3").style.display="none";
  document.getElementById("step2").style.display="none";
  document.getElementById("step1").style.display="block";
  document.getElementById("userImg").value = "";
}
document.getElementById("retryBtn").onclick = resetFn;

document.getElementById("downloadBtn").onclick = async () => {
    if(!afterImg.src) return;
    const res = await fetch(afterImg.src);
    const b = await res.blob();
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = "ai-fitting.jpg";
    document.body.appendChild(a); a.click();
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
        if(st.status==="failed") throw new Error("AI Error");
      }

      if(!result) throw new Error("Timeout");
      
      afterImg.src = result;
      afterImg.onload = () => {
        // ALIGNMENT FIX: Match mask image dimensions to outer container
        const container = document.getElementById("compareContainer");
        beforeImgOverlay.style.width = container.offsetWidth + "px";
        beforeImgOverlay.style.height = container.offsetHeight + "px";
        document.getElementById("step2").style.display="none";
        document.getElementById("step3").style.display="block";
      };
    } catch(err){ alert(err.message); resetFn(); }
  };
  reader.readAsDataURL(file);
};

slider.oninput = e => { mask.style.width = e.target.value+"%"; };
window.openTryon = () => { overlay.style.display="flex"; document.body.classList.add("tryon-open"); };

// Product Page Button Integration
const form = document.querySelector("form[action*='/cart/add']") || document.querySelector(".product-form");
if(form){
  const btn = document.createElement("button");
  btn.type="button"; btn.className="tryon-btn btn-primary";
  btn.innerHTML="✨ VIRTUAL TRY-ON";
  btn.style.width="100%"; btn.style.marginTop="10px"; btn.onclick=openTryon;
  form.after(btn);
}

})();
