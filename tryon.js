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
.tryon-btn { margin:10px 8px; padding:12px 28px; background: var(--primary); color:#fff; border-radius:12px; border:none; cursor:pointer; font-weight:600; display: inline-block; }
.loader { width:45px; height:45px; border:4px solid #f3f3f3; border-top:4px solid var(--accent); border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 20px; }
@keyframes spin { to { transform:rotate(360deg); } }
.close { position:absolute; top:15px; right:15px; cursor:pointer; font-size:20px; z-index: 100; }
#manualCategory { padding: 10px; border-radius: 8px; border: 1px solid #ddd; width: 100%; margin: 10px 0; }
`;
document.head.appendChild(style);

const overlay = document.createElement("div");
overlay.className = "tryon-overlay";
overlay.id = "tryonOverlay";
overlay.innerHTML = `
<div class="tryon-box">
  <div class="close" id="closeBtn">✕</div>
  <div id="step1">
    <h2>Virtual Fitting Room</h2>
    <select id="manualCategory">
        <option value="tops">👕 Top</option>
        <option value="one-pieces">🥋 Full Suit/Tracksuit</option>
        <option value="bottoms">👖 Bottom</option>
    </select>
    <div style="padding:30px; border:2px dashed #ddd; border-radius:16px; cursor:pointer;" onclick="document.getElementById('userImg').click()">
      <strong>📸 Upload Your Photo</strong>
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
      <div id="mask"><img id="beforeImgOverlay"></div>
      <input type="range" class="range" id="slider" min="0" max="100" value="50">
    </div>
    <div style="margin-top:20px;">
        <button class="tryon-btn" id="retryBtn" style="background:#eee; color:#333;">Try Another</button>
        <button class="tryon-btn" id="downloadBtn">Download Look</button>
    </div>
  </div>
</div>`;
document.body.appendChild(overlay);

const beforeImgOverlay = document.getElementById("beforeImgOverlay"),
      afterImg = document.getElementById("afterImg"),
      mask = document.getElementById("mask"),
      slider = document.getElementById("slider");

// ✅ 1. ESC Key & Close logic Fixed
const closePopup = () => { 
    overlay.style.display="none"; 
    document.body.classList.remove("tryon-open"); 
    resetTryOn(); 
};

document.getElementById("closeBtn").onclick = closePopup;
document.addEventListener('keydown', (e) => { if (e.key === "Escape") closePopup(); });

// ✅ 2. Download Function with absolute path fix
document.getElementById("downloadBtn").onclick = async function() {
    const imgUrl = afterImg.src;
    if(!imgUrl) return;
    try {
        const response = await fetch(imgUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = "my-ai-look.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        window.open(imgUrl, '_blank');
    }
};

window.resetTryOn = () => {
  document.getElementById("step3").style.display="none";
  document.getElementById("step2").style.display="none";
  document.getElementById("step1").style.display="block";
  document.getElementById("userImg").value = "";
  afterImg.src = "";
};

document.getElementById("retryBtn").onclick = resetTryOn;

document.getElementById("userImg").onchange = e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    const userBase64 = ev.target.result;
    beforeImgOverlay.src = userBase64; // Set mask image immediately
    
    document.getElementById("step1").style.display="none";
    document.getElementById("step2").style.display="block";

    try {
      const startRes = await fetch(BACKEND_URL+"/tryon/start", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          userImage: userBase64,
          productImage: getProductImage(),
          category: document.getElementById("manualCategory").value
        })
      });
      const data = await startRes.json();
      
      let attempts = 0, resultUrl = null;
      while(attempts < 40 && !resultUrl){
        await new Promise(r=>setTimeout(r,3000));
        const statusRes = await fetch(BACKEND_URL+"/tryon/status/"+data.jobId);
        const statusData = await statusRes.json();
        if(statusData.status==="completed"){ resultUrl = statusData.resultUrl; break; }
        else if(statusData.status==="failed") throw new Error("AI failed");
        attempts++;
      }

      if(!resultUrl) throw new Error("Timeout");

      // ✅ 3. Improved Image Loading Logic
      afterImg.src = resultUrl;
      afterImg.onload = () => {
        // Ensure beforeImgOverlay matches dimensions
        beforeImgOverlay.style.width = "550px";
        beforeImgOverlay.style.height = "480px";
        
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
