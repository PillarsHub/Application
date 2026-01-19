import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import DataError from "../../../components/dataError";
import DataLoading from "../../../components/dataLoading";
import EmptyContent from "../../../components/emptyContent";

var GET_DATA = gql`query ($customerId: String, $treeId: ID!, $enrolledTypes: [Decimal]) {
  customers(idList: [$customerId]) {
    nodes(treeId: $treeId) {
      nodes(
        customerType: { in: $enrolledTypes }
        enrollDate: {
          between: ["2024-10-01T00:00:00.000Z", "2024-11-01T00:00:00.000Z"]
        }
      ) {
        upline {
          id
          fullName
          customerType {
            id
          }
        }
      }
    }
  }
}`;


function RecruiterWidget({ customerId, treeId, columnTitle, maxRows, timePeriod, recruiterTypes, enrolledTypes, compact, showPercent, isPreview }) {
  const [data, setData] = useState();
  const [error, setError] = useState();
  const [loading, setLoading] = useState();
  const { refetch } = useQuery(GET_DATA, { skip: true });

  useEffect(() => {
    if (isPreview) {
      setData([...previewData.slice(0, maxRows)])
    } else {
      setLoading(true);
      refetch({ customerId: customerId, treeId: treeId, enrolledTypes: enrolledTypes.map(Number) })
        .then((result) => {
          setLoading(false);
          setData([...convertToData(result, recruiterTypes).slice(0, maxRows)])
        })
        .catch((error) => {
          setError(error);
          setLoading(false);
          console.error('Refetch error:', error);
        });
    }

  }, [customerId, maxRows, timePeriod, recruiterTypes, enrolledTypes, isPreview])

  const tableClass = compact ? 'table table-sm table-borderless' : 'table card-table table-vcenter';
  const containerClass = compact ? 'ps-2 pe-2 pt-1' : 'table-responsive';

  const maxCount = data ? Math.max(...data.map(d => d.count)) : 0;

  if (error) return <DataError error={error} />
  if (loading) return <DataLoading />

  if (data?.length == 0) return <EmptyContent title="No Recent Recruiters" text="Looks like no one has recruited recently. Encourage your team to invite new members and watch the growth happen!" />

  return <>
    <div className={containerClass}>
      <table className={tableClass}>
        <thead>
          <tr >
            <th>{(columnTitle ?? '') != '' ? columnTitle : "Customer Name"}</th>
            <th className="text-end w-25">Enrolled</th>
          </tr>
        </thead>
        <tbody>
          {data && data.map((row) => {
            let percent = Math.round((row.count / maxCount) * 100)

            return <tr key={row.name}>
              <td>
                <div className="progressbg">
                  {showPercent && <div className="progress progressbg-progress">
                    <div className="progress-bar bg-primary-lt" style={{ width: `${percent}%` }} role="progressbar" aria-valuenow={percent} aria-valuemin="0" aria-valuemax="100" aria-label="82.54% Complete">
                      <span className="visually-hidden">{percent}% Complete</span>
                    </div>
                  </div>}
                  <div className="progressbg-text">{row.name}</div>
                </div>
              </td>
              <td className="text-end">{row.count.toLocaleString()}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>
  </>
}

export default RecruiterWidget;

RecruiterWidget.propTypes = {
  customerId: PropTypes.string,
  treeId: PropTypes.string,
  columnTitle: PropTypes.string,
  maxRows: PropTypes.number,
  timePeriod: PropTypes.string,
  recruiterTypes: PropTypes.array,
  enrolledTypes: PropTypes.array,
  compact: PropTypes.bool,
  showPercent: PropTypes.bool,
  isPreview: PropTypes.bool
}

const previewData = [
  { name: "Example Customer", count: 2503 },
  { name: "Second Example", count: 1893 },
  { name: "Third Example", count: 1730 },
  { name: "Fourth Example", count: 1203 },
  { name: "Fifth Example", count: 996 },
  { name: "Sixth Example", count: 252 },
  { name: "Seventh Example", count: 198 }
];

function convertToData(queryResults, recruiterTypes) {

  console.log(recruiterTypes);

  const getCustomerCounts = (array, rTypes) => {
    const counts = array.reduce((acc, item) => {
      const customerId = item.upline.id;
      const customerName = item.upline.fullName;
      const customerType = item.upline.customerType.id;

      if (rTypes.includes(customerType)) {
        if (acc[customerId]) {
          acc[customerId].count += 1;
        } else {
          acc[customerId] = { name: customerName, customerType: customerType, count: 1 };
        }
      }

      return acc;
    }, {});

    return Object.values(counts);
  };

  const nodes = queryResults?.data?.customers?.[0]?.nodes?.[0]?.nodes;

  if (nodes && recruiterTypes) {
    var items = getCustomerCounts(nodes, recruiterTypes);

    return [...items.filter(i => i.count > 0)].sort((a, b) => {
      if (b.count == a.count) {
        return a.level - b.level
      }

      return b.count - a.count
    });
  }
  return [];

  /*if (nodes) {
    var items = nodes.filter(n => recruiterTypes.includes(n.customer.customerType.id)).map((n) => {
      let count = nodes.filter(c => c.uplineId == n.customer.id && enrolledTypes.includes(c.customer.customerType.id)).length;
      return { name: n.customer.fullName, uplineId: n.uplineId, level: n.level, customerType: n.customer.customerType.id, count: count };
    });

    return [...items.filter(i => i.count > 0)].sort((a, b) => {
      if (b.count == a.count) {
        return a.level - b.level
      }

      return b.count - a.count
    });
  }
  return []; */
}