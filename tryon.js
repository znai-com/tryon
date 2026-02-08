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
:root { --primary: #000; --accent: #3498db; --glass: rgba(255, 255, 255, 0.95); }
body.tryon-open { overflow:hidden; }
.tryon-overlay{
  position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter: blur(8px);
  display:none; align-items:center; justify-content:center; z-index:1000000;
}
.tryon-box{
  background: var(--glass); width:95%; max-width:550px; border-radius:24px; 
  padding:30px; position:relative; text-align: center;
}
.compare { position:relative; width:100%; height:480px; background:#111; overflow:hidden; border-radius:16px; }
.compare img { width:100% !important; height:100% !important; object-fit: cover !important; position:absolute; top:0; left:0; }
#mask { position:absolute; top:0; left:0; bottom:0; width:50%; overflow:hidden; border-right:4px solid #fff; z-index:5; }
#mask img { width: 550px !important; height: 480px !important; object-fit: cover !important; }
.range { position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:ew-resize; z-index:20; }
.tryon-btn { margin:10px 8px; padding:12px 28px; background: var(--primary); color:#fff; border-radius:12px; border:none; cursor:pointer; font-weight:600; }
.loader { width:45px; height:45px; border:4px solid #f3f3f3; border-top:4px solid var(--accent); border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 20px; }
@keyframes spin { to { transform:rotate(360deg); } }
.close-icon { position:absolute; top:15px; right:15px; cursor:pointer; font-size:20px; color:#333; z-index:100; }
#manualCategory { padding: 10px; border-radius: 8px; border: 1px solid #ddd; width: 100%; margin: 10px 0; }
`;
document.head.appendChild(style);

const overlay = document.createElement("div");
overlay.className = "tryon-overlay";
overlay.id = "tryonOverlay";
overlay.innerHTML = `
<div class="tryon-box">
  <div class="close-icon" id="manualClose">✕</div>
  <div id="step1">
    <h2 style="margin-top:0;">Virtual Fitting Room</h2>
    <select id="manualCategory">
        <option value="tops">👕 Top</option>
        <option value="one-pieces">🥋 Tracksuit / Full Suit</option>
        <option value="bottoms">👖 Bottoms</option>
    </select>
    <div style="padding:40px; border:2px dashed #ccc; border-radius:16px; cursor:pointer;" onclick="document.getElementById('userImg').click()">
      <strong>📸 Click to Upload Photo</strong>
    </div>
    <input id="userImg" type="file" hidden accept="image/*">
  </div>
  <div id="step2" style="display:none">
    <div class="loader"></div>
    <h3>AI is Tailoring...</h3>
  </div>
  <div id="step3" style="display:none">
    <div class="compare" id="compareContainer">
      <img id="afterImg" crossorigin="anonymous">
      <div id="mask"><img id="beforeImgRef"></div>
      <input type="range" class="range" id="slider" min="0" max="100" value="50">
    </div>
    <div style="margin-top:20px;">
        <button class="tryon-btn" id="retryBtn" style="background:#ddd; color:#333;">Try Another</button>
        <button class="tryon-btn" id="downloadBtn">Download Look</button>
    </div>
  </div>
</div>`;
document.body.appendChild(overlay);

const afterImg = document.getElementById("afterImg"),
      beforeImgRef = document.getElementById("beforeImgRef"),
      mask = document.getElementById("mask"),
      slider = document.getElementById("slider");

// ✅ 1. ESC Key aur Manual Close logic
const forceClose = () => {
    overlay.style.display = "none";
    document.body.classList.remove("tryon-open");
    resetState();
};

document.getElementById("manualClose").onclick = forceClose;
window.addEventListener('keydown', (e) => { if(e.key === "Escape") forceClose(); });

function resetState() {
    document.getElementById("step3").style.display="none";
    document.getElementById("step2").style.display="none";
    document.getElementById("step1").style.display="block";
    document.getElementById("userImg").value = "";
}

document.getElementById("retryBtn").onclick = resetState;

// ✅ 2. Download Logic (Blob Method)
document.getElementById("downloadBtn").onclick = async () => {
    if(!afterImg.src) return;
    const response = await fetch(afterImg.src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "my-look.jpg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

document.getElementById("userImg").onchange = e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    const userImgData = ev.target.result;
    beforeImgRef.src = userImgData; 
    
    document.getElementById("step1").style.display="none";
    document.getElementById("step2").style.display="block";

    try {
      const res = await fetch(BACKEND_URL+"/tryon/start", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          userImage: userImgData,
          productImage: getProductImage(),
          category: document.getElementById("manualCategory").value
        })
      });
      const { jobId } = await res.json();

      // ✅ 3. Speed Check: Polling logic optimized
      let result = null;
      for(let i=0; i<40; i++) {
        await new Promise(r => setTimeout(r, 2500)); // Thora kam delay for speed
        const status = await (await fetch(BACKEND_URL+"/tryon/status/"+jobId)).json();
        if(status.status === "completed") { result = status.resultUrl; break; }
        if(status.status === "failed") throw new Error("AI failed");
      }

      if(!result) throw new Error("Request Timed Out");

      // ✅ 4. Visibility Fix: Force render before showing step3
      afterImg.src = result;
      afterImg.onload = () => {
        document.getElementById("step2").style.display="none";
        document.getElementById("step3").style.display="block";
      };

    } catch(err) {
      alert("Error: " + err.message);
      resetState();
    }
  };
  reader.readAsDataURL(file);
};

slider.oninput = e => { mask.style.width = e.target.value + "%"; };
window.openTryon = () => { overlay.style.display="flex"; document.body.classList.add("tryon-open"); };

const target = document.querySelector("form[action*='/cart/add']") || document.querySelector(".product-form");
if(target){
  const b = document.createElement("button");
  b.type="button"; b.className="tryon-btn";
  b.innerHTML="✨ Virtual Try-On";
  b.style.width="100%"; b.onclick=openTryon;
  target.after(b);
}

})();
