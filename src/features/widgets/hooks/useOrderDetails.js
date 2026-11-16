import { gql, useQuery } from '@apollo/client';

const GET_ORDER = gql`query ($orderids: [String]!, $nodeIds: [String]!) {
    customers(idList: $nodeIds) {
      id
      fullName
      totalOrders
      orders(idList: $orderids) {
        id
        customerId
        externalIds
        orderDate
        invoiceDate
        orderType
        status
        notes
        statusDetail {
          name
        }
        tracking
        trackingUrl
        subTotal
        shipping
        tax
        discount
        total
        currencyCode
        shipTo
        shipAddress {
          countryCode
          stateCode
          line1
          line2
          line3
          city
          zip
        }
        lineItems
        {
          productId
          description
          quantity
          price
          volume {
            volumeId
            volume
          }
        }
        payments {
            amount
            authorizationNumber
            transactionNumber
            date
            merchant
            response
            paymentType
            reference
            status
        }
        sources{
            sourceGroupId
            value
        }
      }
    }
    sourceGroups{
      id
      sourceType
      dataType
    }
    countries
    {
      iso2
      name
      active
    }
  }`;


export default function useOrderDetails(customerId, orderId) {
  const result = useQuery(GET_ORDER, {
    variables: { orderids: [orderId], nodeIds: [customerId] },
    skip: !customerId || !orderId,
    notifyOnNetworkStatusChange: true
  });
  return {
    ...result,
    context: {
      customerId, orderId,
      customer: result.data?.customers?.[0],
      order: result.data?.customers?.[0]?.orders?.[0],
      countries: result.data?.countries ?? [],
      refetch: result.refetch
    }
  };
}
