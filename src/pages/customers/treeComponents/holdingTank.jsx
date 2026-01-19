import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import OffCanvas from '../../../components/offCanvas.jsx';
import { Post } from '../../../hooks/usePost.js';
import Avatar from '../../../components/avatar.jsx';
import EmptyContent from '../../../components/emptyContent.jsx';

const PAGE_SIZE = 100;

const GET_HoldingTank_PAGED = `
  query ($nodeIds: [String]!, $treeId: ID!, $offset: Int!, $count: Int!) {
    tree(id: $treeId) {
      id
      legNames
      nodes(nodeIds: $nodeIds) {
        nodeId
        uplineId
        uplineLeg
        totalChildNodes
        nodes(levels: 1, offset: $offset, first: $count) {
          nodeId
          uplineId
          uplineLeg
          customer {
            fullName
            enrollDate
            profileImage
          }
        }
      }
    }
  }
`;

const GET_PLACETO = `
  query ($customerId: String!) {
    customers(customerId: { eq: $customerId }) {
      fullName
    }
  }
`;

const GET_BOTTOM = `
  query ($treeId: String!, $nodeIds: [String]!, $leg: String!) {
    trees(idList: [$treeId]) {
      nodes(nodeIds: $nodeIds) {
        bottomPath(leg: $leg) {
          uplineId
          nodeId
          uplineLeg
        }
      }
    }
  }
`;

const HoldingTank = ({ customer, nodeId, periodDate, treeId, overrideShow, uplineId, uplineLeg, showModal, onHide }) => {
  const [show, setShow] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState();
  const [placeUnder, setPlaceUnder] = useState();
  const [loadingFirstPage, setLoadingFirstPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [legNames, setLegNames] = useState();

  // pagination trackers (do NOT depend on filtered count)
  const offsetRef = useRef(0);
  const totalRef = useRef(0);
  const cancelledRef = useRef(false);

  const handleShowPlacemntModel = (node) => {
    showModal({
      nodeId: node.nodeId,
      uplineId,
      uplineLeg,
      fromNodeId: node.uplineId,
      fromLeg: node.uplineLeg,
    });
  };

  const handleShowPlaceBottomLeg = (node, leg) => {
    Post('/graphql', { query: GET_BOTTOM, variables: { treeId: treeId, nodeIds: [nodeId], leg: leg } },
      (r) => {
        var bottomPath = r.data.trees[0].nodes[0].bottomPath;
        var bottomNode = bottomPath[bottomPath.length-1];

        showModal({
          nodeId: node.nodeId,
          uplineId: bottomNode.nodeId,
          uplineLeg: bottomNode.uplineLeg,
          fromNodeId: node.uplineId,
          fromLeg: node.uplineLeg,
        });
      },
      (err) => {
        alert(JSON.stringify(err));
      }
    );


  }

  const handleClose = () => {
    setShow(false);
    onHide();
  }

  // Promise wrapper for Post
  const postGraphQL = (query, variables) =>
    new Promise((resolve, reject) => {
      Post('/graphql', { query, variables }, resolve, reject);
    });

  useEffect(() => {
    if (uplineId) {
      Post(
        '/graphql',
        { query: GET_PLACETO, variables: { customerId: uplineId } },
        (r) => setPlaceUnder(r.data.customers?.[0]),
        (err) => setPlaceUnder({ error: err })
      );
      setShow(true);
    } else {
      setShow(overrideShow);
    }
  }, [uplineId, uplineLeg, overrideShow]);

  // Fetch a page by raw offset and append filtered results
  const fetchPage = async (offset) => {
    const resp = await postGraphQL(GET_HoldingTank_PAGED, {
      nodeIds: [nodeId],
      treeId,
      offset,
      count: PAGE_SIZE,
    });

    setLegNames(resp?.data?.tree?.legNames)
    const nodeBlock = resp?.data?.tree?.nodes?.[0];
    const total = Number(nodeBlock?.totalChildNodes ?? 0);
    totalRef.current = total;

    const pageAll = nodeBlock?.nodes ?? [];
    const pageFiltered = pageAll.filter(
      (n) => n?.uplineLeg?.toLowerCase() === 'holding tank'
    );

    // append filtered items
    setItems((prev) => prev.concat(pageFiltered));

    // advance raw offset regardless of filtered size
    offsetRef.current = offset + PAGE_SIZE;

    // compute hasMore from total, not from filtered page length
    const more = offsetRef.current < totalRef.current;
    setHasMore(more);

    return { more };
  };

  // Progressive load: first page, then background pages until offset >= totalChildNodes
  useEffect(() => {
    cancelledRef.current = false;

    const run = async () => {
      if (!nodeId || !treeId) return;

      // reset
      setError(undefined);
      setItems([]);
      setHasMore(false);
      offsetRef.current = 0;
      totalRef.current = 0;

      try {
        setLoadingFirstPage(true);
        const first = await fetchPage(0);
        if (cancelledRef.current) return;
        setLoadingFirstPage(false);

        if (first.more) {
          setLoadingMore(true);
          while (!cancelledRef.current && offsetRef.current < totalRef.current) {
            await fetchPage(offsetRef.current);
            // allow paint
            await Promise.resolve();
          }
          if (!cancelledRef.current) setLoadingMore(false);
        }
      } catch (e) {
        if (!cancelledRef.current) {
          setLoadingFirstPage(false);
          setLoadingMore(false);
          setError(e?.message ?? 'Unknown error');
        }
      }
    };

    run();
    return () => {
      cancelledRef.current = true;
    };
  }, [nodeId, periodDate, treeId]);

  return (
    <OffCanvas id="HoldingTank" showModal={show}>
      <div className="card-header border-bottom-0 mb-0 pb-0">
        <h2 className="card-title">{customer.fullName} Holding Tank</h2>
        <div className="card-actions">
          <button type="button" className="btn-close text-reset" onClick={handleClose}></button>
        </div>
      </div>

      <div className="card-header mt-0 pt-0">
        {uplineId && <p className="card-subtitle">
          Placing on {placeUnder?.fullName} {uplineLeg}
        </p>}
      </div>

      <div className="overflow-y-scroll h-100">
        {error && <p>Error loading Holding Tank Data. {error}</p>}

        <div className="list-group list-group-flush">
          {(!items || items.length === 0) && !loadingFirstPage && !loadingMore && (
            <EmptyContent
              title="Holding Tank is Empty"
              text="There are no customers in this holding tank"
            />
          )}

          {items?.map((node) => (
            <div
              key={node.nodeId}
              className="list-group-item list-group-item-action"
              aria-current="true"
            >
              <div className="row align-items-center">
                <div className="col-auto">
                  <a href="#">
                    <Avatar
                      name={node.customer?.fullName}
                      url={node.customer?.profileImage}
                      size=""
                    />
                  </a>
                </div>
                <div className="col text-truncate">
                  {node.customer?.fullName}
                  <div className="d-block text-muted text-truncate mt-n1"></div>
                </div>
                <div className="col-auto">
                  <div className="btn-group">
                    <button className="btn" onClick={() => handleShowPlacemntModel(node)}>Place</button>
                    <button data-bs-toggle="dropdown" type="button" className="btn dropdown-toggle dropdown-toggle-split" aria-expanded="false"></button>
                    <div className="dropdown-menu dropdown-menu-end">
                      {legNames.map((legName) => {
                        return <button key={legName} className="dropdown-item" onClick={() => handleShowPlaceBottomLeg(node, legName)}>
                          Place Bottom {legName}
                        </button>
                      })}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}

          {(loadingFirstPage || loadingMore) && (
            <div className="list-group-item text-center text-muted">
              Loading{loadingMore ? ' more' : ''}…
              {totalRef.current > 0 && (
                <div className="small">
                  {Math.min(offsetRef.current, totalRef.current)} / {totalRef.current} loaded
                </div>
              )}
            </div>
          )}

          {!loadingFirstPage && !loadingMore && hasMore && (
            <div className="list-group-item text-center">
              <button
                className="btn btn-link"
                onClick={async () => {
                  try {
                    setLoadingMore(true);
                    await fetchPage(offsetRef.current);
                  } finally {
                    setLoadingMore(false);
                  }
                }}
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </div>
    </OffCanvas>
  );
};

export default HoldingTank;

HoldingTank.propTypes = {
  customer: PropTypes.object.isRequired,
  nodeId: PropTypes.string.isRequired,
  periodDate: PropTypes.string.isRequired,
  treeId: PropTypes.string.isRequired,
  overrideShow: PropTypes.bool.isRequired,
  uplineId: PropTypes.string,
  uplineLeg: PropTypes.string,
  showModal: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired
};
