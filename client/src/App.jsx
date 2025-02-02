import logo from './logo.svg';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import HomePage from './main/home';
import {HeroUIProvider} from "@heroui/react";


function App() {
  return (
    <HeroUIProvider>
      <div className="App">
        <Routes>
            <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    </HeroUIProvider>
  );
}

export default App;
