import { Post } from '../../../hooks/usePost.js';

// Shared by the tree cards and the fan popup, including legacy Tree-{id} values.
export const treeCardCustomerFields = (dateVariable = '$date') => `
  id webAlias fullName enrollDate profileImage
  status { id name statusClass }
  phoneNumbers { type number }
  emailAddress
  customerType { id name }
  cards(idList: $cardIds, date: ${dateVariable}) {
    name values { value valueName valueId }
  }
  widgets {
    id name title description type showDatePicker
    headerColor headerTextColor headerAlignment
    backgroundColor textColor borderColor css settings
    panes { imageUrl title text description values { text value } }
  }
`;

const TREE_CARD_QUERY = `query FanCard($treeIds: [String]!, $nodeIds: [String]!, $cardIds: [String]!, $date: Date) {
  trees(idList: $treeIds) {
    nodes(nodeIds: $nodeIds, date: $date) {
      nodeId uplineLeg
      customer { ${treeCardCustomerFields()} }
    }
  }
}`;

// The caller owns a cache for a single tree, date and dashboard configuration.
// Keep in-flight promises too, so returning to a node shares its request.
export function loadTreeCardNode({ treeId, nodeId, date }, cache) {
  const id = String(nodeId);
  if (cache.has(id)) return cache.get(id);
  const loading = new Promise((resolve, reject) => {
    Post('/graphql', { query: TREE_CARD_QUERY, variables: {
      treeIds: [String(treeId)], nodeIds: [id], cardIds: [`Tree-${treeId}`], date
    } }, response => {
      const node = response?.data?.trees?.[0]?.nodes?.[0];
      if (response?.errors?.length || !node?.customer) reject(new Error('Unable to load customer card.'));
      else resolve(node);
    }, () => reject(new Error('Unable to load customer card.')));
  }).catch(error => {
    cache.delete(id);
    throw error;
  });
  cache.set(id, loading);
  return loading;
}
