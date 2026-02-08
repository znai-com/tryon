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
:root { --primary: #000; --accent: #3498db; --glass: rgba(255, 255, 255, 0.98); }
body.tryon-open { overflow:hidden; }
.tryon-overlay{
  position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter: blur(10px);
  display:none; align-items:center; justify-content:center; z-index:1000000;
}
.tryon-box{
  background: var(--glass); width:95%; max-width:520px; border-radius:28px; 
  padding:35px; position:relative; text-align: center; border: 1px solid #eee;
}

/* --- OLD UI RESTORED --- */
.privacy-badge { display: inline-block; background: #e8f4fd; color: #2980b9; padding: 6px 15px; border-radius: 20px; font-size: 11px; margin-bottom: 15px; font-weight: 700; text-transform: uppercase; }
.upload-area { padding:45px 20px; border:2px dashed #ddd; border-radius:20px; cursor:pointer; background:#fafafa; transition: 0.3s; }
.upload-area:hover { border-color: var(--accent); background:#f0f7ff; }

/* --- CLOSE BUTTON (CIRCLE + RED HOVER) --- */
.close-circle {
  position:absolute; top:20px; right:20px; width:35px; height:35px; 
  background:#eee; border-radius:50%; display:flex; align-items:center; 
  justify-content:center; cursor:pointer; font-weight:bold; transition: 0.3s;
}
.close-circle:hover { background:#ff4757; color:#fff; transform: rotate(90deg); }

/* --- ALIGNMENT FIX (PERFECT OVERLAY) --- */
.compare-wrapper { 
  position:relative; width:100%; height:550px; background:#111; 
  border-radius:18px; overflow:hidden; margin: 20px 0;
}
.compare-wrapper img { 
  width:100% !important; height:100% !important; 
  object-fit: contain !important; /* Forces images to stay in original ratio */
  position:absolute; top:0; left:0;
}
#mask { 
  position:absolute; top:0; left:0; bottom:0; width:50%; 
  overflow:hidden; border-right:3px solid #fff; z-index:5; 
}
#mask img { width: 450px !important; height: 550px !important; object-fit: contain !important; }

/* --- BUTTONS --- */
.tryon-btn { flex:1; padding:16px; border-radius:12px; border:none; cursor:pointer; font-weight:700; font-size:14px; transition: 0.3s; }
.btn-black { background: #000; color:#fff; }
.btn-light { background: #f0f0f0; color:#333; margin-right:10px; }
.btn-download-success { background: #2ecc71 !important; color: white !important; }

/* MAIN EXTERNAL BUTTON */
.main-tryon-trigger {
  width:100%; margin-top:15px; padding:20px; background:#000; color:#fff; 
  border-radius:12px; border:none; font-size:18px; font-weight:900; 
  cursor:pointer; box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.loader-ai { width:40px; height:40px; border:3px solid #f3f3f3; border-top:3px solid #000; border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 20px; }
@keyframes spin { to { transform:rotate(360deg); } }
`;
document.head.appendChild(style);

const overlay = document.createElement("div");
overlay.className = "tryon-overlay";
overlay.innerHTML = `
<div class="tryon-box">
  <div class="close-circle" id="closeAction">✕</div>
  <div id="step1">
    <div class="privacy-badge">🔒 Encrypted & Private</div>
    <h2 style="margin-bottom:25px;">Virtual Try-On</h2>
    <div style="text-align:left; margin-bottom:15px;">
      <label style="font-size:12px; font-weight:bold;">Select Category:</label>
      <select id="catSelect" style="width:100%; padding:12px; margin-top:5px; border-radius:10px; border:1px solid #ddd;">
        <option value="tops">👕 Tops / Jackets</option>
        <option value="one-pieces">🥋 Full Suits / Tracksuits</option>
        <option value="bottoms">👖 Pants / Shorts</option>
      </select>
    </div>
    <div class="upload-area" onclick="document.getElementById('fileIn').click()">
      <span style="font-size:45px;">📸</span><br>
      <strong style="display:block; margin-top:10px;">Upload Your Photo</strong>
    </div>
    <input id="fileIn" type="file" hidden accept="image/*">
  </div>
  <div id="step2" style="display:none; padding:40px 0;">
    <div class="loader-ai"></div>
    <h3>Creating Your Look...</h3>
  </div>
  <div id="step3" style="display:none">
    <div class="compare-wrapper" id="container">
      <img id="outImg" crossorigin="anonymous">
      <div id="mask"><img id="inImg"></div>
      <input type="range" id="slid" min="0" max="100" value="50" style="position:absolute; inset:0; width:100%; height:100%; opacity:0; cursor:ew-resize; z-index:10;">
    </div>
    <div style="display:flex; margin-top:20px;">
        <button class="tryon-btn btn-light" id="retry">Try Another</button>
        <button class="tryon-btn btn-black" id="down">Download Look</button>
    </div>
  </div>
</div>`;
document.body.appendChild(overlay);

const inImg = document.getElementById("inImg"),
      outImg = document.getElementById("outImg"),
      mask = document.getElementById("mask"),
      slid = document.getElementById("slid"),
      downBtn = document.getElementById("down");

// Logic
const close = () => { overlay.style.display="none"; document.body.classList.remove("tryon-open"); reset(); };
document.getElementById("closeAction").onclick = close;
window.addEventListener('keydown', (e) => { if(e.key === "Escape") close(); });

function reset() {
  document.getElementById("step3").style.display="none";
  document.getElementById("step2").style.display="none";
  document.getElementById("step1").style.display="block";
  slid.value = 50; mask.style.width = "50%";
  downBtn.classList.remove("btn-download-success");
  downBtn.innerText = "Download Look";
}
document.getElementById("retry").onclick = reset;

// ✅ Download Logic + Green Effect
downBtn.onclick = async () => {
    if(!outImg.src) return;
    downBtn.classList.add("btn-download-success");
    downBtn.innerText = "✅ Saved";
    
    const res = await fetch(outImg.src);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = "tryon-result.jpg";
    a.click();
    
    setTimeout(() => {
        downBtn.classList.remove("btn-download-success");
        downBtn.innerText = "Download Look";
    }, 2000);
};

document.getElementById("fileIn").onchange = e => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    inImg.src = ev.target.result;
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
      
      let resUrl = null;
      for(let i=0; i<40; i++) {
        await new Promise(r=>setTimeout(r,2500));
        const st = await (await fetch(BACKEND_URL+"/tryon/status/"+jobId)).json();
        if(st.status==="completed") { resUrl = st.resultUrl; break; }
      }

      if(!resUrl) throw new Error("AI Timeout");
      
      outImg.src = resUrl;
      outImg.onload = () => {
        // ✅ ALIGNMENT FORCE-SYNC
        const cont = document.getElementById("container");
        inImg.style.width = cont.offsetWidth + "px";
        inImg.style.height = cont.offsetHeight + "px";
        document.getElementById("step2").style.display="none";
        document.getElementById("step3").style.display="block";
      };
    } catch(err){ alert("Error: " + err.message); reset(); }
  };
  reader.readAsDataURL(file);
};

slid.oninput = e => { mask.style.width = e.target.value+"%"; };
window.openTryon = () => { overlay.style.display="flex"; document.body.classList.add("tryon-open"); };

// Outer Button
const f = document.querySelector("form[action*='/cart/add']") || document.querySelector(".product-form");
if(f){
  const b = document.createElement("button");
  b.type="button"; b.className="main-tryon-trigger";
  b.innerHTML="✨ VIRTUAL TRY-ON";
  b.onclick=openTryon;
  f.after(b);
}

})();
