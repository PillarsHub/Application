import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import {GetToken} from "../../../features/authentication/hooks/useToken.jsx"
import OffCanvas from '../../../components/offCanvas.jsx';
import Avatar from '../../../components/avatar.jsx';
import DataLoading from '../../../components/dataLoading.jsx';
import EmptyContent from '../../../components/emptyContent.jsx';

let GET_PLACEABLE = gql`query ($nodeIds: [String]!, $treeId: ID!) {
  tree(id: $treeId) {
    id
    movementDurationInDays
    maximumAllowedMovementLevels
    customerMovementWarning
    nodes(nodeIds: $nodeIds) {
      nodeId
      uplineId
      uplineLeg
      placeDate
      nodes(levels: 1) {
        nodeId
        uplineLeg
        placeDate
        history (first: 3) {
          placeDate
        }
        customer {
          fullName
          enrollDate
          profileImage
        }
      }
    }
  }
}`;

const PlacementSuite = ({ nodeId, periodDate, treeId, shows, onHide, handlePlaceNode }) => {
  const [show, setShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  const [data, setData] = useState();
  const { refetch } = useQuery(GET_PLACEABLE, {
    variables: { nodeIds: [nodeId], treeId: treeId },
    skip: true, // Initially skip the query
  });

  const handleShowPlacemntModel = (node) => {
    handlePlaceNode({ nodeId: node.nodeId, uplineId: nodeId, fromNodeId: node.uplineId, fromLeg: node.uplineLeg, disclamerId: "placement" });
  }

  useEffect(() => {
    setLoading(true);
    refetch({ nodeIds: [nodeId], treeId: treeId })
      .then((result) => {
        setData(result.data)
        setLoading(false);
      })
      .catch((error) => {
        setLoading(false);
        setError(error);
      });
  }, [periodDate])

  useEffect(() => {
    if (shows) {
      setShow(true);
      setSearchTerm("");
    } else {
      setShow(false);
      setSearchTerm("");
    }
  }, [shows]);

  const token = GetToken();

  const disclaimerByClient = {
    // Example keys — swap to whatever you actually have available (clientId, clientKey, etc.)
    default: {
      title: "Placement Suite Disclaimer",
      body: (
        <>
          Before using the placement suite to move a personally enrolled off your first level, please consider the personally enrolled requirements for Rank advancements.
          Please understand that all tree-based sponsor commissions during an open period for activities of this person will be removed from earned commissions and paid to this person's new sponsor
        </>
      ),
    },
    CL10461: {
      title: "Placement Suite Disclaimer",
      body: (
        <>
          Before using the placement suite to move a personally enrolled and sponsored Brand Partner off your first level, please consider the personally enrolled and sponsored Level 1 requirements for Rank advancements.
          Please review the <a href="https://7ity.me/rewards-plan" target="_blank" rel="noreferrer" >Sevinity Rewards Plan</a> or contact your upline for further guidance.
        </>
      ),
    }
  };


  const disclaimer = token.environmentId == 10461 ? disclaimerByClient.CL10461: disclaimerByClient.default;
  const disclaimerReady = !loading && !!data?.tree;
  const customMovementWarning = `${data?.tree?.customerMovementWarning ?? ""}`;
  const hasCustomMovementWarning = hasMeaningfulHtml(customMovementWarning);

  const movementDurationInDays = data?.tree?.movementDurationInDays;

  const validNodes = data?.tree?.nodes?.[0]?.nodes?.filter((node) =>
    isWithinLastDays(node.customer.enrollDate, node.history, movementDurationInDays)
  ) ?? [];
  const sortedNodes = [...validNodes].sort((a, b) =>
    getExpirationTimestamp(a.customer?.enrollDate, movementDurationInDays) -
    getExpirationTimestamp(b.customer?.enrollDate, movementDurationInDays)
  );
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredNodes = normalizedSearch
    ? sortedNodes.filter((node) => {
      const fullName = (node.customer?.fullName ?? "").toLowerCase();
      const nodeRef = String(node.nodeId ?? "").toLowerCase();
      return fullName.includes(normalizedSearch) || nodeRef.includes(normalizedSearch);
    })
    : sortedNodes;

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
      {loading && <DataLoading />}

      {!loading && validNodes.length > 0 && (
        <div className="m-3">
          <input
            type="text"
            className="form-control"
            placeholder="Search customers"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {!loading && validNodes.length == 0 && <EmptyContent title="No placements available at this time." text="" />}
      {!loading && validNodes.length > 0 && filteredNodes.length == 0 && (
        <EmptyContent title="No customers match your search." text="" />
      )}

      <div className="list-group list-group-flush">
        {filteredNodes.length > 0 && filteredNodes.map((node) => {
          return <div key={node.nodeId} href="#" className="list-group-item list-group-item-action" aria-current="true">
            <div className="row align-items-center">
              <div className="col-auto">
                <a href="#">
                  <Avatar name={node.customer?.fullName} url={node.customer?.profileImage} size="" />
                </a>
              </div>
              <div className="col text-truncate">
                {node.customer?.fullName}
                <div className="d-block text-muted text-truncate mt-n1">{getTimeLeft(node.customer.enrollDate, movementDurationInDays)}</div>
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
    {disclaimerReady && (
      <div className="card-footer">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-title">{disclaimer.title}</h4>
          {hasCustomMovementWarning && (
            <div className="text-muted" style={{ whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{ __html: customMovementWarning }} />
          )}
          {!hasCustomMovementWarning && (
            <div className="text-muted">{disclaimer.body}</div>
          )}
        </div>
      </div>
    )}
  </OffCanvas>
}

function hasMeaningfulHtml(value) {
  return !!`${value ?? ""}`
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
}

// Truncate a Date to the minute (drop seconds & milliseconds)
function truncateToMinute(d) {
  const t = new Date(d);
  t.setSeconds(0, 0);
  return t;
}

function isWithinLastDays(dateString, history, movementDurationInDays) {
  if (!dateString || typeof movementDurationInDays !== "number" || movementDurationInDays <= 0) {
    return false;
  }

  if (history?.length > 1) return false;

  const input = new Date(dateString);
  if (isNaN(input)) return false;

  const now = truncateToMinute(new Date());
  const inputMin = truncateToMinute(input);

  const diffMs = now - inputMin;
  if (diffMs < 0) return false; // future dates don't count as "last N days"

  const maxMs = movementDurationInDays * 24 * 60 * 60 * 1000;
  return diffMs <= maxMs;
}

function getTimeLeft(dateString, movementDurationInDays) {
  if (!isWithinLastDays(dateString, null, movementDurationInDays)) return null;

  const now = truncateToMinute(new Date());
  const expiresAt = getExpirationTimestamp(dateString, movementDurationInDays);
  let remainingMs = expiresAt - now;

  if (remainingMs <= 0) return null; // just in case boundary conditions hit exactly

  // Work in whole minutes
  let remainingMinutes = Math.floor(remainingMs / (60 * 1000));

  const days = Math.floor(remainingMinutes / (24 * 60));
  remainingMinutes -= days * 24 * 60;

  const hours = Math.floor(remainingMinutes / 60);
  remainingMinutes -= hours * 60;

  const minutes = remainingMinutes;

  const parts = [];
  if (days) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
  if (minutes || parts.length === 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);

  return parts.join(", ");
}

function getExpirationTimestamp(dateString, movementDurationInDays) {
  const input = truncateToMinute(new Date(dateString));
  return input.getTime() + movementDurationInDays * 24 * 60 * 60 * 1000;
}


export default PlacementSuite;

PlacementSuite.propTypes = {
  nodeId: PropTypes.string.isRequired,
  periodDate: PropTypes.string.isRequired,
  treeId: PropTypes.string.isRequired,
  shows: PropTypes.bool,
  onHide: PropTypes.func.isRequired,
  handlePlaceNode: PropTypes.func.isRequired
}
