function _(){const t=document.title||"Untitled Page",n=window.location.href,e=document.documentElement.lang||navigator.language||"en";if(n.startsWith("chrome://")||n.startsWith("chrome-extension://")||n.startsWith("edge://")||n.startsWith("about:"))return{title:t,url:n,language:e,wordCount:0,blocks:[],rawText:"",pageType:"generic",isTruncated:!1,unreadableReason:"Browser security policies prevent extensions from reading this internal page."};const i=[];let c=1,o="generic";n.includes("github.com")&&n.includes("/pull/")?o="github_pr":n.includes("mail.google.com")?o="email":n.includes("jira")||n.includes("/issues/")?o="issue_tracker":n.includes("docs.")||n.includes("/docs/")?o="documentation":n.includes("arxiv.org")||n.toLowerCase().includes(".pdf")?o="paper":(n.includes("grafana")||n.includes("dashboard"))&&(o="dashboard"),Array.from(document.body.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, table, pre, blockquote")).forEach(l=>{const m=(l.innerText||l.textContent||"").trim();if(!m||m.length<5)return;const s=`block-${c++}`;l.setAttribute("data-lumen-id",s);const u=l.tagName.toLowerCase();let f="paragraph",y;/^h[1-6]$/.test(u)?(f="heading",y=Number(u.substring(1))):u==="ul"||u==="ol"?f="list":u==="table"?f="table":u==="pre"&&(f="code"),i.push({id:s,type:f,content:m,level:y})});const a=i.map(l=>l.content).join(`

`).trim(),h=a?a.split(/\s+/).filter(Boolean).length:0;return a?{title:t,url:n,language:e,wordCount:h,blocks:i,rawText:a,pageType:o,isTruncated:h>8e3}:{title:t,url:n,language:e,wordCount:0,blocks:[],rawText:"",pageType:o,isTruncated:!1,unreadableReason:"Lumen could not extract readable webpage text. Try Current Selection or Draw a Region."}}function M(){var n;const t=(((n=window.getSelection())==null?void 0:n.toString())||"").replace(/\u00a0/g," ").replace(/[ \t]+/g," ").replace(/\n{3,}/g,`

`).trim();return t?{selectedText:t,contextText:"",wordCount:t.split(/\s+/).filter(Boolean).length}:{selectedText:"",contextText:"",wordCount:0}}const T="lumen-region-overlay";function O(t){const n=window.getComputedStyle(t);if(n.display==="none"||n.visibility==="hidden"||Number(n.opacity)===0)return!1;const e=t.getBoundingClientRect();return e.width>0&&e.height>0}function F(t,n,e,i){const c=t+e,o=n+i,d=[],a=new Set,h=Array.from(document.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,li,td,th,label,button,strong,em,small,code,pre,blockquote,a,figcaption,caption,[role="cell"],[role="columnheader"],[role="rowheader"],[aria-label]'));for(const l of h){if(l.closest(`#${T}`)||!O(l))continue;const m=l.getBoundingClientRect();if(!(m.right>t&&m.left<c&&m.bottom>n&&m.top<o))continue;const u=(l.innerText||l.getAttribute("aria-label")||l.textContent||"").replace(/\s+/g," ").trim();if(!(!u||u.length>1500||a.has(u))&&(a.add(u),d.push(u),d.join(`
`).length>6e3))break}return d.join(`
`).slice(0,6e3).trim()}function v(t){chrome.runtime.sendMessage(t,()=>void chrome.runtime.lastError)}function D(t){requestAnimationFrame(()=>requestAnimationFrame(t))}function N(){var R;(R=document.getElementById(T))==null||R.remove();const t=document.createElement("div");t.id=T,Object.assign(t.style,{position:"fixed",inset:"0",width:"100vw",height:"100vh",zIndex:"2147483647",cursor:"crosshair",background:"rgba(10,10,10,.28)",userSelect:"none",touchAction:"none"});const n=document.createElement("div");n.textContent="Drag over a graph, chart, table, pattern, or any visible area • Esc to cancel",Object.assign(n.style,{position:"fixed",top:"20px",left:"50%",transform:"translateX(-50%)",background:"#0A0A0A",color:"#E8FF3B",border:"1px solid #E8FF3B",borderRadius:"9px",padding:"9px 14px",fontFamily:"Inter,system-ui,sans-serif",fontSize:"12px",fontWeight:"700",pointerEvents:"none",whiteSpace:"nowrap",boxShadow:"0 8px 24px rgba(0,0,0,.45)"}),t.appendChild(n);const e=document.createElement("div");Object.assign(e.style,{position:"fixed",display:"none",border:"2px solid #E8FF3B",background:"rgba(232,255,59,.08)",boxShadow:"0 0 18px rgba(232,255,59,.45)",pointerEvents:"none"}),t.appendChild(e);const i=document.createElement("div");Object.assign(i.style,{position:"absolute",right:"0",bottom:"-27px",background:"#E8FF3B",color:"#0A0A0A",borderRadius:"4px",padding:"3px 7px",fontFamily:"monospace",fontSize:"10px",fontWeight:"700",whiteSpace:"nowrap"}),e.appendChild(i),document.documentElement.appendChild(t);let c=0,o=0,d=0,a=0,h=!1;const l=r=>Math.max(0,Math.min(window.innerWidth,r)),m=r=>Math.max(0,Math.min(window.innerHeight,r));function s(){const r=Math.min(c,d),g=Math.min(o,a);return{x:r,y:g,width:Math.abs(d-c),height:Math.abs(a-o)}}function u(){h=!1,t.remove(),window.removeEventListener("keydown",f,!0)}function f(r){r.key==="Escape"&&(r.preventDefault(),r.stopPropagation(),u(),v({action:"REGION_CAPTURE_CANCELLED"}))}function y(r){r.button===0&&(r.preventDefault(),r.stopImmediatePropagation(),h=!0,c=l(r.clientX),o=m(r.clientY),d=c,a=o,e.style.left=`${c}px`,e.style.top=`${o}px`,e.style.width="0px",e.style.height="0px",e.style.display="block")}function I(r){if(!h)return;r.preventDefault(),r.stopImmediatePropagation(),d=l(r.clientX),a=m(r.clientY);const g=s();e.style.left=`${g.x}px`,e.style.top=`${g.y}px`,e.style.width=`${g.width}px`,e.style.height=`${g.height}px`,i.textContent=`${Math.round(g.width)}px × ${Math.round(g.height)}px`}function L(r){if(!h)return;r.preventDefault(),r.stopImmediatePropagation(),d=l(r.clientX),a=m(r.clientY),h=!1;const{x:g,y:S,width:w,height:E}=s();if(w<15||E<15){u(),v({action:"REGION_CAPTURE_ERROR",error:"Region is too small. Draw a larger rectangle around the visual you want analyzed."});return}const P=F(g,S,w,E),B={x:g,y:S,width:w,height:E,devicePixelRatio:window.devicePixelRatio||1,scrollX:window.scrollX,scrollY:window.scrollY,windowWidth:window.innerWidth,windowHeight:window.innerHeight};u(),D(()=>{chrome.runtime.sendMessage({action:"CAPTURE_VISIBLE_TAB",rect:{x:g,y:S,width:w,height:E,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight,dpr:window.devicePixelRatio||1}},p=>{const C=chrome.runtime.lastError;if(C||!(p!=null&&p.success)||!(p!=null&&p.dataUrl)){v({action:"REGION_CAPTURE_ERROR",error:(C==null?void 0:C.message)||(p==null?void 0:p.error)||"Could not capture this visual region. Refresh the page and try again."});return}v({action:"EXECUTE_SUMMARIZE_PAYLOAD",payload:{success:!0,mode:"region",url:window.location.href,title:document.title||"Drawn Region Screenshot",imageDataUrl:p.dataUrl,text:P||"[No DOM text detected. Analyze the screenshot itself as the primary source.]",region:B,visualPrimary:!0}})})})}t.addEventListener("mousedown",y,!0),t.addEventListener("mousemove",I,!0),t.addEventListener("mouseup",L,!0),window.addEventListener("keydown",f,!0)}function U(){var l,m;const t="lumen-inpage-host",n=document.getElementById(t);if(n){n.style.display=n.style.display==="none"?"block":"none";return}const e=document.createElement("div");e.id=t,Object.assign(e.style,{position:"fixed",top:"20px",right:"20px",width:"420px",height:"640px",zIndex:"2147483646",boxShadow:"0 12px 40px rgba(0,0,0,0.6)",borderRadius:"16px",overflow:"hidden"});const i=e.attachShadow({mode:"open"}),c=document.createElement("div");c.className="lumen-container",c.innerHTML=`
    <style>
      .lumen-container {
        width: 100%;
        height: 100%;
        background: #0A0A0A;
        color: #FAFAF5;
        font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        display: flex;
        flex-direction: column;
        border: 1px solid #272A2D;
        box-sizing: border-box;
      }
      .lumen-header {
        height: 48px;
        background: #111111;
        border-bottom: 1px solid #272A2D;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 16px;
        cursor: move;
        user-select: none;
      }
      .lumen-title {
        color: #E8FF3B;
        font-weight: 700;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .lumen-controls {
        display: flex;
        gap: 8px;
      }
      .lumen-btn {
        background: transparent;
        border: none;
        color: #929292;
        cursor: pointer;
        font-size: 16px;
        padding: 4px 8px;
        border-radius: 4px;
      }
      .lumen-btn:hover {
        color: #E8FF3B;
        background: #181818;
      }
      .lumen-iframe {
        flex: 1;
        width: 100%;
        border: none;
        background: #0A0A0A;
      }
    </style>
    <div class="lumen-header" id="lumen-drag-handle">
      <span class="lumen-title">
        <span>⚡</span> Lumen Side Panel
      </span>
      <div class="lumen-controls">
        <button class="lumen-btn" id="lumen-min-btn" title="Minimize">—</button>
        <button class="lumen-btn" id="lumen-close-btn" title="Close">✕</button>
      </div>
    </div>
    <iframe class="lumen-iframe" src="${chrome.runtime.getURL("src/sidepanel/index.html")}"></iframe>
  `,i.appendChild(c);const o=i.getElementById("lumen-drag-handle");let d=!1,a=0,h=0;o&&o.addEventListener("mousedown",s=>{d=!0,a=s.clientX-e.getBoundingClientRect().left,h=s.clientY-e.getBoundingClientRect().top}),window.addEventListener("mousemove",s=>{d&&(e.style.left=`${s.clientX-a}px`,e.style.top=`${s.clientY-h}px`,e.style.right="auto")}),window.addEventListener("mouseup",()=>{d=!1}),(l=i.getElementById("lumen-close-btn"))==null||l.addEventListener("click",()=>{e.remove()}),(m=i.getElementById("lumen-min-btn"))==null||m.addEventListener("click",()=>{const s=i.querySelector(".lumen-iframe");s&&(s.style.display==="none"?(s.style.display="block",e.style.height="640px"):(s.style.display="none",e.style.height="48px"))}),document.body.appendChild(e)}let A=null,b=null,x=null;function k(){A&&(clearTimeout(A),A=null),b&&x&&(b.style.outline=x.outline,b.style.boxShadow=x.boxShadow,b.style.backgroundColor=x.backgroundColor,b.style.transition=x.transition),b=null,x=null}chrome.runtime.onMessage.addListener((t,n,e)=>{if(t.action==="EXTRACT_PAGE"){try{e(_())}catch(i){e({unreadableReason:(i==null?void 0:i.message)||"Unable to extract webpage content."})}return!0}if(t.action==="EXTRACT_SELECTION"){try{e(M())}catch(i){e({selectedText:"",contextText:"",wordCount:0,error:(i==null?void 0:i.message)||"Unable to read selected text."})}return!0}if(t.action==="START_REGION_SELECTION"||t.action==="TRIGGER_REGION_CROPPER"){try{N(),e({success:!0,started:!0})}catch(i){e({success:!1,started:!1,error:(i==null?void 0:i.message)||"Unable to start region selection."})}return!0}if(t.action==="TOGGLE_INPAGE_PANEL")return U(),e({success:!0}),!0;if(t.action==="HIGHLIGHT_BLOCK"){k();const{blockId:i,textSnippet:c}=t;let o=null;if(i&&(o=document.querySelector(`[data-lumen-id="${CSS.escape(i)}"]`)),!o&&c){const d=Array.from(document.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li, tr, td, pre, blockquote")),a=String(c).slice(0,50).trim().toLowerCase();o=d.find(h=>(h.textContent||"").toLowerCase().includes(a))||null}return o?(o.scrollIntoView({behavior:"smooth",block:"center"}),x={outline:o.style.outline,boxShadow:o.style.boxShadow,backgroundColor:o.style.backgroundColor,transition:o.style.transition},b=o,o.style.outline="2px solid #E8FF3B",o.style.boxShadow="0 0 20px rgba(232, 255, 59, 0.75)",o.style.backgroundColor="rgba(232, 255, 59, 0.22)",o.style.transition="all 0.3s ease",A=setTimeout(k,3500),e({success:!0,found:!0})):e({success:!1,found:!1,error:"Source section not found on webpage."}),!0}return!1});
