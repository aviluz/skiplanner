/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import About from './pages/About';
import ArticlePage from './pages/ArticlePage';
import Articles from './pages/Articles';
import AccessibilityStatement from './pages/AccessibilityStatement';
import AccommodationStep from './pages/AccommodationStep';
import AdminClickTracking from './pages/AdminClickTracking';
import AdminInsurance from './pages/AdminInsurance';
import AdminPanel from './pages/AdminPanel';
import AgentChat from './pages/AgentChat';
import CarStep from './pages/CarStep';
import Destinations from './pages/Destinations';
import EquipmentStep from './pages/EquipmentStep';
import ExpenseTracker from './pages/ExpenseTracker';
import Feedback from './pages/Feedback';
import FinalChecklist from './pages/FinalChecklist';
import FlightStep from './pages/FlightStep';
import Guides from './pages/Guides';
import Home from './pages/Home';
import InsuranceStep from './pages/InsuranceStep';
import Insurances from './pages/Insurances';
import LegalDocument from './pages/LegalDocument';
import LessonsStep from './pages/LessonsStep';
import MyTrips from './pages/MyTrips';
import PlanTrip from './pages/PlanTrip';
import Profile from './pages/Profile';
import RecommendedDestinations from './pages/RecommendedDestinations';
import RecommendedLinks from './pages/RecommendedLinks';
import SkiDeals from './pages/SkiDeals';
import SkiDestinationDetail from './pages/SkiDestinationDetail';
import SkiPassNotice from './pages/SkiPassNotice';
import TermsOfUse from './pages/TermsOfUse';
import TransferStep from './pages/TransferStep';
import TransportChoice from './pages/TransportChoice';
import TripCompletion from './pages/TripCompletion';
import TripDetails from './pages/TripDetails';
import VipForm from './pages/VipForm';
import VipThankYou from './pages/VipThankYou';
import __Layout from './Layout.jsx';

export const PAGES = {
    "About": About,
    "ArticlePage": ArticlePage,
    "Articles": Articles,
    "AccessibilityStatement": AccessibilityStatement,
    "AccommodationStep": AccommodationStep,
    "AdminClickTracking": AdminClickTracking,
    "AdminInsurance": AdminInsurance,
    "AdminPanel": AdminPanel,
    "AgentChat": AgentChat,
    "CarStep": CarStep,
    "Destinations": Destinations,
    "EquipmentStep": EquipmentStep,
    "ExpenseTracker": ExpenseTracker,
    "Feedback": Feedback,
    "FinalChecklist": FinalChecklist,
    "FlightStep": FlightStep,
    "Guides": Guides,
    "Home": Home,
    "InsuranceStep": InsuranceStep,
    "Insurances": Insurances,
    "LegalDocument": LegalDocument,
    "LessonsStep": LessonsStep,
    "MyTrips": MyTrips,
    "PlanTrip": PlanTrip,
    "Profile": Profile,
    "RecommendedDestinations": RecommendedDestinations,
    "RecommendedLinks": RecommendedLinks,
    "SkiDeals": SkiDeals,
    "SkiDestinationDetail": SkiDestinationDetail,
    "SkiPassNotice": SkiPassNotice,
    "TermsOfUse": TermsOfUse,
    "TransferStep": TransferStep,
    "TransportChoice": TransportChoice,
    "TripCompletion": TripCompletion,
    "TripDetails": TripDetails,
    "VipForm": VipForm,
    "VipThankYou": VipThankYou,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};