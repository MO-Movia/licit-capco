import { Schema } from 'prosemirror-model';
import type { NodeSpec } from 'prosemirror-model';
import {
  toParagraphDOM,
  getParagraphNodeAttrs,
  toHeadingDOM,
} from './capcoNodeSpec';
import type { getAttrsExFn, toDOMExFn } from './capcoNodeSpec';
import {
  CAPCOKEY,
  CAPCOMODEKEY,
  PARAGRAPH,
  HEADING,
  TABLE,
  TABLE_FIGURE,
} from './constants';

export enum CAPCOMODE {
  NONE,
  FORCED,
}

export const SYSTEMCAPCO = Object.freeze({
  TBD: 'TBD',
  SECRET: 'S',
  TOPSECRET: 'TS',
  CONFIDENTIAL: 'C',
  UNCLASSIFIED: 'U',
  CONTROLLEDUNCLASSIFIEDINFORMATION: 'CUI'
});

export type Content = {
  type: string;
  schema: Schema;
  attrs: getAttrsExFn;
  toDOM: toDOMExFn;
};

export function effectiveSchema(schema: Schema, mode: CAPCOMODE): Schema {
  if (schema?.spec) {
    createCapcoNodeAttributes(schema);
    createCapcoDocAttributes(schema, mode);
  }

  return schema;
}

function createAttribute(content: NodeSpec, newAttrs: string[], value: string | number | null) {
  const requiredAttrs = [...newAttrs];
  const attr = content?.attrs && Object.keys(content.attrs)[0];
  requiredAttrs.forEach((key) => {
    if (content) {
      let capcoAttrSpec = content.attrs?.[key];
      if (attr && content.attrs && !capcoAttrSpec) {
        const contentAttr = content.attrs[attr];
        capcoAttrSpec = Object.assign(
          Object.create(Object.getPrototypeOf(contentAttr)),
          contentAttr
        );
        if (capcoAttrSpec) {
          capcoAttrSpec.default = value;
          content.attrs[key] = capcoAttrSpec;
        }
      }
    }
  });
}

function getContent(
  type: string,
  schema: Schema,
  nodeAttrs: getAttrsExFn,
  toDOM: toDOMExFn
): NodeSpec {
  const nodes = schema.spec.nodes;

  // [FS-AG][07-MAY-2020][IRAD-956]
  // removed block quoted from the nodes.
  // Hence using this apt method to correctly get the content insteadof hardcoded index, using
  // index based on the type name.
  const content: NodeSpec = nodes.get(type);
  if (content) {
    // found
    // set custom handling of this plugin
    // [FS] IRAD-1177 2021-02-04
    // Always append to base calls.
    if (content.parseDOM) {
      content.parseDOM[0].getAttrs = nodeAttrs.bind(
        null,
        content.parseDOM[0].getAttrs
      );
    }
    if (content.toDOM) {
      content.toDOM = toDOM.bind(null, content.toDOM);
    }
  }

  return content;
}

function createCapcoNodeAttributes(schema) {
  // Paragraph Capco attribute
  const paragraphContent = getContent(PARAGRAPH, schema, getParagraphNodeAttrs, toParagraphDOM);
  const tableContent = getContent(TABLE, schema, getParagraphNodeAttrs, toParagraphDOM);
  const tableFigureContent = getContent(TABLE_FIGURE, schema, getParagraphNodeAttrs, toParagraphDOM);
  // [FS-AG][21-APR-2020][IRAD-939]
  // Heading CAPCO attribute.
  const headingContent = getContent(HEADING, schema, getParagraphNodeAttrs, toHeadingDOM);

  const contentArr = [
    paragraphContent,
    tableContent,
    tableFigureContent,
    headingContent,
    schema.nodes.paragraph,
    schema.nodes.heading,
    schema.nodes.table,
    schema.nodes.image,
    schema.nodes.enhanced_table_figure,
  ];
  const NEWATTRS = [CAPCOKEY, 'isValidate'];
  contentArr.forEach((content) => {
    createAttribute(content, NEWATTRS, null);
  });
}

function createCapcoDocAttributes(schema: Schema, mode: CAPCOMODE) {
  // Document content is always at top hence accessing it at 1.
  const contentArr = [
    (schema.spec.nodes as NodeSpec).content[1],
    schema.nodes.doc,
  ];
  createCapcoModeDocAttributes(contentArr, mode);

}

function createCapcoModeDocAttributes(contentArr, mode: CAPCOMODE) {
  contentArr.forEach((content) => {
    createAttribute(content, [CAPCOMODEKEY], mode || CAPCOMODE.NONE);
  });
}



export const applyEffectiveSchema = effectiveSchema;
