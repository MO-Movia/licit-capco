import { PluginKey } from 'prosemirror-state';

export const PARAGRAPH = 'paragraph';
export const TABLE = 'table';
export const TABLE_FIGURE = 'enhanced_table_figure';
export const HEADING = 'heading';
export const CAPCOMODEKEY = 'capcoMode';
export const DEFMANUALCAPCOKEY = 'defaultManualCapco';
export const CAPCOKEY = 'capco';
export const METADATAKEY = 'objectMetaData';
export const IMAGE = 'image';
export const TABLE_FIGURE_CAPCO = 'enhanced_table_figure_capco';
export const CAPCO_PLUGIN_KEY = new PluginKey(CAPCOKEY);
export const CAPCOMODESTEPKEY = CAPCOMODEKEY;
export const DEFMANUALCAPCOSTEPKEY = DEFMANUALCAPCOKEY;
export type KeyValuePair = { [key: string]: unknown };
export const NF = 'NF';
