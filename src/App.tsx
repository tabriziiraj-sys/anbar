import { AppProvider, useApp } from "./state";
import Layout from "./components/Layout";
import Login from "./features/Login";
import Dashboard from "./features/Dashboard";
import { CompanyPage, UsersPage, PartiesPage, ProductsPage } from "./features/Base";
import StockDocsPage from "./features/Stock";
import { PaymentsPage, LedgerPage, PurchasesPage, ExpensesPage } from "./features/Money";
import {
  StockReportPage, StockTurnoverPage, InOutReportPage, DebtorsPage, CreditorsPage,
  DepositsReportPage, ExpensesReportPage, UsersActivityPage,
} from "./features/Reports";
import { SettingsPrintPage, SettingsGeneralPage } from "./features/Settings";

function Router() {
  const { user, route, params } = useApp();

  if (!user) return <Login />;

  const page = (() => {
    switch (route) {
      case "dashboard": return <Dashboard />;
      case "company": return <CompanyPage />;
      case "users": return <UsersPage />;
      case "parties": return <PartiesPage params={params} />;
      case "products": return <ProductsPage />;
      case "stock-in": return <StockDocsPage kind="in" params={params} />;
      case "stock-out": return <StockDocsPage kind="out" params={params} />;
      case "stock-onhand": return <StockReportPage params={params} />;
      case "stock-turn": return <StockTurnoverPage params={params} />;
      case "deposits": return <PaymentsPage view="deposits" params={params} />;
      case "payouts": return <PaymentsPage view="payouts" params={params} />;
      case "misc-pay": return <PaymentsPage view="misc" params={params} />;
      case "ledger": return <LedgerPage params={params} />;
      case "purchases": return <PurchasesPage preset="goods" params={params} />;
      case "services": return <PurchasesPage preset="service" params={params} />;
      case "expenses": return <ExpensesPage params={params} />;
      case "rep-stock": return <StockReportPage params={params} />;
      case "rep-inout": return <InOutReportPage />;
      case "rep-debtors": return <DebtorsPage />;
      case "rep-creditors": return <CreditorsPage />;
      case "rep-deposits": return <DepositsReportPage />;
      case "rep-expenses": return <ExpensesReportPage />;
      case "rep-users": return <UsersActivityPage />;
      case "set-print": return <SettingsPrintPage />;
      case "set-general": return <SettingsGeneralPage />;
      default: return <Dashboard />;
    }
  })();

  return <Layout><div key={route + JSON.stringify(params)}>{page}</div></Layout>;
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
