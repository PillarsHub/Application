import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import useToken, { TokenProvider } from "./features/authentication/hooks/useToken.jsx";

// Direct render pages (auth guards)
const Login = lazy(() => import("./pages/account/login.jsx"));
const EnvironmentList = lazy(() => import("./pages/account/environmentList.jsx"));
const ForgotPassword = lazy(() => import("./pages/account/forgotPassword.jsx"));
const ResetPassword = lazy(() => import("./pages/account/resetpassword.jsx"));

// Layouts
const Layout = lazy(() => import("./pages/layout.jsx"));
const CustomerLayout = lazy(() => import("./pages/customerLayout.jsx"));

/** Helper: wraps a dynamic import into a lazy route */
const lazyRoute = (importer) => async () => {
  const mod = await importer();
  return { Component: mod.default ?? mod.Component };
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, lazy: lazyRoute(() => import("./pages/home/home.jsx")) },
      { path: "profile", lazy: lazyRoute(() => import("./pages/account/profile.jsx")) },

      // Customers / Inventory
      { path: "customers", lazy: lazyRoute(() => import("./pages/customers/customers.jsx")) },
      { path: "customers/new", lazy: lazyRoute(() => import("./pages/customers/newCustomer.jsx")) },

      { path: "inventory/stores", lazy: lazyRoute(() => import("./pages/inventory/stores.jsx")) },
      { path: "inventory/categories", lazy: lazyRoute(() => import("./pages/inventory/categories.jsx")) },
      { path: "inventory/products", lazy: lazyRoute(() => import("./pages/inventory/products.jsx")) },
      { path: "inventory/products/new", lazy: lazyRoute(() => import("./pages/inventory/newProduct.jsx")) },
      { path: "inventory/products/:productId/general", lazy: lazyRoute(() => import("./pages/inventory/productDetail.jsx")) },
      { path: "inventory/products/:productId/data", lazy: lazyRoute(() => import("./pages/inventory/productData.jsx")) },
      { path: "inventory/products/:productId/pricing", lazy: lazyRoute(() => import("./pages/inventory/productPricing.jsx")) },
      { path: "inventory/products/:productId/variants", lazy: lazyRoute(() => import("./pages/inventory/productVariants.jsx")) },
      { path: "inventory/products/:productId/images", lazy: lazyRoute(() => import("./pages/inventory/productImages.jsx")) },
      { path: "inventory/products/:productId/bom", lazy: lazyRoute(() => import("./pages/inventory/productBom.jsx")) },

      // Commissions
      { path: "commissions/periods", lazy: lazyRoute(() => import("./pages/commissions/periods.jsx")) },
      { path: "commissions/periods/:periodId/summary", lazy: lazyRoute(() => import("./pages/commissions/periodDetail.jsx")) },
      { path: "commissions/periods/:periodId/volumesummary", lazy: lazyRoute(() => import("./pages/commissions/volumesummary.jsx")) },
      { path: "commissions/periods/:periodId/bonusDetail/:bonusId", lazy: lazyRoute(() => import("./pages/commissions/bonusDetail.jsx")) },
      { path: "commissions/periods/:periodId/rankDetail/:rankId", lazy: lazyRoute(() => import("./pages/commissions/rankDetail.jsx")) },
      { path: "commissions/payables", lazy: lazyRoute(() => import("./pages/commissions/payables.jsx")) },
      { path: "commissions/paid", lazy: lazyRoute(() => import("./pages/commissions/paymentHistory.jsx")) },
      { path: "commissions/paid/:batchId", lazy: lazyRoute(() => import("./pages/commissions/paymentHistoryDetail.jsx")) },
      { path: "compensationPlans", lazy: lazyRoute(() => import("./pages/commissions/planList.jsx")) },
      { path: "compensationPlan/:planId", lazy: lazyRoute(() => import("./pages/commissions/planOverview.jsx")) },

      // Tools / Reports
      { path: "media", lazy: lazyRoute(() => import("./pages/tools/mediaList.jsx")) },
      { path: "media/categories", lazy: lazyRoute(() => import("./pages/tools/mediaCategories.jsx")) },
      { path: "schedule", lazy: lazyRoute(() => import("./pages/tools/schedule.jsx")) },
      { path: "training", lazy: lazyRoute(() => import("./pages/tools/training.jsx")) },
      { path: "training/:courseId", lazy: lazyRoute(() => import("./pages/tools/editCourse.jsx")) },

      { path: "reports", lazy: lazyRoute(() => import("./pages/reports/reports.jsx")) },
      { path: "reports/graphQL", lazy: lazyRoute(() => import("./pages/reports/reportQuery.jsx")) },
      { path: "reports/new", lazy: lazyRoute(() => import("./pages/reports/editReport.jsx")) },
      { path: "reports/:reportId", lazy: lazyRoute(() => import("./pages/reports/report.jsx")) },
      { path: "reports/:reportId/edit", lazy: lazyRoute(() => import("./pages/reports/editReport.jsx")) },

      { path: "query", lazy: lazyRoute(() => import("./pages/reports/reportQuery.jsx")) },
      { path: "tools/adjustments", lazy: lazyRoute(() => import("./pages/tools/adjustments.jsx")) },

      // Settings
      { path: "settings/users", lazy: lazyRoute(() => import("./pages/settings/users.jsx")) },
      { path: "settings/theme", lazy: lazyRoute(() => import("./pages/settings/theme.jsx")) },
      { path: "settings/navigation", lazy: lazyRoute(() => import("./pages/settings/navigation.jsx")) },
      { path: "settings/pages/:pageId/widgets/:widgetId", lazy: lazyRoute(() => import("./pages/settings/editWidget.jsx")) },
      { path: "settings/pages", lazy: lazyRoute(() => import("./pages/settings/pages.jsx")) },
      { path: "settings/pages/:pageId", lazy: lazyRoute(() => import("./pages/settings/pageSettings/customerDetailSettings.jsx")) },
      { path: "settings/pages/tree/:treeId", lazy: lazyRoute(() => import("./pages/settings/pageSettings/treeSettings.jsx")) },
      { path: "settings/widgets", lazy: lazyRoute(() => import("./pages/settings/widgets.jsx")) },
      { path: "settings/widgets/:widgetId", lazy: lazyRoute(() => import("./pages/settings/editWidget.jsx")) },
      { path: "settings/email/providers", lazy: lazyRoute(() => import("./pages/settings/emailSettings.jsx")) },
      { path: "settings/email/content", lazy: lazyRoute(() => import("./pages/settings/emailContent.jsx")) },
      { path: "settings/payments", lazy: lazyRoute(() => import("./pages/settings/payments.jsx")) },
      { path: "settings/regions", lazy: lazyRoute(() => import("./pages/settings/regions.jsx")) },
      { path: "settings/regions/:regionId", lazy: lazyRoute(() => import("./pages/settings/regionDetail.jsx")) },
      { path: "settings/countries", lazy: lazyRoute(() => import("./pages/settings/countries.jsx")) },
      { path: "settings/currency", lazy: lazyRoute(() => import("./pages/settings/currency.jsx")) },
      { path: "settings/salestax", lazy: lazyRoute(() => import("./pages/settings/salesTax.jsx")) },
      { path: "settings/statuses", lazy: lazyRoute(() => import("./pages/settings/statuses.jsx")) },
      { path: "settings/company", lazy: lazyRoute(() => import("./pages/settings/company.jsx")) },
      { path: "settings/trees", lazy: lazyRoute(() => import("./pages/settings/placementRules.jsx")) },
      { path: "settings/orderstatuses", lazy: lazyRoute(() => import("./pages/settings/orderStatuses.jsx")) },

      // Other
      { path: "page/:pageId", lazy: lazyRoute(() => import("./pages/corporatePage.jsx")) },
      { path: "*", lazy: lazyRoute(() => import("./pages/nopage.jsx")) },
    ],
  },

  // Customer routes
  {
    path: "/customers/:customerId",
    element: <CustomerLayout />,
    children: [
      { path: "team", lazy: lazyRoute(() => import("./pages/customers/teamList.jsx")) },
      { path: "edit", lazy: lazyRoute(() => import("./pages/customers/editCustomer.jsx")) },
      { path: "summary", lazy: lazyRoute(() => import("./pages/customers/summary.jsx")) },
      { path: "details", lazy: lazyRoute(() => import("./pages/customers/customerDetail.jsx")) },
      { path: "dashboard", lazy: lazyRoute(() => import("./pages/customers/dashboard.jsx")) },
      { path: "orders", lazy: lazyRoute(() => import("./pages/customers/customerOrders.jsx")) },
      { path: "autoships", lazy: lazyRoute(() => import("./pages/customers/autoships.jsx")) },
      { path: "orders/:orderId", lazy: lazyRoute(() => import("./pages/customers/orderDetail.jsx")) },
      { path: "orders/:orderId/edit", lazy: lazyRoute(() => import("./pages/customers/editOrder.jsx")) },
      { path: "shop", lazy: lazyRoute(() => import("./pages/customers/shop.jsx")) },
      { path: "checkout", lazy: lazyRoute(() => import("./pages/customers/checkout.jsx")) },
      { path: "training", lazy: lazyRoute(() => import("./pages/tools/training.jsx")) },
      { path: "training/:courseId", lazy: lazyRoute(() => import("./pages/customers/course.jsx")) },
      { path: "account/profile", lazy: lazyRoute(() => import("./pages/customers/account/profile.jsx")) },
      { path: "account/security", lazy: lazyRoute(() => import("./pages/customers/account/security.jsx")) },
      { path: "account/moneyin", lazy: lazyRoute(() => import("./pages/customers/account/moneyIn.jsx")) },
      { path: "account/moneyout", lazy: lazyRoute(() => import("./pages/customers/account/moneyOut.jsx")) },
      { path: "account/treesettings", lazy: lazyRoute(() => import("./pages/customers/account/treeSettings.jsx")) },
      { path: "commissions", lazy: lazyRoute(() => import("./pages/customers/commissionsDetail.jsx")) },
      { path: "commissions/:bonusId", lazy: lazyRoute(() => import("./pages/customers/commissionsBonusDetail.jsx")) },
      { path: "tree/:treeId", lazy: lazyRoute(() => import("./pages/customers/customerTree.jsx")) },
      { path: "placements", lazy: lazyRoute(() => import("./pages/customers/placementSuite.jsx")) },
      { path: "reports", lazy: lazyRoute(() => import("./pages/reports/reports.jsx")) },
      { path: "reports/:reportId", lazy: lazyRoute(() => import("./pages/reports/report.jsx")) },
      { path: "media", lazy: lazyRoute(() => import("./pages/tools/mediaList.jsx")) },
      { path: ":pageId", lazy: lazyRoute(() => import("./pages/customers/customerPage.jsx")) },
    ],
  },
]);

function App() {
  const { token, setToken, clearToken } = useToken();
  const path = window.location.pathname.toLowerCase();

  // Auth redirects handled before router
  if (path === "/account/forgotpassword") {
    return (
      <Suspense fallback={<></>}>
        <ForgotPassword />
      </Suspense>
    );
  }
  if (path === "/account/resetpassword") {
    return (
      <Suspense fallback={<></>}>
        <ResetPassword />
      </Suspense>
    );
  }
  if (path === "/account/environments") {
    return (
      <Suspense fallback={<></>}>
        <EnvironmentList setToken={setToken} clearToken={clearToken} />
      </Suspense>
    );
  }

  if (!token) {
    return (
      <Suspense fallback={<></>}>
        <Login setToken={setToken} />
      </Suspense>
    );
  }
  if (!token.environmentId) {
    return (
      <Suspense fallback={<></>}>
        <EnvironmentList setToken={setToken} clearToken={clearToken} />
      </Suspense>
    );
  }

  return (
    <TokenProvider clearToken={clearToken}>
      <RouterProvider router={router} fallbackElement={<></>} />
    </TokenProvider>
  );
}

export default App;
