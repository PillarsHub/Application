import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { TreeNodeFront } from './treeNode.jsx';
import { loadTreeCardNode } from './treeCardData.js';

const FanCardPreview = ({ node, treeId, date, dashboard, trees, cache }) => {
  const [result, setResult] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (node.empty || node.summary) return;
    let active = true;
    // Avoid loading cards while the pointer is simply passing over segments.
    const timer = setTimeout(() => {
      loadTreeCardNode({ treeId, nodeId: node.nodeId, date }, cache).then(cardNode => {
        if (active) setResult({ cache, nodeId: node.nodeId, node: cardNode });
      }).catch(() => {
        if (active) setResult({ cache, nodeId: node.nodeId, error: true });
      });
    }, cache.has(String(node.nodeId)) ? 0 : 150);
    return () => { active = false; clearTimeout(timer); };
  }, [node.nodeId, node.empty, node.summary, treeId, date, cache, retry]);

  if (node.summary) return <div className="fan-preview-summary">
    <strong>{node.label}{node.childCount != null
      ? 'ly below this position.' : ' across all levels below this position.'}</strong>
    {node.detailLabel && <span>{node.detailLabel} across all levels below this position.</span>}
    {node.hasMore && <span className="text-muted">More direct connections may be available.</span>}
  </div>;
  if (node.empty) return <div className="fan-preview-summary"><strong>Empty {node.uplineLeg}</strong></div>;
  const current = result?.cache === cache && result.nodeId === node.nodeId ? result : null;
  if (current?.node) return <TreeNodeFront key={`${treeId}:${date}:${node.nodeId}`}
    node={current.node} dashboard={dashboard} trees={trees} date={date} />;
  return <div className="fan-preview-summary">
    <strong>{node.customer?.fullName || node.nodeId}</strong>
    <span>#{node.nodeId}</span>
    <span className="text-muted" role="status">
      {current?.error ? 'Unable to load customer card.' : 'Loading customer card…'}
    </span>
    {current?.error && <button type="button" className="btn btn-sm mt-2" onClick={() => {
      setResult(null);
      setRetry(old => old + 1);
    }}>Retry</button>}
  </div>;
};

FanCardPreview.propTypes = {
  node: PropTypes.object.isRequired,
  treeId: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  dashboard: PropTypes.object,
  trees: PropTypes.array,
  cache: PropTypes.instanceOf(Map).isRequired
};

export default FanCardPreview;
