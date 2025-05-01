--- src/components/ChordDiagram.tsx
+++ src/components/ChordDiagram.tsx
@@
-import React from "react";
-import { ChordGrid } from "@tombatossals/react-chords";
-import { guitar as chordsDB } from "@tombatossals/chords-db";
+import React from "react";
+import { ChordGrid } from "@tombatossals/react-chords";
+// import diretto del JSON dal pacchetto (lib/guitar.json)
+import chordsDB from "@tombatossals/chords-db/lib/guitar.json";

 interface ChordDiagramProps {
   chord: string;
   instrument?: "guitar" | "ukulele";
 }

 export default function ChordDiagram({
   chord,
   instrument = "guitar",
 }: ChordDiagramProps) {
   // il JSON ha la forma { C: [ { key: 'C', suffix: '', positions: [...] }, ... ], D: […] }
-  const data = chordsDB[chord];
+  const data = (chordsDB as any)[chord];
   if (!data) return <div>Diagramma non trovato per {chord}</div>;

   return (
     <div style={{ display: "inline-block", margin: 8 }}>
       {data.map((pos: any, i: number) => (
         <ChordGrid
           key={i}
           chord={chord}
           positions={[pos]}
           instrument={instrument}
+          // riduci un po’ la dimensione se vuoi
+          width={60}
+          height={80}
         />
       ))}
     </div>
   );
 }
