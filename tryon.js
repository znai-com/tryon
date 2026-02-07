(function(){

const BACKEND_URL = "https://tryon-backend-production-4f18.up.railway.app/tryon";

function getProductImage() {
  let img = document.querySelector('meta[property="og:image"]') || 
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
  box-shadow: inset 0 0 20px rgba(0,0,0,0.2);
}
.compare img {
  width:100% !important; height:100% !important; 
  object-fit: cover !important; 
  position:absolute; top:0; left:0;
}
#mask {
  position:absolute; top:0; left:0; bottom:0; width:50%; overflow:hidden; 
  border-right:4px solid #fff; z-index:5; box-shadow: 5px 0 15px rgba(0,0,0,0.3);
}
#mask img { width: 550px !important; height: 480px !important; object-fit: cover !important; }
.range {
  position:absolute; inset:0; width:100%; height:100%;
  opacity:0; cursor:ew-resize; z-index:20;
}
.tryon-btn {
  margin:10px 8px; padding:12px 28px; background: var(--primary); color:#fff;
  border-radius:12px; border:none; cursor:pointer; font-weight:600;
  transition: transform 0.2s, background 0.3s; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.tryon-btn:hover { transform: translateY(-2px); background: #333; }

/* 🔥 DOWNLOAD BUTTON CLICK GREEN */
.tryon-btn.clicked-green { background: #27ae60 !important; transform: scale(0.95); }

.loader-container { padding: 40px 0; }
.loader {
  width:45px; height:45px; border:4px solid #f3f3f3; border-top:4px solid var(--accent);
  border-radius:50%; animation:spin 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite; margin:0 auto 20px;
}
@keyframes spin { to { transform:rotate(360deg); } }

/* 🔥 CIRCLE WINDOWS-STYLE CLOSE BUTTON */
.close { 
  position:absolute; top:15px; right:15px; width:32px; height:32px;
  display:flex; align-items:center; justify-content:center;
  border-radius:50%; font-size:18px; color: #666; 
  cursor:pointer; z-index:30; transition: all 0.2s;
}
.close:hover { background: #e74c3c; color: #fff; }

.step-title { font-size: 22px; font-weight: 700; margin-bottom: 15px; color: #1a1a1a; }
`;
document.head.appendChild(style);

const overlay = document.createElement("div");
overlay.className = "tryon-overlay";
overlay.id = "tryonOverlay";
overlay.innerHTML = `
<div class="tryon-box" id="popup">
  <div class="close" onclick="closeTryon()">✕</div>
  <div id="step1">
    <div class="step-title">Virtual Fitting Room</div>
    <p style="color:#666; margin-bottom:20px;">Upload a clear full-body photo for the best result.</p>
    <div style="padding:60px 20px; border:2px dashed #ddd; border-radius:16px; cursor:pointer; background:rgba(0,0,0,0.02)" 
         onclick="document.getElementById('userImg').click()" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='rgba(0,0,0,0.02)'">
      <span style="font-size:40px;">📸</span><br>
      <strong style="display:block; margin-top:10px;">Click to Upload Photo</strong>
    </div>
    <input id="userImg" type="file" hidden accept="image/*">
  </div>
  <div id="step2" style="display:none">
    <div class="loader-container">
      <div class="loader"></div>
      <div class="step-title">AI is Tailoring...</div>
      <p id="loaderText" style="color:#666;">Our AI is fitting the garment to your body. This takes about 15-30 seconds.</p>
    </div>
  </div>
  <div id="step3" style="display:none">
    <div class="step-title">Your New Look</div>
    <div class="compare" id="compareContainer">
      <img id="afterImg" crossorigin="anonymous">
      <div id="mask"><img id="beforeImg"></div>
      <input type="range" class="range" id="slider" min="0" max="100" value="50">
    </div>
    <div style="margin-top:20px; display:flex; justify-content:center;">
        <button class="tryon-btn" onclick="resetTryOn()" style="background:#f1f1f1; color:#333;">Try Another</button>
        <button class="tryon-btn" id="downloadBtn">Download Look</button>
    </div>
  </div>
</div>`;
document.body.appendChild(overlay);

const beforeImg = document.getElementById("beforeImg"), afterImg = document.getElementById("afterImg");
const mask = document.getElementById("mask"), slider = document.getElementById("slider");

window.closeTryon = () => { 
  overlay.style.display="none"; 
  document.body.classList.remove("tryon-open"); 
  resetTryOn(); 
};

// 🔥 CLOSE ON OUTSIDE CLICK
overlay.onclick = (e) => {
  if (e.target === overlay) closeTryon();
};

// 🔥 CLOSE ON ESC KEY
document.addEventListener('keydown', (e) => {
  if (e.key === "Escape" && overlay.style.display === "flex") closeTryon();
});

window.resetTryOn = () => {
  document.getElementById("step3").style.display="none";
  document.getElementById("step2").style.display="none";
  document.getElementById("step1").style.display="block";
  document.getElementById("userImg").value = "";
  // Reset green button if needed
  document.getElementById("downloadBtn").classList.remove("clicked-green");
  if(slider && mask) { slider.value = 50; mask.style.width = "50%"; }
};

document.getElementById("userImg").onchange = e => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = async ev => {
    beforeImg.src = ev.target.result;
    document.getElementById("step1").style.display="none";
    document.getElementById("step2").style.display="block";

    const out = await processImageAI(ev.target.result);
    if(out) {
      afterImg.src = out;
      afterImg.onload = () => {
        const container = document.getElementById("compareContainer");
        mask.querySelector('img').style.width = container.offsetWidth + "px";
        mask.querySelector('img').style.height = container.offsetHeight + "px";
        document.getElementById("step2").style.display="none";
        document.getElementById("step3").style.display="block";
      };
    } else {
      alert("AI Processing timed out. Please try again with a smaller image.");
      resetTryOn();
    }
  };
  reader.readAsDataURL(file);
};

async function processImageAI(userImg){
  const prodImg = getProductImage();
  let category = "tops"; 
  const content = (document.title + " " + document.body.innerText).toLowerCase();
  const rules = {
    "one-pieces": ["tracksuit", "set", "suit", "jumpsuit", "coords", "outfit"],
    "bottoms": ["pant", "trouser", "short", "skirt", "jean", "legging"]
  };
  for (let cat in rules) {
    if (rules[cat].some(word => content.includes(word))) {
      category = cat;
      break;
    }
  }

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userImage: userImg, productImage: prodImg, category: category })
    });
    const data = await res.json();
    return data.resultImage; 
  } catch(e) { return null; }
}

document.getElementById("downloadBtn").onclick = async function() {
  const btn = this;
  btn.classList.add("clicked-green"); // 🔥 MAKE GREEN ON CLICK
  
  try {
    const response = await fetch(afterImg.src);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "my_style.png";
    a.click();
    // Revert color after 1 second if you want, or keep it green
    setTimeout(() => btn.classList.remove("clicked-green"), 1000);
  } catch(e) { 
    window.open(afterImg.src, '_blank'); 
  }
};

slider.oninput = e => { mask.style.width = e.target.value + "%"; };
window.openTryon = () => { overlay.style.display="flex"; document.body.classList.add("tryon-open"); };

const target = document.querySelector("form[action*='/cart/add']") || document.querySelector(".product-form");
if(target) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "tryon-btn";
  b.innerHTML = "<span>✨</span> Virtual Try-On";
  b.style.width="100%"; b.style.marginTop="15px";
  b.onclick = openTryon;
  target.after(b);
}
})();
