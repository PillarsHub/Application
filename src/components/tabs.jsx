import React, { useState, Children } from 'react';
import PropTypes from 'prop-types';

const Tabs = ({ showTabs = true, fill = false, headerActions, children }) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  const tabs = Children.toArray(children).filter(child => child.type === Tab);

  return <>
    <div className="card">
      <div className={`card-header bg-light ${showTabs ? '' : 'd-none'}`}>
        <ul className={`nav nav-tabs card-header-tabs ${fill ? 'nav-fill' : ''}`}>
          {tabs.map((tab, index) => (
            <li key={index} className="nav-item">
              <a href="#" className={`nav-link ${index === activeTab ? 'active' : ''}`} onClick={(e) => { handleTabClick(index); e.preventDefault(); return false; }}>
                {tab.props.title}
              </a>
            </li>
          ))}
        </ul>
        {headerActions && <div className="card-actions">{headerActions}</div>}
      </div>
      <div className="tab-content">
        {tabs[activeTab]}
      </div>
    </div>
  </>
};

function Tab({ children }) {
  return <>{children}</>;
}

export default Tabs;
export { Tab };

Tab.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

Tabs.propTypes = {
  showTabs: PropTypes.bool,
  fill: PropTypes.bool,
  headerActions: PropTypes.node,
  children: PropTypes.node.isRequired
};
