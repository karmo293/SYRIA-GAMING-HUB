/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import Home from './pages/Home';
import Games from './pages/Games';
import StorePage from './pages/Store';
import GameDetails from './pages/GameDetails';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import AIChatbot from './components/AIChatbot';
import AdminDashboard from './pages/Admin/Dashboard';
import ManageGames from './pages/Admin/ManageGames';
import ManageProducts from './pages/Admin/ManageProducts';
import ManageOrders from './pages/Admin/ManageOrders';
import ManageMessages from './pages/Admin/ManageMessages';
import BudgetDashboard from './pages/BudgetDashboard';
import AIStylist from './pages/AIStylist';
import Quests from './pages/Quests';
import ManageUsers from './pages/Admin/ManageUsers';
import Contact from './pages/Contact';
import LootBox from './pages/LootBox';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <AIChatbot />
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="games" element={<Games />} />
              <Route path="store" element={<StorePage />} />
              <Route path="lootbox" element={<LootBox />} />
              <Route path="game/:id" element={<GameDetails />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="login" element={<Login />} />
              <Route path="profile" element={<Profile />} />
              <Route path="profile/budget" element={<BudgetDashboard />} />
              <Route path="ai-stylist" element={<AIStylist />} />
              <Route path="quests" element={<Quests />} />
              <Route path="orders" element={<Orders />} />
              <Route path="contact" element={<Contact />} />
              
              {/* Admin Routes */}
              <Route path="admin" element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="admin/games" element={
                <ProtectedRoute adminOnly>
                  <ManageGames />
                </ProtectedRoute>
              } />
              <Route path="admin/products" element={
                <ProtectedRoute adminOnly>
                  <ManageProducts />
                </ProtectedRoute>
              } />
              <Route path="admin/orders" element={
                <ProtectedRoute adminOnly>
                  <ManageOrders />
                </ProtectedRoute>
              } />
              <Route path="admin/messages" element={
                <ProtectedRoute adminOnly>
                  <ManageMessages />
                </ProtectedRoute>
              } />
              <Route path="admin/users" element={
                <ProtectedRoute adminOnly>
                  <ManageUsers />
                </ProtectedRoute>
              } />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
