jest.dontMock('./T');
jest.dontMock('./useTranslate');
jest.dontMock('./tagsTools');
jest.mock('@tolgee/core');

import { render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { T } from './T';

const instantMock = jest.fn(() => 'translated');
const translateMock = jest.fn().mockImplementation(async () => 'translated');
const langChangeUnsubscribe = jest.fn();
const translationChangeUnsubscribe = jest.fn();

let langChangeCallback;

const langChangeSubscribeMock = jest.fn((cb) => {
  langChangeCallback = cb;
  return {
    unsubscribe: langChangeUnsubscribe,
  };
});

let translationChangeCallback;
const translationChangeSubscribeMock = jest.fn((cb) => {
  translationChangeCallback = cb;
  return {
    unsubscribe: translationChangeUnsubscribe,
  };
});

jest.mock('./useTolgeeContext', () => ({
  useTolgeeContext: () => ({
    tolgee: {
      instant: instantMock,
      translate: translateMock,
      onLangChange: {
        subscribe: langChangeSubscribeMock,
      },
      onTranslationChange: {
        subscribe: translationChangeSubscribeMock,
      },
    },
  }),
}));

describe('T component', function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('wraps text with span by default', async () => {
    act(() => {
      render(<T>hello</T>);
    });
    await waitFor(() => {
      const translated = screen.getByText('translated');
      expect(translated.getAttribute('data-tolgee-key-only')).toEqual('hello');
    });
  });

  describe('with TEXT_WRAP strategy', () => {
    let translated;

    beforeEach(async () => {
      act(() => {
        render(<T strategy={'TEXT_WRAP'}>hello</T>);
      });
      await waitFor(() => {
        translated = screen.getByText('translated');
      });
    });

    test('instant fn is called at first', async () => {
      expect(instantMock).toBeCalled();
    });

    test('translate fn is called', async () => {
      expect(translateMock).toBeCalledTimes(1);
    });

    test('translate fn is called with proper params', async () => {
      expect(translateMock).toBeCalledWith({
        defaultValue: undefined,
        key: 'hello',
        noWrap: false,
        params: undefined,
      });
    });

    test('it is not wrapped by span with data attribute', async () => {
      expect(translated.getAttribute('data-tolgee-key-only')).toEqual(null);
    });
  });

  describe('with all strategies', function () {
    ['TEXT_WRAP', 'NO_WRAP', 'ELEMENT_WRAP'].forEach((strategy) => {
      describe(`strategy ${strategy}`, () => {
        test('calls translate function when language is changed', async () => {
          act(() => {
            render(<T strategy={strategy as any}>hello</T>);
          });
          act(() => {
            langChangeCallback();
          });
          act(() => {
            langChangeCallback();
          });

          expect(translateMock).toBeCalledTimes(3);
        });

        test('cleans the subscription', () => {
          act(() => {
            const { unmount } = render(<T strategy={strategy as any}>hello</T>);
            unmount();
          });

          expect(langChangeUnsubscribe).toBeCalledTimes(1);
        });
      });
    });
  });

  describe('with NO_WRAP and ELEMENT_WRAP', function () {
    ['NO_WRAP', 'ELEMENT_WRAP'].forEach((strategy) => {
      describe(`strategy ${strategy}`, () => {
        test('calls translate function when language is changed', () => {
          act(() => {
            render(<T strategy={strategy as any}>hello</T>);
          });
          act(() => {
            translationChangeCallback({ key: 'hello' });
          });
          act(() => {
            translationChangeCallback({ key: 'hello' });
          });
          act(() => {
            translationChangeCallback({ key: 'not hello' });
          });
          expect(translateMock).toBeCalledTimes(3);
        });

        test('cleans the subscription', () => {
          act(() => {
            const { unmount } = render(<T strategy={strategy as any}>hello</T>);
            unmount();
          });
          expect(langChangeUnsubscribe).toBeCalledTimes(1);
        });
      });
    });
  });

  describe('with NO_WRAP strategy', () => {
    let translated;

    beforeEach(async () => {
      act(() => {
        render(<T strategy={'NO_WRAP'}>hello</T>);
      });
      await waitFor(() => {
        translated = screen.getByText('translated');
      });
    });

    test('translate fn is called with proper params', async () => {
      expect(translateMock).toBeCalledWith({
        defaultValue: undefined,
        key: 'hello',
        noWrap: true,
        params: undefined,
      });
    });

    test('it is not wrapped by span with data attribute', async () => {
      expect(translated.getAttribute('data-tolgee-key-only')).toEqual(null);
    });
  });

  describe('with ELEMENT_WRAP strategy', () => {
    let translated;

    beforeEach(async () => {
      render(<T strategy={'ELEMENT_WRAP'}>hello</T>);
      await waitFor(() => {
        translated = screen.getByText('translated');
      });
    });

    test('translate fn is called with proper params', async () => {
      expect(translateMock).toBeCalledWith({
        defaultValue: undefined,
        key: 'hello',
        noWrap: true,
        params: undefined,
      });
    });

    test('it is wrapped by span with data attribute', async () => {
      expect(translated.getAttribute('data-tolgee-key-only')).toEqual('hello');
    });
  });

  describe('with deprecated noWrap property', () => {
    let translated;

    beforeEach(async () => {
      render(<T noWrap>hello</T>);
      await waitFor(() => {
        translated = screen.getByText('translated');
      });
    });

    test('instant fn is called with proper params', async () => {
      expect(instantMock).toBeCalledWith({
        key: 'hello',
        params: undefined,
        noWrap: true,
        orEmpty: true,
        defaultValue: undefined,
      });
    });

    test('translate fn is called with proper params', async () => {
      expect(translateMock).toBeCalledWith({
        defaultValue: undefined,
        key: 'hello',
        noWrap: true,
        params: undefined,
      });
    });

    test('it is not wrapped by span with data attribute', async () => {
      expect(translated.getAttribute('data-tolgee-key-only')).toEqual(null);
    });
  });

  describe('works fine with keyName prop and default value as children', () => {
    beforeEach(async () => {
      act(() => {
        render(<T keyName="what a key">hello</T>);
      });
      await waitFor(() => {
        screen.getByText('translated');
      });
    });

    test('instant fn is called with proper params', async () => {
      expect(instantMock).toBeCalledWith({
        key: 'what a key',
        params: undefined,
        noWrap: true,
        orEmpty: true,
        defaultValue: undefined,
      });
    });

    test('translate fn is called with proper params', async () => {
      expect(translateMock).toBeCalledWith({
        defaultValue: 'hello',
        key: 'what a key',
        noWrap: true,
        params: undefined,
      });
    });
  });
});
