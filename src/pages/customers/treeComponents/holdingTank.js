import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import OffCanvas from '../../../components/offCanvas';
import { Post } from '../../../hooks/usePost';
//import { useQuery, gql } from "@apollo/client";
import Avatar from '../../../components/avatar';
import EmptyContent from '../../../components/emptyContent';

let GET_HoldingTank = `query ($nodeIds: [String]!, $treeId: ID!) {
  tree(id: $treeId)
  {
    id
    nodes(nodeIds:$nodeIds)
    {
      nodeId
      uplineId
      uplineLeg
      nodes (levels: 1)
      {
        nodeId
        uplineId
        uplineLeg
        customer{
          fullName
          enrollDate
          profileImage
        }
      }
    }
  }
}`;

let GET_PLACETO = `query ($customerId: String!) {
  customers(customerId: {eq: $customerId}) {
    fullName
  }
}`;

const HoldingTank = ({ nodeId, periodDate, treeId, uplineId, uplineLeg, showModal }) => {
  const [show, setShow] = useState(false);
  const [data, setData] = useState();
  const [error, setError] = useState();
  const [placeUnder, setPlaceUnder] = useState();
  //const { data, error } = useQuery(GET_HoldingTank, {
  //variables: { nodeIds: [nodeId], treeId: treeId },
  //});

  const handleShowPlacemntModel = (node) => {
    showModal({ nodeId: node.nodeId, uplineId: uplineId, uplineLeg: uplineLeg, fromNodeId: node.uplineId, fromLeg: node.uplineLeg });
  }

  const handleClose = () => setShow(false);

  useEffect(() => {
    if (uplineId) {
      Post('/graphql', { query: GET_PLACETO, variables: { customerId: uplineId } }, (r) => {
        setPlaceUnder(r.data.customers[0]);
      }, (error) => {
        setPlaceUnder({ error: error });
      });
      setShow(true);
    } else {
      setShow(false);
    }
  }, [uplineId, uplineLeg]);

  useEffect(() => {
    if (nodeId) {
      //setLoading(true);
      //setShow(true);
      Post('/graphql', { query: GET_HoldingTank, variables: { nodeIds: [nodeId], periodDate: periodDate, treeId: treeId } }, (r) => {
        setData(r.data);
      }, (error) => {
        setError(error);
      });
    } else {
      //setShow(false);
    }
  }, [nodeId, periodDate]);

  const items = data?.tree?.nodes?.[0].nodes.filter(node => node.uplineLeg.toLowerCase() == 'holding tank') ?? [];

  return <OffCanvas id="HoldingTank" showModal={show} >
    <div className="card-header border-bottom-0 mb-0 pb-0">
      <h2 className="card-title">
        Holding Tank
      </h2>
      <div className="card-actions">
        <button type="button" className="btn-close text-reset" onClick={handleClose} ></button>
      </div>
    </div>
    <div className="card-header mt-0 pt-0">
      <p className="card-subtitle">Placing on {placeUnder?.fullName} {uplineLeg}</p>
    </div>
    <div className="overflow-y-scroll">
      {error && <p>Error loading Holding Tank Data. {error}</p>}

      <div className="list-group list-group-flush">
        {!items || items.length == 0 && <>
          <EmptyContent title="Holding Tank is Empty" text="There are no customers in this holding tank" />
        </>}
        {items && items.length > 0 && items.map((node) => {
          return <div key={node.nodeId} href="#" className="list-group-item list-group-item-action" aria-current="true">
            <div className="row align-items-center">
              <div className="col-auto">
                <a href="#">
                  <Avatar name={node.customer?.fullName} url={node.customer?.profileImage} size="" />
                </a>
              </div>
              <div className="col text-truncate">
                {node.customer.fullName}
                <div className="d-block text-muted text-truncate mt-n1"></div>
              </div>
              <div className="col-auto">
                <div className="btn-list flex-nowrap">
                  <button className="btn" onClick={() => handleShowPlacemntModel(node)}>
                    Place
                  </button>
                </div>
              </div>
            </div>
          </div>
        })}
      </div>
    </div>
  </OffCanvas>
}

export default HoldingTank;

HoldingTank.propTypes = {
  nodeId: PropTypes.string.isRequired,
  periodDate: PropTypes.string.isRequired,
  treeId: PropTypes.string.isRequired,
  uplineId: PropTypes.string,
  uplineLeg: PropTypes.string,
  showModal: PropTypes.func.isRequired
}
