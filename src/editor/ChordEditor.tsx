import React, { useState, useRef, useEffect } from "react";
import { loadDocx } from "../utils/loadDocx";
import html2canvas from "html2canvas";
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
  FaBars,
} from "react-icons/fa";
import "./ChordEditor.css";

interface PlacedChord {
  chord: string;
  x: number;
  y: number;
  line: number;
  pos: number;
}
interface Snapshot {
  blocks: string[];
  placed: PlacedChord[];
}

// —– Mappe e utilità —–
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
function splitChord(ch: string): [string,string] {
  for (let suf of SUFFIXES) if (suf && ch.endsWith(suf))
    return [ch.slice(0,-suf.length), suf];
  return [ch, ""];
}
function transposeChord(ch: string, st: number): string {
  const [r,s] = splitChord(ch);
  const intl = invChordMap[r]||r;
  const norm = FLAT_TO_SHARP[intl]||intl;
  const idx = SCALE.indexOf(norm);
  if (idx<0) return ch;
  const ni = (idx+st+12)%12;
  const nr = SCALE[ni], isIt = Object.values(chordMap).includes(r);
  return (isIt ? chordMap[nr] : nr) + s;
}

export default function ChordEditor() {
  // Stati
  const [blocks,setBlocks] = useState<string[]>([]);
  const [placed,setPlaced] = useState<PlacedChord[]>([]);
  const [undoStack,setUndoStack] = useState<Snapshot[]>([]);
  const [redoStack,setRedoStack] = useState<Snapshot[]>([]);
  const [movingIndex,setMovingIndex] = useState<number|null>(null);
  const [selectedChord,setSelectedChord] = useState<string|null>(null);
  useEffect(() => {
    if (blocks.length > 0 || placed.length > 0) {
      setShowWelcome(false);
    }
  }, []);
  
  const [showWelcome, setShowWelcome] = useState(true);

  // context‐menu
  const [menuType,setMenuType] = useState<"root"|"suffix"|null>(null);
  const [menuX,setMenuX] = useState(0);
  const [menuY,setMenuY] = useState(0);
  const [menuRoot,setMenuRoot] = useState<string|null>(null);
  const clickRef = useRef<{localX:number,localY:number}|null>(null);

  // mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Undo/Redo
  const makeSnapshot = (): Snapshot => ({
    blocks: [...blocks],
    placed: placed.map(c => ({ ...c })),
  });
  const record = () => { setUndoStack(u=>[...u,makeSnapshot()]); setRedoStack([]); };
  const handleUndo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length-1];
    setUndoStack(u=>u.slice(0,-1));
    setRedoStack(r=>[...r, makeSnapshot()]);
    setBlocks(prev.blocks);
    setPlaced(prev.placed);
  };
  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length-1];
    setRedoStack(r=>r.slice(0,-1));
    setUndoStack(u=>[...u, makeSnapshot()]);
    setBlocks(next.blocks);
    setPlaced(next.placed);
  };

  // Shortcut tastiera
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase()==="z") {
        e.preventDefault(); handleUndo();
      }
      if (e.ctrlKey && e.key.toLowerCase()==="y") {
        e.preventDefault(); handleRedo();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [undoStack, redoStack]);

  // File / Stampa / Salva / Carica
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    record();
    const paras = await loadDocx(f);
    const d = paras.flatMap(p => ["", p]);
    d.push("");
    setBlocks(d);
    setPlaced([]);
  };
  const exportPrint = async () => {
    const ctr = containerRef.current;
    if (!ctr) return;
  
    // Clona l'intero contenuto
    const clone = ctr.cloneNode(true) as HTMLElement;
  
    // Applica stile temporaneo nero su bianco
    clone.style.position = "absolute";
    clone.style.left = "-9999px";
    clone.style.top = "0";
    clone.style.backgroundColor = "#ffffff";
    clone.style.color = "#000000";
    clone.style.height = "auto";
    clone.style.overflow = "visible";
  
    // Forza ogni elemento interno a colore nero
    clone.querySelectorAll("*").forEach(el => {
      (el as HTMLElement).style.color = "#000000";
      (el as HTMLElement).style.backgroundColor = "#ffffff";
    });
  
    document.body.appendChild(clone);
  
    // Aspetta che venga aggiunto al DOM
    await new Promise(requestAnimationFrame);
  
    // Cattura l’immagine del clone
    const canvas = await html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      width: clone.scrollWidth,
      height: clone.scrollHeight,
    });
  
    // Rimuovi il clone invisibile
    document.body.removeChild(clone);
  
    const imgData = canvas.toDataURL("image/png");
  
    // Apri e stampa immagine
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Stampa</title></head>
        <body style="margin:0; text-align:center; background:#fff;">
          <img src="${imgData}" style="max-width:100%;"/>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    w.document.close();
  };
  
  
  const handleSave = () => {
    const blob = new Blob([JSON.stringify({ blocks, placed })],{type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `progetto".json`; a.click();
    URL.revokeObjectURL(url);
  };
  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const d = JSON.parse(rd.result as string);
        record();
        setBlocks(d.blocks||[]);
        setPlaced(d.placed||[]);
      } catch {
        alert("Progetto non valido");
      }
    };
    rd.readAsText(f);
  };

  // Converti / Transpose
  const convertAllItalian = () => {
    record();
    setPlaced(ps => ps.map(pc => {
      const [r,s] = splitChord(pc.chord);
      return { ...pc, chord: (chordMap[r]||r) + s };
    }));
  };
  const convertAllInternational = () => {
    record();
    setPlaced(ps => ps.map(pc => {
      const [r,s] = splitChord(pc.chord);
      return { ...pc, chord: (invChordMap[r]||r) + s };
    }));
  };
  const transposeAll = (st: number) => {
    record();
    setPlaced(ps => ps.map(pc => ({
      ...pc, chord: transposeChord(pc.chord, st)
    })));
  };

  // Context‐menu inserimento
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const ctr = containerRef.current; if (!ctr) return;
    const el = (e.target as HTMLElement).closest("p[data-line]") as HTMLElement| null;
    if (!el) return;
    const idx = parseInt(el.dataset.line!, 10);
    if (idx % 2 === 1) return; // solo righe vuote
    const rect = ctr.getBoundingClientRect();
    clickRef.current = {
      localX: e.clientX - rect.left + ctr.scrollLeft,
      localY: e.clientY - rect.top  + ctr.scrollTop
    };
    setMenuType("root");
    setMenuRoot(null);
    setMenuX(clickRef.current.localX);
    setMenuY(clickRef.current.localY);
  };
  const handleSelectRoot = (r: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuRoot(r);
    setMenuType("suffix");
  };
  const handleSelectSuffix = (s: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!menuRoot) {
      setMenuType(null);
      return;
    }
    setSelectedChord(menuRoot + s);
    setMenuType(null);
    document.body.style.cursor = "crosshair";
  };

  // Click editor: piazza / sposta
  const onEditorClick = (e: React.MouseEvent) => {
    const ctr = containerRef.current; if (!ctr) return;
    const rect = ctr.getBoundingClientRect();
    const lx = e.clientX - rect.left + ctr.scrollLeft;

    // sposta
    if (movingIndex !== null) {
      record();
      setPlaced(ps => ps.map((c,i) => {
        if (i === movingIndex) {
          const p = ctr.querySelector(`p[data-line="${c.line}"]`) as HTMLElement| null;
          const lockedY = p
            ? (p.getBoundingClientRect().top - rect.top + ctr.scrollTop)
            : c.y;
          return { ...c, x: lx, y: lockedY };
        }
        return c;
      }));
      setMovingIndex(null);
      document.body.style.cursor = "text";
      return;
    }

    // piazza nuovo
    if (selectedChord) {
      const el = (e.target as HTMLElement).closest("p[data-line]") as HTMLElement| null;
      if (!el) return;
      const idx = parseInt(el.dataset.line!, 10);
      if (idx % 2 === 0) {
        record();
        setPlaced(ps => [
          ...ps,
          { chord: selectedChord, x: lx, y: el.offsetTop, line: idx, pos: 0 }
        ]);
        setSelectedChord(null);
        document.body.style.cursor = "text";
      }
      return;
    }

    // chiudi menu
    if (menuType) setMenuType(null);
  };

  // Copy / delete
  const handleChordContextMenu =
    (ch: string) =>
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedChord(ch);
      document.body.style.cursor = "crosshair";
    };
  const onChordDoubleClick = (i: number) =>
    (e: React.MouseEvent) => {
      e.stopPropagation();
      record();
      setPlaced(ps => ps.filter((_,j) => j !== i));
  };

  // Edit inline testo
  const onEdit = (i: number, e: React.FormEvent<HTMLParagraphElement>) => {
    record();
    const txt = e.currentTarget.textContent || "";
    setBlocks(bs => bs.map((b,j) => j===i ? txt : b));
  };

  // Sidebar come componente
  function SidebarContent() {
    return (
      <>
        {/* Undo/Redo */}
        <button onClick={handleUndo} disabled={!undoStack.length} style={btnStyle}>
          <FaUndo /> Undo
        </button>
        <button onClick={handleRedo} disabled={!redoStack.length} style={btnStyle}>
          <FaRedo /> Redo
        </button>
        <div style={{ margin:"16px 0" }} />
        {/* Importa/Stampa/Salva/Carica */}
        <label style={btnStyle as React.CSSProperties} className="force-button-label">
          <FaFileWord /> Importa DOCX
          <input
            type="file"
            onChange={handleFile}
            style={{ display: "none" }}
          />
        </label>


        <input id="file-input" type="file" onChange={handleFile} style={{ display:"none" }}/>
        <button onClick={exportPrint} style={btnStyle}><FaPrint /> Stampa</button>
        <button onClick={handleSave} style={btnStyle}><FaSave  /> Salva</button>
        <label style={btnStyle as React.CSSProperties} className="force-button-label">
          <FaFolderOpen /> Carica
          <input
            type="file"
            accept=".json"
            onChange={handleLoad}
            style={{ display: "none" }}
          />
        </label>

        <input id="load-input" type="file" accept=".json" onChange={handleLoad} style={{ display:"none" }}/>
        {/* Converti / Transpose */}
        <button onClick={convertAllItalian} style={btnStyle}>
          <FaLanguage /> → IT
        </button>
        <button onClick={convertAllInternational} style={btnStyle}>
          <FaLanguage /> → INT
        </button>
        <div style={{ display:"flex", gap:8, marginTop:8 }}>
          <button onClick={()=>transposeAll(-1)} style={btnStyleFlex}>
            <FaMinus /> -1
          </button>
          <button onClick={()=>transposeAll(1)} style={btnStyleFlex}>
            <FaPlus  /> +1
          </button>
        </div>
        {/* Crediti */}
        <div style={{ marginTop:32, fontSize:"0.8em", color:"#888", textAlign:"center" }}>
          <p style={{ marginBottom:4 }}>WebApp creata da un Cantore per i Cantori</p>
          <p>© 2025 Fabio Bova</p>
        </div>
      </>
    );
  }

  return (
    <>
    {showWelcome && (
      <div className="welcome-overlay" onClick={() => setShowWelcome(false)}>
        <div className="welcome-box">
          <h2>Benvenuto!</h2>
          <p>Inizia importando un file DOCX oppure scrivi direttamente il testo e inserisci gli accordi.</p>
          <p>Tocca o clicca per iniziare.</p>
        </div>
      </div>
    )}
    <div className="chord-editor-container">
      {/* Sidebar desktop */}
      <aside className="desktop-sidebar">
        <SidebarContent />
      </aside>

      {/* Bottone mobile */}
      <button
        className="mobile-menu-button"
        onClick={() => setMobileMenuOpen(o => !o)}
      >
        <FaBars size={24} />
      </button>

      {/* Overlay mobile */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <SidebarContent />
        </div>
      )}

      {/* Editor vero e proprio */}
      <div
        className="editor-content"
        ref={containerRef}
        onClick={onEditorClick}
        onContextMenuCapture={handleContextMenu}
      >
        {blocks.map((line,idx) => (
          <p
            key={idx}
            data-line={idx}
            contentEditable={idx%2===1}
            suppressContentEditableWarning
            onBlur={e=>onEdit(idx,e)}
            className={idx%2===1 ? "text-line" : "chord-line"}
          >
            {line}
          </p>
        ))}

        {placed.map((c, i) => {
          let lastTap = 0;
          const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

          const handleTouchStart = (e: React.TouchEvent) => {
            const now = Date.now();
            if (now - lastTap < 300) {
              // Doppio tap
              e.stopPropagation();
              record();
              setPlaced(ps => ps.filter((_, j) => j !== i));
            }
            lastTap = now;
          };

          return (
            <div
              key={i}
              className="placed-chord"
              style={{ left: c.x, top: c.y }}
              onClick={e => {
                e.stopPropagation();
                record();
                setMovingIndex(i);
              }}
              onDoubleClick={onChordDoubleClick(i)}
              onTouchStart={isTouchDevice ? handleTouchStart : undefined}
              onContextMenu={handleChordContextMenu(c.chord)}
            >
              {c.chord}
            </div>
          );
        })}


        {menuType==="root" && (
          <div className="context-menu" style={{ left:menuX, top:menuY }}>
            {SCALE.map(r => (
              <button key={r} onClick={e=>handleSelectRoot(r,e)}>
                {r} ({chordMap[r]})
              </button>
            ))}
          </div>
        )}
        {menuType==="suffix" && menuRoot && (
          <div className="context-menu" style={{ left:menuX, top:menuY }}>
            {SUFFIXES.map(s => (
              <button key={s} onClick={e=>handleSelectSuffix(s,e)}>
                {s||"M"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

// stili pulsanti
const btnStyle: React.CSSProperties = {
  display:"flex", alignItems:"center", gap:8,
  width:"100%", marginBottom:8, background:"#444",
  color:"#eee", border:"none", padding:"8px",
  borderRadius:4, cursor:"pointer"
};
const btnStyleFlex: React.CSSProperties = {
  ...btnStyle, justifyContent:"center", flex:1
};
