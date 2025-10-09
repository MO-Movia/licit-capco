import {Item} from './item';
import {Compartment} from './compartment';
describe('CapcoCompartment', () => {
  const comp = new Compartment('div');
  it('addItem', () => {
    const item = new Item('SCI', 'Sensitive Compartmented Information');
    const c = comp.addItem(item);
    expect(c).toBeUndefined();
  });

  it('removeItem', () => {
    const item = new Item('SCI', 'Sensitive Compartmented Information');
    comp.addItem(item);
    const c = comp.removeItem('SCI');
    expect(c).toBeUndefined();
  });

  it('getItem', () => {
    const item = new Item('SCI', 'Sensitive Compartmented Information');
    comp.addItem(item);
    const c = comp.getItem('SCI');
    expect(c).toEqual(item);
  });

  it('checkCode', () => {
    const item = new Item('SCI', 'Sensitive Compartmented Information');
    comp.addItem(item);
    const c = comp.checkCode(item);
    expect(c).toBeFalsy();
  });
});
