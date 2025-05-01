import React from 'react';
import ChordChip from './ChordChip';

interface Props {
  selectedChord: string | null;
  onSelectChord: (chord: string | null) => void;
}

const chords = ['C', 'G', 'Am', 'F', 'Dm', 'Em'];

export default function Sidebar({ selectedChord, onSelectChord }: Props) {
  return (
    <div>
      <h3>Accordi</h3>
      {chords.map(c => (
        <ChordChip
          key={c}
          chord={c}
          isSelected={c === selectedChord}
          onClick={() => onSelectChord(c)}
        />
      ))}
      {selectedChord && (
        <button
          style={{ marginTop: 12 }}
          onClick={() => onSelectChord(null)}
        >
          ✖ Deseleziona
        </button>
      )}
    </div>
  );
}
