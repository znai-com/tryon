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
:root { --primary: #222; --accent: #3498db; --success: #2ecc71; --danger: #ff4757; --bg: #ffffff; }
body.tryon-open { overflow:hidden; }
.tryon-overlay{
  position:fixed; inset:0; background:rgba(0,0,0,0.75); backdrop-filter: blur(10px);
  display:none; align-items:center; justify-content:center; z-index:1000000;
}
.tryon-box{
  background: var(--bg); width:95%; max-width:520px; border-radius:24px; 
  padding:35px; position:relative; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.2);
}

/* --- RESTORED OLD UI STYLES --- */
.privacy-badge { display: inline-block; background: #e8f4fd; color: #2980b9; padding: 6px 15px; border-radius: 20px; font-size: 12px; margin-bottom: 15px; font-weight: 600; }
.upload-box { padding:40px 20px; border:3px dashed #eee; background:#f9f9f9; cursor:pointer; border-radius:16px; transition:all 0.2s; }
.upload-box:hover { border-color: var(--accent); background:#f0f8ff; }

/* --- CRITICAL ALIGNMENT FIX --- */
.compare { 
  position:relative; width:100%; height:550px; /* Fixed height for consistency */
  background:#f4f4f4; overflow:hidden; border-radius:16px; margin: 20px 0;
}
/* Both images MUST have identical positioning rules */
.compare img, #mask img { 
  width:100% !important; height:100% !important; 
  object-fit: contain !important; /* The key to perfect alignment */
  position:absolute; top:0; left:0;
}
#mask { 
  position:absolute; top:0; left:0; bottom:0; width:50%; 
  overflow:hidden; border-right:3px solid rgba(255,255,255,0.8); z-index:5; 
}

/* --- NEW BUTTON STYLES --- */
.tryon-btn { 
  flex:1; padding:16px; border-radius:12px; border:none; cursor:pointer; 
  font-weight:700; font-size:15px; transition: all 0.3s;
}
.btn-primary { background: var(--primary); color:#fff; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.3); }
.btn-secondary { background: #f4f4f4; color:#333; margin-right:10px; }
.btn-success-state { background: var(--success) !important; color: white !important; }

/* Main Button (Bigger & Nicer) */
.tryon-main-btn {
    width: 100%; margin-top: 15px; padding: 18px;
    font-size: 18px; font-weight: 800; letter-spacing: 1px;
    background: linear-gradient(135deg, #333, #000); color: #fff;
    border: none; border-radius: 14px; cursor: pointer;
    box-shadow: 0 5px 20px rgba(0,0,0,0.2); transition: transform 0.2s;
}
.tryon-main-btn:hover { transform: scale(1.02); }

/* Close Button (Circle & Red Hover) */
.close-btn { 
    position:absolute; top:20px; right:20px; cursor:pointer; 
    width:36px; height:36px; background:#f0f0f0; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-size:18px; color:#555; transition: all 0.2s; z-index: 10;
}
.close-btn:hover { background: var(--danger); color: white; transform: rotate(90deg); }

#manualCategory { width:100%; padding:14px; border-radius:12px; border:1px solid #eee; margin:15px 0; font-family:inherit; background:#f9f9f9; }
.loader { width:45px; height:45px; border:4px solid #f3f3f3; border-top:4px solid var(--accent); border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 25px; }
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
    <div class="privacy-badge">🔒 Photos are auto-deleted after use</div>
    <h2 style="font-size:24px; margin:10px 0 25px;">Virtual Fitting Room</h2>
    <select id="manualCategory">
        <option value="tops">👕 Tops & Jackets</option>
        <option value="one-pieces">🥋 Tracksuits & Full Sets</option>
        <option value="bottoms">👖 Bottoms & Pants</option>
    </select>
    <div class="upload-box" onclick="document.getElementById('userImg').click()">
      <span style="font-size:40px;">📸</span><br>
      <strong style="display:block; margin-top:10px; font-size:16px;">Upload Your Photo</strong>
      <p style="color:#888; font-size:13px; margin-top:5px;">Clear front-facing photos work best</p>
    </div>
    <input id="userImg" type="file" hidden accept="image/*">
  </div>
  <div id="step2" style="display:none; padding:40px 0;">
    <div class="loader"></div>
    <h3 style="margin:0;">AI is Tailoring...</h3>
    <p style="color:#666; margin-top:10px;">This usually takes 15-25 seconds.</p>
  </div>
  <div id="step3" style="display:none">
    <div class="compare" id="compareContainer">
      <img id="afterImg" crossorigin="anonymous">
      <div id="mask"><img id="beforeImgOverlay"></div>
      <input type="range" class="range" id="slider" min="0" max="100" value="50" style="position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:ew-resize; z-index:10;">
    </div>
    <div style="display:flex; margin-top:25px;">
        <button class="tryon-btn btn-secondary" id="retryBtn">Try Another</button>
        <button class="tryon-btn btn-primary" id="downloadBtn">Download Look</button>
    </div>
  </div>
</div>`;
document.body.appendChild(overlay);

const beforeImgOverlay = document.getElementById("beforeImgOverlay"),
      afterImg = document.getElementById("afterImg"),
      mask = document.getElementById("mask"),
      slider = document.getElementById("slider"),
      downloadBtn = document.getElementById("downloadBtn");

const closeFn = () => { overlay.style.display="none"; document.body.classList.remove("tryon-open"); resetFn(); };
document.getElementById("closeTryon").onclick = closeFn;
window.addEventListener('keydown', (e) => { if(e.key === "Escape") closeFn(); });

function resetFn() {
  document.getElementById("step3").style.display="none";
  document.getElementById("step2").style.display="none";
  document.getElementById("step1").style.display="block";
  document.getElementById("userImg").value = "";
  // Slider Reset
  slider.value = 50; mask.style.width = "50%";
  // Reset download button state just in case
  downloadBtn.innerText = "Download Look";
  downloadBtn.classList.remove("btn-success-state");
}
document.getElementById("retryBtn").onclick = resetFn;

// ✅ Download Button Green Effect
downloadBtn.onclick = async () => {
    if(!afterImg.src) return;
    
    // Visual Feedback
    const originalText = downloadBtn.innerText;
    downloadBtn.innerText = "✅ Saved!";
    downloadBtn.classList.add("btn-success-state");
    setTimeout(() => {
        downloadBtn.innerText = originalText;
        downloadBtn.classList.remove("btn-success-state");
    }, 2000);

    const res = await fetch(afterImg.src);
    const b = await res.blob();
    const u = URL.createObjectURL(b);
    const a = document.createElement('a');
    a.href = u; a.download = "my-ai-look.jpg";
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
      const res = await fetch(BACKEND_URL+"/tryon/start", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          userImage: ev.target.result,
          productImage: getProductImage(),
          category: document.getElementById("manualCategory").value 
        })
      });
      const { jobId } = await res.json();
      
      let result = null;
      for(let i=0; i<45; i++) {
        await new Promise(r=>setTimeout(r,2500));
        const st = await (await fetch(BACKEND_URL+"/tryon/status/"+jobId)).json();
        if(st.status==="completed") { result = st.resultUrl; break; }
        if(st.status==="failed") throw new Error("AI Processing Failed. Please try again with a clearer photo.");
      }

      if(!result) throw new Error("Request Timed Out. Please try again.");
      
      afterImg.src = result;
      afterImg.onload = () => {
        document.getElementById("step2").style.display="none";
        document.getElementById("step3").style.display="block";
      };
    } catch(err){ alert(err.message); resetFn(); }
  };
  reader.readAsDataURL(file);
};

slider.oninput = e => { mask.style.width = e.target.value+"%"; };
window.openTryon = () => { overlay.style.display="flex"; document.body.classList.add("tryon-open"); };

const target = document.querySelector("form[action*='/cart/add']") || document.querySelector(".product-form");
if(target){
  const b = document.createElement("button");
  b.type="button"; 
  // ✅ Main Button Bigger & Nicer Style
  b.className="tryon-main-btn";
  b.innerHTML="✨ Virtual Try-On";
  b.onclick=openTryon;
  target.after(b);
}

})();
