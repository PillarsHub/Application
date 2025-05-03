import React, { useEffect, useState } from 'react';
import { useParams } from "react-router-dom"
import { useQuery, gql } from "@apollo/client";
import { useFetch } from "../../hooks/useFetch";
import PageHeader, { CardHeader } from '../../components/pageHeader';
import TreeSideCard from './treeComponents/treeSideCard';
import PeriodDatePicker from '../../components/periodDatePicker';
import DataLoading from '../../components/dataLoading';
import { treeBorad } from './treeComponents/treeView.js';
import TreeNode from './treeComponents/treeNode';
import HoldingTank from './treeComponents/holdingTank';
import ChangePlacementModal from './treeComponents/changePlacementModal';
import LoadingNode from './treeComponents/loadingNode.js';
import DataError from '../../components/dataError.js';
import PlacementSuite from './treeComponents/placementSuite.js';
import EmptyContent from '../../components/emptyContent.js';

var GET_DATA = gql`query ($nodeIds: [String]!, $treeIds: [String]!, $treeId: ID!, $periodDate: Date) {
  customers(idList: $nodeIds) {
    id
    fullName
    nodes (treeId: $treeId){
      totalChildNodes
    }
  },
  trees(idList: $treeIds){
    id
    name
    legNames
    enableCustomerMovements
    movementDurationInDays
    maximumAllowedMovementLevels
  },
  compensationPlans {
    periods(date: $periodDate) {
      id
    }
  }
}`;


const CustomerTree = () => {
  let params = useParams();
  //const queryParams = new URLSearchParams(window.location.search);
  //const periodParam = queryParams.get("periodId") ?? "0";
  const [placement, setPlacement] = useState();
  const [activeId, setActiveId] = useState();
  const [periodDate, setPeriodDate] = useState(new Date().toISOString());
  const [htNode, setHTNode] = useState();
  const [showPlacementSuite, setShowPlacementSuite] = useState(false);
  const { data, loading, error, refetch } = useQuery(GET_DATA, {
    variables: { nodeIds: [params.customerId], treeIds: [params.treeId], treeId: params.treeId, periodDate: periodDate },
  });

  const dId = `T${params.treeId}DB`;
  const { data: dashboard, loading: dbLoading, error: dbError } = useFetch(`/api/v1/dashboards/${dId}`, {}, { id: dId, children: [] });

  const handlePeriodChange = (name, value) => {
    setPeriodDate(value);
    refetch({ nodeIds: [params.customerId], periodDate: value });
  };

  const handleShow = (node) => {
    setPlacement(node);
  }

  const handleRefreshNode = () => {
    refetch();
  }

  useEffect(() => {
    if (data && data?.customers?.[0]) {
      treeBorad('box', params.customerId, params.treeId, periodDate, '/graphql',
        function (node) {
          if (node && node.id != undefined) {
            setHTNode();
            setShowPlacementSuite(false)
            setActiveId(node.id);
          } else if (node && node.uplineLeg != undefined) {
            setActiveId();
            setShowPlacementSuite(false)
            setHTNode(node);
          } else {
            setActiveId();
            setShowPlacementSuite(false)
            setHTNode();
          }
        },
        function (node) {
          return <TreeNode node={node} dashboard={dashboard} trees={data?.trees} date={periodDate} />
        },
        function (id) {
          return <LoadingNode node={id} />
        }
      );
    }
  }, [data]);

  if (loading || dbLoading) return <DataLoading />;
  if (error) return <DataError error={error} />
  if (dbError) return <DataError error={dbError} />

  var tree = data.trees.find(t => t.id == params.treeId);

  return <>
    <PageHeader preTitle={`${data?.trees[0].name} Tree`} title={data?.customers?.[0]?.fullName} pageId="tree" customerId={params.customerId} subPage={params.treeId}>
      <CardHeader>
        <div className="d-flex">
          <div className="me-3">
            <PeriodDatePicker value={periodDate} onChange={handlePeriodChange} />
          </div>
          {data?.trees[0].enableCustomerMovements && data?.customers[0]?.nodes[0].totalChildNodes > 2 && <>
            <button className="btn btn-primary" onClick={() => setShowPlacementSuite(true)}>Placement Suite</button>
          </>}
        </div>
      </CardHeader>

      {(!data?.customers?.[0]) && <>
        <EmptyContent title="Customer Not Found" text="The customer requested cannot be found." ></EmptyContent>
      </>}

      <div id="box" className="h-100" ></div>

      <TreeSideCard customerId={activeId} periodDate={periodDate} treeId={params.treeId} dashboard={dashboard} showModal={handleShow} />
      <HoldingTank nodeId={params.customerId} treeId={params.treeId} uplineId={htNode?.uplineId} uplineLeg={htNode?.uplineLeg} showModal={handleShow} />
      <PlacementSuite nodeId={params.customerId} treeId={params.treeId} shows={showPlacementSuite} onHide={() => setShowPlacementSuite(false)} handlePlaceNode={handleShow} />
    </PageHeader>

    <ChangePlacementModal tree={tree} treeId={params.treeId} placement={placement} refreshNode={handleRefreshNode} />

  </>
}

export default CustomerTree;