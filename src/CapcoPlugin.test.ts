import { Schema, ResolvedPos, Slice } from 'prosemirror-model';
import { EditorState, Transaction, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { CapcoContextMenu, capcoContextMenuProps } from './capcoContextMenu';
import { builders } from 'prosemirror-test-builder';
import { getValueWithoutSlash } from './utils';
import { getAnItem, removeAnItem, Item } from './item';
import { CapcoPlugin } from './CapcoPlugin';
import { getParagraphNodeAttrs } from './capcoNodeSpec';
import { createEditor, doc, p, schema } from 'jest-prosemirror';
import { CAPCOMODE } from './editorSchema';
import { CAPCOMODEKEY } from './constants';

describe('Capco Plugin', () => {
  const customSchema = new Schema({
    nodes: {
      doc: { content: 'block+' },

      text: {
        group: 'inline',
      },

      paragraph: {
        group: 'block',
        content: 'inline*',
        parseDOM: [{ tag: 'p' }],
        toDOM() {
          return ['p', 0];
        },
      },

      heading: {
        group: 'block',
        content: 'inline*',
        attrs: { level: { default: 1 } },
        defining: true,
        parseDOM: [
          { tag: 'h1', attrs: { level: 1 } },
          { tag: 'h2', attrs: { level: 2 } },
          { tag: 'h3', attrs: { level: 3 } },
        ],
        toDOM(node) {
          return ['h' + node.attrs.level, 0];
        },
      },

      table: {
        group: 'block',
        content: 'table_row+',
        tableRole: 'table',
        isolating: true,
        parseDOM: [{ tag: 'table' }],
        toDOM() {
          return ['table', ['tbody', 0]];
        },
      },

      table_row: {
        content: 'table_cell+',
        tableRole: 'row',
        parseDOM: [{ tag: 'tr' }],
        toDOM() {
          return ['tr', 0];
        },
      },

      table_cell: {
        content: 'block+',
        attrs: {
          colspan: { default: 1 },
          rowspan: { default: 1 },
          colwidth: { default: null },
        },
        tableRole: 'cell',
        isolating: true,
        parseDOM: [{ tag: 'td' }],
        toDOM() {
          return ['td', 0];
        },
      },

      enhanced_table_figure: {
        group: 'block',
        atom: true,
        selectable: true,
        attrs: {
          isValidate: { default: false },
        },
        parseDOM: [
          {
            tag: 'enhanced-table-figure',
            getAttrs(dom) {
              return {
                isValidate: dom.getAttribute('data-validate') === 'true',
              };
            },
          },
        ],
        toDOM(node) {
          return [
            'enhanced-table-figure',
            { 'data-validate': node.attrs.isValidate },
          ];
        },
      },
    },

    marks: {},
  });
  const plugin = new CapcoPlugin(1);
  const effSchema = plugin.getEffectiveSchema(customSchema);
  const docSchema = builders(effSchema, { p: { nodeType: 'paragraph' } });

  const state = EditorState.create({
    doc: doc(p('Hello World!!')),
    schema: docSchema.schema,
  });
  const dom = document.createElement('div');

  const view = new EditorView({ mount: dom }, { state: state });
  const mockEvent = {
    key: 'Enter',
    target: {
      childNodes: [
        // Add your child nodes as needed
        document.createElement('div'),
        document.createElement('span'),
        // ...
      ],
    },
  } as unknown as Event;
  jest.spyOn(view, 'posAtCoords').mockImplementation(() => {
    return {
      pos: 5,
      inside: 0,
    };
  });
  jest.spyOn(view, 'coordsAtPos').mockImplementation(() => {
    return {
      left: 10,
      right: 15,
      top: 20,
      bottom: 25,
    };
  });

  it('should handle keydown', () => {
    expect(plugin.spec.props?.handleDOMEvents?.keydown).toBeTruthy();
    if (!plugin.spec.props?.handleDOMEvents?.keydown) {
      return;
    }
    const result = plugin.spec.props.handleDOMEvents.keydown.bind(plugin)(
      view,
      mockEvent
    );
    expect(result).toBeFalsy();
  });

  it('should handle dragstart', () => {
    expect(plugin.spec.props?.handleDOMEvents?.dragstart).toBeTruthy();
    if (!plugin.spec.props?.handleDOMEvents?.dragstart) {
      return;
    }
    const result = plugin.spec.props.handleDOMEvents?.dragstart.bind(plugin)(
      view,
      mockEvent
    );
    expect(result).toBeFalsy();
  });

  it('should handle handleClick', () => {
    expect(plugin.spec.props?.handleClick).toBeTruthy();
    if (!plugin.spec.props?.handleClick) {
      return;
    }
    const result = plugin.spec.props.handleClick.bind(plugin)(
      view,
      0,
      mockEvent
    );
    expect(result).toBeFalsy();
  });

  it('should handle handlePaste', () => {
    expect(plugin.spec.props?.handlePaste).toBeTruthy();
    if (!plugin.spec.props?.handlePaste) {
      return;
    }
    const result = plugin.spec.props.handlePaste.bind(plugin)(
      view,
      mockEvent,
      {} as unknown as Slice
    );
    expect(result).toBeFalsy();
  });

  it('should return capcomode', () => {
    expect(new CapcoPlugin(2 as unknown as CAPCOMODE)).toBeDefined();
  });

  it('should create plugin with default capco', () => {
    expect(new CapcoPlugin(CAPCOMODE.FORCED, 'U')).toBeDefined();
  });

  it('should handle handlePaste 2', () => {
    const docWithNodes = schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello World!!',
            },
          ],
          attrs: { capcoMode: 1 },
        },
      ],
    });
    const plugin = new CapcoPlugin(undefined);
    plugin.mode = undefined as unknown as CAPCOMODE;
    expect(plugin.spec.appendTransaction).toBeTruthy();
    if (!plugin.spec.appendTransaction) {
      return;
    }
    const result = plugin.spec.appendTransaction.bind(plugin)(
      [
        {
          getMeta: () => {
            return 'drop';
          },
          mapping: {
            map: () => {
              return 1;
            },
          },
          selection: {
            $from: {
              node: () => {
                return {};
              },
              depth: 1,
            },
            $to: {
              node: () => {
                return {};
              },
              depth: 1,
            },
          },
          doc: docWithNodes,
        } as unknown as Transaction,
      ],
      state,
      {
        doc: {},
        tr: {
          doc: docWithNodes,
          setNodeMarkup: () => {
            return {};
          },
        },
      } as unknown as EditorState
    );
    expect(result).toBeDefined();
  });

  it('findNodeIndexPos', () => {
    expect(
      plugin.findNodeIndexPos(doc(p('x'), p('one')), p('x'))
    ).toBeDefined();
  });

  it('showHideCapco', () => {
    const state = EditorState.create({
      doc: doc(p('foo')),
      schema: effSchema,
    });
    expect(plugin.showHideCapco(state, 'U')).toBe('');
  });

  it('getDecorations', () => {
    const docJson = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Heading Example' }],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'This is a paragraph.' }],
        },
        {
          type: 'table',
          content: [
            {
              type: 'table_row',
              content: [
                {
                  type: 'table_cell',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Cell 1' }],
                    },
                  ],
                },
                {
                  type: 'table_cell',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'Cell 2' }],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          type: 'enhanced_table_figure',
          attrs: { isValidate: true },
        },
      ],
    };

    const doc = customSchema.nodeFromJSON(docJson);
    const state = EditorState.create({
      doc: doc,
      schema: customSchema,
    });
    const decorationSet = plugin.getDecorations(state);
    expect(decorationSet).toBeDefined();
  });
  it('getDecorations 2', () => {
    const docJson = {
      type: 'doc',
      content: [
        {
          type: 'enhanced_table_figure',
          attrs: { isValidate: true },
        },
        {
          type: 'enhanced_table_figure',
          attrs: { isValidate: true },
        },
        {
          type: 'enhanced_table_figure',
          attrs: { isValidate: true },
        },
        {
          type: 'enhanced_table_figure',
          attrs: { isValidate: true },
        },
      ],
    };

    const doc = customSchema.nodeFromJSON(docJson);
    const state = EditorState.create({
      doc: doc,
      schema: customSchema,
    });
    const decorationSet = plugin.getDecorations(state);
    expect(decorationSet).toBeDefined();
  });

  it('getPendingTransactions', () => {
    const state = EditorState.create({
      doc: doc(p('foo')),
      schema: effSchema,
    });
    const pTr = plugin.getPendingTransactions([state.tr], state, state);
    expect(pTr).toBeDefined();
  });

  it('pos', () => {
    const pos = plugin.getPos(view, 1);
    expect(pos).toBeGreaterThanOrEqual(0);
  });

  it('init Menu', () => {
    const textNode = schema.text('foo');
    const mState = plugin.isAllowedNode(textNode);
    expect(mState).toBeFalsy();
  });

  it('isSupportedNode', () => {
    const textNode = schema.text('foo');
    const mState = plugin.isSupportedNode(textNode);
    expect(mState).toBeTruthy();
  });

  it('onDragStart', () => {
    schema.text('foo');
    const mState = plugin.onDragStart(view);
    expect(mState).toBeFalsy();
  });

  it('processCapcoMode', () => {
    const mState = plugin.processCapcoMode(state.tr, state);
    expect(mState).toBeDefined();
  });

  it('processEnterPendingTransactions', () => {
    const mState = plugin.processEnterPendingTransactions(
      state.tr,
      doc(),
      state.tr,
      schema
    );
    expect(mState).toBeDefined();
  });

  it('processEnterPendingTransactions 2', () => {
    plugin.pendingItems = [
      { pos: 0, attrs: { ['string']: 'test' } },
      { pos: 0, attrs: { ['strig']: 'tests' } },
    ];
    const mState = plugin.processEnterPendingTransactions(
      state.tr,
      doc(),
      state.tr,
      schema
    );
    expect(mState).toBeDefined();
  });

  it('processCapcoMode 2', () => {
    const PendingItem = { pos: 0, attrs: {} };
    const mState = plugin.getPendingItemPos(
      0,
      0,
      false,
      1,
      doc(p('foo')),
      PendingItem,
      schema
    );
    expect(mState).toEqual(0);
  });

  it('removeAnItem', () => {
    const itemArr: Item[] = [];
    let item = new Item('SCI', 'Sensitive Compartmented Information');
    item.addChild(new Item('SI', 'Special Intelligence', 1, 'SSEP'));
    item.addChild(new Item('SI-G', 'Special Intelligence - Gamma', 2, 'SSEP'));
    item.addChild(new Item('TK', 'TALENT KEYHOLE', 3, 'SSEP'));
    item.addChild(new Item('EL', 'ENDSEAL', 4, 'SSEP'));
    item.addChild(new Item('KDK', 'KLONDIKE', 5, 'DSEP'));
    item = new Item('SAR', 'Special Access Required', 0, 'DSEP');
    itemArr.push(item);
    const getFn = (_code: string) => {
      return item;
    };
    const mState = removeAnItem('SAR', getFn, itemArr);
    expect(mState).toBeDefined();
  });

  it('getAnItem', () => {
    const itemArr: Item[] = [];
    let item = new Item('SCI', 'Sensitive Compartmented Information');
    item.addChild(new Item('SI', 'Special Intelligence', 1, 'SSEP'));
    item.addChild(new Item('SI-G', 'Special Intelligence - Gamma', 2, 'SSEP'));
    item.addChild(new Item('TK', 'TALENT KEYHOLE', 3, 'SSEP'));
    item.addChild(new Item('EL', 'ENDSEAL', 4, 'SSEP'));
    item.addChild(new Item('KDK', 'KLONDIKE', 5, 'DSEP'));
    item = new Item('SAR', 'Special Access Required', 0, 'DSEP');
    itemArr.push(item);
    const checkFn = (_item: Item) => {
      return true;
    };

    const mState = getAnItem('SAR', itemArr, checkFn);
    expect(mState).toBeDefined();
  });

  it('getValueWithoutSlash', () => {
    const mState = getValueWithoutSlash('SAR/SDF');
    expect(mState).toEqual('SAR/SDF');
  });

  it('getAttrs', () => {
    const mockGetAttrs = jest.fn((dom) => {
      return {
        capco: dom.getAttribute('capco'),
      };
    });
    const dom = document.createElement('span');
    dom.setAttribute('capco', '{"ism": {"classification": "U"}}');
    dom.style.zIndex = '1';
    dom.style.opacity = '0.25';

    expect(getParagraphNodeAttrs(mockGetAttrs, dom)).not.toBe({
      capco: '',
    });
  });

  it('should handle capco plugin', () => {
    const capcoplugin = new CapcoPlugin(1);
    const capcocontextmenu: capcoContextMenuProps = {
      editorView: view,
      position: { x: 2, y: 2 },
      pos: 1,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    capcoplugin.cMenu = new CapcoContextMenu(capcocontextmenu);
    expect(capcoplugin.cMenu).toBeDefined();
  });
});

describe('capco plugin', () => {
  const capcoplugin = new CapcoPlugin();
  const editor = createEditor(doc(p()), { plugins: [capcoplugin] });
  const state: EditorState = EditorState.create({
    schema: schema,
    selection: editor.selection,
    plugins: [capcoplugin],
  });

  const directeditorprops = { state };
  const dom = document.createElement('div');

  const view = new EditorView(dom, directeditorprops);

  it('should handle Capcoplugin', () => {
    createEditor(doc(p('<cursor>')), { plugins: [capcoplugin] })
      .command((_dispatch) => true)
      .callback((content) => {
        expect(content.state.doc).toEqualProsemirrorNode(doc(p()));
      });
  });

  it('should handle getPendingItemPos', () => {
    const node1 = p('div');
    const pendingitem = { pos: 1, attrs: {}, node: node1 };
    expect(
      capcoplugin.getPendingItemPos(1, 2, true, 4, node1, pendingitem, schema)
    ).toBe(-1);
  });

  it('should handle getPendingItemPos cover else statement', () => {
    const node1 = p('div');
    const pendingitem = { pos: 1, attrs: {}, node: node1 };
    expect(
      capcoplugin.getPendingItemPos(1, 2, false, 3, node1, pendingitem, schema)
    ).toBe(1);
  });

  it('should handle handleoneneter', () => {
    const event = new KeyboardEvent('Enter');
    expect(capcoplugin.handleOnEnter(view, event)).toBeFalsy();
  });

  it('should handle handleoneneter branch coverage', () => {
    const customSchema = new Schema({
      nodes: {
        doc: {
          attrs: {
            capcoMode: { default: 1 },
            author: { default: null },
          },
          content: 'paragraph+',
        },
        paragraph: {
          content: 'text*',
          group: 'block',
          parseDOM: [{ tag: 'p' }],
          toDOM() {
            return ['p', 0];
          },
        },
        text: {
          group: 'inline',
        },
      },
    });
    // Create a mock `EditorState` instance with the desired selection
    const mockEditorState1 = EditorState.create({
      doc: customSchema.nodeFromJSON({
        attrs: { customAttr: { default: 'value' } },
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hellow world' }],
          },
        ],
      }),
    });
    const mockEditorState = EditorState.create({
      doc: customSchema.nodeFromJSON({
        attrs: { customAttr: { default: 'value' } },
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hellow world' }],
          },
        ],
      }),
      selection: TextSelection.create(
        mockEditorState1.doc,
        /* headPosition */ 0,

        /* selectionDepth */ 0
      ),
    });

    const capcoplugin = new CapcoPlugin();
    const mockEditorView = new EditorView(null, {
      state: mockEditorState,
    });
    const event = new KeyboardEvent('Enter');
    expect(capcoplugin.handleOnEnter(mockEditorView, event)).toBeFalsy();
  });

  it('should handle handleoneneter branch coverage NONE', () => {
    const customSchema = new Schema({
      nodes: {
        doc: {
          attrs: {
            capcoMode: { default: 0 },
            author: { default: null },
          },
          content: 'paragraph+',
        },
        paragraph: {
          content: 'text*',
          group: 'block',
          parseDOM: [{ tag: 'p' }],
          toDOM() {
            return ['p', 0];
          },
        },
        text: {
          group: 'inline',
        },
      },
    });
    // Create a mock `EditorState` instance with the desired selection
    const mockEditorState = EditorState.create({
      doc: customSchema.nodeFromJSON({
        attrs: { customAttr: { default: 'value' } },
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hellow world',
              },
            ],
          },
        ],
      }),
      selection: TextSelection.create(
        state.doc,
        /* headPosition */ 0,

        /* selectionDepth */ 0
      ),
    });

    const capcoplugin = new CapcoPlugin();
    const mockEditorView = new EditorView(null, {
      state: mockEditorState,
    });
    const event = new KeyboardEvent('Enter');
    expect(capcoplugin.handleOnEnter(mockEditorView, event)).toBeFalsy();
  });

  it('should correctly handle handleOnEnter logic', () => {
    jest.spyOn(capcoplugin, 'getPos').mockReturnValue(1);
    jest.spyOn(capcoplugin, 'resetCapco').mockReturnValue({ updated: true });
    const mockEditorView = {
      state: {
        doc: {
          nodeAt: jest.fn().mockReturnValue({ attrs: { capco: 'SECRET' } }),
          attrs: {
            [CAPCOMODEKEY]: CAPCOMODE.FORCED,
          },
        },
        selection: {
          $head: {
            posAtIndex: jest.fn().mockReturnValue(1),
            depth: 1,
            pos: 2,
            node: jest.fn().mockReturnValue({ content: { size: 10 } }),
          },
        },
      },
    } as unknown as EditorView;
    capcoplugin.handleOnEnter(mockEditorView, new KeyboardEvent('Enter'));
    expect(capcoplugin.pendingItems).toBeDefined();
    expect(capcoplugin.pendingItems.length).toBeGreaterThan(0);
    expect(capcoplugin.pendingItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ pos: 1, attrs: { updated: true } }),
        expect.objectContaining({ pos: 2, attrs: { updated: true } }),
      ])
    );
  });

  it('should handle initMenu', () => {
    const capcoplugin = new CapcoPlugin();
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', {
      value: {
        classList: {
          contains: jest
            .fn()
            .mockImplementation(
              (className) =>
                className === 'capco' || className === 'ProseMirror-widget'
            ),
        },
      },
      writable: false,
    });
    jest.spyOn(capcoplugin, 'containsStart').mockReturnValue(true);
    expect(
      capcoplugin.initMenu('key', CAPCOMODE.FORCED, view, event, 1)
    ).toBeTruthy();
  });

  it('should handle containsStart', () => {
    const resolvedPos = {
      pos: 10,
      depth: 0,
      index: 0,
      after: 15,
      parentOffset: 3,
      parent: {
        type: {
          name: 'paragraph',
        },
        nodeSize: 20,
        content: {
          size: 10,
        },
      },
    };
    const event = new MouseEvent('click');
    const capcoplugin = new CapcoPlugin();
    jest.spyOn(capcoplugin, 'isInsideDesired').mockReturnValue(true);
    jest.spyOn(capcoplugin, 'isSupportedNode').mockReturnValue(true);
    jest.spyOn(capcoplugin, 'getStartPos').mockReturnValue({
      start: 1,
      startCoords: { left: 1, right: 2, top: 3, bottom: 4 },
      found: true,
      resolvedPos: resolvedPos as unknown as ResolvedPos,
    });
    expect(
      capcoplugin.containsStart(event, view, {
        value: 1,
      })
    ).toBeFalsy();
  });

  it('should handle containsStart without startCoords', () => {
    const event = new MouseEvent('click');
    const capcoplugin = new CapcoPlugin();
    jest.spyOn(capcoplugin, 'isInsideDesired').mockReturnValue(true);
    jest.spyOn(capcoplugin, 'isSupportedNode').mockReturnValue(true);
    jest.spyOn(capcoplugin, 'getStartPos').mockReturnValue({
      start: 1,
      startCoords: null as unknown as {
        left: number;
        right: number;
        top: number;
        bottom: number;
      },
      found: true,
      resolvedPos: null as unknown as ResolvedPos,
    });
    expect(
      capcoplugin.containsStart(event, view, {
        value: 1,
      })
    ).toBeFalsy();
  });

  it('should handle containsStart when found is false', () => {
    const event = new MouseEvent('click');
    const capcoplugin = new CapcoPlugin();
    jest.spyOn(capcoplugin, 'isInsideDesired').mockReturnValue(true);
    jest.spyOn(capcoplugin, 'isSupportedNode').mockReturnValue(true);
    jest.spyOn(capcoplugin, 'getStartPos').mockReturnValue({
      start: 1,
      startCoords: null as unknown as {
        left: number;
        right: number;
        top: number;
        bottom: number;
      },
      found: false,
      resolvedPos: undefined as unknown as ResolvedPos,
    });
    expect(
      capcoplugin.containsStart(event, view, {
        value: 1,
      })
    ).toBeFalsy();
  });

  it('should handle getStartPos', () => {
    const capcoplugin = new CapcoPlugin();
    const editor = createEditor(doc(p()), { plugins: [capcoplugin] });
    const state: EditorState = EditorState.create({
      schema: schema,
      selection: editor.selection,
    });

    const directeditorprops = { state };
    const dom = document.createElement('div');

    const view = new EditorView(dom, directeditorprops);
    jest.spyOn(view, 'posAtCoords').mockReturnValue(null);
    expect(capcoplugin.getStartPos(0, 0, view)).toStrictEqual({
      found: false,
      resolvedPos: null,
      start: 0,
      startCoords: null,
    });
  });
  it('should handle getStartPos 2', () => {
    const capcoplugin = new CapcoPlugin();
    const editor = {
      posAtCoords: () => {
        return {};
      },
      state: {
        doc: {
          content: { size: 1 },
          resolve: () => {
            return {
              posAtIndex: () => {
                return 2;
              },
              start: () => {
                return 0;
              },
            };
          },
        },
      },
    } as unknown as EditorView;
    expect(capcoplugin.getStartPos(0, 1, editor)).toBeDefined();
  });
  it('should handle getStartPos when content size more than posAtIndex', () => {
    const capcoplugin = new CapcoPlugin();
    const editor = {
      coordsAtPos: () => {
        return { top: 1, bottom: 1 };
      },
      posAtCoords: () => {
        return {};
      },
      state: {
        doc: {
          content: { size: 3 },
          resolve: () => {
            return {
              posAtIndex: () => {
                return 2;
              },
              start: () => {
                return 0;
              },
            };
          },
        },
      },
    } as unknown as EditorView;
    expect(capcoplugin.getStartPos(0, 1, editor)).toBeDefined();
  });

  it('should handle handle onenter', () => {
    const capcoplugin = new CapcoPlugin();
    const editor = createEditor(doc(p()), { plugins: [capcoplugin] });
    const state: EditorState = EditorState.create({
      schema: schema,
      selection: editor.selection,
      plugins: [capcoplugin],
    });

    const directeditorprops = { state };
    const dom = document.createElement('div');

    const view = new EditorView(dom, directeditorprops);

    p('div');
    const event = new KeyboardEvent('Enter');
    expect(capcoplugin.handleOnEnter(view, event)).toBeFalsy();
  });

  it('should handle handle getPos', () => {
    const content = `
  <p>Hello, world!</p>
`;

    // Create a mock `EditorState` instance with the desired selection
    const mockEditorState = EditorState.create({
      doc: schema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: content,
              },
            ],
          },
        ],
      }),
      selection: TextSelection.create(
        state.doc,
        /* headPosition */ 4,

        /* selectionDepth */ 1
      ),
    });

    // Create a mock `EditorView` instance with the mock `EditorState`
    const mockEditorView = new EditorView(null, {
      state: mockEditorState,
    });
    const capcoplugin = new CapcoPlugin();
    expect(capcoplugin.getPos(mockEditorView)).toBeDefined();
    expect(capcoplugin.getPos(mockEditorView, 2)).toBeDefined();
  });

  it('should handle handle getPos branch', () => {
    const content = `
  <p>Hello, world!</p>
`;

    // Create a mock `EditorState` instance with the desired selection
    const mockEditorState = EditorState.create({
      doc: schema.nodeFromJSON({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: content,
              },
            ],
          },
        ],
      }),
      selection: TextSelection.create(
        state.doc,
        /* headPosition */ 0,

        /* selectionDepth */ 0
      ),
    });

    // Create a mock `EditorView` instance with the mock `EditorState`
    const mockEditorView = new EditorView(null, {
      state: mockEditorState,
    });
    const capcoplugin = new CapcoPlugin();
    expect(capcoplugin.getPos(mockEditorView)).toBeDefined();
  });

  it('should handle setCapcoContent', () => {
    const customSchema = new Schema({
      nodes: {
        doc: {
          attrs: {
            capcoMode: { default: 1 },
            author: { default: null },
          },
          content: 'paragraph+',
        },
        paragraph: {
          content: 'text*',
          group: 'block',
          parseDOM: [{ tag: 'p' }],
          toDOM() {
            return ['p', 0];
          },
        },
        text: {
          group: 'inline',
        },
      },
    });
    // Create a mock `EditorState` instance with the desired selection
    const mockEditorState = EditorState.create({
      doc: customSchema.nodeFromJSON({
        attrs: { customAttr: { default: 'value' } },
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hellow world',
              },
            ],
          },
        ],
      }),
      selection: TextSelection.create(
        state.doc,
        /* headPosition */ 0,

        /* selectionDepth */ 0
      ),
    });

    const capcoplugin = new CapcoPlugin();
    const capcomark = document.createElement('div');
    capcomark.textContent = '( "SCI" :"TBD")';
    expect(
      capcoplugin.setCapcoContent(
        mockEditorState,
        JSON.stringify({
          ism: {
            version: '1',
            system: 'US',
            classification: 'SCI',
            ownerProducer: ['USA'],
            sciControls: ['SCI'],
            sarIdentifiers: [],
            atomicEnergyMarkings: [],
            fgiSourceOpen: [],
            releasableTo: [],
            disseminationControls: [],
            nonICmarkings: [],
          },
          portionMarking: 'SCI',
        }),
        capcomark,
        '',
        1
      )
    ).toBeUndefined();
  });

  it('should handle setCapcoContent branch', () => {
    const customSchema = new Schema({
      nodes: {
        doc: {
          attrs: {
            capcoMode: { default: 0 },
            author: { default: null },
          },
          content: 'paragraph+',
        },
        paragraph: {
          content: 'text*',
          group: 'block',
          parseDOM: [{ tag: 'p' }],
          toDOM() {
            return ['p', 0];
          },
        },
        text: {
          group: 'inline',
        },
      },
    });
    // Create a mock `EditorState` instance with the desired selection
    const mockEditorState = EditorState.create({
      doc: customSchema.nodeFromJSON({
        attrs: { customAttr: { default: 'value' } },
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hellow world',
              },
            ],
          },
        ],
      }),
      selection: TextSelection.create(
        state.doc,
        /* headPosition */ 0,

        /* selectionDepth */ 0
      ),
    });

    const capcoplugin = new CapcoPlugin();
    const capcomark = document.createElement('div');
    capcomark.textContent = '( "SCI" :"TBD")';
    expect(
      capcoplugin.setCapcoContent(
        mockEditorState,
        undefined as unknown as string,
        capcomark,
        '',
        0
      )
    ).toBeUndefined();
  });

  it('should handle showHideCapco', () => {
    const customSchema = new Schema({
      nodes: {
        doc: {
          attrs: {
            capcoMode: { default: 0 },
            author: { default: null },
          },
          content: 'paragraph+',
        },
        paragraph: {
          content: 'text*',
          group: 'block',
          parseDOM: [{ tag: 'p' }],
          toDOM() {
            return ['p', 0];
          },
        },
        text: {
          group: 'inline',
        },
      },
    });
    // Create a mock `EditorState` instance with the desired selection
    const mockEditorState = EditorState.create({
      doc: customSchema.nodeFromJSON({
        attrs: { customAttr: { default: 'value' } },
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Hellow world',
              },
            ],
          },
        ],
      }),
      selection: TextSelection.create(
        state.doc,
        /* headPosition */ 0,

        /* selectionDepth */ 0
      ),
    });

    const capcoplugin = new CapcoPlugin();
    const capcomark = document.createElement('div');
    capcomark.textContent = '( "SCI" :"TBD")';
    expect(capcoplugin.showHideCapco(mockEditorState, 'SCI')).toBe('none');
  });

  it('should handle getposition', () => {
    const capcoplugin = new CapcoPlugin();
    const mockMouseEvent = new MouseEvent(
      'click',
      Object.create({
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        pageX: 100,
        pageY: 200,
        clientX: 50,
        clientY: 100,
      })
    );
    expect(capcoplugin.getPosition(mockMouseEvent)).toStrictEqual({
      x: 50,
      y: 100,
    });
  });

  it('should handle getposition branch coverage', () => {
    const capcoplugin = new CapcoPlugin();
    const mockMouseEvent = new MouseEvent(
      'click',
      Object.create({
        bubbles: true,
        cancelable: true,
        button: 0,
        buttons: 1,
        pageX: 100,
        pageY: 200,
        clientX: 50,
        clientY: 100,
      })
    );
    Object.defineProperty(document, 'body', {
      value: undefined,
      writable: true,
    });
    expect(capcoplugin.getPosition(mockMouseEvent)).toStrictEqual({
      x: 50,
      y: 100,
    });
  });

  it('should handle getPosition when document.body is undefined', () => {
    const capcoplugin = new CapcoPlugin();
    const mockMouseEvent = { pageX: 0, pageY: 1 } as unknown as MouseEvent;

    Object.defineProperty(document, 'body', {
      value: undefined,
      writable: true,
    });

    expect(capcoplugin.getPosition(mockMouseEvent)).toStrictEqual({
      x: 0,
      y: 1,
    });
  });

  it('should return correct position when pageX and pageY are undefined', () => {
    const capcoplugin = new CapcoPlugin();
    const mockMouseEvent = {
      clientX: 100,
      clientY: 200,
    } as unknown as MouseEvent;

    expect(capcoplugin.getPosition(mockMouseEvent)).toStrictEqual({
      x: 100,
      y: 200,
    });
  });

  it('should return correct position when pageX and pageY are provided', () => {
    const mockEvent = { pageX: 100, pageY: 150 } as MouseEvent;
    expect(capcoplugin.getPosition(mockEvent)).toStrictEqual({
      x: 100,
      y: 150,
    });
  });

  it('should adjust posx if the popup overflows the viewport width', () => {
    window.innerWidth = 500;
    const mockEvent = { pageX: 450, pageY: 150 } as MouseEvent;

    expect(capcoplugin.getPosition(mockEvent)).toStrictEqual({
      x: 220,
      y: 150,
    }); // 500 - 280 = 220
  });

  it('should adjust posy if the popup overflows the viewport height', () => {
    window.innerHeight = 400;
    const mockEvent = { pageX: 100, pageY: 350 } as MouseEvent;

    expect(capcoplugin.getPosition(mockEvent)).toStrictEqual({
      x: 100,
      y: 220,
    }); // 400 - 180 = 220
  });

  it('should ensure posx and posy do not go below 0', () => {
    const mockEvent = { pageX: -50, pageY: -30 } as MouseEvent;
    expect(capcoplugin.getPosition(mockEvent)).toStrictEqual({ x: 0, y: 0 });
  });

  it('should handle very small viewport where popup does not fit', () => {
    window.innerWidth = 100;
    window.innerHeight = 100;
    const mockEvent = { pageX: 50, pageY: 50 } as MouseEvent;

    expect(capcoplugin.getPosition(mockEvent)).toStrictEqual({ x: 0, y: 0 });
  });

  it('should handle isSupportedNode branch coverage image === node.firstChild.type.name', () => {
    const capcoplugin = new CapcoPlugin();
    const schema = new Schema({
      nodes: {
        doc: { content: 'block+' },
        paragraph: { content: 'inline*', group: 'block' },
        text: { inline: true },
        image: {
          inline: true,
          attrs: {
            src: {},
            alt: { default: null },
          },
          group: 'inline',
          draggable: true,
          parseDOM: [
            {
              tag: 'img[src]',
              getAttrs() {
                return {
                  src: 'src',
                  alt: 'alt',
                };
              },
            },
          ],
          toDOM(node) {
            return ['img', { src: node.attrs.src, alt: node.attrs.alt }];
          },
        },
      },
    });

    const imageNode = schema.node('paragraph', null, [
      schema.node('image', {
        src: '/path/to/image.jpg',
        alt: 'An example image',
      }),
    ]);
    const mState = capcoplugin.isSupportedNode(imageNode);
    expect(mState).toBeFalsy();
  });

  it('should handle isSupportedNode branch coverage math === node.firstChild.type.name', () => {
    const capcoplugin = new CapcoPlugin();
    const schema = new Schema({
      nodes: {
        doc: { content: 'block+' },
        paragraph: { content: 'inline*', group: 'block' },
        text: { inline: true },
        math: {
          inline: true,
          attrs: {},
          group: 'inline',
          draggable: true,
          parseDOM: [
            {
              tag: 'math',
              getAttrs() {
                return {};
              },
            },
          ],
          toDOM() {
            return ['math', {}];
          },
        },
      },
    });

    const imageNode = schema.node('paragraph', null, [schema.node('math', {})]);
    const mState = capcoplugin.isSupportedNode(imageNode);
    expect(mState).toBeFalsy();
  });

  it('should handle isInsideDesired', () => {
    const parentElement = document.createElement('div');
    const element = document.createElement('div');
    const el = document.createElement('div');
    element.appendChild(el);

    parentElement.appendChild(element);
    const mockClickEvent = new MouseEvent(
      'click',
      Object.create({
        bubbles: true,
        cancelable: true,
        button: 0,
        target: element,
      })
    );

    element.dispatchEvent(mockClickEvent);

    const resolvedPos = {
      pos: 235, // the position in the document
      depth: 2, // the nesting depth of the node at that position
      parentOffset: 14, // the offset within the parent node
      parent: {}, // the parent node
      nodeAfter: null, // the node after the current position
      nodeBefore: {}, // the node before the current position
    };

    const mState = capcoplugin.isInsideDesired(
      1,
      mockClickEvent,
      {
        left: 1,
        right: 2,
        top: 3,
        bottom: 4,
      },
      resolvedPos as unknown as ResolvedPos,
      document.createElement('div')
    );
    expect(mState).toBeFalsy();
  });

  it('should handle getCapcoFromSlice', () => {
    const child3 = {
      type: { name: 'ordered_list' },
      attrs: { capco: 'SI' },
    };
    const child2 = {
      type: { name: 'ordered_list' },
      content: {
        child: () => child3,
      },
    };
    const child1 = {
      type: { name: 'ordered_list' },
      content: {
        child: () => child2,
      },
    };
    expect(
      capcoplugin.getCapcoFromSlice(view, {
        content: {
          child: () => child1,
        },
      } as unknown as Slice)
    ).toBeDefined();
  });

  it('should handle getCapcoFromSlice when name = ordered_list', () => {
    const child3 = {
      type: {
        name: 'ordered_list',
        attrs: { capco: 'RELIDO' },
      },
      attrs: { capco: 'SI' },
    };
    const child2 = {
      type: { name: 'bullet_list' },
      content: {
        child: () => child3,
      },
    };
    const child1 = {
      attrs: { capco: 'capco' },
      type: { name: 'bullet_list' },
      content: {
        child: () => child2,
      },
    };
    expect(
      capcoplugin.getCapcoFromSlice(view, {
        content: {
          child: () => child1,
        },
      } as unknown as Slice)
    ).toBeDefined();
  });

  it('should handle handleSourceForCapco', () => {
    const docWithNodes = schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello World!!',
            },
          ],
          attrs: { capcoMode: 1 },
        },
      ],
    });
    const view = {
      state: {
        doc: docWithNodes,
        setNodeMarkup: () => {
          return {};
        },
        tr: {
          curSelection: {
            $head: {
              node: () => {
                return { content: { childCount: 0 } };
              },
              depth: 1,
              posAtIndex: () => {
                return { content: { size: 1 } };
              },
            },
          },
        },
      },
    } as unknown as EditorView;
    const child3 = {
      type: {
        name: 'ordered_list',
        attrs: { capco: 'RELIDO' },
      },
      attrs: { capco: 'SI' },
    };
    const child2 = {
      type: { name: 'bullet_list' },
      content: {
        child: () => child3,
      },
    };
    const child1 = {
      attrs: { capco: 'capco' },
      type: { name: 'test' },
      content: {
        child: () => child2,
      },
    };
    expect(
      capcoplugin.handleSourceForCapco(
        view,
        {} as unknown as Event,
        {
          content: {
            child: () => child1,
          },
        } as unknown as Slice
      )
    ).toBeDefined();
  });

  it('should handle setNodeMarkupEx and return tr.setMarkup', () => {
    jest
      .spyOn(capcoplugin, 'findNodeIndexPos')
      .mockReturnValue({ index: 1, pos: 2 });
    const docWithNodes = schema.nodeFromJSON({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Hello World!!',
            },
          ],
          attrs: { capcoMode: 1 },
        },
      ],
    });
    expect(
      capcoplugin.setNodeMarkupEx(
        {
          node: () => {
            return {};
          },
          depth: 1,
        } as unknown as ResolvedPos,
        docWithNodes,
        {
          doc: docWithNodes,
          setNodeMarkup: () => {
            return {};
          },
        } as unknown as Transaction
      )
    ).toBeDefined();
  });
  it('should handle enhancedTableFigureCapco', () => {
    expect(capcoplugin.enhancedTableFigureCapco('TBD')).toBeDefined();
    expect(capcoplugin.enhancedTableFigureCapco('U')).toBeDefined();
    expect(capcoplugin.enhancedTableFigureCapco('S')).toBeDefined();
    expect(capcoplugin.enhancedTableFigureCapco('C')).toBeDefined();
    expect(capcoplugin.enhancedTableFigureCapco('CUI')).toBeDefined();
    expect(capcoplugin.enhancedTableFigureCapco('TS')).toBeDefined();
    expect(capcoplugin.enhancedTableFigureCapco('')).toBeDefined();
  });
  it('should handle getCursorPosition', () => {
    expect(
      capcoplugin.getCursorPosition({ pageY: 1 } as unknown as MouseEvent)
    ).toBeDefined();
  });
  it('should handle getCursorPosition with clientY', () => {
    expect(
      capcoplugin.getCursorPosition({ clientY: 1 } as unknown as MouseEvent)
    ).toBeDefined();
  });
  it('should handle isSpecialTableHeader', () => {
    const schema1 = new Schema({
      nodes: {
        doc: {
          content: 'block+',
        },
        paragraph: {
          group: 'block',
          content: 'text*',
          toDOM: () => ['p', 0],
          parseDOM: [{ tag: 'p' }],
        },
        text: {
          group: 'inline',
        },
        table: {
          group: 'block',
          content: 'table_row+',
          attrs: {
            vignette: { default: null },
          },
          tableRole: 'table',
          toDOM: (node) => ['table', node.attrs, ['tbody', 0]],
          parseDOM: [{ tag: 'table' }],
        },
        table_row: {
          content: 'table_cell+',
          tableRole: 'row',
          toDOM: () => ['tr', 0],
          parseDOM: [{ tag: 'tr' }],
        },
        table_cell: {
          content: 'paragraph+',
          attrs: {
            background: { default: null },
            colspan: { default: 1 },
            fullSize: { default: 0 },
          },
          tableRole: 'cell',
          toDOM: (node) => [
            'td',
            {
              style: `background: ${node.attrs.background};`,
              colspan: node.attrs.colspan,
            },
            0,
          ],
          parseDOM: [
            {
              tag: 'td',
              getAttrs: (dom: HTMLElement) => ({
                background: dom.style.background || null,
                colspan: Number(dom.getAttribute('colspan') || 1),
              }),
            },
          ],
        },
      },
      marks: {},
    });
    const tableNodeJson1 = {
      type: 'table',
      attrs: {
        vignette: true, // triggers the short-circuit path
      },
      content: [
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                background: '#d8d8d8',
                colspan: 2,
                fullSize: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Header Cell' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const tableNode = schema1.nodeFromJSON(tableNodeJson1);

    expect(capcoplugin.isSpecialTableHeader(tableNode)).toBeDefined();
  });
  it('should handle isSpecialTableHeader when !attr.vignette', () => {
    const schema1 = new Schema({
      nodes: {
        doc: {
          content: 'block+',
        },
        paragraph: {
          group: 'block',
          content: 'text*',
          toDOM: () => ['p', 0],
          parseDOM: [{ tag: 'p' }],
        },
        text: {
          group: 'inline',
        },
        table: {
          group: 'block',
          content: 'table_row+',
          attrs: {
            vignette: { default: null },
          },
          tableRole: 'table',
          toDOM: (node) => ['table', node.attrs, ['tbody', 0]],
          parseDOM: [{ tag: 'table' }],
        },
        table_row: {
          content: 'table_cell+',
          tableRole: 'row',
          toDOM: () => ['tr', 0],
          parseDOM: [{ tag: 'tr' }],
        },
        table_cell: {
          content: 'paragraph+',
          attrs: {
            background: { default: null },
            colspan: { default: 1 },
            fullSize: { default: 0 },
          },
          tableRole: 'cell',
          toDOM: (node) => [
            'td',
            {
              style: `background: ${node.attrs.background};`,
              colspan: node.attrs.colspan,
            },
            0,
          ],
          parseDOM: [
            {
              tag: 'td',
              getAttrs: (dom: HTMLElement) => ({
                background: dom.style.background || null,
                colspan: Number(dom.getAttribute('colspan') || 1),
              }),
            },
          ],
        },
      },
      marks: {},
    });
    const tableNodeJson1 = {
      type: 'table',
      attrs: {
        vignette: false, // triggers the short-circuit path
      },
      content: [
        {
          type: 'table_row',
          content: [
            {
              type: 'table_cell',
              attrs: {
                background: '#d8d8d8',
                colspan: 2,
                fullSize: 1,
              },
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Header Cell' }],
                },
              ],
            },
          ],
        },
      ],
    };

    const tableNode = schema1.nodeFromJSON(tableNodeJson1);

    expect(capcoplugin.isSpecialTableHeader(tableNode)).toBeDefined();
  });
});
