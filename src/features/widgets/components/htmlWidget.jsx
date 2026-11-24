import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from 'prop-types';
import Mustache from 'mustache';
import parse from 'html-react-parser';
import { parse as parseGraphQL, Kind } from 'graphql';
import { SendRequest } from '../../../hooks/usePost.js';
import HtmlFrame from "./htmlFrame.jsx";
import Pagination from "../../../components/pagination.jsx";
import useWidgetTranslations from '../hooks/useWidgetTranslations.js';

function getValueByPath(obj, path) {
  if (!obj || !path) return undefined;

  return path.split('/').reduce((current, key) => {
    if (current == null) return undefined;

    // If current is array, take first element
    if (Array.isArray(current)) {
      current = current[0];
    }

    return current[key];
  }, obj);
}

const DOCUMENT_ONLY_TAG_PATTERN = /<!doctype|<\/?(html|head|body|title|meta|link|base)\b/i;
const DOCUMENT_ONLY_SELECTOR = 'title, meta, link, base';

function stripDocumentOnlyTags(htmlContent) {
  if (typeof htmlContent !== 'string' || !DOCUMENT_ONLY_TAG_PATTERN.test(htmlContent)) {
    return htmlContent ?? '';
  }

  if (typeof DOMParser === 'undefined' || typeof document === 'undefined') {
    return htmlContent
      .replace(/<!doctype[^>]*>/gi, '')
      .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<\/?(html|body)\b[^>]*>/gi, '')
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
      .replace(/<(?:meta|link|base)\b[^>]*\/?>/gi, '')
      .trim();
  }

  const parsed = new DOMParser().parseFromString(htmlContent, 'text/html');
  const template = document.createElement('template');
  template.innerHTML = parsed.body?.innerHTML ?? '';
  template.content.querySelectorAll(DOCUMENT_ONLY_SELECTOR).forEach((element) => element.remove());

  return template.innerHTML;
}


const HtmlWidget = ({ html, customer, widget, date, periodId, isPreview, orderId, order, language: requestedLanguage }) => {
  const { i18n, language } = useWidgetTranslations(widget?.translations, requestedLanguage);
  var [data, setData] = useState({});
  var [query, setQuery] = useState({});
  var [output, setOutput] = useState('<div>Loading</div>');
  var [authCode, setAuthCode] = useState('');
  var [pagingData, setPagingData] = useState({ enabled: false, offset: 0, first: 50 });
  var [totalItems, setTotalItems] = useState(-1);
  var [totalItemsPath, setTotalItemsPath] = useState();
  var [runtimeVariables, setRuntimeVariables] = useState({});

  const buildGraphQLVariables = useCallback(() => {
    const defaults = pagingData.enabled
      ? { offset: pagingData.offset, count: pagingData.first }
      : { offset: 0, count: 15 };

    return {
      customerId: customer.id,
      orderId,
      periodId: periodId,
      date: date,
      ...defaults,
      ...runtimeVariables
    };
  }, [customer.id, orderId, periodId, date, pagingData, runtimeVariables]);

  const buildTemplateContext = useCallback(() => {
    const queryParameters = buildGraphQLVariables();
    return {
      customer,
      customerId: customer.id,
      orderId,
      order,
      authorizationCode: authCode,
      i18n,
      language,
      queryParameters,
      data: { ...data, queryParameters }
    };
  }, [buildGraphQLVariables, customer, orderId, order, authCode, i18n, language, data]);

  const pane = widget?.panes?.[0];
  const usePagination = widget?.settings?.usePagination;
  const totalPath = widget?.settings?.totalPath;
  const useAuthorizationCode = widget?.settings?.useAuthorizationCode;

  useEffect(() => {
    setQuery({ method: pane?.imageUrl?.toLowerCase(), query: pane?.title ?? '' });
    setRuntimeVariables({});
  }, [pane?.title, pane?.imageUrl]);

  useEffect(() => {
    setPagingData(usePagination ? { enabled: true, offset: 0, first: 10 } : { enabled: false, offset: 0, first: 50 });
  }, [usePagination]);

  useEffect(() => { setTotalItemsPath(totalPath); }, [totalPath]);

  useEffect(() => {
    let cancelled = false;
    if (!useAuthorizationCode) setAuthCode('');
    else if (isPreview) setAuthCode('PREVIEW_ONLY_AUTH_TOKEN_DO_NOT_USE_FOR_REAL_AUTH');
    else {
      const encodedUsername = encodeURIComponent(customer.emailAddress);
      SendRequest('GET', `/Authentication/GetAuthorizationCode?username=${encodedUsername}`, {}, data => {
        if (!cancelled) setAuthCode(data.token);
      }, () => { if (!cancelled) setAuthCode(''); });
    }
    return () => { cancelled = true; };
  }, [useAuthorizationCode, isPreview, customer.emailAddress]);

  useEffect(() => {
    if (query && query.query) {
      if (query.method == "api") {
        var url = Mustache.render(query.query, buildTemplateContext());
        try {
          SendRequest('GET', url, {}, (data) => {
            setData({ ...data, queryParameters: buildGraphQLVariables() });
          }, (error, code) => {
            setData({ error: `${code} - ${error}` });
          });
        } catch (error) {
          setData({ error: `${error}` });
        }
      } else if (isLikelyGraphQLQuery(query.query)) {
        const graphQLVariables = buildGraphQLVariables();
        var ttt = { query: query.query, variables: graphQLVariables };
        SendRequest('POST', '/graphql', ttt, (r) => {
          if (r.errors) {
            setData({ error: JSON.stringify(r.errors) });
          } else {
            const total = getValueByPath(r.data, totalItemsPath);
            if (typeof total === 'number') {
              setTotalItems(total);
            }

            setData({ ...r.data, queryParameters: graphQLVariables });
          }
        }, (error, code) => {
          setData({ error: `${code} - ${error}` });
        });
      }
    } else {
      setData({});
    }
  }, [query, customer?.id, pagingData, runtimeVariables, date, periodId, orderId, totalItemsPath])

  useEffect(() => {
    if (html) {
      try {
        var renderedHTML = Mustache.render(html, buildTemplateContext());
        setOutput(renderedHTML);
      } catch {
        //doNothing
      }
    } else {
      setOutput('');
    }
  }, [html, buildTemplateContext])

  const refetch = (pageData) => {
    setPagingData(prev => ({
      ...prev,
      ...pageData
    }));
  };

  const handleQueryVariablesChange = useCallback((newVariables, options = {}) => {
    if (!newVariables || typeof newVariables !== 'object' || Array.isArray(newVariables)) return;

    if (options.replace) {
      setRuntimeVariables({ ...newVariables });
      return;
    }

    setRuntimeVariables(prev => ({
      ...prev,
      ...newVariables
    }));
  }, []);

  var useIframe = widget?.settings?.['useIframe'];

  const frameData = useMemo(() => {
    const clone = { ...customer };
    delete clone.widgets;
    delete clone.cards;
    delete clone.__typename;
    return { ...buildTemplateContext(), customer: clone };
  }, [customer, buildTemplateContext]);

  const renderedOutput = useMemo(() => {
    if (useIframe) return null;
    try {
      return <>{parse(stripDocumentOnlyTags(output))}</>;
    } catch (error) {
      console.error('Error parsing or rendering output:', error);
      return <p>Error parsing or rendering output</p>;
    }
  }, [output, useIframe]);

  if (useIframe) {
    return <>
      <HtmlFrame
        language={language}
        htmlContent={output}
        cssContent={widget.css}
        data={frameData}
        onQueryVariablesChange={handleQueryVariablesChange}
      />
      {pagingData.enabled && (
        <div className="card-footer d-flex align-items-center">
          <Pagination variables={pagingData} refetch={refetch} total={totalItems} />
        </div>
      )}
    </>
  } else {
    return (<>
      {renderedOutput}
      {pagingData.enabled && (
        <div className="card-footer d-flex align-items-center">
          <Pagination variables={pagingData} refetch={refetch} total={totalItems} />
        </div>
      )}
    </>)
  }
}

function isLikelyGraphQLQuery(query) {
  if (typeof query !== 'string') return false;
  try {
    return parseGraphQL(query).definitions.some(definition => definition.kind === Kind.OPERATION_DEFINITION);
  } catch {
    return false;
  }
}


export default HtmlWidget;

HtmlWidget.propTypes = {
  orderId: PropTypes.string,
  order: PropTypes.object,
  date: PropTypes.string,
  periodId: PropTypes.number,
  html: PropTypes.string.isRequired,
  customer: PropTypes.object.isRequired,
  widget: PropTypes.object.isRequired,
  isPreview: PropTypes.bool.isRequired,
  language: PropTypes.string
}
