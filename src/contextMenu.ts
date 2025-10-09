export type CapcoEle = {
  name?: string;
  isSimpleItem?: boolean;
  appendHr?: boolean;
  isCustomCAPCO?: boolean;
  displayName?: string;
  isCAPCOMode?: boolean;
  action?: fnCB;
  value?: unknown;
  removeAction?: fnCB;
  menu?: unknown;
  items?: CapcoEle[];
};

type fnCB = (_x: unknown) => void;
