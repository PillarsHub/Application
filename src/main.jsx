import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider, ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from '@apollo/client/link/context';
import  App from './App.jsx';
import { GetToken } from "./features/authentication/hooks/useToken.jsx"
import BaseUrl from './hooks/baseUrl';

const httpLink = createHttpLink({
  uri: `${BaseUrl}/graphql`,
});

const authLink = setContext((_, { headers }) => {  
  const token = GetToken();
  return {
    headers: {
      ...headers,
      "Content-Type": "application/json", 
      authorization: token ? `Bearer ${token.token}` : "",
    }
  }
}); 

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);