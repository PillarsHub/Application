import React, { Suspense, lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import useToken from "./features/authentication/hooks/useToken";
import { TokenProvider } from "./features/authentication/hooks/useToken";

// Direct render pages (auth guards)
const Login = lazy(() => import("./pages/account/login"));
const EnvironmentList = lazy(() => import("./pages/account/environmentList"));
const ForgotPassword = lazy(() => import("./pages/account/forgotPassword"));
const ResetPassword = lazy(() => import("./pages/account/resetpassword"));

// Layouts
const Layout = lazy(() => import("./pages/layout"));
const CustomerLayout = lazy(() => import("./pages/customerLayout"));

/** Helper: wraps a dynamic import into a lazy route */
const lazyRoute = (importer) => async () => {
  const mod = await importer();
  return { Component: mod.default ?? mod.Component };
};

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

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout clearToken={clearToken} />,
      children: [
        { index: true, lazy: lazyRoute(() => import("./pages/home/home")) },
        { path: "profile", lazy: lazyRoute(() => import("./pages/account/profile")) },

        // Customers / Inventory
        { path: "customers", lazy: lazyRoute(() => import("./pages/customers/customers")) },
        { path: "customers/new", lazy: lazyRoute(() => import("./pages/customers/newCustomer")) },

        { path: "inventory/stores", lazy: lazyRoute(() => import("./pages/inventory/stores")) },
        { path: "inventory/categories", lazy: lazyRoute(() => import("./pages/inventory/categories")) },
        { path: "inventory/products", lazy: lazyRoute(() => import("./pages/inventory/products")) },
        { path: "inventory/products/new", lazy: lazyRoute(() => import("./pages/inventory/newProduct")) },
        { path: "inventory/products/:productId/general", lazy: lazyRoute(() => import("./pages/inventory/productDetail")) },
        { path: "inventory/products/:productId/data", lazy: lazyRoute(() => import("./pages/inventory/productData")) },
        { path: "inventory/products/:productId/pricing", lazy: lazyRoute(() => import("./pages/inventory/productPricing")) },
        { path: "inventory/products/:productId/variants", lazy: lazyRoute(() => import("./pages/inventory/productVariants")) },
        { path: "inventory/products/:productId/images", lazy: lazyRoute(() => import("./pages/inventory/productImages")) },
        { path: "inventory/products/:productId/bom", lazy: lazyRoute(() => import("./pages/inventory/productBom")) },

        // Commissions
        { path: "commissions/periods", lazy: lazyRoute(() => import("./pages/commissions/periods")) },
        { path: "commissions/periods/:periodId/summary", lazy: lazyRoute(() => import("./pages/commissions/periodDetail")) },
        { path: "commissions/periods/:periodId/volumesummary", lazy: lazyRoute(() => import("./pages/commissions/volumesummary")) },
        { path: "commissions/periods/:periodId/bonusDetail/:bonusId", lazy: lazyRoute(() => import("./pages/commissions/bonusDetail")) },
        { path: "commissions/periods/:periodId/rankDetail/:rankId", lazy: lazyRoute(() => import("./pages/commissions/rankDetail")) },
        { path: "commissions/payables", lazy: lazyRoute(() => import("./pages/commissions/payables")) },
        { path: "commissions/paid", lazy: lazyRoute(() => import("./pages/commissions/paymentHistory")) },
        { path: "commissions/paid/:batchId", lazy: lazyRoute(() => import("./pages/commissions/paymentHistoryDetail")) },
        { path: "compensationPlans", lazy: lazyRoute(() => import("./pages/commissions/planList")) },
        { path: "compensationPlan/:planId", lazy: lazyRoute(() => import("./pages/commissions/planOverview")) },

        // Tools / Reports
        { path: "media", lazy: lazyRoute(() => import("./pages/tools/mediaList")) },
        { path: "schedule", lazy: lazyRoute(() => import("./pages/tools/schedule")) },
        { path: "training", lazy: lazyRoute(() => import("./pages/tools/training")) },
        { path: "training/:courseId", lazy: lazyRoute(() => import("./pages/tools/editCourse")) },

        { path: "reports", lazy: lazyRoute(() => import("./pages/reports/reports")) },
        { path: "reports/graphQL", lazy: lazyRoute(() => import("./pages/reports/reportQuery")) },
        { path: "reports/new", lazy: lazyRoute(() => import("./pages/reports/editReport")) },
        { path: "reports/:reportId", lazy: lazyRoute(() => import("./pages/reports/report")) },
        { path: "reports/:reportId/edit", lazy: lazyRoute(() => import("./pages/reports/editReport")) },

        { path: "query", lazy: lazyRoute(() => import("./pages/tools/queryBuilder")) },
        { path: "tools/adjustments", lazy: lazyRoute(() => import("./pages/tools/adjustments")) },

        // Settings
        { path: "settings/users", lazy: lazyRoute(() => import("./pages/settings/users")) },
        { path: "settings/theme", lazy: lazyRoute(() => import("./pages/settings/theme")) },
        { path: "settings/navigation", lazy: lazyRoute(() => import("./pages/settings/navigation")) },
        { path: "settings/pages/:pageId/widgets/:widgetId", lazy: lazyRoute(() => import("./pages/settings/editWidget")) },
        { path: "settings/pages", lazy: lazyRoute(() => import("./pages/settings/pages")) },
        { path: "settings/pages/:pageId", lazy: lazyRoute(() => import("./pages/settings/pageSettings/customerDetailSettings")) },
        { path: "settings/pages/tree/:treeId", lazy: lazyRoute(() => import("./pages/settings/pageSettings/treeSettings")) },
        { path: "settings/widgets", lazy: lazyRoute(() => import("./pages/settings/widgets")) },
        { path: "settings/widgets/:widgetId", lazy: lazyRoute(() => import("./pages/settings/editWidget")) },
        { path: "settings/email/providers", lazy: lazyRoute(() => import("./pages/settings/emailSettings")) },
        { path: "settings/email/content", lazy: lazyRoute(() => import("./pages/settings/emailContent")) },
        { path: "settings/payments", lazy: lazyRoute(() => import("./pages/settings/payments")) },
        { path: "settings/regions", lazy: lazyRoute(() => import("./pages/settings/regions")) },
        { path: "settings/regions/:regionId", lazy: lazyRoute(() => import("./pages/settings/regionDetail")) },
        { path: "settings/countries", lazy: lazyRoute(() => import("./pages/settings/countries")) },
        { path: "settings/currency", lazy: lazyRoute(() => import("./pages/settings/currency")) },
        { path: "settings/salestax", lazy: lazyRoute(() => import("./pages/settings/salesTax")) },
        { path: "settings/statuses", lazy: lazyRoute(() => import("./pages/settings/statuses")) },
        { path: "settings/company", lazy: lazyRoute(() => import("./pages/settings/company")) },
        { path: "settings/trees", lazy: lazyRoute(() => import("./pages/settings/placementRules")) },
        { path: "settings/orderstatuses", lazy: lazyRoute(() => import("./pages/settings/orderStatuses")) },

        // Other
        { path: "page/:pageId", lazy: lazyRoute(() => import("./pages/corporatePage")) },
        { path: "*", lazy: lazyRoute(() => import("./pages/nopage")) },
      ],
    },

    // Customer routes
    {
      path: "/customers/:customerId",
      element: <CustomerLayout clearToken={clearToken} />,
      children: [
        { path: "team", lazy: lazyRoute(() => import("./pages/customers/teamList")) },
        { path: "edit", lazy: lazyRoute(() => import("./pages/customers/editCustomer")) },
        { path: "summary", lazy: lazyRoute(() => import("./pages/customers/summary")) },
        { path: "details", lazy: lazyRoute(() => import("./pages/customers/customerDetail")) },
        { path: "dashboard", lazy: lazyRoute(() => import("./pages/customers/dashboard")) },
        { path: "orders", lazy: lazyRoute(() => import("./pages/customers/customerOrders")) },
        { path: "autoships", lazy: lazyRoute(() => import("./pages/customers/autoships")) },
        { path: "orders/:orderId", lazy: lazyRoute(() => import("./pages/customers/orderDetail")) },
        { path: "orders/:orderId/edit", lazy: lazyRoute(() => import("./pages/customers/editOrder")) },
        { path: "shop", lazy: lazyRoute(() => import("./pages/customers/shop")) },
        { path: "checkout", lazy: lazyRoute(() => import("./pages/customers/checkout")) },
        { path: "training", lazy: lazyRoute(() => import("./pages/tools/training")) },
        { path: "training/:courseId", lazy: lazyRoute(() => import("./pages/customers/course")) },
        { path: "account/profile", lazy: lazyRoute(() => import("./pages/customers/account/profile")) },
        { path: "account/security", lazy: lazyRoute(() => import("./pages/customers/account/security")) },
        { path: "account/moneyin", lazy: lazyRoute(() => import("./pages/customers/account/moneyIn")) },
        { path: "account/moneyout", lazy: lazyRoute(() => import("./pages/customers/account/moneyOut")) },
        { path: "account/treesettings", lazy: lazyRoute(() => import("./pages/customers/account/treeSettings")) },
        { path: "commissions", lazy: lazyRoute(() => import("./pages/customers/commissionsDetail")) },
        { path: "commissions/:bonusId", lazy: lazyRoute(() => import("./pages/customers/commissionsBonusDetail")) },
        { path: "tree/:treeId", lazy: lazyRoute(() => import("./pages/customers/customerTree")) },
        { path: "placements", lazy: lazyRoute(() => import("./pages/customers/placementSuite")) },
        { path: "reports", lazy: lazyRoute(() => import("./pages/reports/reports")) },
        { path: "reports/:reportId", lazy: lazyRoute(() => import("./pages/reports/report")) },
        { path: "media", lazy: lazyRoute(() => import("./pages/tools/mediaList")) },
        { path: ":pageId", lazy: lazyRoute(() => import("./pages/customers/customerPage")) },
      ],
    },
  ]);

  return (
    <TokenProvider clearToken={clearToken}>
      <RouterProvider router={router} fallbackElement={<></>} />
    </TokenProvider>
  );
}

export default App;
