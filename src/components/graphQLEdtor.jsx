import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { GraphiQL } from "graphiql";
import "graphiql/graphiql.css";
import "graphiql/style.css";
import "monaco-editor/min/vs/editor/editor.main.css";
import "./graphQLEditor.css";

import { GetToken } from "../features/authentication/hooks/useToken.jsx";
import BaseUrl from "../hooks/baseUrl.js";

const GraphQLEditor = ({ query, onChange, onFetch }) => {
  const fetcher = useMemo(() => {
    return async (graphQLParams) => {
      const isIntrospection =
        typeof graphQLParams?.query === "string" &&
        graphQLParams.query.includes("IntrospectionQuery");

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

      if (!isIntrospection && onFetch) onFetch(result);
      return result;
    };
  }, [onFetch]);

  return (
    <div style={{ height: "500px" }}>
      <GraphiQL
        fetcher={fetcher}
        initialQuery={query ?? ""}
        onEditQuery={(v) => onChange(v)}
        headerEditorEnabled={false}
        shouldPersistHeaders={false}
        toolbarConfig={{ additionalContent: false }}
      />
    </div>
  );
};

export default GraphQLEditor;

GraphQLEditor.propTypes = {
  query: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onFetch: PropTypes.func,
};
