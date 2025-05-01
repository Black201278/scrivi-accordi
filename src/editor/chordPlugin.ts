import { Transforms } from 'slate';
import { CustomEditor } from './types';

export const withChords = (editor: CustomEditor) => {
  const { isVoid } = editor;
  editor.isVoid = element => element.type === 'chord' || isVoid(element);
  return editor;
};

export function insertChord(
  editor: CustomEditor,
  chord: string,
  at: number[],
  left: number,
  top: number
) {
  const chordNode = {
    type: 'chord',
    chord,
    left,
    top,
    children: [{ text: '' }]
  };
  Transforms.insertNodes(editor, chordNode, { at });
}
