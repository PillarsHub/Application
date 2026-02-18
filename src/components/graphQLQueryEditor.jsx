import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { GraphiQL } from "graphiql";
import "graphiql/graphiql.css";
import "graphiql/style.css";
import "monaco-editor/min/vs/editor/editor.main.css";

import { GetToken } from "../features/authentication/hooks/useToken.jsx";
import BaseUrl from "../hooks/baseUrl.js";

const GraphQLQueryEditor = ({ query, variables, onChange, onFetch, className }) => {
  const [_variables, setVariables] = useState(variables ?? "");
  const [introspectionCache, setIntrospectionCache] = useState(null);
  const graphiqlKey = `${variables ?? ""}`;

  useEffect(() => {
    setVariables(variables ?? "");
  }, [variables]);

  const fetcher = useMemo(() => {
    return async (graphQLParams) => {
      const q = typeof graphQLParams?.query === "string" ? graphQLParams.query : "";
      const isIntrospection = q.includes("IntrospectionQuery");

      if (isIntrospection && introspectionCache) return introspectionCache;

      const token = GetToken()?.token;

      const resp = await fetch(`${BaseUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(graphQLParams),
      });

      const result = await resp.json();

      if (isIntrospection) {
        setIntrospectionCache(result);
      } else if (onFetch) {
        onFetch(result);
      }

      return result;
    };
  }, [BaseUrl, introspectionCache, onFetch]);

  const handleQueryChange = (newQuery) => {
    onChange(newQuery ?? "");
  };

  const handleVariablesChange = (newVariables) => {
    setVariables(newVariables ?? "");
  };

  return (
    <div className={className ?? ""}>
      <style>
        {`
          .graphiql-container{
            min-height: 500px;
          }

          /* Hide "new tab" / sessions UI affordances */
          .graphiql-tab-add {
            display: none !important;
          }

          .graphiql-sessions,
          .graphiql-session,
          .graphiql-editors {
            margin: 0 !important;
            border-radius: 0 !important;
          }

          .graphiql-session-header{
            display: none !important;
          }

          /* Optional: match your light background */
          .graphiql-response{
            background-color: var(--tblr-light);
          }

          .graphiql-container .graphiql-editors.full-height {
            margin: 0;
          }
        `}
      </style>

      <GraphiQL
        key={graphiqlKey}
        fetcher={fetcher}
        initialQuery={query ?? ""}
        initialVariables={_variables}
        onEditQuery={handleQueryChange}
        onEditVariables={handleVariablesChange}
        defaultQuery=""
      />
    </div>
  );
};

export default GraphQLQueryEditor;

GraphQLQueryEditor.propTypes = {
  query: PropTypes.string,
  variables: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onFetch: PropTypes.func,
  className: PropTypes.string,
};
