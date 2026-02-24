import React from 'react';
import PropTypes from 'prop-types';

const PoolBonusCard = ({ bonuses, qualifications, definitions, customerType, ranks }) => {

  if (!bonuses || bonuses.length == 0) return <></>;

  const generateTableHeader = () => (
    <>
      <th style={{ width: "8%" }}></th>
      {bonuses.map(bonus => {
        let title = '';
        const qualificationKey = bonus.qualification?.key;
        let percent = 92 / (bonuses.length);

        if (qualificationKey === "Rank") {
          title = ranks.find(rank => rank.id === bonus.qualification?.value)?.name;
        } else if (qualificationKey) {
          title = `${definitions.find(def => def.valueId === qualificationKey)?.name} ${bonus.qualification?.value}`;
        } else {
          title = customerType.description;
        }

        return <th key={bonus.key} className="text-center" style={{ width: `${percent}%` }}>{title}</th>;
      })}
    </>
  );

  const generateTableRows = () => (
    <>
      <tr>
        <td>Points</td>
        {bonuses.map(bonus => {
          return <td key={bonus.key} className="text-center">{bonus.points}</td>;
        })}
      </tr>
    </>
  );

  return <>
    <div className="table-responsive">
      <div className="card-table table-vcenter table-responsive">
        <table className="table table-vcenter card-table table-striped">
          <thead>
            <tr>{generateTableHeader()}</tr>
          </thead>
          <tbody>{generateTableRows()}</tbody>
        </table>
      </div>
    </div>

    {qualifications && <>
    </>}
  </>
}

export default PoolBonusCard;

PoolBonusCard.propTypes = {
  bonuses: PropTypes.any.isRequired,
  qualifications: PropTypes.any.isRequired,
  definitions: PropTypes.array.isRequired,
  customerType: PropTypes.object.isRequired,
  ranks: PropTypes.array.isRequired
}
