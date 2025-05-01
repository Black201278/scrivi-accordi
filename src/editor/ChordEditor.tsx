// src/editor/ChordEditor.tsx
import React, { useState, useRef, useEffect } from "react";
import { loadDocx } from "../utils/loadDocx";
import {
  FaUndo,
  FaRedo,
  FaPrint,
  FaSave,
  FaFolderOpen,
  FaLanguage,
  FaMinus,
  FaPlus,
  FaFileWord,
} from "react-icons/fa";

interface PlacedChord {
  chord: string;
  x: number;
  y: number;
  line: number;
  pos: number;
}

interface Snapshot {
  title: string;
  blocks: string[];
  placed: PlacedChord[];
}

// Mappe
const SCALE = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const FLAT_TO_SHARP: Record<string,string> = { Db:"C#", Eb:"D#", Gb:"F#", Ab:"G#", Bb:"A#" };
const chordMap: Record<string,string> = {
  C:"Do","C#":"Do#",Db:"Reb",D:"Re","D#":"Re#",Eb:"Mib",
  E:"Mi",F:"Fa","F#":"Fa#",Gb:"Solb",G:"Sol","G#":"Sol#",
  Ab:"Lab",A:"La","A#":"La#",Bb:"Sib",B:"Si"
};
const invChordMap = Object.entries(chordMap)
  .reduce((o,[i,ita]) => ((o[ita]=i), o), {} as Record<string,string>);
const SUFFIXES = ["","m","7","M7","m7","sus4","dim"];

function splitChord(ch:string):[string,string] {
  for (let suf of SUFFIXES) if (suf && ch.endsWith(suf))
    return [ch.slice(0,-suf.length), suf];
  return [ch, ""];
}

function transposeChord(ch:string, st:number):string {
  const [r,s] = splitChord(ch);
  const intl = invChordMap[r]||r;
  const norm = FLAT_TO_SHARP[intl]||intl;
  const idx = SCALE.indexOf(norm);
  if (idx<0) return ch;
  const ni = (idx+st+12)%12;
  const nr = SCALE[ni], isIt = Object.values(chordMap).includes(r);
  return (isIt ? chordMap[nr]:nr)+s;
}

export default function ChordEditor() {
  const [title,setTitle] = useState("Titolo canzone");
  const [blocks,setBlocks] = useState<string[]>([]);
  const [placed,setPlaced] = useState<PlacedChord[]>([]);
  const [undoStack,setUndoStack] = useState<Snapshot[]>([]);
  const [redoStack,setRedoStack] = useState<Snapshot[]>([]);
  const [movingIndex,setMovingIndex] = useState<number|null>(null);
  const [selectedChord,setSelectedChord] = useState<string|null>(null);

  const [menuType,setMenuType] = useState<"root"|"suffix"|null>(null);
  const [menuX,setMenuX] = useState(0);
  const [menuY,setMenuY] = useState(0);
  const [menuRoot,setMenuRoot] = useState<string|null>(null);
  const clickRef = useRef<{localX:number,localY:number}|null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(
      "chordEditorProject",
      JSON.stringify({ title, blocks, placed })
    );
  }, [title, blocks, placed]);

  const makeSnapshot = ():Snapshot => ({
    title, blocks:[...blocks], placed:placed.map(c=>({ ...c }))
  });
  const record = () => {
    setUndoStack(u=>[...u,makeSnapshot()]);
    setRedoStack([]);
  };
  const handleUndo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length-1];
    setUndoStack(u=>u.slice(0,-1));
    setRedoStack(r=>[...r, makeSnapshot()]);
    setTitle(prev.title);
    setBlocks(prev.blocks);
    setPlaced(prev.placed);
  };
  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length-1];
    setRedoStack(r=>r.slice(0,-1));
    setUndoStack(u=>[...u, makeSnapshot()]);
    setTitle(next.title);
    setBlocks(next.blocks);
    setPlaced(next.placed);
  };

  useEffect(() => {
    const onKey = (e:KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase()==="z") {
        e.preventDefault(); handleUndo();
      }
      if (e.ctrlKey && e.key.toLowerCase()==="y") {
        e.preventDefault(); handleRedo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undoStack,redoStack]);

  const handleFile = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    record();
    const paras = await loadDocx(f);
    const d = paras.flatMap(p=>["",p]);
    d.push("");
    setBlocks(d);
    setPlaced([]);
  };
  const exportPrint = () => {
    if (!containerRef.current) return;
    const w = window.open("","_blank")!;
    w.document.write(`
      <!DOCTYPE html><html><head><meta charset=utf-8>
      <title>${title}</title><link rel="stylesheet" href="/index.css">
      </head><body style="margin:0">${containerRef.current.outerHTML}</body></html>
    `);
    w.document.close(); w.focus(); w.print(); w.close();
  };
  const handleSave = () => {
    const blob = new Blob([JSON.stringify({ title, blocks, placed })],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${title||"progetto"}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const handleLoad = (e:React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result as string);
        record();
        setTitle(d.title||"");
        setBlocks(d.blocks||[]);
        setPlaced(d.placed||[]);
      } catch { alert("Progetto non valido"); }
    };
    rd.readAsText(f);
  };

  const convertAllItalian = () => {
    record();
    setPlaced(ps => ps.map(pc => {
      const [r,s] = splitChord(pc.chord);
      return { ...pc, chord:(chordMap[r]||r)+s };
    }));
  };
  const convertAllInternational = () => {
    record();
    setPlaced(ps => ps.map(pc => {
      const [r,s] = splitChord(pc.chord);
      return { ...pc, chord:(invChordMap[r]||r)+s };
    }));
  };
  const transposeAll = (st:number) => {
    record();
    setPlaced(ps => ps.map(pc => ({
      ...pc, chord: transposeChord(pc.chord, st)
    })));
  };

  const handleContextMenu = (e:React.MouseEvent) => {
    e.preventDefault();
    const ctr = containerRef.current; if (!ctr) return;
    const el = (e.target as HTMLElement).closest("p[data-line]") as HTMLElement|null;
    if (!el) return;
    const idx = parseInt(el.dataset.line!,10);
    if (idx%2===1) return;
    const rect = ctr.getBoundingClientRect();
    const localX = e.clientX - rect.left + ctr.scrollLeft;
    const localY = e.clientY - rect.top + ctr.scrollTop;
    clickRef.current = { localX, localY };
    setMenuType("root"); setMenuRoot(null);
    setMenuX(localX); setMenuY(localY);
  };

  const handleSelectRoot = (r:string,e:React.MouseEvent) => {
    e.stopPropagation(); setMenuRoot(r); setMenuType("suffix");
  };

  const handleSelectSuffix = (s:string,e:React.MouseEvent) => {
    e.stopPropagation();
    if (!menuRoot) { setMenuType(null); return; }
    setSelectedChord(menuRoot + s);
    setMenuType(null);
    document.body.style.cursor = "crosshair";
  };

  const onEditorClick = (e:React.MouseEvent) => {
    const ctr = containerRef.current; if (!ctr) return;
    const rect = ctr.getBoundingClientRect();
    const lx = e.clientX - rect.left + ctr.scrollLeft;

    if (movingIndex !== null) {
      record();
      setPlaced(ps => ps.map((c,i) => {
        if (i===movingIndex) {
          const p = ctr.querySelector(`p[data-line="${c.line}"]`) as HTMLElement|null;
          const lockedY = p ? (p.getBoundingClientRect().top - rect.top + ctr.scrollTop) : c.y;
          return { ...c, x: lx, y: lockedY };
        }
        return c;
      }));
      setMovingIndex(null);
      document.body.style.cursor="text";
      return;
    }

    if (selectedChord) {
      const el = (e.target as HTMLElement).closest("p[data-line]") as HTMLElement|null;
      if (!el) return;
      const idx = parseInt(el.dataset.line!,10);
      if (idx%2===0) {
        record();
        setPlaced(ps=>[
          ...ps,
          { chord:selectedChord, x:lx, y:el.offsetTop, line:idx, pos:0 }
        ]);
        setSelectedChord(null);
        document.body.style.cursor="text";
      }
      return;
    }

    if (menuType) setMenuType(null);
  };

  const handleChordContextMenu = (ch:string)=>(e:React.MouseEvent)=>{
    e.preventDefault(); e.stopPropagation();
    setSelectedChord(ch);
    document.body.style.cursor="crosshair";
  };
  const onChordClick = (i:number)=>(e:React.MouseEvent)=>{
    e.stopPropagation();
    setMovingIndex(i);
    setSelectedChord(null);
    document.body.style.cursor="move";
  };
  const onChordDoubleClick = (i:number)=>(e:React.MouseEvent)=>{
    e.stopPropagation();
    record();
    setPlaced(ps=>ps.filter((_,j)=>j!==i));
  };

  const onEdit = (i:number,e:React.FormEvent<HTMLParagraphElement>)=>{
    record();
    const txt = e.currentTarget.textContent||"";
    setBlocks(bs=>bs.map((b,j)=>j===i?txt:b));
  };

  return (
    <div style={{ display:"flex", height:"100vh", background:"#1e1e1e", color:"#ddd" }}>
      <aside style={{ width:240, padding:16, background:"#2b2b2b" }}>
        <div style={{ marginBottom:16 }}>
          <label style={{ color:"#ccc", display:"block", marginBottom:4 }}>Titolo:</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titolo canzone"
            style={{
              width:"100%", padding:"6px", borderRadius:4,
              border:"1px solid #555", background:"#333", color:"#eee"
            }}
          />
        </div>
        <button onClick={handleUndo} disabled={!undoStack.length} style={btnStyle}><FaUndo /> Undo</button>
        <button onClick={handleRedo} disabled={!redoStack.length} style={btnStyle}><FaRedo /> Redo</button>
        <div style={{ margin:"16px 0" }} />
        <button onClick={()=>document.getElementById("file-input")!.click()} style={btnStyle}>
          <FaFileWord /> Importa DOCX
        </button>
        <input id="file-input" type="file" accept=".docx" onChange={handleFile} style={{ display:"none" }} />
        <button onClick={exportPrint} style={btnStyle}><FaPrint /> Stampa</button>
        <button onClick={handleSave} style={btnStyle}><FaSave /> Salva</button>
        <button onClick={()=>document.getElementById("load-input")!.click()} style={btnStyle}>
          <FaFolderOpen /> Carica
        </button>
        <input id="load-input" type="file" accept=".json" onChange={handleLoad} style={{ display:"none" }} />
        <button onClick={convertAllItalian} style={btnStyle}><FaLanguage /> → IT</button>
        <button onClick={convertAllInternational} style={btnStyle}><FaLanguage /> → INT</button>
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <button onClick={()=>transposeAll(-1)} style={btnStyleFlex}><FaMinus /> -1</button>
          <button onClick={()=>transposeAll(1)} style={btnStyleFlex}><FaPlus /> +1</button>
        </div>
        <div style={{ marginTop: 32, fontSize: "0.8em", color: "#888", textAlign: "center" }}>
          <p style={{ marginBottom: 4 }}>WebApp creata da un Cantore per i Cantori</p>
          <p>© 2025 Fabio Bova</p>
        </div>
      </aside>

      <div
        ref={containerRef}
        onClick={onEditorClick}
        onContextMenuCapture={handleContextMenu}
        style={{
          position:"relative", flex:1, padding:16,
          overflow:"auto", background:"#1e1e1e",
          backgroundImage:"linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize:"100% 30px",
          cursor: movingIndex!==null ? "move" : "text"
        }}
      >
        <h2 style={{ color:"#fff" }}>{title}</h2>
        {blocks.map((line,idx)=>(
          <p key={idx} data-line={idx} contentEditable={idx%2===1} suppressContentEditableWarning
            onBlur={e=>onEdit(idx,e)}
            style={{
              margin:0, padding:"4px 0", minHeight:24,
              outline: idx%2===1 ? "1px dashed #777" : "none",
              color: idx%2===1 ? "#ddd" : "#bbb"
            }}
          >
            {line}
          </p>
        ))}
        {placed.map((c,i)=>(
          <div
            key={i}
            onClick={onChordClick(i)}
            onDoubleClick={onChordDoubleClick(i)}
            onContextMenu={handleChordContextMenu(c.chord)}
            style={{
              position:"absolute", left:c.x, top:c.y,
              background:"#555", color:"#fff", padding:"2px 6px",
              border:"1px solid #777", borderRadius:4,
              cursor: movingIndex===i ? "move" : "pointer", userSelect:"none"
            }}
          >
            {c.chord}
          </div>
        ))}
        {menuType==="root" && (
          <div style={{
            position:"absolute", left:menuX, top:menuY,
            background:"#2b2b2b", border:"1px solid #555", borderRadius:4,
            boxShadow:"2px 2px 8px rgba(0,0,0,0.5)", zIndex:1000
          }}>
            {SCALE.map(r=>(
              <button key={r} onClick={e=>handleSelectRoot(r,e)}
                style={{
                  display:"block", width:"100%", padding:"6px 12px",
                  textAlign:"left", background:"transparent", color:"#eee",
                  border:"none", cursor:"pointer"
                }}
              >{r} ({chordMap[r]})</button>
            ))}
          </div>
        )}
        {menuType==="suffix" && menuRoot && (
          <div style={{
            position:"absolute", left:menuX, top:menuY,
            background:"#2b2b2b", border:"1px solid #555", borderRadius:4,
            boxShadow:"2px 2px 8px rgba(0,0,0,0.5)", zIndex:1000
          }}>
            {SUFFIXES.map(s=>(
              <button key={s} onClick={e=>handleSelectSuffix(s,e)}
                style={{
                  display:"block", width:"100%", padding:"6px 12px",
                  textAlign:"left", background:"transparent", color:"#eee",
                  border:"none", cursor:"pointer"
                }}
              >{s===""?"M":s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  display:"flex", alignItems:"center", gap:8,
  width:"100%", marginBottom:8, background:"#444",
  color:"#eee", border:"none", padding:"8px",
  borderRadius:4, cursor:"pointer"
};

const btnStyleFlex: React.CSSProperties = {
  ...btnStyle, justifyContent:"center", flex:1
};
