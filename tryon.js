(function(){

/* ================= CONFIG ================= */
const PRODUCT_IMAGE = "https://cdn.shopify.com/s/files/1/0777/6115/1208/files/demo_image_2.png";

/* ================= CSS ================= */
const style = document.createElement("style");
style.innerHTML = `
body.tryon-open { overflow: hidden; }
body.tryon-open header, body.tryon-open main { filter: blur(8px) brightness(0.7); transition:0.3s ease; }

.tryon-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,0.7);
  display:none; justify-content:center; align-items:center; z-index:999999;
  backdrop-filter: blur(10px); transition: all 0.3s ease;
}

.tryon-box {
  background:#fff; width:95%; max-width:480px; border-radius:24px;
  padding:25px; position:relative; text-align:center;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  box-shadow:0 10px 40px rgba(0,0,0,0.3);
}

.tryon-box.full { max-width:850px; }

.compare {
  position:relative; width:100%; aspect-ratio:4/5; 
  overflow:hidden; border-radius:18px; background:#f9f9f9;
}

.compare img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }

.range-ctrl {
  position:absolute; inset:0; width:100%; height:100%;
  opacity:0; cursor:ew-resize; z-index:20; touch-action:none;
}

.slider-line {
  position:absolute; top:0; bottom:0; left:50%; width:2px;
  background:#fff; z-index:10; pointer-events:none;
}

.slider-line::after {
  content:'↔'; position:absolute; top:50%; left:50%;
  transform:translate(-50%,-50%); background:#000; color:#fff;
  width:35px; height:35px; border-radius:50%; display:flex; align-items:center; justify-content:center;
}

.tryon-btn {
  padding:12px 25px; background:#000; color:#fff;
  border-radius:50px; border:none; cursor:pointer; font-weight:700; margin-top:15px;
  transition: all 0.2s ease;
}
.tryon-btn:hover { background:#333; }
.tryon-btn:active { transform:scale(0.97); }

.loader {
  width:40px; height:40px; border:3px solid #f3f3f3;
  border-top:3px solid #000; border-radius:50%;
  animation:spin 1s linear infinite; margin:20px auto;
}
@keyframes spin { to { transform:rotate(360deg); } }

.close { position:absolute; top:15px; right:20px; cursor:pointer; font-size:24px; z-index:100; }

@media(max-width:480px){
  .tryon-box.full { max-width:95%; padding:20px; }
  .slider-line::after { width:30px; height:30px; font-size:14px; }
}
`;
document.head.appendChild(style);

/* ================= HTML ================= */
const overlay = document.createElement("div");
overlay.className="tryon-overlay";
overlay.id="tryonOverlay";
overlay.innerHTML=`
<div class="tryon-box" id="popup">
  <div class="close" onclick="closeTryon()">✕</div>
  
  <div id="step1">
    <h2 style="margin-bottom:20px;">Virtual Try-On</h2>
    <div style="padding:40px; border:2px dashed #ccc; border-radius:20px; cursor:pointer" onclick="document.getElementById('userImg').click()">
       <b>Click to Upload Photo</b>
    </div>
    <input type="file" id="userImg" hidden accept="image/*">
  </div>

  <div id="step2" style="display:none">
    <div class="loader"></div>
    <p>AI is processing your request...</p>
  </div>

  <div id="step3" style="display:none">
    <div style="background:#000; color:#fff; display:inline-block; padding:5px 15px; border-radius:20px; margin-bottom:10px; font-size:12px;">✨ PERFECT FIT</div>
    <div class="compare" id="compareBox">
      <img id="beforeImg" alt="User uploaded photo">
      <div id="mask" style="position:absolute; inset:0; width:50%; overflow:hidden; border-right:2px solid #fff; z-index:5;">
         <img id="afterImg" style="width:100%; height:100%; object-fit:cover;" alt="AI processed try-on">
      </div>
      <div class="slider-line" id="line"></div>
      <input type="range" class="range-ctrl" id="slider" min="0" max="100" value="50">
    </div>
    <button class="tryon-btn" onclick="resetTryOn()" style="background:#eee; color:#000; margin-right:10px;">Try Another</button>
    <button class="tryon-btn" onclick="downloadImage()">Download</button>
  </div>
</div>
`;
document.body.appendChild(overlay);

/* ================= CUSTOM AI LOGIC (PLACEHOLDER) ================= */
async function processImageAI(userBase64) {
  // Replace with your AI API
  return new Promise((resolve) => {
    setTimeout(() => resolve(PRODUCT_IMAGE), 3000);
  });
}

/* ================= FUNCTIONS ================= */
window.openTryon = () => {
  document.body.classList.add("tryon-open");
  overlay.style.display = "flex";
};

window.closeTryon = () => {
  document.body.classList.remove("tryon-open");
  overlay.style.display = "none";
  resetTryOn();
};

document.getElementById("userImg").onchange = async function(e) {
  if(!e.target.files[0]) return;
  const reader = new FileReader();
  reader.onload = async (event) => {
    const base64 = event.target.result;
    document.getElementById("beforeImg").src = base64;
    
    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";

    try {
      const aiRes = await processImageAI(base64);
      if(!aiRes) throw new Error("AI processing failed");

      document.getElementById("afterImg").src = aiRes;
      document.getElementById("step2").style.display = "none";
      document.getElementById("step3").style.display = "block";
      document.getElementById("popup").classList.add("full");
    } catch(err) {
      alert("AI processing failed. Please try again.");
      resetTryOn();
    }
  };
  reader.readAsDataURL(e.target.files[0]);
};

window.resetTryOn = () => {
  document.getElementById("popup").classList.remove("full");
  document.getElementById("step3").style.display = "none";
  document.getElementById("step2").style.display = "none";
  document.getElementById("step1").style.display = "block";
  document.getElementById("userImg").value = "";
  document.getElementById("slider").value = 50;
  document.getElementById("mask").style.width = "50%";
  document.getElementById("line").style.left = "50%";
};

window.downloadImage = () => {
  const img = document.getElementById("afterImg");
  const link = document.createElement("a");
  link.href = img.src;
  link.download = "virtual-tryon-result.png";
  link.click();
};

/* ================= SLIDER ================= */
document.getElementById("slider").oninput = function() {
  const val = this.value;
  document.getElementById("mask").style.width = val + "%";
  document.getElementById("line").style.left = val + "%";
};

/* Attach buttons to Shopify "Add to Cart" forms */
document.querySelectorAll("form[action*='/cart/add']").forEach(f => {
  if(!f.querySelector('.tryon-btn-added')){
    const b = document.createElement("button");
    b.type = "button"; b.className = "tryon-btn tryon-btn-added";
    b.innerText = "Try it On"; b.style.width = "100%";
    b.onclick = openTryon;
    f.appendChild(b);
  }
});

/* ESC key to close */
document.addEventListener("keydown", e => { if(e.key === "Escape") closeTryon(); });

})();
