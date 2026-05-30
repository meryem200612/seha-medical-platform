import { Routes, Route } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Home from './pages/Home/Home';
import DoctorsPage from './pages/DoctorsPage/DoctorsPage';
import MapSearch from './pages/MapSearch/MapSearch';
import DoctorProfile from './pages/DoctorProfile/DoctorProfile';
import Booking from './pages/Booking/Booking';
import Payment from './pages/Payment/Payment';
import Confirmation from './pages/Confirmation/Confirmation';
import WaitingRoom from './pages/WaitingRoom/WaitingRoom';
import VideoCall from './pages/VideoCall/VideoCall';
import Messaging from './pages/Messaging/Messaging';
import Notifications from './pages/Notifications/Notifications';
import PatientProfile from './pages/PatientProfile/PatientProfile';
import Reviews from './pages/Reviews/Reviews';
import Revenus from './pages/Revenus/Revenus';
import Auth from './pages/Auth/Auth';
import Dashboard from './pages/Dashboard/Dashboard';
import Programs from './pages/Programs/Programs';
import CreateProgram from './pages/CreateProgram/CreateProgram';
import ProgramDetails from './pages/ProgramDetails/ProgramDetails';
import Settings from './pages/Settings/Settings';
import EditProgram from './pages/EditProgram/EditProgram';
import Medications from './pages/Medications/Medications';
import Rendezvous from './pages/Rendezvous/Rendezvous';
import Patients from './pages/Patients/Patients';
import Consultations from './pages/Consultations/Consultations';
import Agenda from './pages/Agenda/Agenda';
import Availability from './pages/Availability/Availability';

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<><Navbar /><Home /><Footer /></>} />
        <Route path="/doctors" element={<><Navbar /><DoctorsPage /><Footer /></>} />
        <Route path="/map" element={<><Navbar /><MapSearch /><Footer /></>} />
        <Route path="/doctor/:id" element={<><Navbar /><DoctorProfile /><Footer /></>} />
        <Route path="/profile/:id" element={<><Navbar /><DoctorProfile /><Footer /></>} />
        <Route path="/booking/:id" element={<><Navbar /><Booking /><Footer /></>} />
        <Route path="/payment" element={<><Navbar /><Payment /><Footer /></>} />
        <Route path="/confirm" element={<><Navbar /><Confirmation /><Footer /></>} />
        <Route path="/waiting" element={<><Navbar /><WaitingRoom /><Footer /></>} />
        <Route path="/video" element={<VideoCall />} />
        <Route path="/messaging" element={<><Navbar /><Messaging /><Footer /></>} />
        <Route path="/messages" element={<><Navbar /><Messaging /><Footer /></>} />
        <Route path="/notifications" element={<><Navbar /><Notifications /><Footer /></>} />
        <Route path="/patient" element={<><Navbar /><PatientProfile /><Footer /></>} />
        <Route path="/medications" element={<><Navbar /><Medications /><Footer /></>} />
        <Route path="/reviews" element={<><Navbar /><Reviews /><Footer /></>} />
        <Route path="/revenus" element={<><Navbar /><Revenus /><Footer /></>} />
        <Route path="/auth" element={<><Navbar /><Auth /><Footer /></>} />
        <Route path="/dashboard" element={<><Navbar /><Dashboard /><Footer /></>} />
        <Route path="/programs" element={<><Navbar /><Programs /><Footer /></>} />
        <Route path="/programmes" element={<><Navbar /><Programs /><Footer /></>} />
        <Route path="/programmes/:id" element={<><Navbar /><ProgramDetails /><Footer /></>} />
        <Route path="/create_program.php" element={<><Navbar /><CreateProgram /><Footer /></>} />
        <Route path="/edit_program.php" element={<><Navbar /><EditProgram /><Footer /></>} />
        <Route path="/settings" element={<><Navbar /><Settings /><Footer /></>} />
        <Route path="/rendezvous" element={<><Navbar /><Rendezvous /><Footer /></>} />
        <Route path="/patients" element={<><Navbar /><Patients /><Footer /></>} />
        <Route path="/consultations" element={<><Navbar /><Consultations /><Footer /></>} />
        <Route path="/agenda" element={<Agenda />} />
        <Route path="/availability" element={<Availability />} />
      </Routes>
    </div>
  );
}

export default App;
