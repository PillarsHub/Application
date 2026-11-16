import React from 'react';
import PropTypes from 'prop-types';
import { GetScope } from '../../authentication/hooks/useToken.jsx';
import { orderPermissions } from '../orderPage.mjs';
import OrderDetailBonuses from '../../../pages/customers/orderDetailBonuses.jsx';

export default function OrderCommissionsWidget({ context, isPreview }) {
  if (isPreview) return <div className="card-body text-muted">Commission details appear here for the selected order. This widget is visible only to corporate users.</div>;
  if (!orderPermissions(GetScope(), context.customerId).canViewCommissions) return null;
  return <OrderDetailBonuses orderId={context.order.id} />;
}

OrderCommissionsWidget.propTypes = { context: PropTypes.object.isRequired, isPreview: PropTypes.bool };
