import { Item } from './item';

describe('item',()=>{
    it('should handle item',()=>{
        const item = new Item('code','description');
        item.addChild(new Item('SCT', 'Sensitive Compartmented Information',2));
        item.removeChild('SCT');
        expect(item).toBeDefined();
    });
    it('should handle getChild',()=>{
        const item = new Item('code','description');
        item.children = [new Item('code', 'Sensitive Compartmented Information',2)];

        expect(item.getChild('string')).toBeUndefined();
    });
    it('should handle checkCode',()=>{
        const item = new Item('code','description');

        expect(item.checkCode(new Item('SCT', 'Sensitive Compartmented Information',2))).toBeFalsy();
    });
});