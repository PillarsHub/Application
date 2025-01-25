import React, { useState } from 'react';
import { GraphiQL } from 'graphiql';
import 'graphiql/graphiql.css';
import { GetToken } from '../../features/authentication/hooks/useToken';
import BaseUrl from '../../hooks/baseUrl';

const QueryBuilder = () => {
  const [introspectionCache, setIntrospectionCache] = useState();

  const fetcher = async (graphQLParams) => {
    var isIntrospection = graphQLParams.query.includes('query IntrospectionQuery ')
    if (isIntrospection && introspectionCache) return introspectionCache;

    const data = await fetch(`${BaseUrl}/graphQL`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': GetToken()?.token
      },
      body: JSON.stringify(graphQLParams),
    });

    var result = data.json();
    if (isIntrospection) setIntrospectionCache(result);
    return result;
  };

  return (
    <>
      <div className="page-wrapper">
        <style>
          {`
          .graphiql-container{
            min-height: 500px
          }

          .graphiql-session-header {
            margin-bottom: -17px;
          }
        
          .graphiql-sessions{
            margin: 0 !important;
            border-radius: 0 !important;
          }

          .graphiql-session{
            padding: 0 !important;
            border-radius: 0 !important;
          }

          .graphiql-editors{
            margin: 0 !important;
            border-radius: 0 !important;
          }

          .graphiql-session-header{
            display: none !important;
          }

          3.graphiql-response{
            background-color: var(--tblr-light);
          }

        `}
        </style>

        <GraphiQL
          fetcher={fetcher}
        />
      </div>
    </>
  );
};

export default QueryBuilder;
