import { Compartment } from './compartment';
import { CapcoState } from './types';
import { EditorState } from 'prosemirror-state';
export function getValueWithoutSlash(markerInputvalue: string): string {
  if (markerInputvalue.endsWith('/')) {
    markerInputvalue = markerInputvalue.substring(
      0,
      markerInputvalue.length - 1
    );
    if (markerInputvalue.endsWith('/')) {
      markerInputvalue = markerInputvalue.substring(
        0,
        markerInputvalue.length - 1
      );
    }
  } else if (markerInputvalue.trim().endsWith(',')) {
    markerInputvalue = markerInputvalue.substring(
      0,
      markerInputvalue.length - 1
    );
    if (markerInputvalue.endsWith(',')) {
      markerInputvalue = markerInputvalue.substring(
        0,
        markerInputvalue.length - 1
      );
    }
  }
  return markerInputvalue;
}

export type onCompartmentAdd = (_item: Compartment) => HTMLElement;

export function getCursorPosition(e: Event): number | undefined {
  let position: number;
  if (e.target instanceof HTMLInputElement) {
    position = e.target.selectionStart;

    if (e instanceof KeyboardEvent) {
      if ('ArrowRight' === e.code) {
        if (0 <= position) {
          position++;
        }
      }
    }
  }
  return position;
}

export function safeCapcoParse(
  capco: unknown,
  fallback: CapcoState = { ism: undefined, portionMarking: 'error' }
): CapcoState {
  if (typeof capco === 'string') {
    try {
      return JSON.parse(capco) as CapcoState;
    } catch (e) {
      console.warn('could not parse capco text: ' + capco, e);
    }
  }

  if (capco && typeof capco === 'object') {
    return capco as CapcoState;
  }

  return fallback;
}

export function getCapcoString(capco: unknown, fallback = 'error'): string {
  return safeCapcoParse(capco, { ism: null, portionMarking: fallback })
    .portionMarking;
}

export function getBlockControlCapco(state: EditorState, pos: number): number {
  const posBefore = state.doc.resolve(pos).before(1);
  if (undefined !== posBefore) {
    if (state.doc.nodeAt(posBefore)?.attrs?.figureType === 'figure') {
      pos = posBefore + 3;
      if (null === state.doc.nodeAt(pos)) {
        pos--;
      }
    } else {
      pos = posBefore + 2;
    }
  }
  return pos;
}
