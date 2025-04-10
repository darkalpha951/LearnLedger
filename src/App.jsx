import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Dashboard from "./components/Dashboard";

function App() {
  return (
    <div id="app-root">
        <Router>
              <Routes>
                  <Route path="/" element={<Dashboard />} />
              </Routes>
        </Router>
    </div>
  );
}

export default App; 