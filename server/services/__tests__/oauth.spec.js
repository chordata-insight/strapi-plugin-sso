'use strict';
const oauth = require('../../services/oauth');

describe('oauth service', () => {
  const strapi = jest.fn();
  const service = oauth({ strapi });

  describe('locale Find By Header', () => {
    test('Header contains Japanese characters > ja', () => {
      const result = service.localeFindByHeader({
        'accept-language': 'hellojalanguage',
      });
      expect(result).toEqual('ja');
    });

    test('Header does not contain Japanese > en', () => {
      const result = service.localeFindByHeader({
        'accept-language': 'hellolanguageenglish',
      });
      expect(result).toEqual('en');
    });

    test('Header does not contain accept-language > en', () => {
      const result = service.localeFindByHeader({
        'content-type': 'json',
      });
      expect(result).toEqual('en');
    });
  });
});
