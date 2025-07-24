import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import OffCanvas from '../../../components/offCanvas';
import { useQuery, gql } from "@apollo/client";
import Avatar from '../../../components/avatar';

let GET_PLACEABLE = gql`query ($nodeIds: [String]!, $treeId: ID!) {
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
        totalChildNodes
        customer {
          fullName
          enrollDate
          profileImage
        }
      }
    }
  }
}`;

const PlacementSuite = ({ nodeId, treeId, shows, onHide, handlePlaceNode }) => {
  const [show, setShow] = useState(false);
  const { data, error } = useQuery(GET_PLACEABLE, {
    variables: { nodeIds: [nodeId], treeId: treeId },
  });

  const handleShowPlacemntModel = (nId) => {
    handlePlaceNode({ nodeId: nId, uplineId: nodeId, disclamerId: "placement" });
  }

  useEffect(() => {
    if (shows) {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [shows]);

  return <OffCanvas id="PlacementSuite" showModal={show} >
    <div className="card-header">
      <h2 className="card-title">
        Placement Suite
      </h2>
      <div className="card-actions">
        <button type="button" className="btn-close text-reset" onClick={onHide} ></button>
      </div>
    </div>
    <div className="overflow-y-scroll">
      <p>{error && `Error loading Holding Tank Data. ${error}`}</p>

      {/* <p>{uplineId}</p>
      <p>{uplineLeg}</p>
      <p>{JSON.stringify(placeData)}</p> */}
      <div className="list-group list-group-flush">
        {data?.tree?.nodes && data.tree.nodes[0].nodes && data.tree.nodes[0].nodes.map((node) => {
          return <div key={node.nodeId} href="#" className="list-group-item list-group-item-action" aria-current="true">
            <div className="row align-items-center">
              <div className="col-auto">
                <a href="#">
                  <Avatar name={node.customer?.fullName} url={node.customer?.profileImage} size="" />
                </a>
              </div>
              <div className="col text-truncate">
                {node.customer?.fullName}
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
    <div className="card-footer">
      <div className="alert alert-warning" role="alert">
        <h4 className="alert-title">Commissions Disclaimer</h4>
        <div className="text-muted">Any Sponsor Tree-based commission paid on the Brand Partner being placed for the open commission month will be removed from your monthly commission and paid to the new Sponsor.</div>
      </div>
    </div>
  </OffCanvas>
}

export default PlacementSuite;

PlacementSuite.propTypes = {
  nodeId: PropTypes.string.isRequired,
  treeId: PropTypes.string.isRequired,
  shows: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  handlePlaceNode: PropTypes.func.isRequired
}
