import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './styles/globals.css';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { CartProvider } from './context/CartContext';
import { ChatProvider } from './context/ChatContext';
import { MarketProvider } from './context/MarketContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { TradeProvider } from './context/TradeContext';
import { StoreProvider } from './context/StoreContext';
import { WalletProvider } from './context/WalletContext';
import { AdminProvider } from './context/AdminContext';
import { CommunityProvider } from './context/CommunityContext';

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <AuthModalProvider>
        <CartProvider>
          <ChatProvider>
            <MarketProvider>
              <FavoritesProvider>
                <TradeProvider>
                  <StoreProvider>
                    <WalletProvider>
                      <AdminProvider>
                        <CommunityProvider>
                          <App />
                        </CommunityProvider>
                      </AdminProvider>
                    </WalletProvider>
                  </StoreProvider>
                </TradeProvider>
              </FavoritesProvider>
            </MarketProvider>
          </ChatProvider>
        </CartProvider>
      </AuthModalProvider>
    </AuthProvider>
  </BrowserRouter>,
);