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
:root { --primary: #000; --accent: #007AFF; --success: #28a745; --danger: #dc3545; --bg: #ffffff; }
body.tryon-open { overflow:hidden; }
.tryon-overlay{
  position:fixed; inset:0; background:rgba(0,0,0,0.7); backdrop-filter: blur(8px);
  display:none; align-items:center; justify-content:center; z-index:1000000;
}
.tryon-box{
  background: var(--bg); width:90%; max-width:440px; border-radius:15px; 
  padding:25px; position:relative; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

/* --- RESTORED ORIGINAL UI ELEMENTS --- */
.privacy-badge { display: inline-block; background: #f0f7ff; color: #007AFF; padding: 4px 10px; border-radius: 12px; font-size: 10px; margin-bottom: 10px; font-weight: 700; }
#catSelect { width:100%; padding:10px; border-radius:8px; border:1px solid #ddd; margin-top:5px; font-size:13px; outline:none; }

/* --- UPLOAD AREA WITH BLUE HOVER --- */
.upload-area { 
  padding:30px 15px; border:2px dashed #ccc; border-radius:12px; cursor:pointer; 
  background:#fafafa; transition: all 0.2s ease; margin-top:10px;
}
.upload-area:hover { 
  border-color: var(--accent); 
  background: #f0f7ff; 
  color: var(--accent);
}

/* --- COMPACT ALIGNMENT FIX --- */
.compare-container { 
  position:relative; width:100%; height:420px; background:#f4f4f4; 
  border-radius:12px; overflow:hidden; margin: 15px 0;
}
.compare-container img, #mask img { 
  width:100% !important; height:100% !important; 
  object-fit: contain !important; 
  position:absolute; top:0; left:0;
}
#mask { 
  position:absolute; top:0; left:0; bottom:0; width:50%; 
  overflow:hidden; border-right:2px solid #fff; z-index:5; 
}

/* --- BUTTONS & HOVERS --- */
.close-btn { 
    position:absolute; top:12px; right:12px; width:28px; height:28px; 
    background:#eee; border-radius:50%; display:flex; align-items:center; 
    justify-content:center; cursor:pointer; font-size:14px; transition: 0.2s;
}
.close-btn:hover { background: var(--danger); color: white; }

.tryon-btn { flex:1; padding:12px; border-radius:8px; border:none; cursor:pointer; font-weight:700; font-size:13px; transition: 0.3s; }
.btn-black { background: #000; color:#fff; }
.btn-grey { background: #f0f0f0; color:#333; margin-right:8px; }
.btn-success-anim { background: var(--success) !important; color: white !important; }

/* Main Trigger Button */
.main-trigger-btn {
    width:100%; margin-top:10px; padding:15px; background:#000; color:#fff; 
    border-radius:10px; border:none; font-size:16px; font-weight:800; 
    cursor:pointer; transition: transform 0.1s;
}
.main-trigger-btn:active { transform: scale(0.98); }

.bottom-info { font-size:11px; color:#888; margin-top:12px; line-height:1.3; }
.loader-spin { width:30px; height:30px; border:3px solid #f3f3f3; border-top:3px solid #000; border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 10px; }
@keyframes spin { to { transform:rotate(360deg); } }
`;
document.head.appendChild(style);

const overlay = document.createElement("div");
overlay.className = "tryon-overlay";
overlay.innerHTML = `
<div class="tryon-box">
  <div class="close-btn" id="closeX">✕</div>
  <div id="step1">
    <div class="privacy-badge">PRIVACY PROTECTED</div>
    <h2 style="margin:0 0 15px; font-size:20px;">Virtual Try-On</h2>
    
    <div style="text-align:left;">
      <label style="font-size:11px; font-weight:bold;">CHOOSE CATEGORY</label>
      <select id="catSelect">
        <option value="tops">Tops (Shirts, Jackets, Coats)</option>
        <option value="one-pieces">One-Pieces (Tracksuits, Dresses)</option>
        <option value="bottoms">Bottoms (Pants, Shorts, Skirts)</option>
      </select>
    </div>

    <div class="upload-area" id="upBox" onclick="document.getElementById('imgInput').click()">
      <span style="font-size:32px;">📷</span><br>
      <strong style="display:block; margin-top:8px; font-size:14px;">UPLOAD YOUR PHOTO</strong>
    </div>
    
    <p class="bottom-info">For best results, try a <b>standing</b> and <b>clear</b> picture with good lighting.</p>
    <input id="imgInput" type="file" hidden accept="image/*">
  </div>

  <div id="step2" style="display:none; padding:20px 0;">
    <div class="loader-spin"></div>
    <h3 style="font-size:16px;">Processing...</h3>
  </div>

  <div id="step3" style="display:none">
    <div class="compare-container" id="viewBox">
      <img id="resImg" crossorigin="anonymous">
      <div id="mask"><img id="userImgPrev"></div>
      <input type="range" id="sliderUI" min="0" max="100" value="50" style="position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:ew-resize; z-index:10;">
    </div>
    <div style="display:flex;">
        <button class="tryon-btn btn-grey" id="retryAction">Try Another</button>
        <button class="tryon-btn btn-black" id="saveAction">Download Look</button>
    </div>
  </div>
</div>`;
document.body.appendChild(overlay);

const userImgPrev = document.getElementById("userImgPrev"),
      resImg = document.getElementById("resImg"),
      mask = document.getElementById("mask"),
      sliderUI = document.getElementById("sliderUI"),
      saveBtn = document.getElementById("saveAction");

function resetAll() {
  document.getElementById("step3").style.display="none";
  document.getElementById("step2").style.display="none";
  document.getElementById("step1").style.display="block";
  sliderUI.value = 50; mask.style.width = "50%";
  saveBtn.classList.remove("btn-success-anim");
  saveBtn.innerText = "Download Look";
}

document.getElementById("closeX").onclick = () => { overlay.style.display="none"; document.body.classList.remove("tryon-open"); resetAll(); };
document.getElementById("retryAction").onclick = resetAll;

saveBtn.onclick = async () => {
    if(!resImg.src) return;
    saveBtn.classList.add("btn-success-anim");
    saveBtn.innerText = "✅ Saved!";
    const r = await fetch(resImg.src);
    const b = await r.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = "my_style.jpg";
    a.click();
    setTimeout(() => {
        saveBtn.classList.remove("btn-success-anim");
        saveBtn.innerText = "Download Look";
    }, 2000);
};

document.getElementById("imgInput").onchange = e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    userImgPrev.src = ev.target.result;
    document.getElementById("step1").style.display="none";
    document.getElementById("step2").style.display="block";

    try {
      const start = await fetch(BACKEND_URL+"/tryon/start", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          userImage: ev.target.result,
          productImage: getProductImage(),
          category: document.getElementById("catSelect").value 
        })
      });
      const { jobId } = await start.json();
      
      let finalUrl = null;
      for(let i=0; i<40; i++) {
        await new Promise(r=>setTimeout(r,2500));
        const s = await (await fetch(BACKEND_URL+"/tryon/status/"+jobId)).json();
        if(s.status==="completed") { finalUrl = s.resultUrl; break; }
      }

      if(!finalUrl) throw new Error("Timeout");
      
      resImg.src = finalUrl;
      resImg.onload = () => {
        const box = document.getElementById("viewBox");
        userImgPrev.style.width = box.offsetWidth + "px";
        userImgPrev.style.height = box.offsetHeight + "px";
        document.getElementById("step2").style.display="none";
        document.getElementById("step3").style.display="block";
      };
    } catch(err){ alert("Try again: " + err.message); resetAll(); }
  };
  reader.readAsDataURL(file);
};

sliderUI.oninput = e => { mask.style.width = e.target.value+"%"; };
window.openTryon = () => { overlay.style.display="flex"; document.body.classList.add("tryon-open"); };

const f = document.querySelector("form[action*='/cart/add']") || document.querySelector(".product-form");
if(f){
  const b = document.createElement("button");
  b.type="button"; b.className="main-trigger-btn";
  b.innerHTML="✨ VIRTUAL TRY-ON";
  b.onclick=openTryon;
  f.after(b);
}

})();
