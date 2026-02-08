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
.close { position:absolute; top:15px; right:15px; cursor:pointer; font-size:20px; }
.instruction-text { font-size: 13px; color: #666; margin-top: 15px; }
.privacy-badge { display: inline-block; background: #e8f4fd; color: #2980b9; padding: 4px 12px; border-radius: 20px; font-size: 11px; margin-bottom: 10px; font-weight: 600; }
#manualCategory { padding: 10px; border-radius: 8px; border: 1px solid #ddd; width: 100%; margin: 10px 0; font-family: inherit; }
`;
document.head.appendChild(style);

const overlay = document.createElement("div");
overlay.className = "tryon-overlay";
overlay.id = "tryonOverlay";
overlay.innerHTML = `
<div class="tryon-box">
  <div class="close" onclick="closeTryon()">✕</div>
  <div id="step1">
    <div class="privacy-badge">🔒 Photos are auto-deleted after use</div>
    <h2 style="margin-top:0;">Virtual Fitting Room</h2>
    
    <div style="text-align:left; margin-bottom:15px;">
      <label style="font-size:12px; font-weight:700; color:#333;">Select Category (Important):</label>
      <select id="manualCategory">
        <option value="tops">👕 Top (Shirt/T-shirt/Hoodie)</option>
        <option value="one-pieces">🥋 Full Suit (Tracksuit/Dress/Set)</option>
        <option value="bottoms">👖 Bottom (Pants/Trousers/Shorts)</option>
      </select>
    </div>

    <div style="padding:30px; border:2px dashed #ddd; border-radius:16px; cursor:pointer; background:#fefefe;" onclick="document.getElementById('userImg').click()">
      <span style="font-size:40px;">📸</span><br><strong>Upload Your Photo</strong>
      <p style="font-size:11px; color:#888;">Clear, front-facing photo works best</p>
    </div>

    <div class="instruction-text">
      <strong>💡 Tip:</strong> Best results come from wearing plain, fitted clothes.
    </div>
    <input id="userImg" type="file" hidden accept="image/*">
  </div>
  <div id="step2" style="display:none">
    <div class="loader"></div>
    <h3>AI is Tailoring...</h3>
    <p>Please wait 10-15 seconds.</p>
  </div>
  <div id="step3" style="display:none">
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

window.resetTryOn = () => {
  document.getElementById("step3").style.display="none";
  document.getElementById("step2").style.display="none";
  document.getElementById("step1").style.display="block";
  document.getElementById("userImg").value = "";
};

document.getElementById("userImg").onchange = e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    beforeImg.src = ev.target.result;
    document.getElementById("step1").style.display="none";
    document.getElementById("step2").style.display="block";

    // ✅ FIXED: Using Manual Selection + Smart Fallback
    let selectedCategory = document.getElementById("manualCategory").value; 
    
    try {
      const startRes = await fetch(BACKEND_URL+"/tryon/start", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          userImage: ev.target.result,
          productImage: getProductImage(),
          category: selectedCategory 
        })
      });
      const data = await startRes.json();
      if(!data.jobId) throw new Error("Server Error");

      let attempts = 0, result = null;
      while(attempts < 35 && !result){
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

slider.oninput = e => { mask.style.width = e.target.value+"%"; };
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
