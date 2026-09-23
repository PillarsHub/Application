import React, { useState } from 'react';
import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
import { useFetch } from "../../hooks/useFetch";
import PageHeader, { CardHeader } from '../../components/pageHeader.jsx';
import TreeSideCard from './treeComponents/treeSideCard.jsx';
import PeriodDatePicker from '../../components/periodDatePicker.jsx';
import DataLoading from '../../components/dataLoading.jsx';
import HoldingTank from './treeComponents/holdingTank.jsx';
import ChangePlacementModal from './treeComponents/changePlacementModal.jsx';
import DataError from '../../components/dataError.jsx';
import PlacementSuite from './treeComponents/placementSuite.jsx';
import EmptyContent from '../../components/emptyContent.jsx';
import FanView from './treeComponents/fanView.jsx';

const NO_LEGS = [];

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
      customerMovementWarning
      customerMovementConfirmation
      movementDurationInDays
      maximumAllowedMovementLevels
    }
    compensationPlans {
      periods(date: $periodDate) { id }
    }
  }
`;

const CustomerFanTree = () => {
  const params = useParams();
  const [placement, setPlacement] = useState();
  const [fanFocusId, setFanFocusId] = useState();
  const [fanDetailsOpen, setFanDetailsOpen] = useState(false);
  const [fanHeaderTarget, setFanHeaderTarget] = useState(null);
  // pickerDate: what the PeriodDatePicker shows (UI)
  const [pickerDate, setPickerDate] = useState(new Date().toISOString());
  // effectiveDate: what the fan & side widgets actually use
  const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString());

  const [htNode, setHTNode] = useState();
  const [showPlacementSuite, setShowPlacementSuite] = useState(false);
  const [showHoldingTank, setShowHoldingTank] = useState(false);
  const { data, loading, error, refetch } = useQuery(GET_DATA, {
    variables: { nodeIds: [params.customerId], treeIds: [params.treeId], treeId: params.treeId, periodDate: pickerDate },
  });

  const dId = `T${params.treeId}DB`;
  const { data: dashboard, loading: dbLoading, error: dbError } = useFetch(`/api/v1/dashboards/${dId}`, {}, { id: dId, children: [] });

  const handlePeriodChange = (name, value) => {
    // user is browsing a specific point in time
    setPickerDate(value);
    setEffectiveDate(value);
    refetch({ nodeIds: [params.customerId], periodDate: value });
  };

  const handleShow = (node) => setPlacement(node);

  const handleSelectNode = (node) => {
    setShowPlacementSuite(false);
    setFanDetailsOpen(false);
    setHTNode(node?.id === undefined && node?.uplineLeg !== undefined ? node : undefined);
  };

  const handleRefreshNode = () => {
    // Refresh the fan at the current time after a placement changes.
    setEffectiveDate(new Date().toISOString());
    setHTNode(undefined);
    refetch();
  };

  if (loading || dbLoading) return <DataLoading />;
  if (error) return <DataError error={error} />;
  if (dbError) return <DataError error={dbError} />;

  const tree = data?.trees?.find(t => t.id == params.treeId);
  const isToday = new Date(effectiveDate).toDateString() === new Date().toDateString();

  const treeSetting = data?.customers?.[0]?.treePreferences?.find(x => x.treeId == params.treeId) ?? {};

  return (
    <>
      <PageHeader className="fan-page" fluid
        preTitle={`${data?.trees?.[0]?.name} Fan Tree`}
        title={data?.customers?.[0]?.fullName}
        titleContent={data?.customers?.[0] ? <div ref={setFanHeaderTarget} /> : undefined}
        pageId="fan" customerId={params.customerId} subPage={params.treeId} >
        <CardHeader>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div>
              <PeriodDatePicker name="periodDate" value={pickerDate} onChange={handlePeriodChange} />
            </div>
            {data?.customers?.[0] && <button type="button" className="btn"
              disabled={!fanFocusId} aria-expanded={fanDetailsOpen} aria-controls="offCanvasCard"
              onClick={() => {
                setFanDetailsOpen(open => !open);
                setShowPlacementSuite(false);
                setHTNode(undefined);
              }}>{fanDetailsOpen ? 'Hide details' : 'Details'}</button>}
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

        {data?.customers?.[0] && <FanView
          rootId={params.customerId}
          rootName={data.customers[0].fullName}
          headerTarget={fanHeaderTarget}
          treeId={params.treeId}
          date={effectiveDate}
          legNames={tree?.legNames || NO_LEGS}
          dashboard={dashboard}
          onSelect={handleSelectNode}
          trees={data?.trees}
          onFocusChange={setFanFocusId}
        />}

        <TreeSideCard
          customerId={fanDetailsOpen ? fanFocusId : undefined}
          periodDate={effectiveDate}
          treeId={params.treeId}
          dashboard={dashboard}
          showModal={handleShow}
          onClose={() => {
            setFanDetailsOpen(false);
          }}
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

export default CustomerFanTree;
