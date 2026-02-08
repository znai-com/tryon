// ... (Initial UI code same rahega) ...

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
        method:"POST", 
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          userImage: ev.target.result,
          productImage: getProductImage(),
          category: document.getElementById("catSelect").value,
          storeUrl: window.location.hostname // Automatically send current store URL
        })
      });

      const startData = await start.json();
      
      // 🔴 Check if store is authorized/expired
      if (startData.disabled) {
        alert("⚠️ Notification: " + startData.message);
        resetAll();
        return;
      }

      const { jobId } = startData;
      
      let finalUrl = null;
      for(let i=0; i<40; i++) {
        await new Promise(r=>setTimeout(r,3000));
        const sRes = await fetch(BACKEND_URL+"/tryon/status/"+jobId);
        const s = await sRes.json();
        
        if(s.status==="completed") { finalUrl = s.resultUrl; break; }
        if(s.status==="failed") throw new Error("AI Processing failed");
      }

      if(!finalUrl) throw new Error("Timeout: AI is taking too long.");
      
      resImg.src = finalUrl;
      resImg.onload = () => {
        const box = document.getElementById("viewBox");
        userImgPrev.style.width = box.offsetWidth + "px";
        userImgPrev.style.height = box.offsetHeight + "px";
        document.getElementById("step2").style.display="none";
        document.getElementById("step3").style.display="block";
      };
    } catch(err){ 
      alert("Error: " + err.message); 
      resetAll(); 
    }
  };
  reader.readAsDataURL(file);
};

// ... (Baaki code same rahega) ...
