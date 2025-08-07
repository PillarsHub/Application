import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import useToken from './features/authentication/hooks/useToken';
import { TokenProvider } from './features/authentication/hooks/useToken';

const Layout = lazy(() => import("./pages/layout"));
const Login = lazy(() => import('./pages/account/login'));
const EnvironmentList = lazy(() => import('./pages/account/environmentList'));
const Home = lazy(() => import("./pages/home/home"));
const Profile = lazy(() => import("./pages/account/profile"));
const Customers = lazy(() => import("./pages/customers/customers"));
const CustomerDetail = lazy(() => import("./pages/customers/customerDetail"));
const CustomerSummary = lazy(() => import("./pages/customers/summary"));
const Users = lazy(() => import("./pages/settings/users"));
const CustomerTree = lazy(() => import("./pages/customers/customerTree"));
const Statuses = lazy(() => import("./pages/settings/statuses"));
const OrderStatuses = lazy(() => import("./pages/settings/orderStatuses"));
const NoPage = lazy(() => import("./pages/nopage"));
const Company = lazy(() => import("./pages/settings/company"));
const SalesTax = lazy(() => import("./pages/settings/salesTax"));
const Currency = lazy(() => import("./pages/settings/currency"));
const Countries = lazy(() => import("./pages/settings/countries"));
const Regions = lazy(() => import("./pages/settings/regions"));
const Payments = lazy(() => import("./pages/settings/payments"));
const RegionDetail = lazy(() => import("./pages/settings/regionDetail"));
const Stores = lazy(() => import("./pages/inventory/stores"));
const Categories = lazy(() => import("./pages/inventory/categories"));
const Products = lazy(() => import("./pages/inventory/products"));
const ProductDetail = lazy(() => import("./pages/inventory/productDetail"));
const ProductData = lazy(() => import("./pages/inventory/productData"));
const ProductPricing = lazy(() => import("./pages/inventory/productPricing"));
const ProductImages = lazy(() => import("./pages/inventory/productImages"));
const ProductVariants = lazy(() => import("./pages/inventory/productVariants"));
const ProductBom = lazy(() => import("./pages/inventory/productBom"));
const Periods = lazy(() => import("./pages/commissions/periods"));
const PeriodDetail = lazy(() => import("./pages/commissions/periodDetail"));
const TeamList = lazy(() => import("./pages/customers/teamList"));
const NewCustomer = lazy(() => import("./pages/customers/newCustomer"));
const EditCustomer = lazy(() => import("./pages/customers/editCustomer"));
const CustomerOrders = lazy(() => import("./pages/customers/customerOrders"));
const EditOrder = lazy(() => import("./pages/customers/editOrder"));
const OrderDetail = lazy(() => import("./pages/customers/orderDetail"));
const NewProduct = lazy(() => import("./pages/inventory/newProduct"));
const CustomerProfile = lazy(() => import("./pages/customers/account/profile"));
const Shop = lazy(() => import("./pages/customers/shop"));
const Checkout = lazy(() => import("./pages/customers/checkout"));
const Adjustments = lazy(() => import("./pages/tools/adjustments"));
const CommissionsDetail = lazy(() => import("./pages/customers/commissionsDetail"));
const CustomerSecurity = lazy(() => import("./pages/customers/account/security"));
const CustomerMoneyOut = lazy(() => import("./pages/customers/account/moneyOut"));
const CustomerMoneyIn = lazy(() => import("./pages/customers/account/moneyIn"));
const Payables = lazy(() => import("./pages/commissions/payables"));
const PaymentHistory = lazy(() => import("./pages/commissions/paymentHistory"));
const VolumeSummary = lazy(() => import("./pages/commissions/volumesummary"));
const CommissionsBonusDetail = lazy(() => import("./pages/customers/commissionsBonusDetail"));
const CustomerTreeSettings = lazy(() => import("./pages/customers/account/treeSettings"));
const ForgotPassword = lazy(() => import("./pages/account/forgotPassword"));
const ResetPassword = lazy(() => import("./pages/account/resetpassword"));
const Reports = lazy(() => import("./pages/reports/reports"));
const Report = lazy(() => import("./pages/reports/report"));
const EditReport = lazy(() => import("./pages/reports/editReport"));
const MediaList = lazy(() => import("./pages/tools/mediaList"));
const Schedule = lazy(() => import("./pages/tools/schedule"));
const Theme = lazy(() => import("./pages/settings/theme"));
const Navigation = lazy(() => import("./pages/settings/navigation"));
const CustomerDetailSettings = lazy(() => import("./pages/settings/pageSettings/customerDetailSettings"));
const TreeSettings = lazy(() => import("./pages/settings/pageSettings/treeSettings"));
const WidgetSettings = lazy(() => import("./pages/settings/widgets"));
const EditWidget = lazy(() => import("./pages/settings/editWidget"));
const Dashboard = lazy(() => import("./pages/customers/dashboard"));
const PaymentHistoryDetail = lazy(() => import("./pages/commissions/paymentHistoryDetail"));
const PlacementRules = lazy(() => import("./pages/settings/placementRules"));
const Training = lazy(() => import("./pages/tools/training"));
const Course = lazy(() => import("./pages/customers/course"));
const EditCourse = lazy(() => import("./pages/tools/editCourse"));
const EmailSettings = lazy(() => import("./pages/settings/emailSettings"));
const EmailContent = lazy(() => import("./pages/settings/emailContent"));
const Autoships = lazy(() => import("./pages/customers/autoships"));
const BonusDetail = lazy(() => import("./pages/commissions/bonusDetail"));
const RankDetail = lazy(() => import("./pages/commissions/rankDetail"));
const Pages = lazy(() => import("./pages/settings/pages"));
const ReportQuery = lazy(() => import("./pages/reports/reportQuery"));
const PlacementSuite = lazy(() => import("./pages/customers/placementSuite"));
const QueryBuilder = lazy(() => import("./pages/tools/queryBuilder"));
const CustomerPage = lazy(() => import("./pages/customers/customerPage"));
const CorporatePage = lazy(() => import("./pages/corporatePage"));

function App() {
  const { token, setToken, clearToken } = useToken();

  if (window.location.pathname.toLowerCase() == '/account/forgotpassword') { return <ForgotPassword /> }
  if (window.location.pathname.toLowerCase() == '/account/resetpassword') { return <ResetPassword /> }
  if (window.location.pathname.toLowerCase() == '/account/environments') { return <EnvironmentList setToken={setToken} clearToken={clearToken} /> }

  if (!token) {
    return <Login setToken={setToken} />
  }

  if (!token.environmentId) {
    return <EnvironmentList setToken={setToken} clearToken={clearToken} />
  }

  return (
    <BrowserRouter>
      <TokenProvider clearToken={clearToken}>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Layout clearToken={clearToken} />}>
              <Route index element={<Home />} />
              <Route path="profile" element={<Profile />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/new" element={<NewCustomer />} />
              <Route path="customers/:customerId/team" element={<TeamList />} />
              <Route path="customers/:customerId/edit" element={<EditCustomer />} />
              <Route path="customers/:customerId/summary" element={<CustomerSummary />} />
              <Route path="customers/:customerId/details" element={<CustomerDetail />} />
              <Route path="customers/:customerId/dashboard" element={<Dashboard />} />
              <Route path="customers/:customerId/orders" element={<CustomerOrders />} />
              <Route path="customers/:customerId/autoships" element={<Autoships />} />
              <Route path="customers/:customerId/orders/:orderId" element={<OrderDetail />} />
              <Route path="customers/:customerId/orders/:orderId/edit" element={<EditOrder />} />
              <Route path="customers/:customerId/shop" element={<Shop />} />
              <Route path="customers/:customerId/checkout" element={<Checkout />} />
              <Route path="customers/:customerId/training" element={<Training />} />
              <Route path="customers/:customerId/training/:courseId" element={<Course />} />
              <Route path="customers/:customerId/account/profile" element={<CustomerProfile />} />
              <Route path="customers/:customerId/account/security" element={<CustomerSecurity />} />
              <Route path="customers/:customerId/account/moneyin" element={<CustomerMoneyIn />} />
              <Route path="customers/:customerId/account/moneyout" element={<CustomerMoneyOut />} />
              <Route path="customers/:customerId/account/treesettings" element={<CustomerTreeSettings />} />
              <Route path="customers/:customerId/commissions" element={<CommissionsDetail />} />
              <Route path="customers/:customerId/commissions/:bonusId" element={<CommissionsBonusDetail />} />
              <Route path="customers/:customerId/tree/:treeId" element={<CustomerTree />} />
              <Route path="customers/:customerId/placements" element={<PlacementSuite />} />
              <Route path="customers/:customerId/reports" element={<Reports />} />
              <Route path="customers/:customerId/reports/:reportId" element={<Report />} />
              <Route path="customers/:customerId/media" element={<MediaList />} />
              <Route path="customers/:customerId/:pageId" element={<CustomerPage />} />
              <Route path="inventory/stores" element={<Stores />} />
              <Route path="inventory/categories" element={<Categories />} />
              <Route path="inventory/products" element={<Products />} />
              <Route path="inventory/products/new" element={<NewProduct />} />
              <Route path="inventory/products/:productId/general" element={<ProductDetail />} />
              <Route path="inventory/products/:productId/data" element={<ProductData />} />
              <Route path="inventory/products/:productId/pricing" element={<ProductPricing />} />
              <Route path="inventory/products/:productId/variants" element={<ProductVariants />} />
              <Route path="inventory/products/:productId/images" element={<ProductImages />} />
              <Route path="inventory/products/:productId/bom" element={<ProductBom />} />
              <Route path="commissions/periods" element={<Periods />} />
              <Route path="commissions/periods/:periodId/summary" element={<PeriodDetail />} />
              <Route path="commissions/periods/:periodId/volumesummary" element={<VolumeSummary />} />
              <Route path="commissions/periods/:periodId/bonusDetail/:bonusId" element={<BonusDetail />} />
              <Route path="commissions/periods/:periodId/rankDetail/:rankId" element={<RankDetail />} />
              <Route path="commissions/payables" element={<Payables />} />
              <Route path="commissions/paid" element={<PaymentHistory />} />
              <Route path="commissions/paid/:batchId" element={<PaymentHistoryDetail />} />
              <Route path="media" element={<MediaList />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="training" element={<Training />} />
              <Route path="training/:courseId" element={<EditCourse />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/graphQL" element={<ReportQuery />} />
              <Route path="reports/new" element={<EditReport />} />
              <Route path="reports/:reportId" element={<Report />} />
              <Route path="reports/:reportId/edit" element={<EditReport />} />
              <Route path="query" element={<QueryBuilder />} />
              <Route path="tools/adjustments" element={<Adjustments />} />
              <Route path="settings/users" element={<Users />} />
              <Route path="settings/theme" element={<Theme />} />
              <Route path="settings/navigation" element={<Navigation />} />
              <Route path="settings/pages/:pageId/widgets/:widgetId" element={<EditWidget />} />
              <Route path="settings/pages" element={<Pages />} />
              <Route path="settings/pages/:pageId" element={<CustomerDetailSettings />} />
              <Route path="settings/pages/tree/:treeId" element={<TreeSettings />} />
              <Route path="settings/widgets" element={<WidgetSettings />} />
              <Route path="settings/widgets" element={<WidgetSettings />} />
              <Route path="settings/widgets/:widgetId" element={<EditWidget />} />
              <Route path="settings/email/providers" element={<EmailSettings />} />
              <Route path="settings/email/content" element={<EmailContent />} />
              <Route path="settings/payments" element={<Payments />} />
              <Route path="settings/regions" element={<Regions />} />
              <Route path="settings/regions/:regionId" element={<RegionDetail />} />
              <Route path="settings/countries" element={<Countries />} />
              <Route path="settings/currency" element={<Currency />} />
              <Route path="settings/salestax" element={<SalesTax />} />
              <Route path="settings/statuses" element={<Statuses />} />
              <Route path="settings/company" element={<Company />} />
              <Route path="settings/trees" element={<PlacementRules />} />
              <Route path="settings/orderstatuses" element={<OrderStatuses />} />
              <Route path="page/:pageId" element={<CorporatePage />} />
              <Route path="*" element={<NoPage />} />
            </Route>
          </Routes>
        </Suspense>
      </TokenProvider>
    </BrowserRouter>
  );
}

export default App;
