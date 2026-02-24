import React from 'react';
import PropTypes from 'prop-types';

const GenerationBonusCard = ({ bonuses, qualifications, definitions, customerType, ranks }) => {

  if (!bonuses || bonuses.length == 0) return <></>;

  const generateTableHeader = () => (
    <>
      <th style={{width: "8%"}}></th>
      {bonuses.map(bonus => {
        let title = '';
        const qualificationKey = bonus.qualification?.key;
        let percent = 90 / (bonuses.length);
        
        if (qualificationKey === "Rank") {
          title = ranks.find(rank => rank.id === bonus.qualification?.value)?.name;
        } else if (qualificationKey) {
          title = `${definitions.find(def => def.valueId === qualificationKey)?.name} ${bonus.qualification?.value}`;
        } else {
          title = customerType.description;
        }

        return <th key={bonus.key} className="text-center" style={{width: `${percent}%`}}>{title}</th>;
      })}
    </>
  );

  const generateTableRows = () => (
    Object.entries(generations).map(([generation, items]) => {
      // Check if any percent value is greater than 0
      const shouldRenderRow = items.some(item => item.percent > 0);
  
      // Render the row only if shouldRenderRow is true
      if (!shouldRenderRow) {
        return null; // or you can return an empty fragment: <></>
      }
  
      return (
        <tr key={generation}>
          <td>Level {generation}</td>
          {bonuses.map(bonus => {
            const generationItem = items.find(x => x.key === bonus.qualification?.value);
            const percentValue = generationItem?.percent;
  
            return (
              <td key={bonus.key} className="text-center">
                {percentValue !== undefined && percentValue > 0 && (
                  <>
                    {percentValue}
                    <span className="small text-muted">%</span>
                  </>
                )}
              </td>
            );
          })}
        </tr>
      );
    }).filter(Boolean) // Filter out null or undefined rows
  );  

  const generations = bonuses.reduce((acc, item) => {
    item.percents.forEach(percentItem => {
      const { generation, percent } = percentItem;
      acc[generation] = acc[generation] || [];
      acc[generation].push({ generation, key: item.qualification?.value, percent });
    });
    return acc;
  }, {});

  return (
    <>
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
  );
}

GenerationBonusCard.propTypes = {
  bonuses: PropTypes.array.isRequired,
  qualifications: PropTypes.any.isRequired,
  definitions: PropTypes.array.isRequired,
  customerType: PropTypes.object.isRequired,
  ranks: PropTypes.array.isRequired
}

export default GenerationBonusCard;
