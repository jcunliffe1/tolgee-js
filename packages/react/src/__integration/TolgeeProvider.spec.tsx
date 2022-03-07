jest.autoMockOff();

import React from 'react';
import '@testing-library/jest-dom/extend-expect';
import { act } from 'react-dom/test-utils';

import mockTranslations from './mockTranslations';
import fetchMock from 'jest-fetch-mock';
import { testConfig } from './testConfig';
import { TolgeeProvider, useTranslate } from '..';
import { render, screen, waitFor } from '@testing-library/react';

const API_URL = 'http://localhost';
const API_KEY = 'dummyApiKey';

export const createFetchMock = () => {
  let resolveCzech;
  let resolveEnglish;
  const czechPromise = new Promise((resolve) => {
    resolveCzech = () => {
      resolve(JSON.stringify({ cs: mockTranslations.cs }));
    };
  });

  const englishPromise = new Promise((resolve) => {
    resolveEnglish = () => {
      resolve(JSON.stringify({ en: mockTranslations.en }));
    };
  });

  const fetch = fetchMock.mockResponse(async (req) => {
    if (req.url.includes('/v2/api-keys/current')) {
      return JSON.stringify(testConfig);
    } else if (req.url.includes('/v2/projects/translations/en')) {
      return englishPromise;
    } else if (req.url.includes('/v2/projects/translations/cs')) {
      return czechPromise;
    }
    throw new Error('Invalid request');
  });
  return { fetch, resolveCzech, resolveEnglish };
};

describe('TolgeeProvider integration', () => {
  const TestComponent = () => {
    const t = useTranslate();
    return (
      <>
        <div data-testid="hello_world">{t('hello_world')}</div>
        <div data-testid="english_fallback">
          {t('english_fallback', 'Default value')}
        </div>
        <div data-testid="non_existant">
          {t('non_existant', 'Default value')}
        </div>
      </>
    );
  };

  describe('regular settings', () => {
    let resolveEnglish;
    let resolveCzech;

    beforeEach(async () => {
      const fetchMock = createFetchMock();
      resolveCzech = fetchMock.resolveCzech;
      resolveEnglish = fetchMock.resolveEnglish;
      fetchMock.fetch.enableMocks();
      act(() => {
        render(
          <TolgeeProvider
            apiUrl={API_URL}
            apiKey={API_KEY}
            loadingFallback="Loading..."
            defaultLanguage="cs"
            fallbackLanguage="en"
          >
            <TestComponent />
          </TolgeeProvider>
        );
      });
    });

    it('shows correctly loading, fallback and default value', async () => {
      expect(screen.queryByText('Loading...')).toBeInTheDocument();
      act(() => {
        resolveCzech();
      });
      await waitFor(() => {
        expect(screen.queryByTestId('hello_world')).toContainHTML(
          'Ahoj světe!'
        );
        expect(screen.queryByTestId('english_fallback')).not.toContainHTML(
          'Default value'
        );
        expect(screen.queryByTestId('non_existant')).not.toContainHTML(
          'Default value'
        );
      });
      act(() => {
        resolveEnglish();
      });
      await waitFor(() => {
        expect(screen.queryByTestId('hello_world')).toContainHTML(
          'Ahoj světe!'
        );
        expect(screen.queryByTestId('english_fallback')).toContainHTML(
          'English fallback'
        );
        expect(screen.queryByTestId('non_existant')).toContainHTML(
          'Default value'
        );
      });
    });
  });

  describe('with preloadFallback', () => {
    let resolveEnglish;
    let resolveCzech;

    beforeEach(async () => {
      const fetchMock = createFetchMock();
      resolveCzech = fetchMock.resolveCzech;
      resolveEnglish = fetchMock.resolveEnglish;
      fetchMock.fetch.enableMocks();
      act(() => {
        render(
          <TolgeeProvider
            apiUrl={API_URL}
            apiKey={API_KEY}
            loadingFallback="Loading..."
            defaultLanguage="cs"
            fallbackLanguage="en"
            preloadFallback
          >
            <TestComponent />
          </TolgeeProvider>
        );
      });
    });

    it('shows correctly loading, fallback and default value', async () => {
      expect(screen.queryByText('Loading...')).toBeInTheDocument();
      act(() => {
        resolveCzech();
      });
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).toBeInTheDocument();
        expect(screen.queryByTestId('hello_world')).not.toBeInTheDocument();
      });
      act(() => {
        resolveEnglish();
      });
      await waitFor(() => {
        expect(screen.queryByTestId('hello_world')).toContainHTML(
          'Ahoj světe!'
        );
        expect(screen.queryByTestId('english_fallback')).toContainHTML(
          'English fallback'
        );
        expect(screen.queryByTestId('non_existant')).toContainHTML(
          'Default value'
        );
      });
    });
  });
});
