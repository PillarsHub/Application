import { useCallback, useEffect, useState } from 'react';
import { gql, useApolloClient } from '@apollo/client';
import { loadUnreleasedPages } from './customerGroups.mjs';
import { loadPayableMerchants } from './merchantScope.mjs';

const GET_PAYABLES = gql`
  query ($date: Date!, $offset: Int!, $first: Int!) {
    unreleased(date: $date, offset: $offset, first: $first) {
      nodeId
      bonusTitle
      earningsClass
      amount
      released
      period { id begin end compensationPlanId }
      customer {
        id
        fullName
        webAlias
        status { name statusClass }
      }
    }
  }
`;

const GET_CUSTOMER_MERCHANTS = gql`
  query ($nodeIds: [String!]!, $first: Int!) {
    customers(idList: $nodeIds, first: $first) {
      id
      moneyOutMerchant { id name serviceType }
    }
  }
`;

// Bonus, merchant, and plan changes reuse this complete snapshot. Only a new cutoff date
// or an explicit refresh (for example, a status edit) loads the records again.
export default function usePayables(date) {
  const client = useApolloClient();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({ date: null, revision: -1, rows: null, loading: false, error: null });
  const refetch = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!date) return;
    let current = true;
    setState({ date, revision, rows: null, loading: true, error: null });
    loadUnreleasedPages({
      pageSize: 10000,
      isCurrent: () => current,
      queryPage: async page => {
        const result = await client.query({ query: GET_PAYABLES, variables: { date, ...page }, fetchPolicy: 'no-cache' });
        return result.data?.unreleased;
      },
    }).then(rows => {
      if (!current || !rows) return null;
      return loadPayableMerchants({
        rows,
        isCurrent: () => current,
        queryCustomers: async nodeIds => {
          const result = await client.query({ query: GET_CUSTOMER_MERCHANTS, variables: { nodeIds, first: nodeIds.length }, fetchPolicy: 'no-cache' });
          return result.data?.customers;
        },
      });
    }).then(rows => {
      if (current) setState({ date, revision, rows, loading: false, error: null });
    }).catch(error => {
      if (current) setState({ date, revision, rows: null, loading: false, error });
    });
    return () => { current = false; };
  }, [client, date, revision]);

  const ready = state.date === date && state.revision === revision;
  return {
    rows: ready ? state.rows : null,
    loading: !!date && (!ready || state.loading),
    error: ready ? state.error : null,
    refetch,
  };
}
