(function(){

const BACKEND_URL = "https://tryon-backend-production-4f18.up.railway.app";

function getProductImage() {
  const img = document.querySelector('meta[property="og:image"]') || 
              document.querySelector('.product__main-photos img') ||
              document.querySelector('.product-featured-img') ||
              document.querySelector('img[src*="/products/"]');
  return img ? (img.content || img.src.split('?')[0]) : null;
}

// --- 1. STYLES (Added instructions & privacy styling) ---
const style = document.createElement("style");
style.innerHTML = `
:root { --primary: #000; --accent: #3498db; --glass: rgba(255, 255, 255, 0.95); }
body.tryon-open { overflow:hidden; }
.tryon-overlay{
  position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter: blur(8px);
  display:none; align-items:center; justify-content:center; z-index:1000000; transition: all 0.3s ease;
}
.tryon-box{
  background: var(--glass); width:95%; max-width:550px; border-radius:24px; 
  padding:30px; position:relative; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
  text-align: center; border: 1px solid rgba(255,255,255,0.3);
}
.compare {
  position:relative; width:100%; height:480px; 
  background:#111; overflow:hidden; border-radius:16px;
}
.compare img {
  width:100% !important; height:100% !important; 
  object-fit: cover !important; position:absolute; top:0; left:0;
}
#mask {
  position:absolute; top:0; left:0; bottom:0; width:50%; overflow:hidden; 
  border-right:4px solid #fff; z-index:5;
}
#mask img { width: 550px !important; height: 480px !important; object-fit: cover !important; }
.range {
  position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:ew-resize; z-index:20;
}
.tryon-btn {
  margin:10px 8px; padding:12px 28px; background: var(--primary); color:#fff;
  border-radius:12px; border:none; cursor:pointer; font-weight:600;
  transition: all 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.tryon-btn:hover { background: #333; transform: translateY(-2px); }
.clicked-green { background: #27ae60 !important; }
.loader {
  width:45px; height:45px; border:4px solid #f3f3f3; border-top:4px solid var(--accent);
  border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 20px;
}
@keyframes spin { to { transform:rotate(360deg); } }
.close { 
  position:absolute; top:15px; right:15px; width:30px; height:30px;
  border-radius:50%; display:flex; align-items:center; justify-content:center;
  cursor:pointer; transition: 0.2s; color:#666;
}
.close:hover { background:#e74c3c; color:#fff; }
.step-title { font-size: 22px; font-weight: 700; margin-bottom: 5px; color: #1a1a1a; }
.instruction-text { font-size: 13px; color: #666; margin-top: 15px; line-height: 1.4; }
.privacy-badge { 
  display: inline-block; background: #e8f4fd; color: #2980b9; 
  padding: 4px 12px; border-radius: 20px; font-size: 11px; margin-top: 10px; font-weight: 600;
}
`;
document.head.appendChild(style);

// --- 2. MODAL HTML (Updated with Instructions & Privacy) ---
const overlay = document.createElement("div");
overlay.className = "tryon-overlay";
overlay.id = "tryonOverlay";
overlay.innerHTML = `
<div class="tryon-box" id="popup">
  <div class="close" onclick="closeTryon()">✕</div>
  <div id="step1">
    <div class="step-title">Virtual Fitting Room</div>
    <div class="privacy-badge">🔒 Photos are auto-deleted after use</div>
    
    <div style="padding:40px; border:2px dashed #ddd; border-radius:16px; cursor:pointer; margin-top:20px; background:#f9f9f9;" 
         onclick="document.getElementById('userImg').click()"
         onmouseover="this.style.borderColor='#3498db'" 
         onmouseout="this.style.borderColor='#ddd'">
      <span style="font-size:40px;">📸</span><br>
      <strong>Upload Your Photo</strong>
      <p style="font-size:12px; color:#888;">Supports JPG, PNG</p>
    </div>

    <div class="instruction-text">
      <strong>💡 For Best Results:</strong><br>
      Wear a plain T-shirt or body-fit clothes. Avoid bulky jackets or loose outfits for a perfect fit.
    </div>

    <input id="userImg" type="file" hidden accept="image/*">
  </div>
  <div id="step2" style="display:none">
    <div class="loader"></div>
    <div class="step-title">AI is Tailoring...</div>
    <p style="color:#666;">This usually takes 10-15 seconds</p>
  </div>
  <div id="step3" style="display:none">
    <div class="step-title">Your New Look</div>
    <div class="compare" id="compareContainer">
      <img id="afterImg" crossorigin="anonymous">
      <div id="mask"><img id="beforeImg"></div>
      <input type="range" class="range" id="slider" min="0" max="100" value="50">
    </div>
    <div style="margin-top:20px;">
        <button class="tryon-btn" onclick="resetTryOn()" style="background:#f1f1f1; color:#333;">Try Another</button>
        <button class="tryon-btn" id="downloadBtn">Download Look</button>
    </div>
  </div>
</div>`;
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

// --- 3. IMAGE UPLOAD & SMART CATEGORY ---
document.getElementById("userImg").onchange = e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    beforeImg.src = ev.target.result;
    document.getElementById("step1").style.display="none";
    document.getElementById("step2").style.display="block";

    let category = "tops"; 
    const content = (document.title + " " + document.body.innerText).toLowerCase();
    const rules = {
      "one-pieces": ["tracksuit", "set", "suit", "jumpsuit", "coords", "outfit"],
      "bottoms": ["pant", "trouser", "short", "skirt", "jean", "legging"]
    };
    for (let cat in rules) {
      if (rules[cat].some(word => content.includes(word))) {
        category = cat; break;
      }
    }

    try {
      const startRes = await fetch(BACKEND_URL+"/tryon/start", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          userImage: ev.target.result,
          productImage: getProductImage(),
          category: category 
        })
      });
      const data = await startRes.json();
      if(!data.jobId) throw new Error("Server Error");

      let attempts = 0, result = null;
      while(attempts < 30 && !result){
        await new Promise(r=>setTimeout(r,3000));
        const statusRes = await fetch(BACKEND_URL+"/tryon/status/"+data.jobId);
        const statusData = await statusRes.json();
        if(statusData.status==="completed"){ result = statusData.resultUrl; break; }
        else if(statusData.status==="failed"){ throw new Error("AI failed"); }
        attempts++;
      }

      if(!result) throw new Error("Timeout");
      afterImg.src = result;
      afterImg.onload = () => {
        const container = document.getElementById("compareContainer");
        mask.querySelector('img').style.width = container.offsetWidth + "px";
        mask.querySelector('img').style.height = container.offsetHeight + "px";
        document.getElementById("step2").style.display="none";
        document.getElementById("step3").style.display="block";
      };

    } catch(err){
      alert("Error: " + err.message);
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
