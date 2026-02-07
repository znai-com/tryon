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
body.tryon-open { overflow:hidden; }
.tryon-overlay{
  position:fixed; inset:0; background:rgba(0,0,0,.9);
  display:none; align-items:center; justify-content:center; z-index:1000000;
}
.tryon-box{
  background:#fff; width:90%; max-width:500px; border-radius:15px; 
  padding:20px; position:relative;
}
.compare {
  position:relative; width:100%; height:450px; 
  background:#eee; overflow:hidden; border-radius:8px;
}
/* 🔥 FIXED ALIGNMENT: 'cover' ensures both images occupy same space exactly */
.compare img {
  width:100% !important; height:100% !important; 
  object-fit: cover !important; 
  position:absolute; top:0; left:0;
  display: block;
}
#mask {
  position:absolute; top:0; left:0; bottom:0; width:50%; overflow:hidden; 
  border-right:3px solid #fff; z-index:5;
}
#mask img { 
  width: 500px !important; /* Matches container max-width approx */
  height: 450px !important; 
  object-fit: cover !important;
  max-width: none !important;
}
.range {
  position:absolute; inset:0; width:100%; height:100%;
  opacity:0; cursor:ew-resize; z-index:20;
}
.tryon-btn {
  margin:10px 5px; padding:10px 20px; background:#000; color:#fff;
  border-radius:5px; border:none; cursor:pointer; font-weight:bold;
}
.loader {
  width:30px; height:30px; border:3px solid #f3f3f3; border-top:3px solid #3498db;
  border-radius:50%; animation:spin 1s linear infinite; margin:20px auto;
}
@keyframes spin { to { transform:rotate(360deg); } }
.close { position:absolute; top:10px; right:15px; font-size:24px; cursor:pointer; z-index:30; }
`;
document.head.appendChild(style);

const overlay = document.createElement("div");
overlay.className = "tryon-overlay";
overlay.id = "tryonOverlay";
overlay.innerHTML = `
<div class="tryon-box" id="popup">
  <div class="close" onclick="closeTryon()">✕</div>
  <div id="step1">
    <h3>Virtual Try-On</h3>
    <div style="padding:40px; border:2px dashed #ccc; cursor:pointer" onclick="document.getElementById('userImg').click()">
      Upload your photo
    </div>
    <input id="userImg" type="file" hidden accept="image/*">
  </div>
  <div id="step2" style="display:none">
    <div class="loader"></div>
    <p id="loaderText">AI is tailoring your outfit... please wait</p>
  </div>
  <div id="step3" style="display:none">
    <div class="compare" id="compareContainer">
      <img id="afterImg" crossorigin="anonymous">
      <div id="mask"><img id="beforeImg"></div>
      <input type="range" class="range" id="slider" min="0" max="100" value="50">
    </div>
    <div style="margin-top:10px; display:flex; justify-content:center;">
        <button class="tryon-btn" onclick="resetTryOn()" style="background:#666">Try Another</button>
        <button class="tryon-btn" id="downloadBtn">Download</button>
    </div>
  </div>
</div>`;
document.body.appendChild(overlay);

const beforeImg = document.getElementById("beforeImg"), afterImg = document.getElementById("afterImg");
const mask = document.getElementById("mask"), slider = document.getElementById("slider");

window.closeTryon = () => { overlay.style.display="none"; document.body.classList.remove("tryon-open"); resetTryOn(); };

window.resetTryOn = () => {
  document.getElementById("step3").style.display="none";
  document.getElementById("step2").style.display="none";
  document.getElementById("step1").style.display="block";
  document.getElementById("userImg").value = "";
  if(slider && mask) {
    slider.value = 50;
    mask.style.width = "50%";
  }
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
        // Alignment Sync: Make sure mask image matches afterImg size
        const container = document.getElementById("compareContainer");
        mask.querySelector('img').style.width = container.offsetWidth + "px";
        mask.querySelector('img').style.height = container.offsetHeight + "px";
        
        document.getElementById("step2").style.display="none";
        document.getElementById("step3").style.display="block";
      };
    } else {
      alert("Something went wrong. Please try again.");
      resetTryOn();
    }
  };
  reader.readAsDataURL(file);
};

async function processImageAI(userImg){
  const prodImg = getProductImage();
  let category = "tops"; 
  const bodyContent = document.body.innerText.toLowerCase();
  
  if(bodyContent.includes("tracksuit") || bodyContent.includes("suit") || bodyContent.includes("set")) {
    category = "one-pieces";
  } else if(bodyContent.includes("pant") || bodyContent.includes("trouser")) {
    category = "bottoms";
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

document.getElementById("downloadBtn").onclick = async () => {
  const a = document.createElement("a");
  a.href = afterImg.src; a.download = "tryon_result.png";
  a.click();
};

slider.oninput = e => { 
  mask.style.width = e.target.value + "%"; 
};

window.openTryon = () => { overlay.style.display="flex"; document.body.classList.add("tryon-open"); };

const cartForm = document.querySelector("form[action*='/cart/add']");
if(cartForm) {
  const b = document.createElement("button");
  b.type = "button"; b.className = "tryon-btn";
  b.innerText = "Try it On"; b.style.width="100%";
  b.onclick = openTryon;
  cartForm.appendChild(b);
}
})();
