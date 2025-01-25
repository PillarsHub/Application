import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import OffCanvas from '../../../components/offCanvas';
import { useQuery, gql } from "@apollo/client";
import Avatar from '../../../components/avatar';
import EmptyContent from '../../../components/emptyContent';

let GET_HoldingTank = gql`query ($nodeIds: [String]!, $treeId: ID!) {
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

const HoldingTank = ({ nodeId, treeId, uplineId, uplineLeg, showModal }) => {
  const [show, setShow] = useState(false);
  const { data, error } = useQuery(GET_HoldingTank, {
    variables: { nodeIds: [nodeId], treeId: treeId },
  });

  const handleShowPlacemntModel = (nodeId) => {
    showModal({ nodeId: nodeId, uplineId: uplineId, uplineLeg: uplineLeg });
  }

  const handleClose = () => setShow(false);

  useEffect(() => {
    if (uplineId) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [uplineId, uplineLeg]);

  const items = data?.tree?.nodes?.[0].nodes.filter(node => node.uplineLeg.toLowerCase() == 'holding tank') ?? [];

  return <OffCanvas id="HoldingTank" showModal={show} >
    <div className="card-header">
      <h2 className="card-title">
        Holding Tank
      </h2>
      <div className="card-actions">
        <button type="button" className="btn-close text-reset" onClick={handleClose} ></button>
      </div>
    </div>
    <div className="overflow-y-scroll">
      <p>{error && `Error loading Holding Tank Data. ${error}`}</p>

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
                  <button className="btn" onClick={() => handleShowPlacemntModel(`${node.nodeId}`)}>
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
  treeId: PropTypes.string.isRequired,
  uplineId: PropTypes.string,
  uplineLeg: PropTypes.string,
  showModal: PropTypes.func.isRequired
}
