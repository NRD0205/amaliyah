import { useState, useRef, useEffect } from "react";

const SYS = `Kamu adalah Ustadz AI, asisten islami berpengetahuan luas. Jawab pertanyaan tentang Al-Quran, Hadits Shahih, Fiqih, Doa, Dzikir, Sejarah Islam, dan Akhlak dengan bahasa Indonesia yang ramah dan mudah dipahami. Sertakan teks Arab, latin, dan terjemahan jika relevan menggunakan format:
[ARAB]teks arab[/ARAB]
[LATIN]transliterasi[/LATIN]
[TRANS]terjemahan[/TRANS]
Gunakan **teks** untuk bold. Jawab sesuai Ahlus Sunnah wal Jamaah.`;

const CHIPS = [
  ["🌙 Ramadan", "Apa keutamaan bulan Ramadan?"],
  ["✨ Tahajud", "Bagaimana tata cara sholat tahajud?"],
  ["🌅 Doa Pagi", "Sebutkan doa pagi hari beserta artinya"],
  ["💝 Sedekah", "Apa keutamaan sedekah dalam Islam?"],
  ["🕌 Rukun Islam", "Jelaskan rukun Islam dan rukun iman"],
  ["📿 Dzikir", "Apa saja dzikir setelah sholat?"],
  ["📚 Sirah Nabi", "Ceritakan kisah Nabi Muhammad SAW"],
  ["🤲 Taubat", "Bagaimana cara bertaubat yang benar?"],
];

function now() {
  const n = new Date();
  return String(n.getHours()).padStart(2,"0") + ":" + String(n.getMinutes()).padStart(2,"0");
}

function ParsedMsg({ text }) {
  const parts = [];
  const regex = /\[ARAB\]([\s\S]*?)\[\/ARAB\]|\[LATIN\]([\s\S]*?)\[\/LATIN\]|\[TRANS\]([\s\S]*?)\[\/TRANS\]|\*\*(.*?)\*\*/g;
  let lastIdx = 0, match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx)
      parts.push(<span key={lastIdx} dangerouslySetInnerHTML={{__html: text.slice(lastIdx, match.index).replace(/\n/g,"<br/>")}}/>);
    if (match[1] !== undefined)
      parts.push(<span key={match.index} style={{fontFamily:"serif",fontSize:"1.05rem",textAlign:"right",direction:"rtl",display:"block",margin:"7px 0 4px",padding:"8px 10px",background:"rgba(16,185,129,.08)",borderRadius:"9px",lineHeight:2,color:"#065f46"}}>{match[1]}</span>);
    else if (match[2] !== undefined)
      parts.push(<em key={match.index} style={{color:"#6b7280",fontSize:".73rem",display:"block",marginBottom:"3px"}}>{match[2]}</em>);
    else if (match[3] !== undefined)
      parts.push(<span key={match.index} style={{fontSize:".75rem",color:"#374151",display:"block"}}>{match[3]}</span>);
    else if (match[4] !== undefined)
      parts.push(<strong key={match.index}>{match[4]}</strong>);
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length)
    parts.push(<span key={lastIdx} dangerouslySetInnerHTML={{__html: text.slice(lastIdx).replace(/\n/g,"<br/>")}}/>);
  return <>{parts}</>;
}

export default function UstadzAI() {
  const [msgs, setMsgs] = useState([{role:"welcome"}]);
  const [hist, setHist] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const msgsRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [msgs]);

  async function send(text) {
    const q = (text || input).trim();
    if (!q || busy) return;
    setInput("");
    if (taRef.current) taRef.current.style.height = "auto";
    const newHist = [...hist, {role:"user", content:q}];
    setHist(newHist);
    setMsgs(p => [...p, {role:"user", text:q, time:now()}, {role:"typing"}]);
    setBusy(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({model:"claude-sonnet-4-20250514", max_tokens:1000, system:SYS, messages:newHist}),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const rep = (data.content||[]).map(b=>b.text||"").join("") || "Maaf, tidak ada respons.";
      setHist(p => [...p, {role:"assistant", content:rep}]);
      setMsgs(p => p.filter(m=>m.role!=="typing").concat({role:"ai", text:rep, time:now()}));
    } catch(e) {
      setHist(newHist.slice(0,-1));
      setMsgs(p => p.filter(m=>m.role!=="typing").concat({role:"ai", text:"⚠️ Gagal terhubung. Coba lagi. 🙏", time:now(), err:true}));
    }
    setBusy(false);
  }

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",maxWidth:"480px",margin:"0 auto",background:"#f0fdf4",fontFamily:"system-ui,sans-serif",overflow:"hidden"}}>

      {/* Header */}
      <div style={{background:"#0f1f17",padding:"13px 16px",display:"flex",alignItems:"center",gap:"11px",flexShrink:0,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-20px",right:"-20px",width:"100px",height:"100px",background:"radial-gradient(circle,rgba(16,185,129,.2) 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}}/>
        <div style={{width:"42px",height:"42px",borderRadius:"13px",background:"linear-gradient(135deg,#10b981,#065f46)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.2rem",flexShrink:0,boxShadow:"0 3px 10px rgba(16,185,129,.4)"}}>🕌</div>
        <div style={{flex:1}}>
          <div style={{fontSize:".95rem",fontWeight:900,color:"#fff"}}>Ustadz AI</div>
          <div style={{fontSize:".62rem",color:"#34d399",fontWeight:700,display:"flex",alignItems:"center",gap:"5px"}}>
            <span style={{width:"6px",height:"6px",borderRadius:"50%",background:"#34d399",boxShadow:"0 0 6px #34d399",display:"inline-block",animation:"pulse 2s infinite"}}/>
            Online — siap membantu
          </div>
        </div>
        <button onClick={()=>{setHist([]);setMsgs([{role:"welcome"}]);}}
          style={{background:"rgba(255,255,255,.1)",border:"none",borderRadius:"8px",color:"rgba(255,255,255,.7)",padding:"6px 11px",fontSize:".68rem",fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"background .2s"}}>
          🔄 Reset
        </button>
      </div>

      {/* Chips */}
      <div style={{display:"flex",gap:"6px",padding:"8px 12px",overflowX:"auto",background:"#fff",borderBottom:"1px solid #e5e7eb",flexShrink:0}}>
        {CHIPS.map(([label,q]) => (
          <button key={label} onClick={()=>send(q)} disabled={busy}
            style={{padding:"5px 12px",borderRadius:"20px",background:"#f0fdf4",border:"1.5px solid #e5e7eb",fontSize:".65rem",fontWeight:700,color:"#065f46",cursor:busy?"not-allowed":"pointer",whiteSpace:"nowrap",fontFamily:"inherit",flexShrink:0,opacity:busy?.5:1,transition:"all .15s"}}>
            {label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={msgsRef} style={{flex:1,overflowY:"auto",padding:"14px",display:"flex",flexDirection:"column",gap:"10px"}}>
        {msgs.map((m,i) => {
          if (m.role==="welcome") return (
            <div key={i} style={{display:"flex",gap:"8px",alignItems:"flex-end",maxWidth:"90%"}}>
              <div style={{width:"28px",height:"28px",borderRadius:"9px",background:"linear-gradient(135deg,#10b981,#065f46)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".8rem",flexShrink:0}}>🕌</div>
              <div style={{background:"linear-gradient(135deg,#0f2218,#0f1f17)",border:"1px solid rgba(16,185,129,.25)",borderRadius:"16px 16px 16px 4px",padding:"13px 15px"}}>
                <div style={{fontSize:".85rem",fontWeight:900,color:"#34d399",marginBottom:"6px"}}>Assalamu'alaikum Warahmatullahi Wabarakatuh 🌿</div>
                <div style={{fontSize:".76rem",color:"rgba(255,255,255,.8)",lineHeight:1.65}}>Saya <strong style={{color:"#fff"}}>Ustadz AI</strong>, asisten islami siap membantu.<br/>Pilih topik atau ketik pertanyaanmu:</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"5px",marginTop:"9px"}}>
                  {["📖 Al-Qur'an","📜 Hadits","🕌 Fiqih","🤲 Doa & Dzikir","📚 Sejarah","✨ Amalan"].map(t=>(
                    <span key={t} style={{fontSize:".63rem",background:"rgba(16,185,129,.15)",color:"#34d399",padding:"3px 9px",borderRadius:"20px",fontWeight:700}}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          );

          if (m.role==="typing") return (
            <div key={i} style={{display:"flex",gap:"8px",alignItems:"flex-end"}}>
              <div style={{width:"28px",height:"28px",borderRadius:"9px",background:"linear-gradient(135deg,#10b981,#065f46)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".8rem",flexShrink:0}}>🕌</div>
              <div style={{background:"#fff",borderRadius:"16px 16px 16px 4px",padding:"12px 16px",boxShadow:"0 1px 6px rgba(0,0,0,.07)",display:"flex",gap:"5px",alignItems:"center"}}>
                {[0,1,2].map(j=>(
                  <div key={j} style={{width:"7px",height:"7px",borderRadius:"50%",background:"#10b981",animation:`blink .9s ${j*.2}s infinite`}}/>
                ))}
              </div>
            </div>
          );

          if (m.role==="user") return (
            <div key={i} style={{display:"flex",justifyContent:"flex-end",alignSelf:"flex-end",maxWidth:"85%"}}>
              <div style={{background:"linear-gradient(135deg,#10b981,#065f46)",borderRadius:"16px 16px 4px 16px",padding:"10px 14px",fontSize:".8rem",color:"#fff",lineHeight:1.65,boxShadow:"0 2px 10px rgba(16,185,129,.35)",wordBreak:"break-word"}}>
                <span dangerouslySetInnerHTML={{__html:m.text.replace(/\n/g,"<br/>")}}/>
                <div style={{fontSize:".6rem",color:"rgba(255,255,255,.55)",marginTop:"5px",textAlign:"right"}}>{m.time}</div>
              </div>
            </div>
          );

          if (m.role==="ai") return (
            <div key={i} style={{display:"flex",gap:"8px",alignItems:"flex-end",maxWidth:"90%"}}>
              <div style={{width:"28px",height:"28px",borderRadius:"9px",background:"linear-gradient(135deg,#10b981,#065f46)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:".8rem",flexShrink:0,marginBottom:"2px"}}>🕌</div>
              <div style={{background:"#fff",borderRadius:"16px 16px 16px 4px",padding:"11px 14px",boxShadow:"0 1px 6px rgba(0,0,0,.07)",fontSize:".8rem",color:"#1f2937",lineHeight:1.7,wordBreak:"break-word",borderLeft:m.err?"3px solid #ef4444":undefined,maxWidth:"100%"}}>
                <ParsedMsg text={m.text}/>
                <div style={{fontSize:".6rem",color:"#9ca3af",marginTop:"6px",textAlign:"right"}}>{m.time}</div>
              </div>
            </div>
          );
          return null;
        })}
      </div>

      {/* Input */}
      <div style={{flexShrink:0,background:"#fff",borderTop:"1px solid #e5e7eb",padding:"10px 12px",display:"flex",gap:"8px",alignItems:"flex-end"}}>
        <textarea ref={taRef} value={input}
          onChange={e=>{setInput(e.target.value);e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,100)+"px";}}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
          placeholder="Tanyakan seputar Islam..."
          disabled={busy}
          rows={1}
          style={{flex:1,border:"1.5px solid #e5e7eb",borderRadius:"13px",padding:"9px 12px",fontFamily:"inherit",fontSize:".82rem",color:"#1f2937",background:busy?"#f9f9f9":"#f0fdf4",resize:"none",minHeight:"40px",maxHeight:"100px",lineHeight:1.5,outline:"none",transition:"border-color .2s"}}
        />
        <button onClick={()=>send()} disabled={busy||!input.trim()}
          style={{width:"40px",height:"40px",borderRadius:"12px",background:(busy||!input.trim())?"#e5e7eb":"linear-gradient(135deg,#10b981,#065f46)",border:"none",color:"#fff",fontSize:".95rem",cursor:(busy||!input.trim())?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:(busy||!input.trim())?"none":"0 3px 9px rgba(16,185,129,.4)",transition:"all .2s"}}>
          ➤
        </button>
      </div>

      <style>{`
        @keyframes blink{0%,100%{opacity:.3;transform:translateY(0)}50%{opacity:1;transform:translateY(-4px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{display:none}
        button:hover{filter:brightness(1.05)}
      `}</style>
    </div>
  );
}
