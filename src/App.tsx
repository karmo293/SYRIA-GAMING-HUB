/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Games from './pages/Games';
import StorePage from './pages/Store';
import GameDetails from './pages/GameDetails';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import AdminDashboard from './pages/Admin/Dashboard';
import ManageGames from './pages/Admin/ManageGames';
import ManageProducts from './pages/Admin/ManageProducts';
import ManageOrders from './pages/Admin/ManageOrders';
import ManageMessages from './pages/Admin/ManageMessages';
import Contact from './pages/Contact';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="games" element={<Games />} />
              <Route path="store" element={<StorePage />} />
              <Route path="game/:id" element={<GameDetails />} />
              <Route path="product/:id" element={<ProductDetails />} />
              <Route path="login" element={<Login />} />
              <Route path="profile" element={<Profile />} />
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
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
