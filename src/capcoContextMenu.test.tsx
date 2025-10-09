import { CapcoContextMenu, capcoContextMenuProps } from './capcoContextMenu';
import type { CapcoEle } from './contextMenu';
import { CapcoPlugin } from './CapcoPlugin';
import { builders } from 'prosemirror-test-builder';
import { doc, p, schema } from 'jest-prosemirror';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { CapcoService, CapcoState } from './types';
import { Schema } from 'prosemirror-model';
import React from 'react';

describe('Capco Builder Component', () => {
  let capcoContextMenu;
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

  const editorView = new EditorView(
    { mount: dom },
    {
      state: state,
    }
  );
  const pos = { x: 1, y: 1 };
  const cProps: capcoContextMenuProps = {
    editorView: editorView,
    position: pos,
    pos: 1,
    customCapcoListItems: [{} as CapcoState],
    close: () => {
      return null;
    },
  };
  beforeEach(() => {
    capcoContextMenu = new CapcoContextMenu(cProps);
  });

  it('should render Context Menu component', () => {
    expect(capcoContextMenu).toBeDefined();
  });

  it('should call createDefaultMenu', () => {
    const defMenu: CapcoEle[] = [];
    const def = capcoContextMenu.createDefaultMenu(defMenu);
    expect(def[1].name).toEqual('Clear');
  });

  it('should call createSystemCapcoMenu', () => {
    const defMenu = [];
    const def = capcoContextMenu.createSystemCapcoMenu(defMenu);
    expect(def[0].name).toEqual('TBD - To be Determined');
  });

  it('should call createCustomCapcoMenu', () => {
    const defMenu = [];
    localStorage.setItem(
      'customCapcoList',
      JSON.stringify([
        JSON.stringify({
          ism: {
            version: '1',
            classification: 'CUI',
            ownerProducer: ['USA'],
            sciControls: [],
            sarIdentifiers: [],
            atomicEnergyMarkings: [],
            fgiSourceOpen: [],
            releasableTo: [],
            disseminationControls: [],
            nonICmarkings: [],
          },
          portionMarking: 'TBD',
        }),
      ])
    );
    const def = capcoContextMenu.createCustomCapcoMenu(defMenu, [
      JSON.stringify({
        ism: {
          version: '1',
          classification: 'CUI',
          ownerProducer: ['USA'],
          sciControls: [],
          sarIdentifiers: [],
          atomicEnergyMarkings: [],
          fgiSourceOpen: [],
          releasableTo: [],
          disseminationControls: [],
          nonICmarkings: [],
        },
        portionMarking: 'TBD',
      }),
    ]);
    expect(def[0].name).toBeUndefined();
  });

  it('should handle closePopUP', () => {
    let hit = 0;
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: editorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      customCapcoListItems: [],
      close: () => {
        hit++;
      },
    };
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);

    capcoContextMenu.closePopUP();
    expect(hit).toBe(1);
  });

  it('should handle wrapItemWithCapco', () => {
    const tr = {
      doc: {
        nodeAt: () => {
          return {
            attrs: { capco: 'SI' },
            type: { name: 'enhanced_table_figure_capco' },
          };
        },
      },
      setNodeMarkup: () => {
        return tr;
      },
      nodeAt: () => {
        return {
          attrs: { capco: 'SI' },
          type: { name: 'enhanced_table_figure_capco' },
        };
      },
    };
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: {
            $head: { depth: 0 },
            $from: {
              before: () => {
                return 1;
              },
            },
          },
          doc: {
            nodeAt: () => {
              return { type: { name: 'enhanced_table_figure_capco' } };
            },
            resolve: () => {
              return {
                before: () => {
                  return 1;
                },
                index: () => {
                  return 2;
                },
                node: () => {
                  return {
                    child: () => {
                      return { type: { name: 'table' } };
                    },
                  };
                },
              };
            },
          },
          tr: tr,
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 2, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    const spy = jest.spyOn(capcoContextMenu.props, 'close');
    capcoContextMenu.wrapItemWithCapco('{"ism": {"classification": "U"}}');
    expect(spy).toHaveBeenCalled();
    // and update
    const spy1 = jest.spyOn(capcoContextMenu.props, 'close');
    capcoContextMenu.wrapItemWithCapco('{"ism": {"classification": "NU"}}');
    expect(spy1).toHaveBeenCalled();
  });
  it('should handle wrapItemWithCapco name table', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: {
            $head: { depth: 0 },
            $from: {
              before: () => {
                return 1;
              },
            },
          },
          doc: {
            nodeAt: () => {
              return { type: { name: 'table' } };
            },
            resolve: () => {
              return {
                index: () => {
                  return 2;
                },
                node: () => {
                  return {
                    child: () => {
                      return { type: { name: 'table' } };
                    },
                  };
                },
              };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return {};
            },
            nodeAt: () => {
              return { attrs: { capco: 'SI' }, type: { name: 'table' } };
            },
          },
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 2, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    const spy = jest.spyOn(capcoContextMenu.props, 'close');
    capcoContextMenu.wrapItemWithCapco('{"ism": {"classification": "U"}}');
    expect(spy).toHaveBeenCalled();
    // and update
    const spy1 = jest.spyOn(capcoContextMenu.props, 'close');
    capcoContextMenu.wrapItemWithCapco('{"ism": {"classification": "NU"}}');
    expect(spy1).toHaveBeenCalled();
  });
  it('should handle wrapItemWithCapco 2', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: {
            $head: { depth: 0 },
            $from: {
              before: () => {
                return 1;
              },
            },
          },
          doc: {
            nodeAt: () => {
              return null;
            },
            resolve: () => {
              return {
                index: () => {
                  return 2;
                },
                node: () => {
                  return {
                    child: () => {
                      return { type: { name: 'enhanced_table_figure_capco' } };
                    },
                  };
                },
              };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return {};
            },
            nodeAt: () => {
              return {
                attrs: { capco: 'SI' },
                type: { name: 'enhanced_table_figure_capco' },
              };
            },
          },
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 2, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    const spy = jest.spyOn(capcoContextMenu.props, 'close');
    capcoContextMenu.wrapItemWithCapco('{"ism": {"classification": "U"}}');
    expect(spy).toHaveBeenCalled();
    // and update
    const spy1 = jest.spyOn(capcoContextMenu.props, 'close');
    capcoContextMenu.wrapItemWithCapco('{"ism": {"classification": "NU"}}');
    expect(spy1).toHaveBeenCalled();
  });
  it('should handle wrapItemWithCapco 3', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: {
            $head: { depth: 0 },
            $from: {
              before: () => {
                return 1;
              },
            },
          },
          doc: {
            nodeAt: () => {
              return null;
            },
            resolve: () => {
              return {
                index: () => {
                  return 2;
                },
                node: () => {
                  return {
                    child: () => {
                      return { type: { name: 'table' } };
                    },
                  };
                },
              };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return {};
            },
            nodeAt: () => {
              return { attrs: { capco: 'SI' }, type: { name: 'table' } };
            },
          },
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 2, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    const spy = jest.spyOn(capcoContextMenu.props, 'close');
    capcoContextMenu.wrapItemWithCapco('{"ism": {"classification": "U"}}');
    expect(spy).toHaveBeenCalled();
    // and update
    const spy1 = jest.spyOn(capcoContextMenu.props, 'close');
    capcoContextMenu.wrapItemWithCapco('{"ism": {"classification": "NU"}}');
    expect(spy1).toHaveBeenCalled();
  });
  it('should handle wrapItemWithCapco when node.type.name  = enhanced_table_figure_capco', () => {
    const tr = {
      setNodeMarkup: () => {
        return tr;
      },
      nodeAt: () => {
        return {
          attrs: { capco: 'SI' },
          type: { name: 'enhanced_table_figure_capco' },
        };
      },
    };
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: {
            $head: { depth: 0 },
            $from: {
              before: () => {
                return 1;
              },
            },
          },
          doc: {
            nodeAt: () => {
              return null;
            },
            resolve: () => {
              return {
                index: () => {
                  return 2;
                },
                node: () => {
                  return {
                    child: () => {
                      return { type: { name: 'enhanced_table_figure_capco' } };
                    },
                  };
                },
              };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return tr;
            },
            nodeAt: () => {
              return {
                attrs: { capco: 'SI' },
                type: { name: 'enhanced_table_figure_capco' },
              };
            },
          },
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 2, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    const spy = jest.spyOn(capcoContextMenu.props, 'close');
    capcoContextMenu.wrapItemWithCapco('{"ism": {"classification": "U"}}');
    expect(spy).toHaveBeenCalled();
    // and update
    const spy1 = jest.spyOn(capcoContextMenu.props, 'close');
    capcoContextMenu.wrapItemWithCapco('{"ism": {"classification": "NU"}}');
    expect(spy1).toHaveBeenCalled();
  });
  it('should handle wrapItemWithCapco and call setCapco if condition when iscitation is true', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: editorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      isCitation: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    const spy1 = jest.spyOn(capcoContextMenu, 'setState');
    capcoContextMenu.wrapItemWithCapco('{}');
    expect(spy1).not.toHaveBeenCalled();
    capcoContextMenu.wrapItemWithCapco('test');
    expect(spy1).not.toHaveBeenCalled();
  });

  it('should handle clearCapcoMark', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: { $head: { depth: 0 } },
          doc: {
            nodeAt: () => {
              return { attrs: { capco: 'SI' } };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return {};
            },
          },
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    expect(capcoContextMenu.clearCapcoMark()).toBeUndefined();
  });

  it('should handle saveCapco', async () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',

      editorView: {
        state: {
          selection: {
            $head: { depth: 0, parent: { attrs: { capco: '{}' } } },
          },
          doc: {
            nodeAt: () => {
              return { attrs: { capco: 'SI' } };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return {};
            },
          },
          plugins: [
            {
              CapcoPlugin: {
                key: 'capco$',
              },
              pendingItems: [],
              runtime: {
                capcoService: {},
              },
              spec: {
                key: {
                  key: 'capco$',
                },
              },
            },
          ],
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    } as capcoContextMenuProps;
    const customCapco =
      '{"valid":true,"ism":{"system":"US","classification":{"key":"C","value":"CONFIDENTIAL"},"sciControls":[{"key":"EL","value":"ENDSEAL"}]},"portionMarking":"C///EL"}';

    let ok = false;
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    jest.spyOn(capcoContextMenu, 'getcapcoRunTime').mockImplementation(
      () =>
        ({
          saveCapco: (_capcoList: CapcoState[]) => Promise.resolve(ok),
        }) as CapcoService
    );
    const bOK = capcoContextMenu.saveCapco(customCapco, []);
    expect(await bOK).toBeFalsy();
    ok = true;
    const bOK2 = capcoContextMenu.saveCapco(customCapco, []);
    expect(await bOK2).toBeTruthy();
  });

  it('should handle saveCapco with capcoList', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: {
            $head: { depth: 0, parent: { attrs: { capco: '{}' } } },
          },
          doc: {
            nodeAt: () => {
              return { attrs: { capco: 'SI' } };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return {};
            },
          },
          plugins: [
            {
              CapcoPlugin: {
                key: 'capco$',
              },
              pendingItems: [],
              runtime: {
                capcoService: {},
              },
              spec: {
                key: {
                  key: 'capco$',
                },
              },
            },
          ],
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const capcoList = [
      {
        valid: true,
        portionMarking: 'C///EL/DCNI//EYES',
        ism: {
          system: 'US',
          classification: { key: 'C', value: 'CONFIDENTIAL' },
          sciControls: [{ key: 'EL', value: 'ENDSEAL' }],
        },
      },
    ];
    const customCapco =
      '{"valid":true,"ism":{"system":"US","classification":{"key":"C","value":"CONFIDENTIAL"},"sciControls":[{"key":"EL","value":"ENDSEAL"}]},"portionMarking":"C///EL"}';

    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    const bOK = capcoContextMenu.saveCapco(customCapco, capcoList);
    expect(bOK).toBeFalsy();
  });

  it('should handle onCapcoMenuClicked', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: {
            $head: { depth: 0, parent: { attrs: { capco: '{}' } } },
          },
          doc: {
            nodeAt: () => {
              return { attrs: { capco: 'SI' } };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return {};
            },
          },
          plugins: [
            {
              CapcoPlugin: {
                key: 'capco$',
              },
              pendingItems: [],
              runtime: {
                capcoService: {},
              },
              spec: {
                key: {
                  key: 'capco$',
                },
              },
            },
          ],
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };

    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    const spy = jest.spyOn(capcoContextMenu, 'closePopUP');
    capcoContextMenu.onCapcoMenuClicked('Clear');
    capcoContextMenu.onCapcoMenuClicked('');
    expect(spy).toHaveBeenCalled();
  });
  it('should handle onCapcoMenuClicked when capco undefined', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: {
            $head: { depth: 0, parent: { attrs: { capco: undefined } } },
          },
          doc: {
            nodeAt: () => {
              return { attrs: { capco: 'SI' } };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return {};
            },
          },
          plugins: [
            {
              CapcoPlugin: {
                key: 'capco$',
              },
              pendingItems: [],
              runtime: {
                capcoService: {},
              },
              spec: {
                key: {
                  key: 'capco$',
                },
              },
            },
          ],
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };

    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    const spy = jest.spyOn(capcoContextMenu, 'closePopUP');
    capcoContextMenu.onCapcoMenuClicked('Clear');
    capcoContextMenu.onCapcoMenuClicked('');
    expect(spy).toHaveBeenCalled();
  });

  it('should handle remoCapcoFromList', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: editorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      mode: 1,
      customCapcoListItems: [{ portionMarking: 'SCI' } as CapcoState],
      close: () => {
        return 1;
      },
    };

    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    expect(capcoContextMenu.remoCapcoFromList('SCI')).toBeUndefined();
  });
  it('should handle remoCapcoFromList when capco mode is none', () => {
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
          attrs: { capcoMode: 0 },
        },
      ],
    });
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          doc: docWithNodes,
          plugins: [
            {
              CapcoPlugin: {
                key: 'capco$',
              },
              pendingItems: [],
              runtime: {
                capcoService: {},
              },
              spec: {
                key: {
                  key: 'capco$',
                },
              },
            },
          ],
        },
        dispatch: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      mode: 0,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);

    expect(capcoContextMenu.remoCapcoFromList('SCI')).toBeUndefined();
  });

  it('should handle render', () => {
    expect(capcoContextMenu.render()).toBeDefined();
  });
  it('should handle render 2', () => {
    const cProps: capcoContextMenuProps = {
      editorView: editorView,
      position: { x: 10000, y: 1000 },
      pos: 2,
      close: () => {
        return null;
      },
      customCapcoListItems: [],
    };
    capcoContextMenu = new CapcoContextMenu(cProps);
    expect(capcoContextMenu.render()).toBeDefined();
  });
  it('should handle render when mode is undefined', () => {
    const cProps: capcoContextMenuProps = {
      editorView: editorView,
      position: { x: 10000, y: 1000 },
      pos: 2,
      close: () => {
        return null;
      },
      customCapcoListItems: [],
    };
    capcoContextMenu = new CapcoContextMenu(cProps);
    capcoContextMenu.props.mode = undefined;
    expect(capcoContextMenu.render()).toBeDefined();
  });

  it('should handle setCapco and cover the else condition when this.props.editorView.state.selection.$head.depth is 0', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: { $head: { depth: 0 } },
          doc: {
            nodeAt: () => {
              return { attrs: { capco: 'SI' } };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return {};
            },
          },
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      isCitation: true,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const spy = jest.spyOn(capcocontextmenuprops, 'close');
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    capcoContextMenu.setCapco('');

    expect(spy).not.toHaveBeenCalled();
  });

  it('should handle setCapco and cover the else condition when this.props.editorView.state.selection.$head.depth is 0 (2)', () => {
    const tr = {
      setNodeMarkup: () => {
        return tr;
      },
    };
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: { $head: { depth: 0 } },
          doc: {
            nodeAt: () => {
              return {
                attrs: { capco: 'SI' },
                type: { name: 'enhanced_table_figure_capco' },
              };
            },
            resolve: () => {
              return {
                before: () => {
                  return 1;
                },
              };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return tr;
            },
            nodeAt: () => {
              return {
                attrs: { capco: 'SI' },
                type: { name: 'enhanced_table_figure_capco' },
              };
            },
          },
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      isCitation: false,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const spy = jest.spyOn(capcocontextmenuprops, 'close');
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    capcoContextMenu.setCapco('{"ism": {"classification": "SI"}}');

    expect(spy).toHaveBeenCalled();
  });

  it('should handle onKeyDownCmenuclicked', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: { $head: { depth: 0 } },
          doc: {
            nodeAt: () => {
              return { attrs: { capco: 'SI' } };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return {};
            },
          },
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 1, y: 2 },
      pos: 2,
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      isCitation: false,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    expect(
      capcoContextMenu.onKeyDownCmenuclicked(
        { key: 'Enter' } as React.KeyboardEvent<unknown>,
        { name: 'name' }
      )
    ).toBeUndefined();
  });
  it('should handle onKeyDownwrapItemWithCapco', () => {
    const capcocontextmenuprops = {
      capcoKey: 'capco',
      selectedCapco: 'selctedcapco',
      editorView: {
        state: {
          selection: { $head: { depth: 0 } },
          doc: {
            nodeAt: () => {
              return { attrs: { capco: 'SI' }, type: { name: '' } };
            },
          },
          tr: {
            setNodeMarkup: () => {
              return {};
            },
          },
        },
        dispatch: () => {
          return {};
        },
        posAtCoords: () => {
          return {};
        },
      } as unknown as EditorView,
      position: { x: 1, y: 2 },
      pos: 2,
      cursorPosition: { x: 2, y: 2 },
      showSubMenu: true,
      showCapcoModeSubMenu: true,
      showDotOnCapcoMode: true,
      isCitation: false,
      customCapcoListItems: [],
      close: () => {
        return 1;
      },
    };
    const capcoContextMenu = new CapcoContextMenu(capcocontextmenuprops);
    const spy = jest.spyOn(capcoContextMenu, 'wrapItemWithCapco');
    capcoContextMenu.onKeyDownwrapItemWithCapco(
      { key: 'Enter' } as React.KeyboardEvent,
      { displayName: '{"ism": {"classification": "U"}}' }
    );
    expect(spy).toHaveBeenCalled();
  });

  it('should return the original capcoList when customCapcoListItems is undefined', () => {
    const capcoList: CapcoEle[] = [
      { name: 'ExistingItem', appendHr: false, isCustomCAPCO: false },
    ];

    const result = capcoContextMenu.createCustomCapcoMenu(capcoList, undefined);

    expect(result).toEqual(capcoList);
  });

  it('should return the original capcoList when customCapcoListItems is null', () => {
    const capcoList: CapcoEle[] = [
      { name: 'ExistingItem', appendHr: false, isCustomCAPCO: false },
    ];

    const result = capcoContextMenu.createCustomCapcoMenu(capcoList, null);

    expect(result).toEqual(capcoList);
  });
});
