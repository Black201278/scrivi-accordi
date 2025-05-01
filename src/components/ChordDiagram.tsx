import React from "react";
import { guitar as chordsDB } from "@tombatossals/chords-db";
import Chord from "@tombatossals/react-chords";

interface Props {
  chordName: string;       // es. "C", "Cm7", "Csus4", ...
  width?: number;          // larghezza SVG desiderata
  height?: number;         // altezza SVG desiderata
}

export default function ChordDiagram({
  chordName,
  width = 180,
  height = 200,
}: Props) {
  // Prendo il primo voicing disponibile dal DB
  const entries = (chordsDB as any)[chordName];
  if (!entries || entries.length === 0) {
    return <div style={{ padding: 16 }}>Diagramma non disponibile</div>;
  }
  const chordData = entries[0];

  // render SSR‐safe di un SVG (il componente internamente è un <svg> completo)
  return (
    <Chord
      chord={chordData}
      lite={false}
      width={width}
      height={height}
    />
  );
}
