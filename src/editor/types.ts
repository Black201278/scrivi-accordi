// types.ts
export type CustomElement = ChordLine | TextLine | ChordElement;

export interface ChordLine {
  type: 'chord-line';
  children: CustomText[];
}

export interface TextLine {
  type: 'text-line';
  children: CustomText[];
}

export interface ChordElement {
  type: 'chord';
  chord: string;
  children: CustomText[];
}

export interface CustomText {
  text: string;
}
