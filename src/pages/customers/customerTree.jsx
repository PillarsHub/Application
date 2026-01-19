import React, { useEffect, useRef, useState } from 'react';
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { useFetch } from "../../hooks/useFetch";
import PageHeader, { CardHeader } from '../../components/pageHeader.jsx';
import TreeSideCard from './treeComponents/treeSideCard.jsx';
import PeriodDatePicker from '../../components/periodDatePicker.jsx';
import DataLoading from '../../components/dataLoading.jsx';
import { treeBorad } from './treeComponents/treeView.js';
import TreeNode from './treeComponents/treeNode.jsx';
import HoldingTank from './treeComponents/holdingTank.jsx';
import ChangePlacementModal from './treeComponents/changePlacementModal.jsx';
import LoadingNode from './treeComponents/loadingNode.jsx';
import DataError from '../../components/dataError.jsx';
import PlacementSuite from './treeComponents/placementSuite.jsx';
import EmptyContent from '../../components/emptyContent.jsx';

const GET_DATA = gql`
  query ($nodeIds: [String]!, $treeIds: [String]!, $treeId: ID!, $periodDate: Date) {
    customers(idList: $nodeIds) {
      id
      fullName
      nodes (treeId: $treeId){
        totalChildNodes
      }
      treePreferences{
        treeId
        holdingTank
      }
    }
    trees(idList: $treeIds){
      id
      name
      legNames
      enableHoldingTank
      enableCustomerMovements
      movementDurationInDays
      maximumAllowedMovementLevels
    }
    compensationPlans {
      periods(date: $periodDate) { id }
    }
  }
`;

const CustomerTree = () => {
  const params = useParams();
  const [placement, setPlacement] = useState();
  const [activeId, setActiveId] = useState();
  //const [periodDate, setPeriodDate] = useState(new Date().toISOString());
  // pickerDate: what the PeriodDatePicker shows (UI)
  const [pickerDate, setPickerDate] = useState(new Date().toISOString());
  // effectiveDate: what the tree engine & side widgets actually use
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString());

  const [htNode, setHTNode] = useState();
  const [showPlacementSuite, setShowPlacementSuite] = useState(false);
  const [showHoldingTank, setShowHoldingTank] = useState(false);
  const [availableLegButtons, setAvailableLegButtons] = useState([]);

  const treeCleanupRef = useRef(null);
  const treeApiRef = useRef(null);

  const { data, loading, error, refetch } = useQuery(GET_DATA, {
    variables: { nodeIds: [params.customerId], treeIds: [params.treeId], treeId: params.treeId, periodDate: pickerDate },
  });

  const dId = `T${params.treeId}DB`;
  const { data: dashboard, loading: dbLoading, error: dbError } = useFetch(`/api/v1/dashboards/${dId}`, {}, { id: dId, children: [] });

  const handlePeriodChange = (name, value) => {
    // user is browsing a specific point in time
    setPickerDate(value);
    setEffectiveDate(value);
    // keep the tree engine in sync for lazy loads
    if (treeApiRef.current?.setPeriodDate) {
      treeApiRef.current.setPeriodDate(value);
    }
    refetch({ nodeIds: [params.customerId], periodDate: value });
  };

  const handleShow = (node) => setPlacement(node);

  // Prefer surgical node move when ChangePlacementModal completes
  const handleRefreshNode = (move) => {
    // Always switch the tree engine to "now" (current second) when a move is made
    const movedAt = new Date().toISOString();
    setEffectiveDate(movedAt);
    setHTNode(undefined);
    if (treeApiRef.current?.setPeriodDate) {
      treeApiRef.current.setPeriodDate(movedAt);
    }

    if (move && treeApiRef.current?.moveNode) {
      treeApiRef.current.moveNode(move);
      return;
    }
    refetch();
  };

  useEffect(() => {
    // Teardown any existing tree
    if (typeof treeCleanupRef.current === 'function') {
      treeCleanupRef.current();
      treeCleanupRef.current = null;
      treeApiRef.current = null;
    }

    if (data?.customers?.[0]) {
      const cleanup = treeBorad(
        'box',
        params.customerId,
        params.treeId,
        effectiveDate,
        '/graphql',
        function onSelect(node) {
          if (node && node.id !== undefined) {
            setHTNode(undefined);
            setShowPlacementSuite(false);
            setActiveId(node.id);
          } else if (node && node.uplineLeg !== undefined) {
            setActiveId(undefined);
            setShowPlacementSuite(false);
            setHTNode(node);
          } else {
            setActiveId(undefined);
            setShowPlacementSuite(false);
            setHTNode(undefined);
          }
        },
        function renderNode(node) {

          let card = dashboard.children[0];
          let widget = node.customer?.widgets?.find((w) => w.id === card?.widgetId);
          if (node.customer && !widget && (!card.children || card.children.length == 0)) return null;

          return <TreeNode node={node} dashboard={dashboard} trees={data?.trees} date={effectiveDate} />;
        },
        function renderLoading(id) {
          return <LoadingNode node={id} />;
        }
      );

      treeCleanupRef.current = cleanup;
      treeApiRef.current = cleanup?.api ?? null;

      // Subscribe to engine-ready (after root + first gen load) to build buttons
      treeApiRef.current?.onReady?.((info) => {
        // `info.legsWithRealNodeAtRoot` is lowercased; keep original casing for labels from GET_DATA
        const originalLegNames = data?.trees?.[0]?.legNames || [];
        const available = originalLegNames.filter((name) =>
          (info.legsWithRealNodeAtRoot || []).includes(String(name).toLowerCase())
        );
        setAvailableLegButtons(available);
      });
    }

    return () => {
      if (typeof treeCleanupRef.current === 'function') {
        treeCleanupRef.current();
        treeCleanupRef.current = null;
        treeApiRef.current = null;
      }
    };
  }, [data, params.customerId, params.treeId, pickerDate, dashboard]);

  if (loading || dbLoading) return <DataLoading />;
  if (error) return <DataError error={error} />;
  if (dbError) return <DataError error={dbError} />;

  const tree = data?.trees?.find(t => t.id == params.treeId);
  const isToday = new Date(effectiveDate).toDateString() === new Date().toDateString();

  const treeSetting = data?.customers?.[0]?.treePreferences?.find(x => x.treeId == params.treeId) ?? {};

  return (
    <>
      <PageHeader preTitle={`${data?.trees?.[0]?.name} Tree`} title={data?.customers?.[0]?.fullName} pageId="tree" customerId={params.customerId} subPage={params.treeId} >
        <CardHeader>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div>
              <PeriodDatePicker name="periodDate" value={pickerDate} onChange={handlePeriodChange} />
            </div>
            {data?.trees?.[0]?.enableHoldingTank && treeSetting.holdingTank && data?.customers?.[0]?.nodes?.[0]?.totalChildNodes > 1 && (
              <button className="btn btn-primary" onClick={() => setShowHoldingTank(true)}>
                Holding Tank
              </button>
            )}

            {data?.trees?.[0]?.enableCustomerMovements && data?.customers?.[0]?.nodes?.[0]?.totalChildNodes > 1 && (
              <button className="btn btn-primary" onClick={() => setShowPlacementSuite(true)}>
                Placement Suite
              </button>
            )}
          </div>
        </CardHeader>

        {!data?.customers?.[0] && (
          <EmptyContent title="Customer Not Found" text="The customer requested cannot be found." />
        )}

        {!isToday && <>
          <div className="container-xl">
            <div className="alert alert-important alert-info alert-dismissible" role="alert">
              <div className="d-flex">
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="icon alert-icon" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12.01" y2="8" /><polyline points="11 12 12 12 12 16 13 16" /></svg>
                </div>
                <div>
                  The tree structure displayed is from historical data and may not represent the current structure of the tree.
                </div>
              </div>
              <a className="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="close"></a>
            </div>
          </div>
        </>}

        <div id="box" className="h-100" />

        <div className="tree_footer">
          {availableLegButtons?.length > 0 && (
            <div className="card">
              <div className="card-footer">
                <div className="d-flex align-items-center flex-wrap w-100">
                  {availableLegButtons.map((leg, index) => {
                    const count = availableLegButtons.length;

                    // figure out alignment class
                    let alignmentClass = "";
                    if (count === 1) {
                      alignmentClass = "mx-auto"; // center
                    } else if (count === 2) {
                      alignmentClass = index === 0 ? "me-auto" : "ms-auto"; // first left, last right
                    } else {
                      if (index === 0) alignmentClass = "me-auto"; // first left
                      else if (index === count - 1) alignmentClass = "ms-auto"; // last right
                      else alignmentClass = "mx-auto"; // middle ones centered
                    }

                    return (
                      <button
                        key={leg}
                        className={`btn btn-default ${alignmentClass}`}
                        onClick={() =>
                          treeApiRef.current?.goToBottom?.({
                            fromNodeId: params.customerId,
                            leg,
                            mode: "surrogate", // progressive surrogate mode
                          })
                        }
                      >
                        Bottom {leg}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <TreeSideCard
          customerId={activeId}
          periodDate={effectiveDate}
          treeId={params.treeId}
          dashboard={dashboard}
          showModal={handleShow}
        />
        <HoldingTank
          customer={data?.customers?.[0]}
          nodeId={params.customerId}
          periodDate={effectiveDate}
          treeId={params.treeId}
          overrideShow={showHoldingTank}
          uplineId={htNode?.uplineId}
          uplineLeg={htNode?.uplineLeg}
          onHide={() => setShowHoldingTank(false)}
          showModal={handleShow}
        />
        <PlacementSuite
          nodeId={params.customerId}
          periodDate={effectiveDate}
          treeId={params.treeId}
          shows={showPlacementSuite}
          onHide={() => setShowPlacementSuite(false)}
          handlePlaceNode={handleShow}
        />
      </PageHeader>

      <ChangePlacementModal
        tree={tree}
        treeId={params.treeId}
        placement={placement}
        refreshNode={handleRefreshNode}
      />
    </>
  );
};

export default CustomerTree;
