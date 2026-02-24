import React from 'react';
import PropTypes from 'prop-types';
import GenerationBonusCard from './generationBonusCard.jsx';
import BinaryBonusCard from './binaryBonusCard.jsx';
import PoolBonusCard from './poolBonusCard.jsx';

const BonusesCard = ({ bonuses, definitions, customerTypes, ranks }) => {
  return <>
    <div className="col-lg-12">
      <div className="card">

        {bonuses && bonuses.sort((a, b) => (a.index > b.index) ? 1 : -1).map((bonus) => {
          let customerType = customerTypes?.find(x => x.value == (bonus.customerTypeId ?? "1"));
          return <div key={bonus.id} className="">
            <h2 className="accordion-header" id={`heading-${bonus.id}`}>
              <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target={`#collapse-${bonus.id}`} aria-expanded="true">
                {bonus.name}  ({bonus.periodId})
                {<div className="col-auto ms-1">
                  <span className="form-help" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-html="true" title={`${bonus.volumeKey}: ${bonus.description}`}>?</span>
                </div>}
              </button>
            </h2>
            <div id={`collapse-${bonus.id}`} className="accordion-collapse collapse show" data-bs-parent="#accordion-example">
              <div className="accordion-body pt-0">
                <div className="row row-deck row-cards">
                  <div className="col-lg-@(12 / Model.BonusCustomerTypes(bonus).Length)">
                    <div className="card">
                      <GenerationBonusCard bonuses={bonus.generationBonuses} qualifications={bonus.qualifications} definitions={definitions} customerType={customerType} ranks={ranks} />
                      <BinaryBonusCard bonuses={bonus.binaryBonuses} qualifications={bonus.qualifications} definitions={definitions} customerType={customerType} ranks={ranks}/>
                      <PoolBonusCard bonuses={bonus.poolBonus} qualifications={bonus.qualifications} definitions={definitions} customerType={customerType} ranks={ranks}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        })}

      </div>
    </div>
  </>
};

export default BonusesCard;

BonusesCard.propTypes = {
  bonuses: PropTypes.any.isRequired,
  definitions: PropTypes.any.isRequired,
  customerTypes: PropTypes.any.isRequired,
  ranks: PropTypes.any.isRequired
}
