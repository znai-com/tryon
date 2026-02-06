(function(){

/* ================= CONFIG ================= */

// 🔗 BACKEND URL (sirf ye change karna hoga)
const BACKEND_URL = "https://YOUR-BACKEND-URL/tryon";

/* Auto-detect Shopify product image */
function getProductImage() {
  const img =
    document.querySelector(".product__media img") ||
    document.querySelector(".product__image img") ||
    document.querySelector("img[src*='cdn.shopify.com']");

  return img ? img.src : null;
}

/* ================= CSS ================= */
const style = document.createElement("style");
style.innerHTML = `
body.tryon-open { overflow: hidden; }
body.tryon-open header, body.tryon-open main { filter: blur(8px) brightness(0.7); transition:0.3s ease; }

.tryon-overlay {
  position:fixed; inset:0; background:rgba(0,0,0,0.7);
  display:none; justify-content:center; align-items:center; z-index:999999;
  backdrop-filter: blur(10px);
}

.tryon-box {
  background:#fff; width:95%; max-width:480px; border-radius:24px;
  padding:25px; position:relative; text-align:center;
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
  opacity:0; cursor:ew-resize; z-index:20;
}

.slider-line {
  position:absolute; top:0; bottom:0; left:50%; width:2px;
  background:#fff; z-index:10;
}

.slider-line::after {
  content:'↔'; position:absolute; top:50%; left:50%;
  transform:translate(-50%,-50%);
  background:#000; color:#fff;
  width:35px; height:35px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
}

.tryon-btn {
  padding:12px 25px; background:#000; color:#fff;
  border-radius:50px; border:none; cursor:pointer;
  font-weight:700; margin-top:15px;
}

.loader {
  width:40px; height:40px; border:3px solid #f3f3f3;
  border-top:3px solid #000; border-radius:50%;
  animation:spin 1s linear infinite; margin:20px auto;
}

@keyframes spin { to { transform:rotate(360deg); } }

.close { position:absolute; top:15px; right:20px; cursor:pointer; font-size:24px; }
`;
document.head.appendChild(style);

/* ================= HTML ================= */
const overlay = document.createElement("div");
overlay.className="tryon-overlay";
overlay.innerHTML=`
<div class="tryon-box" id="popup">
  <div class="close" onclick="closeTryon()">✕</div>

  <div id="step1">
    <h2>Virtual Try-On</h2>
    <div style="padding:40px;border:2px dashed #ccc;border-radius:20px;cursor:pointer"
      onclick="document.getElementById('userImg').click()">
      <b>Click to Upload Photo</b>
    </div>
    <input type="file" id="userImg" hidden accept="image/*">
  </div>

  <div id="step2" style="display:none">
    <div class="loader"></div>
    <p>AI is processing...</p>
  </div>

  <div id="step3" style="display:none">
    <div class="compare">
      <img id="beforeImg">
      <div id="mask" style="position:absolute;inset:0;width:50%;overflow:hidden">
        <img id="afterImg">
      </div>
      <div class="slider-line" id="line"></div>
      <input type="range" class="range-ctrl" id="slider" min="0" max="100" value="50">
    </div>

    <button class="tryon-btn" onclick="resetTryOn()" style="background:#eee;color:#000">Try Another</button>
    <button class="tryon-btn" onclick="downloadImage()">Download</button>
  </div>
</div>
`;
document.body.appendChild(overlay);

/* ================= AI CALL (REAL BACKEND) ================= */
async function processImageAI(userBase64) {
  const productImage = getProductImage();
  if (!productImage) {
    alert("Product image not found");
    return null;
  }

  const res = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userImage: userBase64,
      productImage
    })
  });

  const data = await res.json();
  return data.resultImage;
}

/* ================= LOGIC ================= */
window.openTryon = () => {
  document.body.classList.add("tryon-open");
  overlay.style.display = "flex";
};

window.closeTryon = () => {
  document.body.classList.remove("tryon-open");
  overlay.style.display = "none";
  resetTryOn();
};

document.getElementById("userImg").onchange = e => {
  const file = e.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = async ev => {
    document.getElementById("beforeImg").src = ev.target.result;
    document.getElementById("step1").style.display="none";
    document.getElementById("step2").style.display="block";

    const aiImg = await processImageAI(ev.target.result);
    document.getElementById("afterImg").src = aiImg;

    document.getElementById("step2").style.display="none";
    document.getElementById("step3").style.display="block";
    document.getElementById("popup").classList.add("full");
  };
  reader.readAsDataURL(file);
};

window.resetTryOn = () => {
  document.getElementById("popup").classList.remove("full");
  document.getElementById("step3").style.display="none";
  document.getElementById("step2").style.display="none";
  document.getElementById("step1").style.display="block";
};

window.downloadImage = () => {
  const a = document.createElement("a");
  a.href = document.getElementById("afterImg").src;
  a.download = "tryon.png";
  a.click();
};

document.getElementById("slider").oninput = e => {
  const v = e.target.value;
  document.getElementById("mask").style.width = v+"%";
  document.getElementById("line").style.left = v+"%";
};

/* Add button to Shopify */
document.querySelectorAll("form[action*='/cart/add']").forEach(f=>{
  if(!f.querySelector(".tryon-btn-added")){
    const b=document.createElement("button");
    b.type="button";
    b.innerText="Try it On";
    b.className="tryon-btn tryon-btn-added";
    b.onclick=openTryon;
    f.appendChild(b);
  }
});

})();
