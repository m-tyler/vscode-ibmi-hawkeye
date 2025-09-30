import { expect } from 'chai';
import { capitalize } from '../tools/utils';

describe('Utils', () => {
    describe('capitalize', () => {
        it('should capitalize the first letter of a string', () => {
            expect(capitalize('hello')).to.equal('Hello');
        });

        it('should return an empty string if input is empty', () => {
            expect(capitalize('')).to.equal('');
        });

        it('should not change already capitalized strings', () => {
            expect(capitalize('World')).to.equal('World');
        });
    });
});