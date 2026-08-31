/**
 * @license MIT
 * @copyright Copyright 2025 Modus Operandi Inc. All Rights Reserved.
 *
 * @jest-environment jsdom
 */

import { Item } from './item';
import * as utils from './utils';
import * as item from './item';
import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

describe('utils', () => {
  it('should handle getCursorPosition', () => {
    function eventHandler(this: HTMLInputElement, ev: MouseEvent) {
      return !!ev;
    }
    const input: HTMLInputElement = document.createElement('input');

    input.addEventListener('click', eventHandler);
    const options = {
      bubbles: true,
      cancelable: true,
      view: window,
      target: input,
    };
    const mevent = new MouseEvent('click', options);
    input.dispatchEvent(mevent);

    expect(utils.getCursorPosition(mevent)).toBe(0);
  });
  it('should handle getCursorPosition 2', () => {
    function eventHandler(this: HTMLInputElement, ev: MouseEvent) {
      return !!ev;
    }
    const input = document.createElement('input');

    input.addEventListener('click', eventHandler);
    const options = {
      code: 'ArrowRight',
      key: 'ArrowUp',
      location: 1,
    };
    const mevent = new KeyboardEvent('keydown', options);
    input.dispatchEvent(mevent);

    expect(utils.getCursorPosition(mevent)).toBe(1);
  });

  it('should handle getValueWithoutSlash', () => {
    expect(utils.getValueWithoutSlash('TEST//')).toBe('TEST');
  });
  it('should handle getValueWithoutSlash else statement', () => {
    expect(utils.getValueWithoutSlash('TEST,,')).toBe('TEST');
  });
  it('should handle getCapcoString else statement', () => {
    expect(utils.getCapcoString('CUI')).toBe('error');
  });
  it('should handle removeAnItem', () => {
    const fnitem = () => {
      return new Item('SCI', 'Sensitive Compartmented Information', 1);
    };
    const items = [new Item('SCT', 'Sensitive Compartmented Information', 2)];
    expect(item.removeAnItem('test', fnitem, items)).toEqual([
      {
        code: 'SCT',
        description: 'Sensitive Compartmented Information',
        display: 'SCT',
        order: 2,
      },
    ]);
  });
  it('should handle removeAnItem branch', () => {
    const fnitem = () => {
      return new Item('SCI', 'Sensitive Compartmented Information', 1);
    };
    const items = [new Item('SCI', 'Sensitive Compartmented Information', 2)];
    expect(item.removeAnItem('test', fnitem, items)).toStrictEqual([]);
  });
  it('should handle safeCapcoParse null', () => {
    expect(utils.safeCapcoParse(undefined).portionMarking).toBe('error');
  });
  it('should handle safeCapcoParse string', () => {
    expect(utils.safeCapcoParse('TBD').portionMarking).toBe('error');
  });
  it('should handle safeCapcoParse object', () => {
    expect(
      utils.safeCapcoParse(JSON.parse('{"portionMarking": "SECRET"}'))
        .portionMarking
    ).toBe('SECRET');
  });
  it('should handle safeCapcoParse json', () => {
    expect(
      utils.safeCapcoParse('{"portionMarking": "SECRET"}').portionMarking
    ).toBe('SECRET');
  });

  it.each([
    ['legacy direct table', 'table', false, false],
    ['standalone table block', 'table', true, false],
    ['standalone table block in landscape', 'table', true, true],
    ['legacy paragraph image', 'figure', false, false],
    ['standalone image block', 'figure', true, false],
    ['standalone image block in landscape', 'figure', true, true],
  ])(
    'finds the CAPCO payload for a %s',
    (_name, figureType, wrapped, landscape) => {
      const { state, capcoPos, payloadPos } = createEicState(
        figureType,
        wrapped,
        landscape
      );

      expect(utils.getBlockControlCapco(state, capcoPos)).toBe(payloadPos);
      expect(
        utils.isInsideEnhancedTableFigureBody(state, payloadPos)
      ).toBe(true);
    }
  );

  it('finds a wrapped payload when rendering starts at the EIC figure', () => {
    const { state, figurePos, payloadPos } = createEicState(
      'table',
      true,
      false
    );

    expect(utils.getBlockControlCapco(state, figurePos)).toBe(payloadPos);
  });

  it('leaves a non-EIC position unchanged', () => {
    const schema = createEicSchema();
    const state = EditorState.create({
      doc: schema.nodes.doc.create(
        {},
        schema.nodes.table.create({ capco: 'U' })
      ),
      schema,
    });

    expect(utils.getBlockControlCapco(state, 0)).toBe(0);
    expect(utils.isInsideEnhancedTableFigureBody(state, 0)).toBe(false);
  });
});

function createEicState(
  figureType: string,
  wrapped: boolean,
  landscape: boolean
) {
  const schema = createEicSchema();
  const isImage = figureType === 'figure';
  const payload = isImage
    ? schema.nodes.image.create({ src: 'eic.png', capco: 'U' })
    : schema.nodes.table.create({ capco: 'U' });
  let bodyPayload = payload;

  if (wrapped) {
    const wrapperType = isImage
      ? schema.nodes.enhanced_table_figure_image
      : schema.nodes.enhanced_table_figure_table;
    bodyPayload = wrapperType.create({}, payload);
  } else if (isImage) {
    bodyPayload = schema.nodes.paragraph.create({}, payload);
  }

  const body = schema.nodes.enhanced_table_figure_body.create({}, bodyPayload);
  const capco = schema.nodes.enhanced_table_figure_capco.create({ capco: 'U' });
  const figure = schema.nodes.enhanced_table_figure.create(
    { figureType },
    [body, capco]
  );
  const root = landscape
    ? schema.nodes.landscape_section.create({}, figure)
    : figure;
  const state = EditorState.create({
    doc: schema.nodes.doc.create({}, root),
    schema,
  });

  return {
    state,
    figurePos: findNodePosition(state, 'enhanced_table_figure'),
    payloadPos: findNodePosition(state, isImage ? 'image' : 'table'),
    capcoPos: findNodePosition(state, 'enhanced_table_figure_capco'),
  };
}

function createEicSchema() {
  return new Schema({
    nodes: {
      doc: { content: 'block+' },
      text: { group: 'inline' },
      paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
      image: {
        inline: true,
        group: 'inline',
        attrs: {
          src: { default: '' },
          capco: { default: null },
        },
        toDOM: (node) => ['img', { src: node.attrs.src }],
      },
      table: {
        group: 'block',
        attrs: { capco: { default: null } },
        toDOM: () => ['table'],
      },
      enhanced_table_figure_table: {
        group: 'block',
        content: 'table',
        toDOM: () => ['div', 0],
      },
      enhanced_table_figure_image: {
        group: 'block',
        content: 'image',
        toDOM: () => ['div', 0],
      },
      enhanced_table_figure_body: {
        content:
          '(table | paragraph | enhanced_table_figure_table | enhanced_table_figure_image)',
        toDOM: () => ['div', 0],
      },
      enhanced_table_figure_capco: {
        content: 'text*',
        attrs: { capco: { default: null } },
        toDOM: () => ['div', 0],
      },
      enhanced_table_figure: {
        group: 'block',
        content:
          'enhanced_table_figure_body enhanced_table_figure_capco',
        attrs: { figureType: { default: 'table' } },
        toDOM: () => ['div', 0],
      },
      landscape_section: {
        group: 'block',
        content: 'block+',
        toDOM: () => ['section', 0],
      },
    },
  });
}

function findNodePosition(state: EditorState, typeName: string): number {
  let found = -1;
  state.doc.descendants((node, pos) => {
    if (found < 0 && node.type.name === typeName) {
      found = pos;
    }
  });
  return found;
}
