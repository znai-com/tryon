(function(){

/* ================= CONFIG ================= */
const MODE = document.currentScript.dataset.mode || "demo";

/* ================= CSS ================= */
const style = document.createElement("style");
style.innerHTML = `
body.tryon-open header,
body.tryon-open main {
  filter: blur(6px) brightness(0.5);
}

.tryon-overlay{
  position:fixed;
  inset:0;
  background:rgba(0,0,0,.55);
  display:none;
  justify-content:center;
  align-items:center;
  z-index:9999;
}

.tryon-box{
  background:#fff;
  width:90%;
  max-width:900px;
  border-radius:16px;
  padding:20px;
  animation:scaleIn .35s ease;
}

.tryon-box.full{
  max-width:100%;
  height:90vh;
}

@keyframes scaleIn{
  from{transform:scale(.9);opacity:0}
  to{transform:scale(1);opacity:1}
}

.tryon-btn{
  padding:12px 20px;
  background:#000;
  color:#fff;
  border-radius:30px;
  cursor:pointer;
}

.compare{
  position:relative;
  height:420px;
  overflow:hidden;
  border-radius:14px;
}

.compare img{
  position:absolute;
  top:0; left:0;
  width:100%;
  height:100%;
  object-fit:contain;
}

.compare .after{
  clip-path: inset(0 0 0 50%);
}

.range-ctrl{
  position:absolute;
  top:0; bottom:0;
  left:50%;
  width:4px;
  background:#fff;
  cursor:ew-resize;
  touch-action:pan-x;
}

.badge{
  text-align:center;
  font-size:20px;
  margin:10px 0;
  font-weight:600;
}

.close{
  position:absolute;
  top:15px; right:20px;
  cursor:pointer;
  font-size:22px;
}
`;
document.head.appendChild(style);

/* ================= HTML ================= */
const overlay = document.createElement("div");
overlay.className="tryon-overlay";
overlay.innerHTML=`
<div class="tryon-box" id="popup">
  <div class="close" onclick="closeTryon()">✕</div>

  <!-- STEP 1 -->
  <div id="step1">
    <h2>Upload your photo</h2>
    <input type="file" id="userImg">
    <br><br>
    <button class="tryon-btn" onclick="startTryOn()">Try On</button>
  </div>

  <!-- STEP 3 -->
  <div id="step3" style="display:none">
    <div class="badge">✨ Perfect Fit</div>
    <div class="compare" id="compareBox">
      <img id="beforeImg">
      <img id="afterImg" class="after">
      <div class="range-ctrl" id="slider"></div>
    </div>
    <br>
    <button class="tryon-btn" onclick="resetTryOn()" style="background:#f4f4f4;color:#000">
      Try Another
    </button>
  </div>
</div>
`;
document.body.appendChild(overlay);

/* ================= BUTTON ADD ================= */
document.querySelectorAll("form[action*='/cart/add']").forEach(f=>{
  const b=document.createElement("button");
  b.type="button";
  b.className="tryon-btn";
  b.innerText="Try it On";
  b.onclick=openTryon;
  f.appendChild(b);
});

/* ================= FUNCTIONS ================= */
window.openTryon=function(){
  document.body.classList.add("tryon-open");
  overlay.style.display="flex";
};

window.closeTryon=function(){
  document.body.classList.remove("tryon-open");
  overlay.style.display="none";
};

window.startTryOn=function(){
  popup.classList.add("full");
  step1.style.display="none";
  step3.style.display="block";

  // DEMO images
  beforeImg.src="https://via.placeholder.com/800x800?text=Before";
  afterImg.src="https://via.placeholder.com/800x800?text=After";
};

window.resetTryOn=function(){
  popup.classList.remove("full");
  step3.style.display="none";
  step1.style.display="block";
  userImg.value="";
};

/* ================= SLIDER ================= */
const slider=document.getElementById("slider");
const afterImg=document.getElementById("afterImg");

slider.onmousedown=e=>{
  document.onmousemove=ev=>{
    const rect=slider.parentElement.getBoundingClientRect();
    let x=ev.clientX-rect.left;
    let p=Math.max(0,Math.min(100,(x/rect.width)*100));
    afterImg.style.clipPath=`inset(0 0 0 ${p}%)`;
    slider.style.left=p+"%";
  };
  document.onmouseup=()=>document.onmousemove=null;
};

/* ESC close */
document.addEventListener("keydown",e=>{
  if(e.key==="Escape") closeTryon();
});

})();
